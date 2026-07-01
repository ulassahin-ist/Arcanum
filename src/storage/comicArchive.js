import RNFS from 'react-native-fs';
import { loadZip, listZipFilePaths } from './zipUtils';
import { IMAGE_EXT, classifyArchiveEntries } from './archieveUtils';
import { extractRarArchive } from './rarBridge';

const CACHE_ROOT = `${RNFS.CachesDirectoryPath}/comics`;

// Hard cap on total extracted-pages cache size. Once a fresh extraction
// pushes the cache over this, the least-recently-read books' extracted
// dirs get evicted (oldest first) until we're back under the limit.
// This is the fix for the cache growing forever, uncapped, invisibly.
const CACHE_LIMIT_BYTES = 800 * 1024 * 1024; // 800MB

// Thrown when an archive with a comic-book extension doesn't actually
// contain a comic (e.g. a renamed .zip full of documents). Callers can
// catch this specifically to show a friendlier message than a generic
// "couldn't open file" error.
export class NotAComicError extends Error {}

// Best-effort read of ComicInfo.xml — a de-facto standard metadata file
// many (not all) comic releases ship with — for a writer/artist credit.
// A missing file is normal, not an error.
function parseComicAuthor(xml) {
  const match =
    xml.match(/<Writer>([^<]*)<\/Writer>/i) ||
    xml.match(/<Penciller>([^<]*)<\/Penciller>/i);
  return match?.[1]?.trim() || null;
}

async function extractZipPages(uri, dir) {
  const zip = await loadZip(uri);
  const allPaths = listZipFilePaths(zip);
  const { isComic, pages } = classifyArchiveEntries(allPaths);
  if (!isComic) {
    throw new NotAComicError(
      'This file doesn\u2019t look like a comic archive.',
    );
  }

  const names = [];
  for (let i = 0; i < pages.length; i++) {
    const ext = pages[i].match(IMAGE_EXT)[0];
    const outName = `${String(i).padStart(5, '0')}${ext}`;
    const base64 = await zip.files[pages[i]].async('base64');
    await RNFS.writeFile(`${dir}/${outName}`, base64, 'base64');
    names.push(outName);
  }

  const infoName = allPaths.find(p =>
    p.toLowerCase().endsWith('comicinfo.xml'),
  );
  let author = null;
  if (infoName) {
    try {
      author = parseComicAuthor(await zip.files[infoName].async('text'));
    } catch (e) {
      // missing/unreadable ComicInfo.xml is fine, just no author credit
    }
  }

  return { pages: names, author };
}

async function extractRarPages(uri, dir) {
  // Runs entirely inside the hidden RarExtractorBridge WebView (WASM
  // unrar via node-unrar-js) — see rarBridge.js. No native RN module
  // involved, so this is unaffected by New Architecture/autolinking.
  const dataBase64 = await RNFS.readFile(uri, 'base64');
  const entries = await extractRarArchive(dataBase64); // [{ name, base64 }]

  const allPaths = entries.map(e => e.name);
  const { isComic, pages } = classifyArchiveEntries(allPaths);
  if (!isComic) {
    throw new NotAComicError(
      'This file doesn\u2019t look like a comic archive.',
    );
  }

  // Rar releases sometimes nest pages a folder deep — flatten to
  // index-based names in `dir`, same convention as extractZipPages.
  const byName = new Map(entries.map(e => [e.name, e.base64]));
  const names = [];
  for (let i = 0; i < pages.length; i++) {
    const ext = pages[i].match(IMAGE_EXT)[0];
    const outName = `${String(i).padStart(5, '0')}${ext}`;
    await RNFS.writeFile(`${dir}/${outName}`, byName.get(pages[i]), 'base64');
    names.push(outName);
  }

  const infoName = allPaths.find(p =>
    p.toLowerCase().endsWith('comicinfo.xml'),
  );
  let author = null;
  if (infoName) {
    try {
      const infoPath = `${dir}/.ComicInfo.xml`;
      await RNFS.writeFile(infoPath, byName.get(infoName), 'base64');
      author = parseComicAuthor(await RNFS.readFile(infoPath, 'utf8'));
      await RNFS.unlink(infoPath).catch(() => {});
    } catch (e) {
      // missing/unreadable ComicInfo.xml is fine, just no author credit
    }
  }

  return { pages: names, author };
}

// Unpacks every page of a comic archive to disk once, cached under
// <cache>/comics/<bookId>/, so re-opening the reader later — or reading
// the cover right after import — is instant instead of re-decompressing.
// `archiveFormat` is 'zip' (covers .cbz/.zip) or 'rar' (covers .cbr/.rar).
export async function ensureComicPagesExtracted(uri, bookId, archiveFormat) {
  const dir = `${CACHE_ROOT}/${bookId}`;
  const manifestPath = `${dir}/manifest.json`;

  if (await RNFS.exists(manifestPath)) {
    const manifest = JSON.parse(await RNFS.readFile(manifestPath, 'utf8'));
    // Touch the access time so this book counts as "recently read" and
    // survives the next eviction pass over other, staler books.
    touchManifest(manifestPath, manifest).catch(() => {});
    return {
      pageUris: manifest.pages.map(name => 'file://' + `${dir}/${name}`),
      pageCount: manifest.pages.length,
      author: manifest.author || null,
    };
  }

  await RNFS.mkdir(dir).catch(() => {});

  let pages, author;
  try {
    ({ pages, author } =
      archiveFormat === 'rar'
        ? await extractRarPages(uri, dir)
        : await extractZipPages(uri, dir));
  } catch (e) {
    // Don't leave a half-extracted / non-comic dir behind in the cache.
    await RNFS.unlink(dir).catch(() => {});
    throw e;
  }

  await RNFS.writeFile(
    manifestPath,
    JSON.stringify({ pages, author, lastAccessedAt: Date.now() }),
    'utf8',
  );

  // A brand new extraction is the only thing that can push us over the
  // cap, so this is the right (and only) place to check it. `bookId` is
  // excluded so we never evict the book we just extracted.
  enforceCacheLimit(bookId).catch(() => {});

  return {
    pageUris: pages.map(name => 'file://' + `${dir}/${name}`),
    pageCount: pages.length,
    author,
  };
}

function touchManifest(manifestPath, manifest) {
  return RNFS.writeFile(
    manifestPath,
    JSON.stringify({ ...manifest, lastAccessedAt: Date.now() }),
    'utf8',
  );
}

// Recursively sums file sizes under `path`. Unlike books/ and covers/
// (flat directories), the comic cache nests page images one level down
// (comics/<bookId>/000.jpg, ...), so this needs to walk subdirectories.
async function dirSizeRecursive(path) {
  let total = 0;
  let entries;
  try {
    entries = await RNFS.readDir(path);
  } catch (e) {
    return 0; // doesn't exist yet
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      total += await dirSizeRecursive(entry.path);
    } else {
      total += entry.size || 0;
    }
  }
  return total;
}

// Total bytes currently used by extracted comic pages, across all books.
// Used by getStorageInfo() so this cache is no longer invisible.
export async function getComicCacheBytes() {
  return dirSizeRecursive(CACHE_ROOT);
}

// Scans every cached book dir, sorts by last-read time (oldest first),
// and deletes whole dirs until total size is back under the cap.
// `excludeBookId` (optional) is never evicted, even if it's the oldest —
// used to protect a book that was just extracted/read.
export async function enforceCacheLimit(excludeBookId) {
  let entries;
  try {
    entries = await RNFS.readDir(CACHE_ROOT);
  } catch (e) {
    return; // no cache yet
  }

  const bookDirs = entries.filter(e => e.isDirectory());
  const withStats = await Promise.all(
    bookDirs.map(async dir => {
      const size = await dirSizeRecursive(dir.path);
      let lastAccessedAt = 0;
      try {
        const manifest = JSON.parse(
          await RNFS.readFile(`${dir.path}/manifest.json`, 'utf8'),
        );
        lastAccessedAt = manifest.lastAccessedAt || 0;
      } catch (e) {
        // no/broken manifest — treat as oldest so it's first to go
      }
      return { id: dir.name, path: dir.path, size, lastAccessedAt };
    }),
  );

  let total = withStats.reduce((sum, b) => sum + b.size, 0);
  if (total <= CACHE_LIMIT_BYTES) return;

  const evictable = withStats
    .filter(b => b.id !== excludeBookId)
    .sort((a, b) => a.lastAccessedAt - b.lastAccessedAt);

  for (const book of evictable) {
    if (total <= CACHE_LIMIT_BYTES) break;
    await RNFS.unlink(book.path).catch(() => {});
    total -= book.size;
  }
}

// Wipes the entire extracted-pages cache. Books stay intact — pages are
// just re-extracted the next time each comic is opened. Callers should
// clear coverUri/coverChecked on cbz books afterward, since any cover
// pointing into this cache is now a dangling file:// URI.
export async function clearComicPagesCache() {
  await RNFS.unlink(CACHE_ROOT).catch(() => {});
}
