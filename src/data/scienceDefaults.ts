// docs/training-science.md の数値基準をコードへ落とし込んだ定数群。
// 各定数のコメントはtraining-science.mdの章番号を指す。数値を変更する場合は
// 両方のファイルを合わせて更新し、docs/decisions.mdにD-XXXを追加すること。
import type { ExperienceLevel } from './types';

/** 2章: 週あたり部位別セット数（経験レベル別）。 */
export const WEEKLY_SETS_PER_CATEGORY: Record<ExperienceLevel, { min: number; max: number }> = {
  beginner: { min: 6, max: 10 },
  intermediate: { min: 10, max: 14 },
  advanced: { min: 14, max: 20 },
};

/** 4章: 週間実施可能日数から導く「カテゴリが週に何回登場するか」の目安。 */
export function targetHitsPerWeek(daysPerWeek: number): number {
  if (daysPerWeek >= 5) return 3;
  if (daysPerWeek >= 3) return 2;
  return 1.5;
}

/** 5章: 進行判定。全達成→reps+1、一部未達→据え置き、2連続未達→reps-1。 */
export const PROGRESSION = {
  repIncrementOnFullHit: 1,
  repDecrementOnConsecutiveMiss: 1,
  consecutiveMissThreshold: 2,
  repCapBeforeVariationUp: 15,
} as const;

/** 6章: 疲労・ディロード。 */
export const FATIGUE_RULES = {
  /** 直近3セッション平均疲労度がこの値以上なら次回セット数を減らす */
  highFatigueAvgThreshold: 4,
  /** 高疲労時のセット数削減率 */
  highFatigueVolumeCutRatio: 0.15,
  /** 体調不良申告時の目標reps削減率 */
  poorConditionRepCutRatio: 0.2,
  /** このセッション数を通常負荷で継続したらディロードを提案 */
  sessionsBeforeDeloadSuggestion: 18, // 週6日想定でおよそ6週
  deloadSetCutRatio: 0.5,
  deloadRepDropSteps: 1,
} as const;

/** 7章: 「今日はここまで」判定の閾値。 */
export const CAPACITY_RULES = {
  defaultDailyTimeCapMinutes: 30,
  timeWarnRatio: 0.9,
  setsOverPlanRatio: 1.2,
  singleCategoryDailySetCap: 6,
  fatigueWarnAvgOfLast3: 4.5,
  gaugeBlocks: 10,
} as const;
