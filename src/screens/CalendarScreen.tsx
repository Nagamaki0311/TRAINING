import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { categoryTokens, colors, fonts } from '../theme/tokens';
import { categoryOf } from '../data/exercisePool';
import { exerciseName, useAppState } from '../state/AppState';
import type { CategoryKey } from '../theme/tokens';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function CalendarScreen() {
  const { state, actions } = useAppState();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // 0=Mon

  const sessionsByDate = useMemo(() => {
    // 日付ごとに、その日にセットを実施したカテゴリの集合（重複なし）を持つ。
    const map = new Map<string, Set<CategoryKey>>();
    for (const s of state.sessions) {
      const set = map.get(s.date) ?? new Set<CategoryKey>();
      for (const r of s.sets) {
        const c = categoryOf(r.exerciseId);
        if (c) set.add(c);
      }
      map.set(s.date, set);
    }
    return map;
  }, [state.sessions]);

  const todayStr = `${year}-${pad(month + 1)}-${pad(now.getDate())}`;
  const selectedDate = state.calDay ?? todayStr;

  const cells: { label: string; date: string | null; trained: boolean; isToday: boolean }[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push({ label: '', date: null, trained: false, isToday: false });
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${pad(month + 1)}-${pad(d)}`;
    cells.push({ label: String(d), date, trained: sessionsByDate.has(date), isToday: date === todayStr });
  }

  const counts: Record<CategoryKey, number> = { chest: 0, core: 0, arms: 0, back: 0, legs: 0 };
  for (const set of sessionsByDate.values()) for (const c of set) counts[c]++;

  const monthSessions = state.sessions.filter((s) => s.date.startsWith(`${year}-${pad(month + 1)}`));
  const ratePct = daysInMonth ? Math.round((new Set(monthSessions.map((s) => s.date)).size / daysInMonth) * 100) : 0;

  const daySessions = state.sessions.filter((s) => s.date === selectedDate);
  // 選択日の種目別セット結果（複数セッションがある日も合算して種目ごとに並べる）。
  const dayExercises = useMemo(() => {
    const byEx = new Map<string, number[]>();
    for (const s of daySessions) for (const r of s.sets) byEx.set(r.exerciseId, [...(byEx.get(r.exerciseId) ?? []), r.reps]);
    return [...byEx.entries()];
  }, [state.sessions, selectedDate]);
  const dayDurationSec = daySessions.reduce((a, s) => a + s.durationSec, 0);
  const daySetCount = daySessions.reduce((a, s) => a + s.sets.length, 0);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>BATTLE LOG</Text>
          <Text style={styles.month}>{year} / {pad(month + 1)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.rateKicker}>実施率</Text>
          <Text style={styles.rateValue}>{ratePct}<Text style={{ fontSize: 14 }}>%</Text></Text>
        </View>
      </View>

      <View style={styles.grid}>
        {cells.map((c, i) => {
          const bg = c.trained ? colors.teal : c.date ? 'rgba(255,255,255,.05)' : 'transparent';
          const fg = c.trained ? '#04120F' : c.date ? 'rgba(255,255,255,.3)' : 'transparent';
          const isSelected = c.date === selectedDate;
          return (
            <Pressable
              key={i}
              disabled={!c.date}
              onPress={() => c.date && actions.setCalDay(c.date)}
              style={[styles.cell, { backgroundColor: bg }, isSelected && styles.cellSelected]}
            >
              <Text style={[styles.cellLabel, { color: fg }]}>{c.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.legendRow}>
        {(['core', 'chest', 'arms', 'back', 'legs'] as CategoryKey[]).map((k) => {
          const c = categoryTokens[k];
          return (
            <View key={k} style={[styles.legendItem, { borderLeftColor: c.color }]}>
              <Text style={[styles.legendEn, { color: c.color }]}>{c.en}</Text>
              <Text style={styles.legendDays}>{counts[k]}日</Text>
            </View>
          );
        })}
      </View>

      <ScrollView style={styles.dayPanel}>
        {daySessions.length === 0 ? (
          <Text style={styles.emptyText}>この日の記録はありません</Text>
        ) : (
          <>
            <View style={styles.dayHeadRow}>
              <View style={[styles.dayBadge, { backgroundColor: 'rgba(0,229,199,.2)', borderColor: colors.teal }]}>
                <Text style={[styles.dayBadgeText, { color: colors.teal }]}>全</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dayTitle}>{selectedDate.slice(5).replace('-', '/')} 今日のプラン</Text>
                <Text style={styles.dayMeta}>
                  {Math.floor(dayDurationSec / 60)}分{Math.round(dayDurationSec % 60)}秒 · {daySetCount}セット
                </Text>
              </View>
              <Text style={styles.dayRank}>{daySessions[daySessions.length - 1].rank}</Text>
            </View>
            <View style={{ marginTop: 12 }}>
              {dayExercises.map(([id, reps]) => (
                <View key={id} style={styles.dayRow}>
                  <Text style={styles.dayRowName}>{exerciseName(id)}</Text>
                  <Text style={[styles.dayRowReps, { color: colors.teal }]}>{reps.join(' / ')}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 10 },
  kicker: { fontFamily: fonts.labelBold, fontSize: 9, letterSpacing: 3, color: colors.textDim3 },
  month: { fontFamily: fonts.jpBlack, fontSize: 26, color: colors.text, marginTop: 3 },
  rateKicker: { fontFamily: fonts.labelBold, fontSize: 8, letterSpacing: 2, color: colors.textDim3 },
  rateValue: { fontFamily: fonts.numeric, fontSize: 30, color: colors.teal },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, paddingTop: 14, gap: 3 },
  cell: { width: '13%', aspectRatio: 1, alignItems: 'flex-end', padding: 3, borderRadius: 2 },
  cellSelected: { borderWidth: 2, borderColor: '#fff' },
  cellLabel: { fontFamily: fonts.labelBold, fontSize: 9 },
  legendRow: { flexDirection: 'row', gap: 5, paddingHorizontal: 20, paddingTop: 12 },
  legendItem: { flex: 1, padding: 8, backgroundColor: 'rgba(255,255,255,.04)', borderLeftWidth: 2 },
  legendEn: { fontFamily: fonts.labelBold, fontSize: 9, letterSpacing: 1 },
  legendDays: { fontFamily: fonts.numericBold, fontSize: 17, color: colors.text, marginTop: 1 },
  dayPanel: { marginTop: 14, flex: 1, backgroundColor: colors.bgSheet, paddingHorizontal: 20, paddingTop: 15 },
  emptyText: { fontFamily: fonts.jpRegular, fontSize: 11, color: colors.textDim3 },
  dayHeadRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dayBadge: { width: 38, height: 38, borderRadius: 4, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dayBadgeText: { fontFamily: fonts.jpBlack, fontSize: 19 },
  dayTitle: { fontFamily: fonts.jpBlack, fontSize: 16, color: colors.text },
  dayMeta: { fontFamily: fonts.jp, fontSize: 10, color: colors.textDim2 },
  dayRank: { fontFamily: fonts.numeric, fontSize: 26, color: colors.gold },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.hairline },
  dayRowName: { fontFamily: fonts.jpBold, fontSize: 11, color: colors.text },
  dayRowReps: { fontFamily: fonts.numericBold, fontSize: 13 },
});
