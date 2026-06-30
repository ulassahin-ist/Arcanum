import React, { useCallback, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeIn } from 'react-native-reanimated';
import RNFS from 'react-native-fs';
import { C } from '../theme/colors';
import { SPACING } from '../theme/spacing';
import { SHADOW_SM } from '../theme/shadows';
import ViewToggle from '../components/ViewToggle';
import BookCardGrid from '../components/BookCardGrid';
import BookCardList from '../components/BookCardList';
import EpubCoverExtractor from '../components/EpubCoverExtractor';
import { getLibrary, updateCover } from '../storage/library';
import { importBookFromDevice } from '../storage/importBook';
import { Plus } from 'lucide-react-native';

const SCREEN_W = Dimensions.get('window').width;
const GRID_COLS = 3;
const GRID_GAP = SPACING.md;
const CARD_W =
  (SCREEN_W - SPACING.lg * 2 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

export default function LibraryScreen({ navigation }) {
  const [view, setView] = useState('grid');
  const [books, setBooks] = useState([]);
  const [pendingCover, setPendingCover] = useState(null);

  function findPendingCover(lib) {
    return lib.find(
      b => b.fileType === 'epub' && !b.coverUri && !b.coverChecked,
    );
  }

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getLibrary().then(lib => {
        if (!active) return;
        setBooks(lib);
        setPendingCover(findPendingCover(lib));
      });
      return () => {
        active = false;
      };
    }, []),
  );

  async function handleCoverResult(base64) {
    const book = pendingCover;
    setPendingCover(null);
    if (!book) return;

    let coverUri = null;
    if (base64) {
      try {
        const dir = `${RNFS.DocumentDirectoryPath}/covers`;
        await RNFS.mkdir(dir).catch(() => {});
        const dest = `${dir}/${book.id}.jpg`;
        await RNFS.writeFile(dest, base64, 'base64');
        coverUri = 'file://' + dest;
      } catch (e) {
        coverUri = null;
      }
    }

    await updateCover(book.id, coverUri);
    const lib = await getLibrary();
    setBooks(lib);
    setPendingCover(findPendingCover(lib));
  }

  async function handleImport() {
    await importBookFromDevice();
    const lib = await getLibrary();
    setBooks(lib);
    if (!pendingCover) setPendingCover(findPendingCover(lib));
  }

  function openBook(book) {
    navigation.navigate('Reader', { book });
  }

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <Text style={styles.heading}>Library</Text>
        <ViewToggle value={view} onChange={setView} />
      </View>

      {books.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>No books yet</Text>
          <Text style={styles.emptySub}>
            Import an EPUB or PDF to start reading
          </Text>
          <Pressable style={styles.importBtn} onPress={handleImport}>
            <Text style={styles.importBtnTxt}>Import a book</Text>
          </Pressable>
        </View>
      ) : (
        <Animated.View
          key={view}
          entering={FadeIn.duration(180)}
          style={{ flex: 1 }}
        >
          {view === 'grid' ? (
            <FlatList
              data={books}
              keyExtractor={item => item.id}
              numColumns={GRID_COLS}
              contentContainerStyle={styles.gridContent}
              columnWrapperStyle={{ gap: GRID_GAP }}
              renderItem={({ item }) => (
                <BookCardGrid
                  book={item}
                  width={CARD_W}
                  onPress={() => openBook(item)}
                />
              )}
            />
          ) : (
            <FlatList
              data={books}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <BookCardList book={item} onPress={() => openBook(item)} />
              )}
            />
          )}
        </Animated.View>
      )}

      <Pressable style={styles.fab} onPress={handleImport}>
        <Plus size={28} color="#fff" />
      </Pressable>

      {pendingCover && (
        <EpubCoverExtractor
          uri={pendingCover.fileUri}
          onResult={handleCoverResult}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, paddingHorizontal: SPACING.lg },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  heading: { fontSize: 24, fontWeight: '800', color: C.text },
  gridContent: { paddingBottom: 100, gap: GRID_GAP },
  listContent: { paddingBottom: 100 },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.text,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
    marginBottom: 18,
  },
  importBtn: {
    backgroundColor: C.blue,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  importBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: C.blue,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW_SM,
    shadowColor: C.blue,
  },
  fabTxt: { color: '#fff', fontSize: 28, fontWeight: '300', marginTop: -2 },
});
