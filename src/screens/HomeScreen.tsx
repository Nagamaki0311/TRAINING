import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, categoryTokens, fonts } from '../theme/tokens';
import { categoryOf } from '../data/exercisePool';
import { exerciseDef, planForToday, todayIso, useAppState } from '../state/AppState';
import { computeTodayCapacity } from '../engine/capacity';
import { estimatePlanSeconds } from '../engine/programGenerator';
import { shouldSuggestDeload } from '../engine/progression';
import { CapacityGauge } from './components/CapacityGauge';

export function HomeScreen() {
  const { state, actions } = useAppState();
  const today = todayIso();

  const todaysSessions = useMemo(() => state.sessions.filter((s) => s.date === today), [state.sessions, today]);
  const setsDoneToday = useMemo(() => todaysSessions.reduce((a, s) => a + s.sets.length, 0), [todaysSessions]);
  const minutesDoneToday = useMemo(() => todaysSessions.reduce((a, s) => a + s.durationSec, 0) / 60, [todaysSessions]);
  const maxSetsInOneCategoryToday = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of todaysSessions) {
      for (const r of s.sets) {
        const c = categoryOf(r.exerciseId);
        if (c) counts.set(c, (counts.get(c) ?? 0) + 1);
      }
    }
    return Math.max(0, ...counts.values());
  }, [todaysSessions]);

  const plan = useMemo(() => planForToday(state), [state.profile, state.targets, state.sessions, state.settings.sessionCountSinceDeload, today]);
  const plannedTotalSets = plan.reduce((a, e) => a + e.sets, 0);
  const estMinutes = Math.round(estimatePlanSeconds(plan) / 60);
  const deload = shouldSuggestDeload(state.settings.sessionCountSinceDeload);
  const trainedToday = todaysSessions.length > 0;

  const capacity = computeTodayCapacity({
    plannedMinutes: state.profile.minutesPerSession,
    elapsedMinutes: minutesDoneToday,
    dailyTimeCapMinutes: state.settings.dailyTimeCapMinutes,
    setsDoneToday,
    plannedTotalSets: plannedTotalSets || 1,
    maxSetsInOneCategoryToday,
    fatigueLast3: state.sessions.slice(-3).map((s) => s.fatigue).filter((v): v is number => v !== null),
  });

  const recent = state.sessions
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, 3);

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={styles.streakCard}>
        <View>
          <Text style={styles.streakKicker}>STREAK COMBO</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
            <Text style={styles.streakNum}>{state.settings.streak}</Text>
            <Text style={styles.streakUnit}>HIT</Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.rankKicker}>RANK</Text>
          <Text style={styles.rankValue}>{rankForStreak(state.settings.streak)}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <CapacityGauge
          capacity={capacity}
          capLine={`時間${Math.round(minutesDoneToday)}分 · セット${setsDoneToday} · 疲労 ${capacity.warn ? '高' : capacity.ratio > 0.4 ? '中' : '低'}`}
        />
      </View>

      <View style={[styles.todayCard, { borderColor: trainedToday ? colors.hairlineStrong : colors.teal }]}>
        <Text style={[styles.todayKicker, { color: trainedToday ? colors.textDim3 : colors.teal }]}>
          {trainedToday ? 'TODAY · 実施済み' : deload ? 'TODAY · ディロード' : 'TODAY'}
        </Text>
        <Text style={styles.todayName}>{trainedToday ? '今日のトレーニング完了' : '今日のプラン'}</Text>
        {trainedToday && <Text style={styles.todaySub}>下は追加で行う場合のプランです（直近の実施量から再計算）。</Text>}
        <View style={{ flexDirection: 'row', gap: 18, marginTop: 14 }}>
          <Stat label="SETS" value={String(plannedTotalSets)} />
          <Stat label="TIME" value={`${estMinutes}′`} />
          <Stat label="EXERCISES" value={String(plan.length)} />
        </View>
        <View style={{ marginTop: 14, gap: 6 }}>
          {plan.map((e) => {
            const def = exerciseDef(e.exerciseId);
            const c = categoryTokens[def.category];
            return (
              <View key={e.exerciseId} style={[styles.planRow, { borderLeftColor: c.color }]}>
                <Text style={[styles.planCat, { color: c.color }]}>{c.kanji}</Text>
                <Text style={styles.planName}>{def.name}</Text>
                <Text style={styles.planSets}>
                  {e.sets}×{e.targetReps}{def.unit === 'seconds' ? '秒' : ''}
                </Text>
              </View>
            );
          })}
        </View>
        <View style={styles.preRow}>
          <Toggle label="睡眠不足" active={state.preSleepPoor} onPress={actions.togglePreSleep} />
          <Toggle label="体調不良" active={state.preUnwell} onPress={actions.togglePreUnwell} />
        </View>
        <Pressable style={[styles.startBtn, { backgroundColor: colors.teal }]} onPress={actions.startWorkout}>
          <Text style={styles.startText}>{trainedToday ? '追加で行う' : 'START'}</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.historyKicker}>直近の履歴</Text>
        <View style={{ gap: 7 }}>
          {recent.length === 0 ? (
            <Text style={styles.emptyText}>まだ記録がありません</Text>
          ) : (
            recent.map((r) => (
              <View key={r.id} style={[styles.historyRow, { borderLeftColor: colors.teal }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyName}>{r.sets.length}セット</Text>
                  <Text style={styles.historyMeta}>{r.date} · {Math.round(r.durationSec / 60)}分</Text>
                </View>
                <Text style={[styles.historyRank, { color: colors.teal }]}>{r.rank}</Text>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
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

function rankForStreak(streak: number) {
  if (streak >= 30) return 'S';
  if (streak >= 14) return 'A+';
  if (streak >= 7) return 'A';
  if (streak >= 3) return 'B';
  return 'C';
}

function Stat({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 18, paddingTop: 14 },
  section: { marginTop: 16 },
  streakCard: {
    padding: 14,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,229,199,.35)',
    backgroundColor: 'rgba(0,229,199,.06)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  streakKicker: { fontFamily: fonts.labelBold, fontSize: 9, letterSpacing: 3, color: colors.teal },
  streakNum: { fontFamily: fonts.numeric, fontSize: 46, color: colors.text, lineHeight: 46 },
  streakUnit: { fontFamily: fonts.numericBold, fontSize: 14, color: colors.teal },
  rankKicker: { fontFamily: fonts.labelBold, fontSize: 9, letterSpacing: 2, color: colors.textDim3 },
  rankValue: { fontFamily: fonts.numeric, fontSize: 30, color: colors.gold, lineHeight: 34 },
  todayCard: { marginTop: 18, borderRadius: 4, borderWidth: 1, padding: 20, backgroundColor: colors.bgCard, overflow: 'hidden' },
  todayKicker: { fontFamily: fonts.labelBold, fontSize: 9, letterSpacing: 3 },
  todayName: { fontFamily: fonts.jpBlack, fontSize: 30, color: colors.text, marginTop: 6 },
  statLabel: { fontFamily: fonts.label, fontSize: 9, letterSpacing: 1.5, color: colors.textDim3 },
  statValue: { fontFamily: fonts.numericBold, fontSize: 22, color: colors.text, marginTop: 2 },
  todaySub: { fontFamily: fonts.jpRegular, fontSize: 10, color: colors.textDim2, marginTop: 6 },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 9, backgroundColor: 'rgba(255,255,255,.04)', borderLeftWidth: 2 },
  planCat: { fontFamily: fonts.jpBlack, fontSize: 13, width: 18, textAlign: 'center' },
  planName: { flex: 1, fontFamily: fonts.jpBold, fontSize: 12, color: colors.text },
  planSets: { fontFamily: fonts.numericBold, fontSize: 15, color: colors.textDim1 },
  preRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
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
  startBtn: { marginTop: 18, height: 54, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  startText: { fontFamily: fonts.jpBlack, fontSize: 17, color: '#04120F', letterSpacing: 1 },
  historyKicker: { fontFamily: fonts.jpBold, fontSize: 10, letterSpacing: 2, color: colors.textDim3, marginBottom: 9 },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,.04)',
    borderLeftWidth: 2,
  },
  historyName: { fontFamily: fonts.jpBold, fontSize: 12, color: colors.text },
  historyMeta: { fontFamily: fonts.jpRegular, fontSize: 9, color: colors.textDim3, marginTop: 2 },
  historyRank: { fontFamily: fonts.numeric, fontSize: 15 },
  emptyText: { fontFamily: fonts.jpRegular, fontSize: 11, color: colors.textDim3 },
});
