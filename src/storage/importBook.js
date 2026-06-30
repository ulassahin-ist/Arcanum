import { pick, types } from '@react-native-documents/picker';
import RNFS from 'react-native-fs';
import { addBook } from './library';

export async function importBookFromDevice() {
  const [result] = await pick({
    mode: 'open',
    type: [types.pdf, 'application/epub+zip'],
  });

  const destPath = `${RNFS.DocumentDirectoryPath}/books/${result.name}`;
  await RNFS.mkdir(`${RNFS.DocumentDirectoryPath}/books`).catch(() => {});
  await RNFS.copyFile(result.uri, destPath);

  const fileType = result.name.toLowerCase().endsWith('.epub') ? 'epub' : 'pdf';

  const book = {
    id: `${Date.now()}`,
    title: result.name.replace(/\.(epub|pdf)$/i, ''),
    author: 'Unknown',
    fileUri: destPath,
    fileType,
    coverUri: null,
    addedAt: Date.now(),
    progress: 0,
  };

  await addBook(book);
  return book;
}
