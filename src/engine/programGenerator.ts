// 日次プラン生成。docs/training-science.md 2章・9章、docs/decisions.md D-010参照。
// 毎日「全カテゴリを少しずつ」を1回の時間予算（既定15分）に収める。部位別の直近7日ボリュームが
// 少ないカテゴリへ優先してセットを配分し、特定部位への偏りを防ぐ。
import type { CategoryKey } from '../theme/tokens';
import { categoryOf, exercisesFor, findExercise } from '../data/exercisePool';
import { CATEGORY_WEIGHT, SESSION_RULES, WEEKLY_SETS_PER_CATEGORY } from '../data/scienceDefaults';
import type { ExerciseDef, ExerciseTargets, PlannedExercise, Profile, SessionRecord } from '../data/types';
import { applyDeload } from './progression';

/**
 * セッション内の実施順。引く(懸垂系)→押す→脚で握力と肩を休ませ→腕→体幹の順にし、
 * ぶら下がり系の体幹種目が懸垂系の握力を先に使い切らないようにする。
 */
const CATEGORY_ORDER: CategoryKey[] = ['back', 'chest', 'legs', 'arms', 'core'];
const DIFFICULTY_RANK = { beginner: 0, intermediate: 1, advanced: 2 } as const;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** 端末のローカル日付(YYYY-MM-DD)。toISOStringはUTC基準で日付がずれるため使わない。 */
export function todayIso(d = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return todayIso(new Date(y, m - 1, d + days));
}

/** 直近windowDays日（当日含む）のカテゴリ別実施セット数。 */
function recentSetsByCategory(sessions: SessionRecord[], today: string): Record<CategoryKey, number> {
  const from = addDaysIso(today, -(SESSION_RULES.windowDays - 1));
  const done: Record<CategoryKey, number> = { back: 0, chest: 0, arms: 0, core: 0, legs: 0 };
  for (const s of sessions) {
    if (s.date < from || s.date > today) continue;
    for (const r of s.sets) {
      const c = categoryOf(r.exerciseId);
      if (c) done[c]++;
    }
  }
  return done;
}

/** 種目ごとの最終実施日時(ISO)。未実施の種目は含まれない。 */
function lastDoneAt(sessions: SessionRecord[]): Map<string, string> {
  const last = new Map<string, string>();
  for (const s of sessions) {
    for (const r of s.sets) {
      const prev = last.get(r.exerciseId);
      if (prev === undefined || r.at > prev) last.set(r.exerciseId, r.at);
    }
  }
  return last;
}

/** カテゴリ内で、最も長く実施していない種目（未実施は優先、同順位はプール順）を選ぶ。 */
function pickExercise(category: CategoryKey, profile: Profile, last: Map<string, string>): ExerciseDef | null {
  const pool = exercisesFor(category, profile.equipment);
  const maxRank = DIFFICULTY_RANK[profile.experience] + 1;
  const usable = pool.filter((e) => DIFFICULTY_RANK[e.difficulty] <= maxRank);
  const candidates = usable.length ? usable : pool;
  let best: ExerciseDef | null = null;
  let bestAt = '';
  for (const e of candidates) {
    const at = last.get(e.id) ?? '';
    if (best === null || at < bestAt) {
      best = e;
      bestAt = at;
    }
  }
  return best;
}

function setSeconds(def: ExerciseDef, targetReps: number): number {
  const work = def.unit === 'seconds' ? targetReps : targetReps * SESSION_RULES.secondsPerRep;
  return work + SESSION_RULES.setupSeconds;
}

export interface DailyPlanInput {
  profile: Profile;
  targets: ExerciseTargets;
  sessions: SessionRecord[];
  /** ローカル日付(YYYY-MM-DD) */
  today: string;
  deload: boolean;
}

/** 1回の所要時間の見積もり秒数（セット間レストを含み、最終セット後のレストは含まない）。 */
export function estimatePlanSeconds(plan: PlannedExercise[]): number {
  let total = 0;
  let count = 0;
  for (const p of plan) {
    const def = findExercise(p.exerciseId);
    if (!def) continue;
    for (let i = 0; i < p.sets; i++) {
      total += setSeconds(def, p.targetReps) + (count > 0 ? SESSION_RULES.restSeconds : 0);
      count++;
    }
  }
  return total;
}

export function generateDailyPlan({ profile, targets, sessions, today, deload }: DailyPlanInput): PlannedExercise[] {
  const budget = profile.minutesPerSession * 60;
  const done = recentSetsByCategory(sessions, today);
  const last = lastDoneAt(sessions);
  const mid = (WEEKLY_SETS_PER_CATEGORY[profile.experience].min + WEEKLY_SETS_PER_CATEGORY[profile.experience].max) / 2;

  interface Slot {
    category: CategoryKey;
    def: ExerciseDef;
    targetReps: number;
    sets: number;
  }
  const slots: Slot[] = [];
  for (const category of CATEGORY_ORDER) {
    const def = pickExercise(category, profile, last);
    if (def) slots.push({ category, def, targetReps: targets[def.id]?.targetReps ?? def.repRangeLow, sets: 0 });
  }

  // 週間目標(中央値×重み)に対して直近の実施が少ないカテゴリほど優先度が高い。
  const priority = (s: Slot) => (mid * CATEGORY_WEIGHT[s.category]) / (done[s.category] + s.sets + 1);
  let elapsed = 0;
  let count = 0;
  const tryAdd = (s: Slot): boolean => {
    const cost = setSeconds(s.def, s.targetReps) + (count > 0 ? SESSION_RULES.restSeconds : 0);
    if (s.sets >= SESSION_RULES.maxSetsPerExercise || elapsed + cost > budget) return false;
    s.sets++;
    elapsed += cost;
    count++;
    return true;
  };

  // まず全カテゴリへ1セットずつ（偏り防止）、その後は優先度の高いカテゴリから時間予算まで追加する。
  for (const s of slots.slice().sort((a, b) => priority(b) - priority(a))) tryAdd(s);
  while (slots.slice().sort((a, b) => priority(b) - priority(a)).some(tryAdd));

  const plan: PlannedExercise[] = slots
    .filter((s) => s.sets > 0)
    .map((s) => ({ exerciseId: s.def.id, sets: s.sets, targetReps: s.targetReps, prevReps: targets[s.def.id]?.prevReps ?? null }));
  return deload ? applyDeload(plan) : plan;
}
