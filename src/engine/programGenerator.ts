// プログラム生成ロジック（工程2-1）。docs/training-science.md 2章・4章・8章の基準を用いる。
import type { CategoryKey } from '../theme/tokens';
import { exercisesFor } from '../data/exercisePool';
import { WEEKLY_SETS_PER_CATEGORY, targetHitsPerWeek } from '../data/scienceDefaults';
import type { PlannedExercise, Profile, ProgramDay, WeekPlan } from '../data/types';

const CATEGORY_ORDER: CategoryKey[] = ['core', 'back', 'chest', 'arms'];

/**
 * 週間の曜日→カテゴリ割り当てを生成する。
 * 休養日はprofile.daysPerWeekから7日間へ均等分散し（Bresenham式）、残りの実施日にカテゴリを
 * ローテーションで割り当てる。docs/training-science.md 4章（週2〜3回/部位）を目安にCATEGORY_ORDERを巡回する。
 */
export function generateWeekPlan(profile: Profile): WeekPlan {
  const trainingDays = Math.min(7, Math.max(1, Math.round(profile.daysPerWeek)));
  const restDays = 7 - trainingDays;

  const plan: WeekPlan = {};
  let catIdx = 0;
  let restAccumulated = 0;
  for (let day = 1; day <= 7; day++) {
    restAccumulated += restDays;
    const takeRest = restAccumulated >= 7;
    if (takeRest) {
      restAccumulated -= 7;
      plan[day as 1] = null;
      continue;
    }
    plan[day as 1] = CATEGORY_ORDER[catIdx % CATEGORY_ORDER.length];
    catIdx++;
  }
  return plan;
}

/**
 * 1カテゴリ分のプログラム（種目・セット数・初期目標reps）を生成する。
 * 前提: profile.equipmentには常に'bodyweight'が含まれる（現状プロフィール編集UIが無く、
 * SEED_PROFILEのみを使用するため）。将来equipment編集UIを追加する場合、poolが空になり得るため
 * `chosen`が空配列になるケースへのフォールバックを追加すること（D-003参照）。
 */
export function generateProgramForCategory(category: CategoryKey, profile: Profile): ProgramDay {
  const pool = exercisesFor(category, profile.equipment);
  const byDifficulty = { beginner: 0, intermediate: 1, advanced: 2 } as const;
  const maxDifficulty = byDifficulty[profile.experience];
  const usable = pool.filter((e) => byDifficulty[e.difficulty] <= maxDifficulty + 1);
  const chosen = (usable.length ? usable : pool).slice(0, 4);

  const weeklyBudget = WEEKLY_SETS_PER_CATEGORY[profile.experience];
  const hits = targetHitsPerWeek(profile.daysPerWeek);
  const setsPerSessionTotal = Math.max(6, Math.round(((weeklyBudget.min + weeklyBudget.max) / 2) / hits));
  const setsPerExercise = Math.max(2, Math.min(4, Math.round(setsPerSessionTotal / Math.max(1, chosen.length))));

  const exercises: PlannedExercise[] = chosen.map((ex) => ({
    exerciseId: ex.id,
    sets: setsPerExercise,
    targetReps: ex.repRangeLow,
    prevReps: null,
  }));

  return { category, exercises };
}

export function generateInitialProgram(profile: Profile): Record<CategoryKey, ProgramDay> {
  const cats: CategoryKey[] = ['chest', 'core', 'arms', 'back'];
  const out = {} as Record<CategoryKey, ProgramDay>;
  for (const c of cats) out[c] = generateProgramForCategory(c, profile);
  return out;
}
