// ローカル永続化リポジトリ。AsyncStorageのみを使用し、クラウド同期は行わない。
// 保存対象はプロフィール・週間プログラム・セッション記録・設定の4つ。UI/ロジック層は
// このモジュールの関数のみを通じて読み書きし、AsyncStorageのキーを直接扱わない。
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CategoryKey } from '../theme/tokens';
import type { Profile, ProgramDay, SessionRecord, Settings, WeekPlan } from '../data/types';

const KEYS = {
  profile: '@training/profile',
  weekPlan: '@training/weekPlan',
  program: '@training/program',
  sessions: '@training/sessions',
  settings: '@training/settings',
} as const;

async function readJson<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export const getProfile = () => readJson<Profile>(KEYS.profile);
export const setProfile = (p: Profile) => writeJson(KEYS.profile, p);

export const getWeekPlan = () => readJson<WeekPlan>(KEYS.weekPlan);
export const setWeekPlan = (w: WeekPlan) => writeJson(KEYS.weekPlan, w);

export const getProgram = () => readJson<Record<CategoryKey, ProgramDay>>(KEYS.program);
export const setProgram = (p: Record<CategoryKey, ProgramDay>) => writeJson(KEYS.program, p);

export const getSessions = async (): Promise<SessionRecord[]> => (await readJson<SessionRecord[]>(KEYS.sessions)) ?? [];
export const setSessions = (sessions: SessionRecord[]) => writeJson(KEYS.sessions, sessions);
export const appendSession = async (s: SessionRecord): Promise<void> => {
  const sessions = await getSessions();
  sessions.push(s);
  await writeJson(KEYS.sessions, sessions);
};

const DEFAULT_SETTINGS: Settings = {
  dailyTimeCapMinutes: 30,
  streak: 0,
  lastDeloadSessionCount: 0,
  sessionCountSinceDeload: 0,
};
export const getSettings = async (): Promise<Settings> => (await readJson<Settings>(KEYS.settings)) ?? DEFAULT_SETTINGS;
export const setSettings = (s: Settings) => writeJson(KEYS.settings, s);

export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}
