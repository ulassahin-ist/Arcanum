import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from '../components/AppText';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeIn } from 'react-native-reanimated';
import RNFS from 'react-native-fs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { SPACING } from '../theme/spacing';
import { SHADOW_SM } from '../theme/shadows';
import ViewToggle from '../components/ViewToggle';
import BookCardGrid from '../components/BookCardGrid';
import BookCardList from '../components/BookCardList';
import EpubCoverExtractor from '../components/EpubCoverExtractor';
import ContextMenu from '../components/ContextMenu';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  getLibrary,
  updateCover,
  removeBook,
  toggleFavorite,
  sortBooks,
} from '../storage/library';
import { importBookFromDevice } from '../storage/importBook';
import { ensureComicPagesExtracted } from '../storage/comicArchive';
import { Plus } from 'lucide-react-native';

const SCREEN_W = Dimensions.get('window').width;
const GRID_COLS = 3;
const GRID_GAP = SPACING.md;
const CARD_W =
  (SCREEN_W - SPACING.lg * 2 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

export default function LibraryScreen({ navigation, route }) {
  const onlyFavorites = !!route?.params?.onlyFavorites;
  const { colors, librarySortOrder } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors);
  const [view, setView] = useState('grid');
  const [books, setBooks] = useState([]);
  const [pendingCover, setPendingCover] = useState(null);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    anchor: null,
    book: null,
  });
  const [confirmDialog, setConfirmDialog] = useState({
    visible: false,
    book: null,
  });
  function findPendingCover(lib) {
    // epub covers go through the WebView-based EpubCoverExtractor below.
    // cbz covers can end up in this same "needs a cover" state after
    // clearComicCache() wipes the extracted-pages cache (a cbz's cover
    // is just its first page, so it's dangling once that cache is gone)
    // — handled directly via handleCbzCoverExtraction instead of a
    // WebView pass, since cbz doesn't need one.
    return lib.find(
      b =>
        (b.fileType === 'epub' || b.fileType === 'cbz') &&
        !b.coverUri &&
        !b.coverChecked,
    );
  }

  function visibleBooks(lib) {
    const base = onlyFavorites ? lib.filter(b => b.favorite) : lib;
    return sortBooks(base, librarySortOrder);
  }

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getLibrary().then(lib => {
        if (!active) return;
        setBooks(visibleBooks(lib));
        // Cover extraction runs off the full library exactly once,
        // regardless of which tab triggered the focus — no need to
        // duplicate it on the Favorites tab too.
        if (!onlyFavorites) setPendingCover(findPendingCover(lib));
      });
      return () => {
        active = false;
      };
    }, [librarySortOrder, onlyFavorites]),
  );

  // cbz books don't need the WebView pass epub uses — extraction (and
  // therefore the cover, which is just page 0) can be requested directly.
  useEffect(() => {
    if (!pendingCover || pendingCover.fileType !== 'cbz') return;
    let active = true;
    const book = pendingCover;
    ensureComicPagesExtracted(book.fileUri, book.id, book.archiveFormat)
      .then(({ pageUris }) => updateCover(book.id, pageUris[0] || null))
      .catch(() => updateCover(book.id, null)) // mark checked either way — falls back to initials rather than retrying forever
      .finally(async () => {
        if (!active) return;
        const lib = await getLibrary();
        setBooks(visibleBooks(lib));
        setPendingCover(findPendingCover(lib));
      });
    return () => {
      active = false;
    };
  }, [pendingCover?.id]);

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
    setBooks(visibleBooks(lib));
    setPendingCover(findPendingCover(lib));
  }

  async function handleImport() {
    await importBookFromDevice();
    const lib = await getLibrary();
    setBooks(visibleBooks(lib));
    if (!pendingCover) setPendingCover(findPendingCover(lib));
  }

  function openBook(book) {
    navigation.navigate('Reader', { book });
  }

  function openContextMenu(book, event) {
    const { pageX, pageY } = event.nativeEvent;
    setContextMenu({ visible: true, anchor: { x: pageX, y: pageY }, book });
  }

  function closeContextMenu() {
    setContextMenu(prev => ({ ...prev, visible: false }));
  }

  async function handleToggleFavorite(book) {
    await toggleFavorite(book.id);
    setBooks(visibleBooks(await getLibrary()));
  }

  function handleDeleteRequest(book) {
    setConfirmDialog({
      visible: true,
      book,
    });
  }
  async function handleConfirmDelete() {
    if (!confirmDialog.book) return;

    await removeBook(confirmDialog.book.id);
    setBooks(visibleBooks(await getLibrary()));

    setConfirmDialog({
      visible: false,
      book: null,
    });
  }
  function handleCancelDelete() {
    setConfirmDialog({
      visible: false,
      book: null,
    });
  }
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Text style={styles.heading}>
          {onlyFavorites ? 'Favorites' : 'Library'}
        </Text>
        <ViewToggle value={view} onChange={setView} />
      </View>

      {books.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>
            {onlyFavorites ? 'No favorites yet' : 'No books yet'}
          </Text>
          <Text style={styles.emptySub}>
            {onlyFavorites
              ? 'Long-press a book in your library and choose Add to Favorites'
              : 'Import an EPUB, PDF, CBZ, or TXT to start reading'}
          </Text>
          {!onlyFavorites && (
            <Pressable style={styles.importBtn} onPress={handleImport}>
              <Text style={styles.importBtnTxt}>Import a book</Text>
            </Pressable>
          )}
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
                  onLongPress={e => openContextMenu(item, e)}
                />
              )}
            />
          ) : (
            <FlatList
              data={books}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <BookCardList
                  book={item}
                  onPress={() => openBook(item)}
                  onLongPress={e => openContextMenu(item, e)}
                />
              )}
            />
          )}
        </Animated.View>
      )}

      {!onlyFavorites && (
        <Pressable style={styles.fab} onPress={handleImport}>
          <Plus size={28} color={colors.onAccent} />
        </Pressable>
      )}

      {pendingCover && pendingCover.fileType === 'epub' && (
        <EpubCoverExtractor
          uri={pendingCover.fileUri}
          onResult={handleCoverResult}
        />
      )}

      <ContextMenu
        visible={contextMenu.visible}
        anchor={contextMenu.anchor}
        onClose={closeContextMenu}
        items={
          contextMenu.book
            ? [
                {
                  label: contextMenu.book.favorite
                    ? 'Remove from Favorites'
                    : 'Add to Favorites',
                  onPress: () => handleToggleFavorite(contextMenu.book),
                },
                {
                  label: 'Delete',
                  destructive: true,
                  onPress: () => handleDeleteRequest(contextMenu.book),
                },
              ]
            : []
        }
      />
      <ConfirmDialog
        visible={confirmDialog.visible}
        title="Delete book?"
        message={
          confirmDialog.book
            ? `"${confirmDialog.book.title}" will be removed from your library. This can't be undone.`
            : ''
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </View>
  );
}

const getStyles = colors =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg,
      paddingHorizontal: SPACING.lg,
    },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: SPACING.lg,
      marginBottom: SPACING.lg,
    },
    heading: { fontSize: 24, fontWeight: '800', color: colors.text },
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
      color: colors.text,
      marginBottom: 4,
    },
    emptySub: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
      marginBottom: 18,
    },
    importBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
    },
    importBtnTxt: { color: colors.onAccent, fontWeight: '700', fontSize: 14 },
    fab: {
      position: 'absolute',
      bottom: 24,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 18,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      ...SHADOW_SM,
      shadowColor: colors.primary,
    },
    fabTxt: {
      color: colors.onAccent,
      fontSize: 28,
      fontWeight: '300',
      marginTop: -2,
    },
  });
