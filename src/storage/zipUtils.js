import RNFS from 'react-native-fs';
import JSZip from 'jszip';

// Loads an .epub or .cbz (both are just zip archives) into memory as a
// JSZip instance. `uri` must be a plain filesystem path, as stored in
// book.fileUri — not a file:// URL.
export async function loadZip(uri) {
  const base64 = await RNFS.readFile(uri, 'base64');
  return JSZip.loadAsync(base64, { base64: true });
}

// Lists file entries (no directories) in an already-loaded zip. Reading
// the central directory via JSZip.loadAsync doesn't inflate any file
// contents, so this is cheap to call purely for classification before
// deciding whether to treat the archive as a comic.
export function listZipFilePaths(zip) {
  return Object.keys(zip.files).filter(name => !zip.files[name].dir);
}
