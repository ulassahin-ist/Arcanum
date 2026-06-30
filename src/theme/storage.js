import RNFS from 'react-native-fs';

const SETTINGS_PATH = `${RNFS.DocumentDirectoryPath}/settings.json`;

export async function loadSettings() {
  try {
    const raw = await RNFS.readFile(SETTINGS_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

export async function saveSettings(partial) {
  const current = await loadSettings();
  const next = { ...current, ...partial };
  await RNFS.writeFile(SETTINGS_PATH, JSON.stringify(next), 'utf8');
  return next;
}
