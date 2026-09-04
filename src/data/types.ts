import type { CategoryKey } from '../theme/tokens';

export type Equipment = 'bodyweight' | 'pullupbar' | 'dumbbell' | 'barbell';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type Goal = 'strength' | 'hypertrophy' | 'both';
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
  goal: Goal;
  equipment: Equipment[];
  daysPerWeek: number;
  minutesPerSession: number;
  injuries: string[];
}

export interface PlannedExercise {
  exerciseId: string;
  sets: number;
  targetReps: number;
  prevReps: number | null;
}

export interface ProgramDay {
  category: CategoryKey;
  exercises: PlannedExercise[];
}

/** 曜日(1=月〜7=日) -> カテゴリ。nullは休養日。 */
export type WeekPlan = Partial<Record<1 | 2 | 3 | 4 | 5 | 6 | 7, CategoryKey | null>>;

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
  category: CategoryKey;
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
  streak: number;
  lastDeloadSessionCount: number;
  sessionCountSinceDeload: number;
}
