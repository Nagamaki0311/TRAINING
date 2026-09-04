import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { categoryTokens, colors, fonts } from '../theme/tokens';
import { exerciseDef, useAppState } from '../state/AppState';

const RANK_LINE: Record<string, string> = {
  S: '全セット完遂',
  A: 'ほぼ完遂',
  B: '次回は完遂率アップを狙う',
  C: '次回は完遂率アップを狙う',
};

export function CompleteScreen() {
  const { state, actions } = useAppState();
  const record = state.lastFinishedSession;
  if (!record) return null;
  const cat = categoryTokens[record.category];
  const totalReps = record.sets.reduce((a, s) => a + s.reps, 0);
  const total = record.sets.length;
  const hits = record.sets.filter((s) => s.hit).length;

  const program = state.program?.[record.category];
  const nextAdjustExercise = program?.exercises[1] ?? program?.exercises[0];
  const nextAdjustName = nextAdjustExercise ? exerciseDef(nextAdjustExercise.exerciseId).name : '';

  const stats = useMemo(
    () => [
      { label: '総レップ数', value: String(totalReps), badge: '', color: colors.gold },
      { label: '最大コンボ', value: String(record.maxCombo), badge: 'MAX', color: colors.danger },
      { label: '完遂セット', value: `${hits}/${total}`, badge: record.rank, color: colors.teal },
      { label: 'ストリーク', value: String(state.settings.streak), badge: '日', color: '#7C6BFF' },
    ],
    [record]
  );

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={styles.header}>
        <Text style={styles.kicker}>WORKOUT COMPLETE</Text>
        <Text style={styles.catName}>{cat.name}</Text>
        <Text style={styles.meta}>{Math.round(record.durationSec / 60)}分 · {total}セット</Text>
      </View>

      <View style={styles.rankWrap}>
        <View style={styles.rankRing} />
        <Text style={styles.rankText}>{record.rank}</Text>
      </View>
      <Text style={styles.rankLine}>{RANK_LINE[record.rank]}</Text>

      <View style={styles.statsList}>
        {stats.map((s) => (
          <View key={s.label} style={[styles.statRow, { borderLeftColor: s.color }]}>
            <Text style={styles.statLabel}>{s.label}</Text>
            <Text style={styles.statValue}>{s.value}</Text>
            {!!s.badge && <Text style={[styles.statBadge, { color: s.color }]}>{s.badge}</Text>}
          </View>
        ))}
      </View>

      <View style={styles.adjustBox}>
        <Text style={styles.adjustKicker}>次回の自動調整</Text>
        <Text style={styles.adjustText}>
          {record.rank === 'S' ? '全セット達成のため' : '達成状況に応じて'}、次回の{nextAdjustName}の目標を見直しました。
        </Text>
      </View>

      <View style={styles.fatigueBox}>
        <Text style={styles.adjustKicker}>今日の体感疲労度</Text>
        <View style={styles.fatigueRow}>
          {[1, 2, 3, 4, 5].map((v) => (
            <Pressable
              key={v}
              onPress={() => actions.setFatiguePick(v)}
              style={[styles.fatigueDot, state.fatiguePick === v && { backgroundColor: cat.color, borderColor: cat.color }]}
            >
              <Text style={styles.fatigueDotText}>{v}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable style={styles.calBtn} onPress={() => actions.setScreen('cal')}>
          <Text style={styles.calBtnText}>記録を見る</Text>
        </Pressable>
        <Pressable style={[styles.homeBtn, { backgroundColor: colors.gold }]} onPress={() => actions.setScreen('home')}>
          <Text style={styles.homeBtnText}>ホームへ</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  header: { alignItems: 'center', paddingTop: 18, paddingHorizontal: 22 },
  kicker: { fontFamily: fonts.labelBold, fontSize: 10, letterSpacing: 5, color: colors.gold },
  catName: { fontFamily: fonts.numeric, fontSize: 44, color: colors.text, marginTop: 8 },
  meta: { fontFamily: fonts.jpBold, fontSize: 11, color: colors.textDim1, marginTop: 6, letterSpacing: 1 },
  rankWrap: { alignSelf: 'center', marginTop: 18, width: 150, height: 150, alignItems: 'center', justifyContent: 'center' },
  rankRing: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 99,
    borderWidth: 2,
    borderColor: 'rgba(255,197,61,.45)',
  },
  rankText: { fontFamily: fonts.numeric, fontSize: 96, color: colors.gold },
  rankLine: { textAlign: 'center', fontFamily: fonts.jpBlack, fontSize: 13, color: colors.text, marginTop: 4, letterSpacing: 1 },
  statsList: { marginTop: 20, paddingHorizontal: 22, gap: 2 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: 'rgba(255,255,255,.045)', borderLeftWidth: 2 },
  statLabel: { flex: 1, fontFamily: fonts.jp, fontSize: 12, color: colors.textDim1 },
  statValue: { fontFamily: fonts.numericBold, fontSize: 24, color: colors.text },
  statBadge: { fontFamily: fonts.labelBold, fontSize: 11 },
  adjustBox: {
    marginTop: 16,
    marginHorizontal: 22,
    padding: 13,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,.04)',
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  fatigueBox: {
    marginTop: 12,
    marginHorizontal: 22,
    padding: 13,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,.04)',
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  adjustKicker: { fontFamily: fonts.jpRegular, fontSize: 10, letterSpacing: 1.5, color: colors.textDim3 },
  adjustText: { fontFamily: fonts.jpRegular, fontSize: 11, lineHeight: 17, color: 'rgba(255,255,255,.72)', marginTop: 5 },
  fatigueRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  fatigueDot: {
    width: 36,
    height: 36,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fatigueDotText: { fontFamily: fonts.numericBold, fontSize: 14, color: colors.text },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 22, marginTop: 22 },
  calBtn: { flex: 1, height: 54, borderRadius: 12, borderWidth: 1, borderColor: colors.hairlineStrong, alignItems: 'center', justifyContent: 'center' },
  calBtnText: { fontFamily: fonts.jpBold, fontSize: 13, color: colors.textDim1 },
  homeBtn: { flex: 1.4, height: 54, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  homeBtnText: { fontFamily: fonts.jpBlack, fontSize: 15, color: '#120C02' },
});
