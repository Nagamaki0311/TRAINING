import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { categoryTokens, colors, fonts } from '../theme/tokens';
import { exerciseDef, useAppState } from '../state/AppState';
import { RestRing } from './components/RestRing';
import { HowToSheet } from './components/HowToSheet';
import { FlashOverlay } from './components/FlashOverlay';

function clock(sec: number) {
  const s = Math.max(0, sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function WorkoutScreen() {
  const { state, actions } = useAppState();
  const [, setTick] = useState(0);
  const session = state.session;

  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [!!session]);

  useEffect(() => {
    if (!session || session.phase !== 'rest' || !session.restEndAt) return;
    const remaining = Math.ceil((session.restEndAt - Date.now()) / 1000);
    if (remaining <= 0) actions.advance();
  });

  if (!session) return null;
  const cat = categoryTokens[session.category];
  const ex = session.exercises[session.exIdx];
  const exDef = exerciseDef(ex.exerciseId);
  const isLastSetOfExercise = session.setIdx === ex.sets - 1;
  const nextExercise = isLastSetOfExercise ? session.exercises[session.exIdx + 1] : ex;
  const nextIsSameExercise = !isLastSetOfExercise;
  const remaining = session.restEndAt ? Math.max(0, Math.ceil((session.restEndAt - Date.now()) / 1000)) : 0;
  const restProgress = session.restDurationSec ? remaining / session.restDurationSec : 0;

  const unitLabel = exDef.unit === 'seconds' ? '秒' : '回';
  const target = ex.targetReps;
  const diff = target - session.reps;
  const repsHint = diff > 0 ? `目標まであと${diff}${unitLabel}` : diff === 0 ? '目標達成' : `目標を${-diff}${unitLabel}超過`;

  const nextLine = isLastSetOfExercise
    ? nextExercise
      ? `この後：${exerciseDef(nextExercise.exerciseId).name} ${nextExercise.sets}×${nextExercise.targetReps}`
      : 'この後：コンプリート'
    : `この後：${exDef.name} セット${session.setIdx + 2}`;

  const setBarSegments: { done: boolean; now: boolean }[] = [];
  session.exercises.forEach((e, ei) => {
    const doneCount = session.results.filter((r) => r.exerciseId === e.exerciseId).length;
    for (let i = 0; i < e.sets; i++) {
      setBarSegments.push({
        done: i < doneCount,
        now: ei === session.exIdx && i === session.setIdx && session.phase === 'work',
      });
    }
  });

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.exKicker, { color: cat.color }]}>EXERCISE {session.exIdx + 1} / {session.exercises.length}</Text>
          <Text style={styles.exName}>{exDef.name}</Text>
          <Pressable style={styles.howBtn} onPress={() => actions.toggleHow(true)}>
            <Text style={styles.howBtnText}>やり方を見る ›</Text>
          </Pressable>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.comboKicker}>COMBO</Text>
          <Text style={styles.comboValue}>{session.combo}</Text>
        </View>
      </View>

      <View style={styles.setBar}>
        {setBarSegments.map((s, i) => (
          <View
            key={i}
            style={[
              styles.setBarSeg,
              { backgroundColor: s.now ? cat.color : s.done ? colors.teal : 'rgba(255,255,255,.12)' },
            ]}
          />
        ))}
      </View>

      {session.phase === 'work' ? (
        <View style={styles.workBody}>
          <Text style={styles.setLabel}>
            SET {session.setIdx + 1} / {ex.sets} · TARGET {target} {unitLabel === '秒' ? 'SEC' : 'REPS'}
          </Text>
          <Text style={styles.repsBig}>{String(session.reps).padStart(2, '0')}</Text>
          <Text style={[styles.repsHint, { color: cat.color }]}>{repsHint}</Text>

          <View style={styles.repControls}>
            <Pressable style={styles.repBtn} onPress={actions.decReps}>
              <Text style={styles.repBtnText}>−</Text>
            </Pressable>
            <Text style={styles.repHelp}>実施回数を調整</Text>
            <Pressable style={styles.repBtn} onPress={actions.incReps}>
              <Text style={styles.repBtnText}>＋</Text>
            </Pressable>
          </View>

          <View style={styles.pipsRow}>
            {Array.from({ length: ex.sets }).map((_, i) => {
              const done = session.results.filter((r) => r.exerciseId === ex.exerciseId).length > i;
              const now = i === session.setIdx;
              return <View key={i} style={[styles.pip, { backgroundColor: done ? colors.teal : now ? cat.color : 'rgba(255,255,255,.14)' }]} />;
            })}
          </View>

          <View style={{ flex: 1 }} />
          <Text style={styles.nextLine}>{nextLine}</Text>
          <View style={styles.actionsRow}>
            <Pressable style={styles.quitBtn} onPress={actions.quit}>
              <Text style={styles.quitText}>中断</Text>
            </Pressable>
            <Pressable
              disabled={session.finishing}
              style={[styles.completeBtn, { backgroundColor: cat.color }, session.finishing && styles.completeBtnDisabled]}
              onPress={actions.completeSet}
            >
              <Text style={styles.completeText}>セット完了</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.restBody}>
          <RestRing progress={restProgress} color={cat.color} clockLabel={clock(remaining)} />
          <View style={styles.restActions}>
            <Pressable style={styles.restChip} onPress={actions.addRest}>
              <Text style={styles.restChipText}>+15秒</Text>
            </Pressable>
            <Pressable style={[styles.restChip, { borderColor: cat.color }]} onPress={actions.advance}>
              <Text style={[styles.restChipText, { color: cat.color }]}>スキップして次へ</Text>
            </Pressable>
          </View>

          {nextExercise && (
            <View style={styles.nextCard}>
              <Text style={styles.nextKicker}>次のセット</Text>
              <View style={styles.nextRow}>
                <View>
                  <Text style={styles.nextName}>{exerciseDef(nextExercise.exerciseId).name}</Text>
                  <Text style={styles.nextMeta}>
                    セット {nextIsSameExercise ? session.setIdx + 2 : 1} / {nextExercise.sets} · 目標 {nextExercise.targetReps}
                    {exerciseDef(nextExercise.exerciseId).unit === 'seconds' ? '秒' : '回'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.prevKicker}>前回</Text>
                  <Text style={styles.prevValue}>{nextExercise.prevReps ?? nextExercise.targetReps}{unitLabel}</Text>
                </View>
              </View>
              <View style={styles.tipBox}>
                <Text style={styles.tipText}>
                  前回{nextExercise.prevReps ?? nextExercise.targetReps}
                  {unitLabel}。{(nextExercise.prevReps ?? nextExercise.targetReps) + 1}{unitLabel}で記録更新になります。
                </Text>
              </View>
              <Pressable style={styles.howRow} onPress={() => actions.toggleHow(true)}>
                <Text style={[styles.howRowKicker, { color: cat.color }]}>HOW TO</Text>
                <Text style={styles.howRowText} numberOfLines={1}>{exerciseDef(nextExercise.exerciseId).how.steps[0]}</Text>
                <Text style={styles.howRowChevron}>›</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      <HowToSheet
        visible={session.howOn}
        onClose={() => actions.toggleHow(false)}
        exercise={exDef}
        planned={ex}
        accent={cat.color}
        accentGlow={cat.glow}
      />
      <FlashOverlay flash={session.flash} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, paddingTop: 8 },
  header: { flexDirection: 'row', paddingHorizontal: 22, alignItems: 'flex-start' },
  exKicker: { fontFamily: fonts.labelBold, fontSize: 9, letterSpacing: 2 },
  exName: { fontFamily: fonts.jpBlack, fontSize: 20, color: colors.text, marginTop: 2 },
  howBtn: {
    marginTop: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
  },
  howBtnText: { fontFamily: fonts.jpBold, fontSize: 10, color: colors.textDim1 },
  comboKicker: { fontFamily: fonts.labelBold, fontSize: 8, letterSpacing: 2, color: colors.textDim3 },
  comboValue: { fontFamily: fonts.numeric, fontSize: 30, color: colors.gold, lineHeight: 32 },
  setBar: { flexDirection: 'row', gap: 4, marginTop: 14, paddingHorizontal: 22 },
  setBarSeg: { flex: 1, height: 5, borderRadius: 3 },
  workBody: { flex: 1, alignItems: 'center', paddingHorizontal: 22, paddingBottom: 20 },
  setLabel: { fontFamily: fonts.label, fontSize: 10, letterSpacing: 2, color: colors.textDim2, marginTop: 40 },
  repsBig: { fontFamily: fonts.numeric, fontSize: 108, color: colors.text, lineHeight: 118 },
  repsHint: { fontFamily: fonts.jpBlack, fontSize: 13 },
  repControls: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 20 },
  repBtn: {
    width: 52,
    height: 52,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repBtnText: { fontFamily: fonts.labelBold, fontSize: 22, color: colors.textDim1 },
  repHelp: { fontFamily: fonts.jpRegular, fontSize: 10, color: colors.textDim3, letterSpacing: 1 },
  pipsRow: { flexDirection: 'row', gap: 7, marginTop: 20 },
  pip: { width: 44, height: 6, borderRadius: 3 },
  nextLine: { fontFamily: fonts.jpRegular, fontSize: 10, color: colors.textDim3, alignSelf: 'flex-start' },
  actionsRow: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 10 },
  quitBtn: {
    width: 60,
    height: 58,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quitText: { fontFamily: fonts.jpBold, fontSize: 11, color: colors.textDim1 },
  completeBtn: { flex: 1, height: 58, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  completeBtnDisabled: { opacity: 0.5 },
  completeText: { fontFamily: fonts.jpBlack, fontSize: 17, color: '#0A0505' },
  restBody: { flex: 1, paddingHorizontal: 22 },
  restActions: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 14 },
  restChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
  },
  restChipText: { fontFamily: fonts.jpBold, fontSize: 11, color: colors.textDim1 },
  nextCard: {
    marginTop: 20,
    padding: 15,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,.045)',
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  nextKicker: { fontFamily: fonts.jpRegular, fontSize: 10, letterSpacing: 2, color: colors.textDim3 },
  nextRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 7 },
  nextName: { fontFamily: fonts.jpBold, fontSize: 18, color: colors.text },
  nextMeta: { fontFamily: fonts.jpRegular, fontSize: 11, color: colors.textDim2, marginTop: 2 },
  prevKicker: { fontFamily: fonts.jpRegular, fontSize: 9, color: colors.textDim3 },
  prevValue: { fontFamily: fonts.numeric, fontSize: 22, color: colors.gold },
  tipBox: {
    marginTop: 11,
    padding: 11,
    borderRadius: 9,
    backgroundColor: 'rgba(255,197,61,.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,197,61,.28)',
  },
  tipText: { fontFamily: fonts.jpRegular, fontSize: 11, lineHeight: 17, color: 'rgba(255,255,255,.8)' },
  howRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  howRowKicker: { fontFamily: fonts.labelBold, fontSize: 9, letterSpacing: 2 },
  howRowText: { flex: 1, fontFamily: fonts.jpRegular, fontSize: 11, color: colors.textDim1 },
  howRowChevron: { fontFamily: fonts.label, fontSize: 12, color: colors.textDim3 },
});
