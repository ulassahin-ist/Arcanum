import RNFS from 'react-native-fs';
import { loadZip } from './zipUtils';

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp)$/i;

// Plain string sort puts "page10.jpg" before "page2.jpg". Comics need
// reading order, so sort numeric runs numerically.
function naturalCompare(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

function listImageEntries(zip) {
  return Object.keys(zip.files)
    .filter(name => !zip.files[name].dir && IMAGE_EXT.test(name))
    .sort(naturalCompare);
}

// Best-effort read of ComicInfo.xml — a de-facto standard metadata file
// many (not all) CBZ releases ship with — for a writer/artist credit.
// A missing file is normal, not an error.
async function extractComicAuthor(zip) {
  const infoName = Object.keys(zip.files).find(name =>
    name.toLowerCase().endsWith('comicinfo.xml'),
  );
  if (!infoName) return null;
  try {
    const xml = await zip.files[infoName].async('text');
    const match =
      xml.match(/<Writer>([^<]*)<\/Writer>/i) ||
      xml.match(/<Penciller>([^<]*)<\/Penciller>/i);
    const value = match?.[1]?.trim();
    return value || null;
  } catch (e) {
    return null;
  }
}

// Extracts just the first page as a cover thumbnail — mirrors the
// one-shot PDF thumbnail flow at import time, no WebView needed since
// this is a plain zip we can read directly.
export async function extractCbzCover(uri, destPath) {
  const zip = await loadZip(uri);
  const pages = listImageEntries(zip);
  if (pages.length === 0) {
    return { coverUri: null, pageCount: 0, author: null };
  }

  const base64 = await zip.files[pages[0]].async('base64');
  await RNFS.writeFile(destPath, base64, 'base64');
  const author = await extractComicAuthor(zip);
  return { coverUri: 'file://' + destPath, pageCount: pages.length, author };
}

// Unpacks every page of a CBZ to disk once, cached under
// <cache>/cbz/<bookId>/, so re-opening the reader later is instant
// instead of re-decompressing the whole archive.
export async function ensureCbzPagesExtracted(uri, bookId) {
  const dir = `${RNFS.CachesDirectoryPath}/cbz/${bookId}`;
  const manifestPath = `${dir}/manifest.json`;

  if (await RNFS.exists(manifestPath)) {
    const manifest = JSON.parse(await RNFS.readFile(manifestPath, 'utf8'));
    return manifest.pages.map(name => 'file://' + `${dir}/${name}`);
  }

  await RNFS.mkdir(dir).catch(() => {});
  const zip = await loadZip(uri);
  const pages = listImageEntries(zip);

  const names = [];
  for (let i = 0; i < pages.length; i++) {
    const ext = pages[i].match(IMAGE_EXT)[0];
    const outName = `${String(i).padStart(5, '0')}${ext}`;
    const base64 = await zip.files[pages[i]].async('base64');
    await RNFS.writeFile(`${dir}/${outName}`, base64, 'base64');
    names.push(outName);
  }

  await RNFS.writeFile(manifestPath, JSON.stringify({ pages: names }), 'utf8');
  return names.map(name => 'file://' + `${dir}/${name}`);
}
