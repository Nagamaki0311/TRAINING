import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme/tokens';
import type { CapacityResult } from '../../engine/capacity';

const BLOCK_COLORS = [
  { bg: '#00E5C7', glow: 'rgba(0,229,199,.5)' },
  { bg: '#7CFF6B', glow: 'rgba(124,255,107,.5)' },
  { bg: '#FFC53D', glow: 'rgba(255,197,61,.45)' },
  { bg: '#FF4D2E', glow: 'rgba(255,77,46,.4)' },
];

function colorForIndex(i: number, used: number, total: number) {
  const remaining = total - used;
  if (i < remaining - 2) return BLOCK_COLORS[0];
  if (i < remaining) return BLOCK_COLORS[1];
  if (i < remaining + 1) return BLOCK_COLORS[2];
  if (i < used) return BLOCK_COLORS[3];
  return null;
}

export function CapacityGauge({ capacity, capLine }: { capacity: CapacityResult; capLine: string }) {
  const used = capacity.blocksUsed;
  const total = capacity.blocksTotal;
  return (
    <View>
      <View style={styles.headRow}>
        <Text style={styles.title}>本日のゲージ</Text>
        <Text style={styles.count}>{total - used} / {total} ブロック</Text>
      </View>
      <View style={styles.row}>
        {Array.from({ length: total }).map((_, i) => {
          const c = colorForIndex(i, used, total);
          return (
            <View
              key={i}
              style={[
                styles.block,
                { backgroundColor: c ? c.bg : 'rgba(255,255,255,.07)' },
                c ? { shadowColor: c.glow, shadowOpacity: 0.8, shadowRadius: 6 } : null,
              ]}
            />
          );
        })}
      </View>
      <View style={styles.footRow}>
        <Text style={styles.footText}>{capLine}</Text>
        {capacity.warn ? <Text style={styles.warnText}>残り少なめ・今日はここまで推奨</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 },
  title: { fontFamily: fonts.jpBlack, fontSize: 13, color: colors.text, letterSpacing: 1 },
  count: { fontFamily: fonts.jp, fontSize: 10, color: colors.textDim3 },
  row: { flexDirection: 'row', gap: 4, height: 34 },
  block: { flex: 1, borderRadius: 2 },
  footRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  footText: { fontFamily: fonts.jp, fontSize: 9, color: colors.textDim3 },
  warnText: { fontFamily: fonts.jp, fontSize: 9, color: colors.danger },
});
