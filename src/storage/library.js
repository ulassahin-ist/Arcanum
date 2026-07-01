import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import { StorageKeys } from './asyncStorage';

export async function getLibrary() {
  const raw = await AsyncStorage.getItem(StorageKeys.LIBRARY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveLibrary(books) {
  await AsyncStorage.setItem(StorageKeys.LIBRARY, JSON.stringify(books));
}

export async function addBook(book) {
  const lib = await getLibrary();
  const updated = [...lib, book];
  await saveLibrary(updated);
  return updated;
}

export async function removeBook(id) {
  const lib = await getLibrary();
  const target = lib.find(b => b.id === id);
  const updated = lib.filter(b => b.id !== id);
  await saveLibrary(updated);
  if (target?.fileUri) {
    RNFS.unlink(target.fileUri).catch(() => {});
  }
  return updated;
}

export async function updateProgress(id, progress, extra = {}) {
  const lib = await getLibrary();
  const updated = lib.map(b =>
    b.id === id ? { ...b, progress, lastReadAt: Date.now(), ...extra } : b,
  );
  await saveLibrary(updated);
}

// Sorts a copy of the library for display. `order` is one of:
// 'title' | 'author' | 'recentlyAdded' | 'recentlyRead'
export function sortBooks(books, order) {
  const sorted = [...books];
  switch (order) {
    case 'title':
      return sorted.sort((a, b) =>
        (a.title || '').localeCompare(b.title || ''),
      );
    case 'author':
      return sorted.sort((a, b) =>
        (a.author || '').localeCompare(b.author || ''),
      );
    case 'recentlyRead':
      return sorted.sort((a, b) => (b.lastReadAt || 0) - (a.lastReadAt || 0));
    case 'recentlyAdded':
    default:
      return sorted.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
  }
}

export async function updateCover(id, coverUri) {
  const lib = await getLibrary();
  const updated = lib.map(b =>
    b.id === id ? { ...b, coverUri, coverChecked: true } : b,
  );
  await saveLibrary(updated);
  return updated;
}

export async function toggleFavorite(id) {
  const lib = await getLibrary();
  const updated = lib.map(b =>
    b.id === id ? { ...b, favorite: !b.favorite } : b,
  );
  await saveLibrary(updated);
  return updated;
}

// Reports on-disk size of imported books and extracted covers, in bytes.
export async function getStorageInfo() {
  const booksDir = `${RNFS.DocumentDirectoryPath}/books`;
  const coversDir = `${RNFS.DocumentDirectoryPath}/covers`;
  const [booksBytes, coversBytes] = await Promise.all([
    dirSize(booksDir),
    dirSize(coversDir),
  ]);
  return { booksBytes, coversBytes, totalBytes: booksBytes + coversBytes };
}

async function dirSize(path) {
  try {
    const entries = await RNFS.readDir(path);
    return entries.reduce((sum, entry) => sum + (entry.size || 0), 0);
  } catch (e) {
    return 0; // directory doesn't exist yet
  }
}

// Clears extracted cover thumbnails only — never touches the books
// themselves. Covers are cheap to regenerate (EpubCoverExtractor /
// PdfThumbnail run again automatically next time the library loads).
export async function clearCoverCache() {
  const coversDir = `${RNFS.DocumentDirectoryPath}/covers`;
  await RNFS.unlink(coversDir).catch(() => {});

  // Only EPUB covers regenerate automatically (LibraryScreen's
  // findPendingCover only re-extracts for epub); PDF covers are a
  // one-shot thumbnail from import, so those are left alone.
  const lib = await getLibrary();
  const updated = lib.map(b =>
    b.fileType === 'epub' ? { ...b, coverUri: null, coverChecked: false } : b,
  );
  await saveLibrary(updated);
  return updated;
}

export async function addBookmark(id, bookmark) {
  const lib = await getLibrary();
  const updated = lib.map(b =>
    b.id === id ? { ...b, bookmarks: [...(b.bookmarks || []), bookmark] } : b,
  );
  await saveLibrary(updated);
  return updated;
}

export async function removeBookmark(id, bookmarkId) {
  const lib = await getLibrary();
  const updated = lib.map(b =>
    b.id === id
      ? {
          ...b,
          bookmarks: (b.bookmarks || []).filter(bm => bm.id !== bookmarkId),
        }
      : b,
  );
  await saveLibrary(updated);
  return updated;
}
