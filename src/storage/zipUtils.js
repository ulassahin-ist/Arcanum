import RNFS from 'react-native-fs';
import JSZip from 'jszip';

// Loads an .epub or .cbz (both are just zip archives) into memory as a
// JSZip instance. `uri` must be a plain filesystem path, as stored in
// book.fileUri — not a file:// URL.
export async function loadZip(uri) {
  const base64 = await RNFS.readFile(uri, 'base64');
  return JSZip.loadAsync(base64, { base64: true });
}
