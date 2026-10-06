// レストタイマーの通知。実測時間はタイムスタンプ差分で計算するため、アプリがバックグラウンドへ
// 遷移してカウントが止まっても復帰時に正しい残り時間へ復元できる（タイマー自体は保持しない）。
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** 通知権限を確認し、未決定ならOSの許可ダイアログを出す。拒否済み・失敗時はfalse（アプリ内カウントダウンは継続する）。 */
export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    return (await Notifications.requestPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

let scheduledId: string | null = null;

export async function scheduleRestEndNotification(seconds: number): Promise<void> {
  await cancelRestNotification();
  try {
    scheduledId = await Notifications.scheduleNotificationAsync({
      content: { title: '休憩終了', body: '次のセットを始めましょう。' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds, repeats: false },
    });
  } catch {
    scheduledId = null;
  }
}

export async function cancelRestNotification(): Promise<void> {
  if (!scheduledId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(scheduledId);
  } catch {
    // 既に発火済み等は無視する。
  }
  scheduledId = null;
}

// ===== SECTION: 毎日のリマインド =====
// 日付指定の通知を今後14日分、固定ID（daily-reminder-N）で登録する。アプリ起動時・セッション終了時・
// 設定変更時に張り直し、実施済みの当日分は登録しない。14日以上アプリを開かないと通知は止まる（D-012）。
const REMINDER_DAYS = 14;
const reminderId = (offset: number) => `daily-reminder-${offset}`;

async function runReminderSync(
  enabled: boolean,
  timeMinutes: number,
  trainedToday: boolean,
  sessionMinutes: number
): Promise<void> {
  try {
    for (let i = 0; i < REMINDER_DAYS; i++) await Notifications.cancelScheduledNotificationAsync(reminderId(i));
    if (!enabled || !(await ensureNotificationPermission())) return;
    const now = new Date();
    for (let i = 0; i < REMINDER_DAYS; i++) {
      const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, Math.floor(timeMinutes / 60), timeMinutes % 60, 0);
      if (at.getTime() <= now.getTime() || (i === 0 && trainedToday)) continue;
      await Notifications.scheduleNotificationAsync({
        identifier: reminderId(i),
        content: { title: '今日のトレーニング', body: `${sessionMinutes}分のメニューを用意しました。` },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at },
      });
    }
  } catch {
    // 通知の登録に失敗してもアプリ本体の動作は継続する。
  }
}

/** 同期は直列化する（設定の連打で取り消しと登録が交錯しないよう、常に最後の呼び出しが最終状態になる）。 */
let reminderChain: Promise<void> = Promise.resolve();
export function syncDailyReminders(
  enabled: boolean,
  timeMinutes: number,
  trainedToday: boolean,
  sessionMinutes: number
): Promise<void> {
  reminderChain = reminderChain.then(() => runReminderSync(enabled, timeMinutes, trainedToday, sessionMinutes));
  return reminderChain;
}
