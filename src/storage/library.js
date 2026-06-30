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
    b.id === id ? { ...b, progress, ...extra } : b,
  );
  await saveLibrary(updated);
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

export async function addBookmark(id, bookmark) {
  const lib = await getLibrary();
  const updated = lib.map(b =>
    b.id === id
      ? { ...b, bookmarks: [...(b.bookmarks || []), bookmark] }
      : b,
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
