// 記録ベースの自動プログラム更新ロジック（工程2-2）。docs/training-science.md 5章・6章参照。
import { EXERCISE_POOL } from '../data/exercisePool';
import { FATIGUE_RULES, PROGRESSION } from '../data/scienceDefaults';
import type { PlannedExercise, SessionRecord } from '../data/types';

interface ProgressionInput {
  exercise: PlannedExercise;
  /** その種目の直近セッション結果を新しい順に並べたもの（各セッションで全セット達成したか） */
  recentFullHits: boolean[];
  avgFatigueLast3: number | null;
  feltUnwellToday: boolean;
}

export interface ProgressionResult {
  nextTargetReps: number;
  suggestVariationUp: boolean;
  note: string;
}

/** 次回セッションの目標reps・バリエーション変更提案を算出する。 */
export function computeNextTarget({
  exercise,
  recentFullHits,
  avgFatigueLast3,
  feltUnwellToday,
}: ProgressionInput): ProgressionResult {
  const def = EXERCISE_POOL.find((e) => e.id === exercise.exerciseId);
  const cap = def?.repRangeHigh ?? PROGRESSION.repCapBeforeVariationUp;
  let target = exercise.targetReps;
  let note = '目標を維持します。';

  const lastFullHit = recentFullHits[0];
  const missedLastTwo =
    recentFullHits.length >= PROGRESSION.consecutiveMissThreshold &&
    recentFullHits.slice(0, PROGRESSION.consecutiveMissThreshold).every((h) => !h);

  if (lastFullHit) {
    target = Math.min(cap, target + PROGRESSION.repIncrementOnFullHit);
    note = '前回全セット達成のため目標を+1します。';
  } else if (missedLastTwo) {
    target = Math.max(def?.repRangeLow ?? 1, target - PROGRESSION.repDecrementOnConsecutiveMiss);
    note = '2回連続で未達のため目標を-1します。';
  }

  const suggestVariationUp = target >= cap && lastFullHit;
  if (suggestVariationUp) note = '上限に到達したため、難易度の高いバリエーションへの切り替えを検討してください。';

  if (avgFatigueLast3 !== null && avgFatigueLast3 >= FATIGUE_RULES.highFatigueAvgThreshold) {
    target = Math.max(def?.repRangeLow ?? 1, Math.round(target * (1 - FATIGUE_RULES.highFatigueVolumeCutRatio)));
    note = '直近の疲労度が高いため、目標を控えめに調整しました。';
  }

  if (feltUnwellToday) {
    target = Math.max(def?.repRangeLow ?? 1, Math.round(target * (1 - FATIGUE_RULES.poorConditionRepCutRatio)));
    note = '本日の体調申告を反映し、目標を軽くしました。';
  }

  return { nextTargetReps: target, suggestVariationUp, note };
}

/** 6章: 通常負荷を続けたセッション数からディロード週を提案すべきか判定する。 */
export function shouldSuggestDeload(sessionCountSinceDeload: number): boolean {
  return sessionCountSinceDeload >= FATIGUE_RULES.sessionsBeforeDeloadSuggestion;
}

/** ディロード週向けに種目のセット数・目標を落とす。 */
export function applyDeload(exercises: PlannedExercise[]): PlannedExercise[] {
  return exercises.map((e) => ({
    ...e,
    sets: Math.max(1, Math.round(e.sets * (1 - FATIGUE_RULES.deloadSetCutRatio))),
    targetReps: Math.max(1, e.targetReps - FATIGUE_RULES.deloadRepDropSteps),
  }));
}

/** 種目単位で直近セッションの「全セット達成したか」を新しい順に抽出する。 */
export function fullHitHistoryFor(exerciseId: string, sessions: SessionRecord[]): boolean[] {
  return sessions
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .map((s) => {
      const sets = s.sets.filter((r) => r.exerciseId === exerciseId);
      if (!sets.length) return null;
      return sets.every((r) => r.hit);
    })
    .filter((v): v is boolean => v !== null);
}
