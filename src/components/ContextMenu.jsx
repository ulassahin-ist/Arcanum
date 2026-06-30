import React from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { RADIUS } from '../theme/spacing';
import { SHADOW_MD } from '../theme/shadows';

const MENU_WIDTH = 190;
const ITEM_HEIGHT = 46;
const EDGE_MARGIN = 12;

// Anchor-positioned popup menu, similar to a desktop right-click menu.
// `anchor` is the { x, y } screen point where the long-press happened.
export default function ContextMenu({ visible, anchor, items, onClose }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  if (!visible || !anchor) return null;

  const screen = Dimensions.get('window');
  const menuHeight = items.length * ITEM_HEIGHT + 8;

  let left = anchor.x;
  let top = anchor.y;
  if (left + MENU_WIDTH + EDGE_MARGIN > screen.width) {
    left = screen.width - MENU_WIDTH - EDGE_MARGIN;
  }
  if (left < EDGE_MARGIN) left = EDGE_MARGIN;
  if (top + menuHeight + EDGE_MARGIN > screen.height) {
    top = screen.height - menuHeight - EDGE_MARGIN;
  }
  if (top < EDGE_MARGIN) top = EDGE_MARGIN;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={[styles.menu, { left, top }]}>
          {items.map((item, i) => (
            <Pressable
              key={item.label}
              onPress={() => {
                onClose();
                item.onPress();
              }}
              style={({ pressed }) => [
                styles.item,
                i < items.length - 1 && styles.itemBorder,
                pressed && styles.itemPressed,
              ]}
            >
              <Text
                style={[
                  styles.itemText,
                  item.destructive && styles.itemTextDestructive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

const getStyles = colors =>
  StyleSheet.create({
    backdrop: { flex: 1 },
    menu: {
      position: 'absolute',
      width: MENU_WIDTH,
      backgroundColor: colors.card,
      borderRadius: RADIUS.sm,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      ...SHADOW_MD,
    },
    item: {
      height: ITEM_HEIGHT,
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    itemBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
    itemPressed: { backgroundColor: colors.bg },
    itemText: { fontSize: 14, fontWeight: '600', color: colors.text },
    itemTextDestructive: { color: colors.red },
  });
