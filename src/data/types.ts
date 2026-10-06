import type { CategoryKey } from '../theme/tokens';

/** bodyweight=器具なし（床）、pullupbar=懸垂マシン上部バー、dipbars=中段の横バー、pushuphandles=土台の短い持ち手。D-010参照。 */
export type Equipment = 'bodyweight' | 'pullupbar' | 'dipbars' | 'pushuphandles';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type Unit = 'reps' | 'seconds';

export interface ExerciseHowTo {
  steps: string[];
  point: string;
  breath: string;
}

export interface ExerciseDef {
  id: string;
  name: string;
  category: CategoryKey;
  equipment: Equipment[];
  difficulty: Difficulty;
  unit: Unit;
  /** docs/training-science.md 3章の初期レップレンジ（下限・上限） */
  repRangeLow: number;
  repRangeHigh: number;
  how: ExerciseHowTo;
}

export interface Profile {
  heightCm: number;
  weightKg: number;
  birthday: string; // ISO date
  sex: 'male' | 'female' | 'other';
  experience: ExperienceLevel;
  equipment: Equipment[];
  minutesPerSession: number;
}

export interface PlannedExercise {
  exerciseId: string;
  sets: number;
  targetReps: number;
  prevReps: number | null;
}

/** 種目ごとの次回目標。日次プラン生成時に参照し、セッション終了時に更新する。 */
export interface ExerciseTarget {
  targetReps: number;
  prevReps: number | null;
}
export type ExerciseTargets = Record<string, ExerciseTarget>;

export interface SetRecord {
  exerciseId: string;
  setIndex: number;
  reps: number;
  hit: boolean;
  at: string; // ISO datetime
}

export interface SessionRecord {
  id: string;
  date: string; // ISO date (YYYY-MM-DD)
  sets: SetRecord[];
  durationSec: number;
  completed: boolean;
  rank: 'S' | 'A' | 'B' | 'C';
  maxCombo: number;
  /** セッション後に申告した体感疲労度(1-5)。docs/training-science.md 6章。 */
  fatigue: number | null;
}

export interface DailyCheckIn {
  date: string;
  sleepPoor: boolean;
  feelingUnwell: boolean;
}

export interface Settings {
  dailyTimeCapMinutes: number;
  reminderEnabled: boolean;
  /** 0時からの経過分（22:00 = 1320）。D-012参照。 */
  reminderTimeMinutes: number;
  streak: number;
  lastDeloadSessionCount: number;
  sessionCountSinceDeload: number;
}
