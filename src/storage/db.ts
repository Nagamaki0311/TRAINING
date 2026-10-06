// ローカル永続化リポジトリ。AsyncStorageのみを使用し、クラウド同期は行わない。
// 保存対象はプロフィール・種目別の次回目標・セッション記録・設定の4つ。UI/ロジック層は
// このモジュールの関数のみを通じて読み書きし、AsyncStorageのキーを直接扱わない。
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CAPACITY_RULES } from '../data/scienceDefaults';
import type { ExerciseTargets, Profile, SessionRecord, Settings } from '../data/types';

const KEYS = {
  profile: '@training/profile.v2',
  targets: '@training/targets',
  sessions: '@training/sessions',
  settings: '@training/settings',
} as const;

/** D-010で廃止した旧形式（カテゴリ別プログラム・週間プラン・旧プロフィール）のキー。 */
const LEGACY_KEYS = ['@training/profile', '@training/weekPlan', '@training/program'];
export const removeLegacyKeys = () => AsyncStorage.multiRemove(LEGACY_KEYS);

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

export const getTargets = async (): Promise<ExerciseTargets> => (await readJson<ExerciseTargets>(KEYS.targets)) ?? {};
export const setTargets = (t: ExerciseTargets) => writeJson(KEYS.targets, t);

export const getSessions = async (): Promise<SessionRecord[]> => (await readJson<SessionRecord[]>(KEYS.sessions)) ?? [];
export const setSessions = (sessions: SessionRecord[]) => writeJson(KEYS.sessions, sessions);
export const appendSession = async (s: SessionRecord): Promise<void> => {
  const sessions = await getSessions();
  sessions.push(s);
  await writeJson(KEYS.sessions, sessions);
};

export const DEFAULT_SETTINGS: Settings = {
  dailyTimeCapMinutes: CAPACITY_RULES.defaultDailyTimeCapMinutes,
  reminderEnabled: true,
  reminderTimeMinutes: 22 * 60,
  streak: 0,
  lastDeloadSessionCount: 0,
  sessionCountSinceDeload: 0,
};
export const getSettings = async (): Promise<Settings> => ({ ...DEFAULT_SETTINGS, ...(await readJson<Partial<Settings>>(KEYS.settings)) });
export const setSettings = (s: Settings) => writeJson(KEYS.settings, s);

export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove([...Object.values(KEYS), ...LEGACY_KEYS]);
}
