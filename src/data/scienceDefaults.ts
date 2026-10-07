// docs/training-science.md の数値基準をコードへ落とし込んだ定数群。
// 各定数のコメントはtraining-science.mdの章番号を指す。数値を変更する場合は
// 両方のファイルを合わせて更新し、docs/decisions.mdにD-XXXを追加すること。
import type { CategoryKey } from '../theme/tokens';
import type { ExperienceLevel } from './types';

/** 2章: 週あたり部位別セット数（経験レベル別）。 */
export const WEEKLY_SETS_PER_CATEGORY: Record<ExperienceLevel, { min: number; max: number }> = {
  beginner: { min: 6, max: 10 },
  intermediate: { min: 10, max: 14 },
  advanced: { min: 14, max: 20 },
};

/** 9章: 日次プラン（1回15分・毎日実施）の時間見積もりと、カテゴリ別の週間セット目標の重み（D-010）。 */
export const SESSION_RULES = {
  restSeconds: 45,
  /** 回数制種目1repあたりの所要秒数の見積もり */
  secondsPerRep: 3,
  /** 1セットごとの準備・切替の見積もり秒数 */
  setupSeconds: 10,
  maxSetsPerExercise: 4,
  /** 部位別ボリュームを集計する直近日数（当日を含む） */
  windowDays: 7,
} as const;

/** 腹部重視・脚は補助（ユーザー要望）。週間セット目標=2章の中央値×重み。 */
export const CATEGORY_WEIGHT: Record<CategoryKey, number> = {
  back: 1,
  chest: 1,
  arms: 1,
  core: 1.2,
  legs: 0.6,
};

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
  sessionsBeforeDeloadSuggestion: 42, // 毎日実施（休養日なし）でおよそ6週
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
