import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme/tokens';
import type { Screen } from '../../state/AppState';

interface Props {
  screen: Screen;
  onNavigate: (s: Screen) => void;
  onSettings: () => void;
}

const ITEMS: { key: Screen; label: string }[] = [
  { key: 'home', label: 'ホーム' },
  { key: 'cat', label: 'カテゴリ' },
  { key: 'cal', label: '記録' },
];

export function BottomNav({ screen, onNavigate, onSettings }: Props) {
  return (
    <View style={styles.bar}>
      {ITEMS.map((it) => {
        const active = screen === it.key;
        return (
          <Pressable key={it.key} onPress={() => onNavigate(it.key)} hitSlop={8} style={styles.item}>
            <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>{it.label}</Text>
          </Pressable>
        );
      })}
      <Pressable onPress={onSettings} hitSlop={8} style={styles.item}>
        <Text style={[styles.label, styles.labelInactive]}>設定</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 64,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 18,
    backgroundColor: 'rgba(5,6,10,.94)',
  },
  item: { paddingVertical: 6, paddingHorizontal: 10 },
  label: { fontSize: 11 },
  labelActive: { fontFamily: fonts.jpBold, color: colors.teal },
  labelInactive: { fontFamily: fonts.jp, color: colors.textDim3 },
});
