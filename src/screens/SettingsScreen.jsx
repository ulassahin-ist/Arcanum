import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C } from '../theme/colors';

export default function SettingsScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Settings</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: '700', color: C.text },
});
