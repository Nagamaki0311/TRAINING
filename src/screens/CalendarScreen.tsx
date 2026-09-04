import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { categoryTokens, colors, fonts } from '../theme/tokens';
import { exerciseDef, useAppState } from '../state/AppState';
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
    const map = new Map<string, CategoryKey[]>();
    for (const s of state.sessions) {
      const list = map.get(s.date) ?? [];
      list.push(s.category);
      map.set(s.date, list);
    }
    return map;
  }, [state.sessions]);

  const todayStr = `${year}-${pad(month + 1)}-${pad(now.getDate())}`;
  const selectedDate = state.calDay ?? todayStr;

  const cells: { label: string; date: string | null; categories: CategoryKey[]; isToday: boolean }[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push({ label: '', date: null, categories: [], isToday: false });
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${pad(month + 1)}-${pad(d)}`;
    cells.push({ label: String(d), date, categories: sessionsByDate.get(date) ?? [], isToday: date === todayStr });
  }

  const counts: Record<CategoryKey, number> = { chest: 0, core: 0, arms: 0, back: 0 };
  for (const list of sessionsByDate.values()) for (const c of list) counts[c]++;

  const monthSessions = state.sessions.filter((s) => s.date.startsWith(`${year}-${pad(month + 1)}`));
  const ratePct = daysInMonth ? Math.round((new Set(monthSessions.map((s) => s.date)).size / daysInMonth) * 100) : 0;

  const daySessions = state.sessions.filter((s) => s.date === selectedDate);
  const dayCat = daySessions[0]?.category;
  const dc = dayCat ? categoryTokens[dayCat] : null;

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
          const primary = c.categories[0];
          const bg = primary ? categoryTokens[primary].color : c.date ? 'rgba(255,255,255,.05)' : 'transparent';
          const fg = primary ? categoryTokens[primary].fg : c.date ? 'rgba(255,255,255,.3)' : 'transparent';
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
        {(['core', 'chest', 'arms', 'back'] as CategoryKey[]).map((k) => {
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
        {daySessions.length === 0 || !dc ? (
          <Text style={styles.emptyText}>この日の記録はありません</Text>
        ) : (
          <>
            <View style={styles.dayHeadRow}>
              <View style={[styles.dayBadge, { backgroundColor: dc.glow, borderColor: dc.color }]}>
                <Text style={[styles.dayBadgeText, { color: dc.color }]}>{dc.kanji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dayTitle}>{selectedDate.slice(5).replace('-', '/')} {dc.name}</Text>
                <Text style={styles.dayMeta}>
                  {Math.round(daySessions[0].durationSec / 60)}分{Math.round(daySessions[0].durationSec % 60)}秒 · {daySessions[0].sets.length}セット
                </Text>
              </View>
              <Text style={styles.dayRank}>{daySessions[0].rank}</Text>
            </View>
            <View style={{ marginTop: 12 }}>
              {daySessions[0].sets.slice(0, 6).map((r, i) => (
                <View key={i} style={styles.dayRow}>
                  <Text style={styles.dayRowName}>{exerciseDef(r.exerciseId).name}</Text>
                  <Text style={[styles.dayRowReps, { color: r.hit ? colors.teal : colors.textDim2 }]}>{r.reps}</Text>
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
