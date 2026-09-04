// ===== SECTION: グローバル状態 =====
// アプリ全体の状態（プロフィール・プログラム・記録・画面遷移・進行中ワークアウト）を1箇所で保持する。
// 永続化はsrc/storage/db.tsを通じてのみ行い、このファイルはAsyncStorageのキーを直接扱わない。
import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import type { CategoryKey } from '../theme/tokens';
import type {
  PlannedExercise,
  Profile,
  ProgramDay,
  SessionRecord,
  SetRecord,
  Settings,
  WeekPlan,
} from '../data/types';
import { EXERCISE_POOL } from '../data/exercisePool';
import { generateInitialProgram, generateWeekPlan } from '../engine/programGenerator';
import { computeNextTarget, fullHitHistoryFor, shouldSuggestDeload, applyDeload } from '../engine/progression';
import { FATIGUE_RULES, CAPACITY_RULES } from '../data/scienceDefaults';
import * as db from '../storage/db';
import * as auth from '../storage/auth';
import { cancelRestNotification, ensureNotificationPermission, scheduleRestEndNotification } from '../engine/timer';

// ===== SECTION: 初期プロフィール（工程1のヒアリング結果を種として使用） =====
// F. オンボーディング画面はデザイン検討時に明示的にスコープ外とされたため未実装（docs/decisions.md D-003参照）。
// 代わりに、デザイン作成時に収集済みのヒアリング結果を初期プロフィールとして起動時に投入する。
const SEED_PROFILE: Profile = {
  heightCm: 168,
  weightKg: 58,
  birthday: '1998-03-11',
  sex: 'male',
  experience: 'beginner',
  goal: 'both',
  equipment: ['bodyweight', 'pullupbar'],
  daysPerWeek: 5,
  minutesPerSession: 20,
  injuries: [],
};

export type Screen = 'loading' | 'pin-setup' | 'pin' | 'home' | 'cat' | 'exec' | 'complete' | 'cal';
type Phase = 'work' | 'rest';

export interface FlashState {
  label: string;
  sub: string;
  color: string;
}

export interface ActiveSession {
  category: CategoryKey;
  exercises: PlannedExercise[];
  exIdx: number;
  setIdx: number;
  phase: Phase;
  reps: number;
  combo: number;
  maxCombo: number;
  results: SetRecord[];
  restEndAt: number | null;
  restDurationSec: number;
  startedAt: number;
  flash: FlashState | null;
  howOn: boolean;
  /** 最終セット完了後、finishSession実行までの遷移中。trueの間はセット完了/中断操作を受け付けない。 */
  finishing: boolean;
}

interface State {
  screen: Screen;
  hydrated: boolean;
  hasPin: boolean;
  pinDraft: string;
  pinFirstEntry: string | null;
  pinError: string | null;

  profile: Profile;
  weekPlan: WeekPlan;
  program: Record<CategoryKey, ProgramDay> | null;
  settings: Settings;
  sessions: SessionRecord[];

  selectedCategory: CategoryKey;
  preSleepPoor: boolean;
  preUnwell: boolean;

  session: ActiveSession | null;
  lastFinishedSession: SessionRecord | null;
  fatiguePick: number | null;

  calDay: string | null;
  settingsOpen: boolean;
}

const REST_SECONDS = 45; // docs/training-science.md 6章の休息目安（筋肥大寄り種目の一般的レンジ内）

function todayIso(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}
function weekdayOf(d = new Date()): 1 | 2 | 3 | 4 | 5 | 6 | 7 {
  const js = d.getDay(); // 0=Sun..6=Sat
  return (js === 0 ? 7 : js) as 1 | 2 | 3 | 4 | 5 | 6 | 7;
}

const initialState: State = {
  screen: 'loading',
  hydrated: false,
  hasPin: false,
  pinDraft: '',
  pinFirstEntry: null,
  pinError: null,
  profile: SEED_PROFILE,
  weekPlan: {},
  program: null,
  settings: { dailyTimeCapMinutes: CAPACITY_RULES.defaultDailyTimeCapMinutes, streak: 0, lastDeloadSessionCount: 0, sessionCountSinceDeload: 0 },
  sessions: [],
  selectedCategory: 'chest',
  preSleepPoor: false,
  preUnwell: false,
  session: null,
  lastFinishedSession: null,
  fatiguePick: null,
  calDay: null,
  settingsOpen: false,
};

type Action =
  | { type: 'HYDRATE'; payload: Partial<State> }
  | { type: 'SET_SCREEN'; screen: Screen }
  | { type: 'PIN_DIGIT'; digit: string }
  | { type: 'PIN_BACKSPACE' }
  | { type: 'PIN_CLEAR'; error?: string | null }
  | { type: 'PIN_ADVANCE_SETUP'; firstEntry: string }
  | { type: 'SELECT_CATEGORY'; category: CategoryKey }
  | { type: 'TOGGLE_PRE_SLEEP' }
  | { type: 'TOGGLE_PRE_UNWELL' }
  | { type: 'START_SESSION'; session: ActiveSession }
  | { type: 'SET_REPS'; reps: number }
  | { type: 'SET_PHASE'; phase: Phase; results: SetRecord[]; combo: number; maxCombo: number; flash: FlashState | null; restEndAt: number | null; finishing: boolean }
  | { type: 'CLEAR_FLASH' }
  | { type: 'ADVANCE_SET'; exIdx: number; setIdx: number; reps: number }
  | { type: 'TOGGLE_HOW'; on: boolean }
  | { type: 'FINISH_SESSION'; record: SessionRecord; program: Record<CategoryKey, ProgramDay>; settings: Settings }
  | { type: 'SET_FATIGUE_PICK'; value: number }
  | { type: 'SET_CAL_DAY'; date: string | null }
  | { type: 'OPEN_SETTINGS' }
  | { type: 'CLOSE_SETTINGS' }
  | { type: 'UPDATE_SETTINGS'; settings: Settings }
  | { type: 'RESET_PRE_TOGGLES' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, ...action.payload, hydrated: true };
    case 'SET_SCREEN':
      return { ...state, screen: action.screen, pinError: null };
    case 'PIN_DIGIT': {
      const pinDraft = (state.pinDraft + action.digit).slice(0, 4);
      return { ...state, pinDraft, pinError: null };
    }
    case 'PIN_BACKSPACE':
      return { ...state, pinDraft: state.pinDraft.slice(0, -1) };
    case 'PIN_CLEAR':
      return { ...state, pinDraft: '', pinError: action.error ?? null };
    case 'PIN_ADVANCE_SETUP':
      return { ...state, pinFirstEntry: action.firstEntry, pinDraft: '' };
    case 'SELECT_CATEGORY':
      return { ...state, selectedCategory: action.category };
    case 'TOGGLE_PRE_SLEEP':
      return { ...state, preSleepPoor: !state.preSleepPoor };
    case 'TOGGLE_PRE_UNWELL':
      return { ...state, preUnwell: !state.preUnwell };
    case 'RESET_PRE_TOGGLES':
      return { ...state, preSleepPoor: false, preUnwell: false };
    case 'START_SESSION':
      return { ...state, session: action.session, screen: 'exec', fatiguePick: null };
    case 'SET_REPS':
      return state.session ? { ...state, session: { ...state.session, reps: Math.max(0, action.reps) } } : state;
    case 'SET_PHASE':
      return state.session
        ? {
            ...state,
            session: {
              ...state.session,
              phase: action.phase,
              results: action.results,
              combo: action.combo,
              maxCombo: action.maxCombo,
              flash: action.flash,
              restEndAt: action.restEndAt,
              restDurationSec: REST_SECONDS,
              finishing: action.finishing,
            },
          }
        : state;
    case 'CLEAR_FLASH':
      return state.session ? { ...state, session: { ...state.session, flash: null } } : state;
    case 'ADVANCE_SET':
      return state.session
        ? {
            ...state,
            session: {
              ...state.session,
              exIdx: action.exIdx,
              setIdx: action.setIdx,
              phase: 'work',
              reps: action.reps,
              restEndAt: null,
            },
          }
        : state;
    case 'TOGGLE_HOW':
      return state.session ? { ...state, session: { ...state.session, howOn: action.on } } : state;
    case 'FINISH_SESSION':
      return {
        ...state,
        screen: 'complete',
        session: null,
        lastFinishedSession: action.record,
        sessions: [...state.sessions, action.record],
        program: action.program,
        settings: action.settings,
      };
    case 'SET_FATIGUE_PICK':
      return { ...state, fatiguePick: action.value };
    case 'SET_CAL_DAY':
      return { ...state, calDay: action.date };
    case 'OPEN_SETTINGS':
      return { ...state, settingsOpen: true };
    case 'CLOSE_SETTINGS':
      return { ...state, settingsOpen: false };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: action.settings };
    default:
      return state;
  }
}

// ===== SECTION: Context/Provider =====
interface Ctx {
  state: State;
  actions: ReturnType<typeof buildActions>;
}
const AppStateContext = createContext<Ctx | null>(null);

/** completeSet後の遅延仕上げ処理（フラッシュ解除/finishSession）を指す、キャンセル可能なタイマーID。 */
type PendingTimeoutRef = React.MutableRefObject<ReturnType<typeof setTimeout> | null>;

function buildActions(state: State, dispatch: React.Dispatch<Action>, pendingTimeoutRef: PendingTimeoutRef) {
  return {
    setScreen: (screen: Screen) => dispatch({ type: 'SET_SCREEN', screen }),

    tapPinKey: async (key: string, mode: 'setup' | 'unlock') => {
      if (key === 'del') {
        dispatch({ type: 'PIN_BACKSPACE' });
        return;
      }
      if (key === 'bio') {
        if (mode === 'unlock') {
          const ok = await auth.tryBiometric();
          if (ok) dispatch({ type: 'SET_SCREEN', screen: 'home' });
        }
        return;
      }
      const next = (state.pinDraft + key).slice(0, 4);
      dispatch({ type: 'PIN_DIGIT', digit: key });
      if (next.length !== 4) return;
      if (mode === 'setup') {
        if (!state.pinFirstEntry) {
          dispatch({ type: 'PIN_ADVANCE_SETUP', firstEntry: next });
        } else if (next === state.pinFirstEntry) {
          await auth.setPin(next);
          dispatch({ type: 'HYDRATE', payload: { hasPin: true, pinFirstEntry: null, pinDraft: '' } });
          dispatch({ type: 'SET_SCREEN', screen: 'home' });
        } else {
          dispatch({ type: 'HYDRATE', payload: { pinFirstEntry: null } });
          dispatch({ type: 'PIN_CLEAR', error: 'PINが一致しませんでした。もう一度入力してください' });
        }
      } else {
        const ok = await auth.verifyPin(next);
        if (ok) {
          dispatch({ type: 'SET_SCREEN', screen: 'home' });
        } else {
          dispatch({ type: 'PIN_CLEAR', error: 'PINが違います' });
        }
      }
    },

    selectCategory: (category: CategoryKey) => dispatch({ type: 'SELECT_CATEGORY', category }),
    togglePreSleep: () => dispatch({ type: 'TOGGLE_PRE_SLEEP' }),
    togglePreUnwell: () => dispatch({ type: 'TOGGLE_PRE_UNWELL' }),

    startWorkout: async (category: CategoryKey) => {
      if (!state.program) return;
      await ensureNotificationPermission();
      let exercises = state.program[category].exercises;
      if (state.preUnwell) {
        exercises = exercises.map((e) => ({
          ...e,
          targetReps: Math.max(1, Math.round(e.targetReps * (1 - FATIGUE_RULES.poorConditionRepCutRatio))),
        }));
      }
      const session: ActiveSession = {
        category,
        exercises,
        exIdx: 0,
        setIdx: 0,
        phase: 'work',
        reps: exercises[0]?.targetReps ?? 0,
        combo: 0,
        maxCombo: 0,
        results: [],
        restEndAt: null,
        restDurationSec: REST_SECONDS,
        startedAt: Date.now(),
        flash: null,
        howOn: false,
        finishing: false,
      };
      dispatch({ type: 'RESET_PRE_TOGGLES' });
      dispatch({ type: 'START_SESSION', session });
    },

    setReps: (reps: number) => dispatch({ type: 'SET_REPS', reps }),
    incReps: () => state.session && dispatch({ type: 'SET_REPS', reps: state.session.reps + 1 }),
    decReps: () => state.session && dispatch({ type: 'SET_REPS', reps: state.session.reps - 1 }),
    toggleHow: (on: boolean) => dispatch({ type: 'TOGGLE_HOW', on }),

    completeSet: async () => {
      const s = state.session;
      if (!s || s.finishing) return;
      const ex = s.exercises[s.exIdx];
      const hit = s.reps >= ex.targetReps;
      const record: SetRecord = { exerciseId: ex.exerciseId, setIndex: s.setIdx, reps: s.reps, hit, at: new Date().toISOString() };
      const results = [...s.results, record];
      const combo = hit ? s.combo + 1 : 0;
      const maxCombo = Math.max(s.maxCombo, combo);
      const isLastSetOfExercise = s.setIdx === ex.sets - 1;
      const isLastExercise = s.exIdx === s.exercises.length - 1;
      const isLastOfSession = isLastSetOfExercise && isLastExercise;

      const flash: FlashState = hit
        ? { label: s.reps > ex.targetReps ? 'EXCELLENT' : 'PERFECT', sub: '+1 SET', color: 'rgba(255,77,46,.92)' }
        : { label: 'GOOD', sub: '記録', color: 'rgba(124,107,255,.92)' };

      const restEndAt = isLastOfSession ? null : Date.now() + REST_SECONDS * 1000;
      dispatch({
        type: 'SET_PHASE',
        phase: isLastOfSession ? 'work' : 'rest',
        results,
        combo,
        maxCombo,
        flash,
        restEndAt,
        finishing: isLastOfSession,
      });
      if (!isLastOfSession) await scheduleRestEndNotification(REST_SECONDS);

      if (pendingTimeoutRef.current) clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = setTimeout(async () => {
        pendingTimeoutRef.current = null;
        dispatch({ type: 'CLEAR_FLASH' });
        if (isLastOfSession) await finishSession(state, dispatch, results, maxCombo);
      }, isLastOfSession ? 900 : 820);
    },

    quit: () => {
      if (pendingTimeoutRef.current) {
        clearTimeout(pendingTimeoutRef.current);
        pendingTimeoutRef.current = null;
      }
      cancelRestNotification();
      dispatch({ type: 'HYDRATE', payload: { session: null } });
      dispatch({ type: 'SET_SCREEN', screen: 'home' });
    },

    addRest: () => {
      const s = state.session;
      if (!s || !s.restEndAt) return;
      const newEnd = s.restEndAt + 15000;
      dispatch({
        type: 'SET_PHASE',
        phase: 'rest',
        results: s.results,
        combo: s.combo,
        maxCombo: s.maxCombo,
        flash: s.flash,
        restEndAt: newEnd,
        finishing: false,
      });
      scheduleRestEndNotification(Math.max(1, Math.round((newEnd - Date.now()) / 1000)));
    },

    advance: () => {
      const s = state.session;
      if (!s) return;
      cancelRestNotification();
      const ex = s.exercises[s.exIdx];
      if (s.setIdx < ex.sets - 1) {
        dispatch({ type: 'ADVANCE_SET', exIdx: s.exIdx, setIdx: s.setIdx + 1, reps: ex.targetReps });
      } else if (s.exIdx < s.exercises.length - 1) {
        const next = s.exercises[s.exIdx + 1];
        dispatch({ type: 'ADVANCE_SET', exIdx: s.exIdx + 1, setIdx: 0, reps: next.targetReps });
      }
    },

    setFatiguePick: async (value: number) => {
      dispatch({ type: 'SET_FATIGUE_PICK', value });
      if (!state.lastFinishedSession) return;
      const targetId = state.lastFinishedSession.id;
      const updatedSessions = state.sessions.map((s) => (s.id === targetId ? { ...s, fatigue: value } : s));
      await db.setSessions(updatedSessions);
      dispatch({ type: 'HYDRATE', payload: { sessions: updatedSessions } });
    },
    setCalDay: (date: string | null) => dispatch({ type: 'SET_CAL_DAY', date }),
    openSettings: () => dispatch({ type: 'OPEN_SETTINGS' }),
    closeSettings: () => dispatch({ type: 'CLOSE_SETTINGS' }),
    updateDailyCap: async (minutes: number) => {
      const settings = { ...state.settings, dailyTimeCapMinutes: minutes };
      await db.setSettings(settings);
      dispatch({ type: 'UPDATE_SETTINGS', settings });
    },
    resetAllData: async () => {
      await db.clearAllData();
      dispatch({ type: 'HYDRATE', payload: { ...initialState, screen: 'loading', hydrated: false } });
    },
  };
}

async function finishSession(
  state: State,
  dispatch: React.Dispatch<Action>,
  results: SetRecord[],
  maxCombo: number
): Promise<void> {
  const s = state.session;
  if (!s) return;
  const total = s.exercises.reduce((a, e) => a + e.sets, 0);
  const hits = results.filter((r) => r.hit).length;
  const ratio = total ? hits / total : 0;
  const rank: SessionRecord['rank'] = ratio >= 1 ? 'S' : ratio >= 0.8 ? 'A' : ratio >= 0.6 ? 'B' : 'C';
  const durationSec = Math.round((Date.now() - s.startedAt) / 1000);

  const record: SessionRecord = {
    id: `${Date.now()}`,
    date: todayIso(),
    category: s.category,
    sets: results,
    durationSec,
    completed: true,
    rank,
    maxCombo,
    fatigue: null, // Complete画面のfatiguePickerで後追い保存する
  };

  const allSessions = [...state.sessions, record];
  const sameCategorySessions = allSessions.filter((r) => r.category === s.category);
  const fatigueValues = sameCategorySessions.slice(-3).map((r) => r.fatigue).filter((v): v is number => v !== null);
  const avgFatigueLast3 = fatigueValues.length ? fatigueValues.reduce((a, b) => a + b, 0) / fatigueValues.length : null;

  let updatedExercises: PlannedExercise[] = s.exercises.map((e) => {
    const history = fullHitHistoryFor(e.exerciseId, sameCategorySessions);
    const { nextTargetReps } = computeNextTarget({
      exercise: e,
      recentFullHits: history,
      avgFatigueLast3,
      feltUnwellToday: false,
    });
    return { ...e, targetReps: nextTargetReps, prevReps: e.targetReps };
  });

  const sessionCountSinceDeload = state.settings.sessionCountSinceDeload + 1;
  let settings: Settings = { ...state.settings, streak: state.settings.streak + 1, sessionCountSinceDeload };
  if (shouldSuggestDeload(sessionCountSinceDeload)) {
    updatedExercises = applyDeload(updatedExercises);
    settings = { ...settings, sessionCountSinceDeload: 0, lastDeloadSessionCount: state.settings.streak + 1 };
  }

  const program: Record<CategoryKey, ProgramDay> = {
    ...(state.program as Record<CategoryKey, ProgramDay>),
    [s.category]: { category: s.category, exercises: updatedExercises },
  };

  try {
    await db.appendSession(record);
    await db.setProgram(program);
    await db.setSettings(settings);
  } catch (e) {
    // 永続化に失敗しても、ユーザーをワークアウト実行画面に取り残さないことを優先する。
    // この回のプログラム自動更新・ストリーク加算は保存されていない可能性がある。
    console.error('[finishSession] failed to persist session/program/settings', e);
  }
  cancelRestNotification();

  dispatch({ type: 'FINISH_SESSION', record, program, settings });
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const pendingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actions = useMemo(() => buildActions(state, dispatch, pendingTimeoutRef), [state]);
  const hydratingRef = useRef(false);

  useEffect(() => {
    if (hydratingRef.current) return;
    hydratingRef.current = true;
    (async () => {
      let profile = await db.getProfile();
      let weekPlan = await db.getWeekPlan();
      let program = await db.getProgram();
      if (!profile) {
        profile = SEED_PROFILE;
        weekPlan = generateWeekPlan(profile);
        program = generateInitialProgram(profile);
        await db.setProfile(profile);
        await db.setWeekPlan(weekPlan);
        await db.setProgram(program);
      }
      const settings = await db.getSettings();
      const sessions = await db.getSessions();
      const hasPin = await auth.hasPin();
      dispatch({
        type: 'HYDRATE',
        payload: {
          profile,
          weekPlan: weekPlan ?? {},
          program,
          settings,
          sessions,
          hasPin,
          screen: hasPin ? 'pin' : 'pin-setup',
        },
      });
    })();
  }, []);

  return <AppStateContext.Provider value={{ state, actions }}>{children}</AppStateContext.Provider>;
}

export function useAppState(): Ctx {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}

export function exerciseDef(id: string) {
  return EXERCISE_POOL.find((e) => e.id === id)!;
}

export { weekdayOf, todayIso, REST_SECONDS };
