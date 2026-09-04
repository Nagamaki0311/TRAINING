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

let requested = false;
export async function ensureNotificationPermission(): Promise<void> {
  if (requested) return;
  requested = true;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') await Notifications.requestPermissionsAsync();
  } catch {
    // 権限取得に失敗しても、アプリ内カウントダウン自体は動作を継続する。
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
