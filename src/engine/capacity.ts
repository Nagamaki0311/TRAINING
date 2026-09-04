// 「今日はここまで」判定（工程2-3、複合的オーバーワーク防止）。docs/training-science.md 7章参照。
import { CAPACITY_RULES } from '../data/scienceDefaults';

export interface CapacityInput {
  plannedMinutes: number;
  elapsedMinutes: number;
  dailyTimeCapMinutes: number;
  setsDoneToday: number;
  plannedTotalSets: number;
  setsDoneTodayForActiveCategory: number;
  fatigueLast3: number[]; // セット完了ごとに記録した体感疲労度（1-5）のうち直近3件
}

export interface CapacityResult {
  /** 0〜1。1に近いほど限界に近い。 */
  ratio: number;
  /** 10分割したブロック消費数（design側の本日ゲージ表示に対応） */
  blocksUsed: number;
  blocksTotal: number;
  warn: boolean;
  reason: 'time' | 'sets' | 'fatigue' | null;
}

export function computeTodayCapacity(input: CapacityInput): CapacityResult {
  const timeRatio = input.dailyTimeCapMinutes > 0 ? input.elapsedMinutes / input.dailyTimeCapMinutes : 0;
  const setsRatio =
    input.plannedTotalSets > 0
      ? input.setsDoneToday / (input.plannedTotalSets * CAPACITY_RULES.setsOverPlanRatio)
      : 0;
  const singleCategoryRatio = input.setsDoneTodayForActiveCategory / CAPACITY_RULES.singleCategoryDailySetCap;
  const fatigueAvg = input.fatigueLast3.length
    ? input.fatigueLast3.reduce((a, b) => a + b, 0) / input.fatigueLast3.length
    : 0;
  const fatigueRatio = fatigueAvg / CAPACITY_RULES.fatigueWarnAvgOfLast3;

  const axes: Array<[CapacityResult['reason'], number]> = [
    ['time', timeRatio / CAPACITY_RULES.timeWarnRatio],
    ['sets', Math.max(setsRatio, singleCategoryRatio)],
    ['fatigue', fatigueRatio],
  ];
  axes.sort((a, b) => b[1] - a[1]);
  const [reason, topRatio] = axes[0];
  const ratio = Math.max(0, Math.min(1, topRatio));

  return {
    ratio,
    blocksUsed: Math.round(ratio * CAPACITY_RULES.gaugeBlocks),
    blocksTotal: CAPACITY_RULES.gaugeBlocks,
    warn: ratio >= 1,
    reason: ratio >= 0.7 ? reason : null,
  };
}
