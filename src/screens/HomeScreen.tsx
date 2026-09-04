import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, categoryTokens, fonts } from '../theme/tokens';
import { useAppState, weekdayOf, todayIso, REST_SECONDS } from '../state/AppState';
import { computeTodayCapacity } from '../engine/capacity';
import { CapacityGauge } from './components/CapacityGauge';

export function HomeScreen() {
  const { state, actions } = useAppState();
  const weekday = weekdayOf();
  const todayCategory = state.weekPlan[weekday] ?? null;
  const today = todayIso();

  const todaysSessions = useMemo(() => state.sessions.filter((s) => s.date === today), [state.sessions, today]);
  const setsDoneToday = useMemo(() => todaysSessions.reduce((a, s) => a + s.sets.length, 0), [todaysSessions]);
  const minutesDoneToday = useMemo(() => todaysSessions.reduce((a, s) => a + s.durationSec, 0) / 60, [todaysSessions]);

  const plannedDay = todayCategory && state.program ? state.program[todayCategory] : null;
  const plannedTotalSets = plannedDay ? plannedDay.exercises.reduce((a, e) => a + e.sets, 0) : 0;

  const capacity = computeTodayCapacity({
    plannedMinutes: state.profile.minutesPerSession,
    elapsedMinutes: minutesDoneToday,
    dailyTimeCapMinutes: state.settings.dailyTimeCapMinutes,
    setsDoneToday,
    plannedTotalSets: plannedTotalSets || 1,
    setsDoneTodayForActiveCategory: todaysSessions.filter((s) => s.category === todayCategory).reduce((a, s) => a + s.sets.length, 0),
    fatigueLast3: state.sessions.slice(-3).map((s) => s.fatigue).filter((v): v is number => v !== null),
  });

  const cat = todayCategory ? categoryTokens[todayCategory] : null;
  const estMinutes = plannedTotalSets ? Math.round((plannedTotalSets * (40 + REST_SECONDS)) / 60) : 0;

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

      {cat && plannedDay ? (
        <Pressable style={[styles.todayCard, { borderColor: cat.color }]} onPress={() => actions.selectCategory(todayCategory!)}>
          <Text style={styles.todayKanji}>{cat.kanji}</Text>
          <Text style={[styles.todayKicker, { color: cat.color }]}>TODAY · {cat.en}</Text>
          <Text style={styles.todayName}>{cat.name}</Text>
          <View style={{ flexDirection: 'row', gap: 18, marginTop: 14 }}>
            <Stat label="SETS" value={String(plannedTotalSets)} />
            <Stat label="TIME" value={`${estMinutes}′`} />
            <Stat label="LOAD" value="+8%" valueColor={colors.gold} />
          </View>
          <Pressable
            style={[styles.startBtn, { backgroundColor: cat.color }]}
            onPress={() => actions.startWorkout(todayCategory!)}
          >
            <Text style={styles.startText}>START</Text>
          </Pressable>
        </Pressable>
      ) : (
        <View style={styles.restCard}>
          <Text style={styles.restTitle}>本日は休養日</Text>
          <Text style={styles.restSub}>カテゴリから種目を選んで自主トレーニングも可能です</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.historyKicker}>直近の履歴</Text>
        <View style={{ gap: 7 }}>
          {recent.length === 0 ? (
            <Text style={styles.emptyText}>まだ記録がありません</Text>
          ) : (
            recent.map((r) => {
              const c = categoryTokens[r.category];
              return (
                <View key={r.id} style={[styles.historyRow, { borderLeftColor: c.color }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyName}>{c.name}</Text>
                    <Text style={styles.historyMeta}>{r.date} · {Math.round(r.durationSec / 60)}分</Text>
                  </View>
                  <Text style={[styles.historyRank, { color: c.color }]}>{r.rank}</Text>
                </View>
              );
            })
          )}
        </View>
      </View>
    </ScrollView>
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
  todayKanji: {
    position: 'absolute',
    right: -14,
    bottom: -30,
    fontFamily: fonts.jpBlack,
    fontSize: 140,
    color: 'rgba(255,255,255,.05)',
  },
  todayKicker: { fontFamily: fonts.labelBold, fontSize: 9, letterSpacing: 3 },
  todayName: { fontFamily: fonts.jpBlack, fontSize: 30, color: colors.text, marginTop: 6 },
  statLabel: { fontFamily: fonts.label, fontSize: 9, letterSpacing: 1.5, color: colors.textDim3 },
  statValue: { fontFamily: fonts.numericBold, fontSize: 22, color: colors.text, marginTop: 2 },
  startBtn: { marginTop: 18, height: 54, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  startText: { fontFamily: fonts.jpBlack, fontSize: 17, color: '#0A0505', letterSpacing: 1 },
  restCard: {
    marginTop: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 20,
    alignItems: 'center',
  },
  restTitle: { fontFamily: fonts.jpBlack, fontSize: 16, color: colors.text },
  restSub: { fontFamily: fonts.jpRegular, fontSize: 11, color: colors.textDim2, marginTop: 6, textAlign: 'center' },
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
