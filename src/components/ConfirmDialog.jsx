import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { RADIUS, SPACING } from '../theme/spacing';
import { SHADOW_MD } from '../theme/shadows';

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        {/* Inner Pressable with no-op onPress stops a tap on the card itself
            from bubbling up to the backdrop and dismissing the dialog. */}
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                styles.btn,
                pressed && styles.btnPressed,
              ]}
            >
              <Text style={styles.btnLabel}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.btn,
                styles.confirmBtn,
                pressed && styles.btnPressed,
              ]}
            >
              <Text
                style={[
                  styles.btnLabel,
                  destructive && styles.confirmLabelDestructive,
                ]}
              >
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const getStyles = colors =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: SPACING.xl,
    },
    card: {
      width: '100%',
      maxWidth: 320,
      backgroundColor: colors.card,
      borderRadius: RADIUS.md,
      padding: SPACING.lg,
      ...SHADOW_MD,
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 6,
    },
    message: {
      fontSize: 13,
      color: colors.textMuted,
      lineHeight: 18,
      marginBottom: SPACING.lg,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
    },
    btn: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: RADIUS.sm - 4,
    },
    btnPressed: { backgroundColor: colors.bg },
    confirmBtn: {},
    btnLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
    confirmLabelDestructive: { color: colors.red },
  });
