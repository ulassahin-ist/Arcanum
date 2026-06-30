import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV({
  id: 'arcanum-storage',
});

export const StorageKeys = {
  LIBRARY: 'library',
  READING_PROGRESS: 'reading_progress_',
  SETTINGS: 'settings',
};
