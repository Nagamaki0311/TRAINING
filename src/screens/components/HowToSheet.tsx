import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme/tokens';
import type { ExerciseDef, PlannedExercise } from '../../data/types';

interface Props {
  visible: boolean;
  onClose: () => void;
  exercise: ExerciseDef;
  planned: PlannedExercise;
  accent: string;
  accentGlow: string;
}

export function HowToSheet({ visible, onClose, exercise, planned, accent, accentGlow }: Props) {
  if (!visible) return null;
  const unitLabel = exercise.unit === 'seconds' ? '秒' : '回';
  return (
    <>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.kicker, { color: accent }]}>HOW TO</Text>
            <Text style={styles.name}>{exercise.name}</Text>
            <Text style={styles.meta}>{planned.sets}セット × 目標{planned.targetReps}{unitLabel}</Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
            <Text style={styles.closeIcon}>✕</Text>
          </Pressable>
        </View>

        <View style={styles.figurePlaceholder}>
          <Text style={styles.figureLabel}>figure — {exercise.name}</Text>
          <Text style={styles.figureSub}>動作図（開始 / 終了の2コマ）をここに配置</Text>
        </View>

        <ScrollView style={{ maxHeight: 260 }}>
          <View style={{ gap: 9 }}>
            {exercise.how.steps.map((st, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={[styles.stepBadge, { backgroundColor: accentGlow }]}>
                  <Text style={[styles.stepNum, { color: accent }]}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{st}</Text>
              </View>
            ))}
          </View>

          <View style={styles.pointBox}>
            <Text style={styles.pointKicker}>POINT</Text>
            <Text style={styles.pointText}>{exercise.how.point}</Text>
          </View>
          <Text style={styles.breathText}>呼吸：{exercise.how.breath}</Text>
        </ScrollView>

        <Pressable onPress={onClose} style={[styles.closeCta, { backgroundColor: accent }]}>
          <Text style={styles.closeCtaText}>閉じる</Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,.64)', zIndex: 8 },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9,
    backgroundColor: colors.bgSheet,
    borderTopWidth: 1,
    borderColor: colors.hairlineStrong,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 28,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  kicker: { fontFamily: fonts.labelBold, fontSize: 9, letterSpacing: 3 },
  name: { fontFamily: fonts.jpBlack, fontSize: 19, color: colors.text, marginTop: 2 },
  meta: { fontFamily: fonts.jp, fontSize: 10, color: colors.textDim3, marginTop: 2 },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: { color: colors.textDim1, fontSize: 13 },
  figurePlaceholder: {
    marginTop: 14,
    height: 112,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,.2)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  figureLabel: { fontFamily: 'ui-monospace', fontSize: 11, color: colors.textDim1 },
  figureSub: { fontFamily: 'ui-monospace', fontSize: 9, color: colors.textDim4 },
  stepRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginTop: 9 },
  stepBadge: { width: 20, height: 20, borderRadius: 99, alignItems: 'center', justifyContent: 'center' },
  stepNum: { fontFamily: fonts.labelBold, fontSize: 11 },
  stepText: { flex: 1, fontFamily: fonts.jpRegular, fontSize: 12, lineHeight: 18, color: 'rgba(255,255,255,.82)' },
  pointBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,197,61,.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,197,61,.28)',
  },
  pointKicker: { fontFamily: fonts.labelBold, fontSize: 9, letterSpacing: 2, color: colors.gold },
  pointText: { fontFamily: fonts.jpRegular, fontSize: 11, lineHeight: 17, color: 'rgba(255,255,255,.8)', marginTop: 3 },
  breathText: { fontFamily: fonts.jpRegular, fontSize: 11, color: colors.textDim2, marginTop: 9 },
  closeCta: { marginTop: 16, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  closeCtaText: { fontFamily: fonts.jpBlack, fontSize: 14, color: '#0A0505' },
});
