import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme/tokens';
import { useAppState } from '../state/AppState';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'bio', '0', 'del'];

export function PinScreen() {
  const { state, actions } = useAppState();
  const mode: 'setup' | 'unlock' = state.screen === 'pin-setup' ? 'setup' : 'unlock';
  const isConfirmStep = mode === 'setup' && !!state.pinFirstEntry;

  const heading = mode === 'unlock' ? 'PINを入力して開始' : isConfirmStep ? 'もう一度入力して確認' : '新しいPINを設定';

  const dots = useMemo(() => [0, 1, 2, 3].map((i) => i < state.pinDraft.length), [state.pinDraft]);

  return (
    <View style={styles.wrap}>
      <View style={styles.center}>
        <Text style={styles.kicker}>PERSONAL TRAINING</Text>
        <Text style={styles.title}>今日の{'\n'}トレーニング</Text>
        <Text style={styles.subtitle}>{heading}</Text>
        {state.pinError ? <Text style={styles.error}>{state.pinError}</Text> : null}
      </View>

      <View style={styles.dotsRow}>
        {dots.map((filled, i) => (
          <View key={i} style={[styles.dot, filled ? styles.dotFilled : styles.dotEmpty]} />
        ))}
      </View>

      <View style={styles.grid}>
        {KEYS.map((k) => {
          const isBio = k === 'bio';
          const isDel = k === 'del';
          const disabledBio = isBio && mode !== 'unlock';
          return (
            <Pressable
              key={k}
              disabled={disabledBio}
              onPress={() => actions.tapPinKey(k, mode)}
              style={({ pressed }) => [
                styles.key,
                (isBio || isDel) && styles.keyMuted,
                pressed && styles.keyPressed,
                disabledBio && { opacity: 0.25 },
              ]}
            >
              <Text style={[styles.keyText, isBio && { color: colors.teal }]}>
                {isBio ? '⌾' : isDel ? '⌫' : k}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.footnote}>端末内にのみ保存 · 生体認証で開く</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 30, justifyContent: 'space-between', paddingVertical: 40 },
  center: { alignItems: 'center', marginTop: 20 },
  kicker: { fontFamily: fonts.labelBold, fontSize: 9, letterSpacing: 6, color: colors.teal },
  title: {
    fontFamily: fonts.jpBlack,
    fontSize: 34,
    lineHeight: 40,
    color: colors.text,
    textAlign: 'center',
    marginTop: 12,
  },
  subtitle: { fontFamily: fonts.jpRegular, fontSize: 12, color: colors.textDim2, marginTop: 12, lineHeight: 20 },
  error: { fontFamily: fonts.jpBold, fontSize: 11, color: colors.danger, marginTop: 8 },
  dotsRow: { flexDirection: 'row', gap: 12, alignSelf: 'center' },
  dot: { width: 16, height: 16, borderRadius: 99 },
  dotFilled: { backgroundColor: colors.teal },
  dotEmpty: { backgroundColor: 'rgba(255,255,255,.14)' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  key: {
    width: '30%',
    height: 62,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,.07)',
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyMuted: { backgroundColor: 'rgba(255,255,255,.04)' },
  keyPressed: { backgroundColor: 'rgba(0,229,199,.2)', transform: [{ scale: 0.96 }] },
  keyText: { fontFamily: fonts.numericBold, fontSize: 22, color: 'rgba(255,255,255,.9)' },
  footnote: { fontFamily: fonts.jpRegular, fontSize: 10, color: colors.textDim4, textAlign: 'center' },
});
