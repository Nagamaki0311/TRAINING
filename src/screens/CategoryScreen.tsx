import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { CategoryKey } from '../theme/tokens';
import { categoryTokens, colors, fonts } from '../theme/tokens';
import { useAppState } from '../state/AppState';

const ORDER: CategoryKey[] = ['chest', 'core', 'arms', 'back'];

export function CategoryScreen() {
  const { state, actions } = useAppState();
  const selected = state.selectedCategory;
  const program = state.program;
  const plannedTotalSets = program ? program[selected].exercises.reduce((a, e) => a + e.sets, 0) : 0;
  const accent = categoryTokens[selected].color;
  const costPct = Math.min(90, plannedTotalSets * 5);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.kicker}>SELECT YOUR STAGE</Text>
        <Text style={styles.title}>トレーニング部位を選ぶ</Text>
      </View>

      <View style={styles.panels}>
        {ORDER.map((key) => {
          const c = categoryTokens[key];
          const isSel = selected === key;
          const day = program?.[key];
          const subtitle = day ? `${day.exercises.length}種目 · ${day.exercises.reduce((a, e) => a + e.sets, 0)}セット` : '';
          return (
            <Pressable
              key={key}
              onPress={() => actions.selectCategory(key)}
              style={[
                styles.panel,
                { flex: isSel ? 1.55 : 1, borderTopColor: isSel ? c.color : 'rgba(255,255,255,.1)' },
                isSel ? { backgroundColor: `${c.color}22` } : styles.panelDim,
              ]}
            >
              <Text style={[styles.panelKanji, { fontSize: isSel ? 150 : 90, color: `${c.color}26` }]}>{c.kanji}</Text>
              <Text style={[styles.panelKicker, { color: c.color }]}>{c.en}</Text>
              <Text style={[styles.panelTitle, { fontSize: isSel ? 30 : 21 }]}>{c.name}</Text>
              {!!subtitle && <Text style={styles.panelSub}>{subtitle}</Text>}
              {isSel && (
                <View style={[styles.selectedBadge, { backgroundColor: c.color }]}>
                  <Text style={[styles.selectedBadgeText, { color: c.fg }]}>選択中 ✓</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.preRow}>
        <Toggle label="睡眠不足" active={state.preSleepPoor} onPress={actions.togglePreSleep} />
        <Toggle label="体調不良" active={state.preUnwell} onPress={actions.togglePreUnwell} />
      </View>

      <View style={styles.footer}>
        <View style={{ flex: 1 }}>
          <Text style={styles.costLine}>許容量残 — この選択で{costPct}%消費</Text>
          <View style={styles.costTrack}>
            <View style={[styles.costFill, { width: `${costPct}%`, backgroundColor: accent }]} />
          </View>
        </View>
        <Pressable style={[styles.startBtn, { backgroundColor: accent }]} onPress={() => actions.startWorkout(selected)}>
          <Text style={styles.startText}>開始</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Toggle({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.toggle, active && styles.toggleActive]}>
      <View style={[styles.toggleDot, active && styles.toggleDotActive]} />
      <Text style={[styles.toggleText, active && styles.toggleTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 12 },
  kicker: { fontFamily: fonts.labelBold, fontSize: 9, letterSpacing: 4, color: colors.textDim3 },
  title: { fontFamily: fonts.jpBlack, fontSize: 24, color: colors.text, marginTop: 4 },
  panels: { flex: 1, flexDirection: 'column', gap: 2 },
  panel: { padding: 22, justifyContent: 'center', overflow: 'hidden', borderTopWidth: 2 },
  panelDim: { backgroundColor: colors.bgCard },
  panelKanji: { position: 'absolute', right: 10, top: '50%', fontFamily: fonts.jpBlack, marginTop: -60 },
  panelKicker: { fontFamily: fonts.labelBold, fontSize: 9, letterSpacing: 3 },
  panelTitle: { fontFamily: fonts.jpBlack, color: colors.text, marginTop: 4 },
  panelSub: { fontFamily: fonts.jpRegular, fontSize: 10, color: colors.textDim2, marginTop: 4 },
  selectedBadge: { marginTop: 12, alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 4 },
  selectedBadgeText: { fontFamily: fonts.jpBlack, fontSize: 12 },
  preRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 22, paddingTop: 12 },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
  },
  toggleActive: { borderColor: colors.gold, backgroundColor: 'rgba(255,197,61,.12)' },
  toggleDot: { width: 8, height: 8, borderRadius: 99, backgroundColor: 'rgba(255,255,255,.2)' },
  toggleDotActive: { backgroundColor: colors.gold },
  toggleText: { fontFamily: fonts.jp, fontSize: 11, color: colors.textDim2 },
  toggleTextActive: { color: colors.gold },
  footer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    padding: 22,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  costLine: { fontFamily: fonts.jpRegular, fontSize: 9, color: colors.textDim3 },
  costTrack: { height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,.1)', marginTop: 6 },
  costFill: { height: 5, borderRadius: 3 },
  startBtn: { height: 44, paddingHorizontal: 24, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  startText: { fontFamily: fonts.jpBlack, fontSize: 14, color: '#0A0505' },
});
