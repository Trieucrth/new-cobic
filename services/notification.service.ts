import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

class NotificationService {
  private static instance: NotificationService;

  private constructor() {
    this.configureNotifications();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async configureNotifications() {
    // Cấu hình thông báo
    await Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Yêu cầu quyền thông báo
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }
  }

  public async scheduleDailyCheckInNotification() {
    try {
      // Hủy tất cả thông báo cũ
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Lấy thời gian điểm danh tiếp theo từ AsyncStorage
      const nextCheckInTime = await AsyncStorage.getItem('nextCheckInTime');
      if (!nextCheckInTime) return;

      const nextTime = new Date(nextCheckInTime);
      const now = new Date();

      // Nếu thời gian điểm danh đã qua, không lên lịch thông báo
      if (nextTime <= now) return;

      // Tính toán thời gian còn lại
      const diff = nextTime.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      // Chỉ lên lịch thông báo nếu thời gian còn lại là 0:0:0
      if (hours === 0 && minutes === 0 && seconds === 0) {
        // Lên lịch thông báo
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Đến giờ điểm danh!',
            body: 'Hãy điểm danh ngay để nhận COBIC!',
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: {
            date: nextTime,
          },
        });

        console.log('Scheduled notification for:', nextTime);
      }
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }

  public async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  }
}

export const notificationService = NotificationService.getInstance(); 