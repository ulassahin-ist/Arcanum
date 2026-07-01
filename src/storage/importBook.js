import { pick, types } from '@react-native-documents/picker';
import RNFS from 'react-native-fs';
import PdfThumbnail from 'react-native-pdf-thumbnail';
import { addBook } from './library';
import { extractEpubMetadata } from './epubMetadata';
import { extractCbzCover } from './cbz';

const EXT_TO_FILE_TYPE = {
  epub: 'epub',
  pdf: 'pdf',
  cbz: 'cbz',
  txt: 'txt',
};

function detectFileType(name) {
  const ext = name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  return EXT_TO_FILE_TYPE[ext] || null;
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
    ],
  });

  const fileType = detectFileType(result.name);
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
    try {
      const coverDir = `${RNFS.DocumentDirectoryPath}/covers`;
      await RNFS.mkdir(coverDir).catch(() => {});
      const coverDest = `${coverDir}/${book.id}.jpg`;
      const { coverUri, pageCount, author } = await extractCbzCover(
        destPath,
        coverDest,
      );
      book.coverUri = coverUri;
      book.pageCount = pageCount;
      if (author) book.author = author;
    } catch (e) {
      // leave cover/author at defaults; reader still unpacks pages lazily
    }
    book.coverChecked = true; // one-shot, like pdf — no WebView retry pass
  } else if (fileType === 'txt') {
    book.coverChecked = true; // no cover art possible; card shows initials
  }

  await addBook(book);
  return book;
}
