import { pick, types } from '@react-native-documents/picker';
import RNFS from 'react-native-fs';
import PdfThumbnail from 'react-native-pdf-thumbnail';
import { addBook } from './library';
import { extractEpubMetadata } from './epubMetadata';
import { ensureComicPagesExtracted, NotAComicError } from './comicArchive';

const EXT_TO_FILE_TYPE = {
  epub: 'epub',
  pdf: 'pdf',
  cbz: 'cbz',
  txt: 'txt',
  // .zip and .rar aren't guaranteed to be comics just because of their
  // extension -- ensureComicPagesExtracted rejects the import below if
  // the contents turn out not to be predominantly page images.
  zip: 'cbz',
  rar: 'cbz',
  cbr: 'cbz',
};

// zip and rar (and their .cbz/.cbr aliases) share one archive extraction
// backend each; this is what tells the storage layer which one to use.
const EXT_TO_ARCHIVE_FORMAT = {
  cbz: 'zip',
  zip: 'zip',
  cbr: 'rar',
  rar: 'rar',
};

function detectFileType(name) {
  const ext = name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  return {
    fileType: EXT_TO_FILE_TYPE[ext] || null,
    archiveFormat: EXT_TO_ARCHIVE_FORMAT[ext],
  };
}

export async function importBookFromDevice() {
  const [result] = await pick({
    mode: 'open',
    type: [
      types.pdf,
      types.plainText,
      types.zip, // covers .cbz — Android often reports comic archives as generic zip
      'application/epub+zip',
      'application/vnd.comicbook+zip',
      'application/x-cbz',
      // .cbr/.rar — mime type varies a lot by document provider
      'application/vnd.comicbook-rar',
      'application/x-cbr',
      'application/x-rar-compressed',
      'application/vnd.rar',
      'application/x-rar',
    ],
  });

  const { fileType, archiveFormat } = detectFileType(result.name);
  if (!fileType) {
    // The picker's type filter is a hint, not a guarantee (some Android
    // document providers ignore it) — bail out cleanly on anything we
    // don't actually know how to read instead of mis-tagging it.
    throw new Error(`Unsupported file type: ${result.name}`);
  }

  const destPath = `${RNFS.DocumentDirectoryPath}/books/${result.name}`;
  await RNFS.mkdir(`${RNFS.DocumentDirectoryPath}/books`).catch(() => {});
  await RNFS.copyFile(result.uri, destPath);

  const book = {
    id: `${Date.now()}`,
    title: result.name.replace(/\.[a-z0-9]+$/i, ''),
    author: 'Unknown',
    fileUri: destPath,
    fileType,
    coverUri: null,
    coverChecked: false,
    favorite: false,
    addedAt: Date.now(),
    progress: 0,
  };

  if (fileType === 'pdf') {
    try {
      const { uri } = await PdfThumbnail.generate(destPath, 0);
      book.coverUri = uri;
    } catch (e) {
      book.coverUri = null;
    }
    book.coverChecked = true; // pdf cover is one-shot, no retry needed
  } else if (fileType === 'epub') {
    // Cover extraction is still deferred to EpubCoverExtractor's WebView
    // pass (see LibraryScreen) — but metadata is cheap enough to resolve
    // synchronously right here instead of leaving it hardcoded.
    try {
      const { title, author } = await extractEpubMetadata(destPath);
      if (title) book.title = title;
      if (author) book.author = author;
    } catch (e) {
      // keep filename/'Unknown' fallback
    }
  } else if (fileType === 'cbz') {
    book.archiveFormat = archiveFormat; // 'zip' or 'rar' — needed again if the reader cache ever gets evicted
    try {
      // Extracting pages now (rather than lazily in the reader) does
      // double duty: it's also the classification check that confirms
      // this .zip/.rar is actually a comic, and the first page becomes
      // the cover for free — no separate thumbnail pass needed.
      const { pageUris, pageCount, author } = await ensureComicPagesExtracted(
        destPath,
        book.id,
        archiveFormat,
      );
      book.coverUri = pageUris[0] || null;
      book.pageCount = pageCount;
      if (author) book.author = author;
    } catch (e) {
      if (e instanceof NotAComicError) {
        // Not actually a comic (e.g. a renamed .zip full of unrelated
        // files) — don't leave a broken, unopenable book in the library.
        await RNFS.unlink(destPath).catch(() => {});
        throw e;
      }
      // Some other extraction hiccup: keep the book, just without a
      // cover/author; the reader will retry extraction when opened.
    }
    book.coverChecked = true; // one-shot, like pdf — no WebView retry pass
  } else if (fileType === 'txt') {
    book.coverChecked = true; // no cover art possible; card shows initials
  }

  await addBook(book);
  return book;
}
