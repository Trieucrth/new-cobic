import { StyleSheet, TouchableOpacity, Alert, View, ScrollView } from 'react-native';
import { ThemedText } from '@components/ThemedText';
import { ThemedView } from '@components/ThemedView';
import { useColorScheme } from '@hooks/useColorScheme';
import { miningService, MiningStatus, MiningResult, DailyCheckInResult, DailyCheckInError } from '@services/mining.service';
import { useEffect, useState, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@constants/Colors';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { userService } from '@services/user.service';

export default function MiningScreen() {
  const colorScheme = useColorScheme();
  const [miningStatus, setMiningStatus] = useState<MiningStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [miningResult, setMiningResult] = useState<MiningResult | null>(null);
  const [checkInResult, setCheckInResult] = useState<DailyCheckInResult | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [hasFetchedWhenZero, setHasFetchedWhenZero] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    fetchMiningData();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Thêm useFocusEffect để fetch mining data khi focus vào tab
  useFocusEffect(
    React.useCallback(() => {
      fetchMiningData();
    }, [])
  );

  useEffect(() => {
    if (miningStatus?.nextMiningTime) {
      updateTimeLeft();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      timerRef.current = setInterval(updateTimeLeft, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [miningStatus?.nextMiningTime]);

  const updateTimeLeft = () => {
    if (miningStatus?.nextMiningTime) {
      const nextTime = new Date(miningStatus.nextMiningTime);
      const now = new Date();
      const diff = nextTime.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft('');
        if (!hasFetchedWhenZero) {
          setHasFetchedWhenZero(true);
          fetchMiningData(); // Cập nhật lại trạng thái khi hết thời gian chờ
        }
      } else {
        setHasFetchedWhenZero(false);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    }
  };

  const fetchMiningData = async () => {
    try {
      setLoading(true);
      const status = await miningService.getMiningStatus();
      setMiningStatus(status);
    } catch (error: any) {
      console.error('Error fetching mining data:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin mining. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleMine = async () => {
    if (!miningStatus?.canMine) return;

    try {
      setLoading(true);
      console.log('Bắt đầu mining...');
      const result = await miningService.mine();
      console.log('Kết quả mining:', result);
      setMiningResult(result);
      Alert.alert(
        'Thành công',
        `Bạn đã mining được ${result.amount} COBIC`,
        [
          {
            text: 'OK',
            onPress: () => {
              setMiningResult(null);
              fetchMiningData();
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Lỗi khi mining:', error);
      
      // Xử lý các mã lỗi cụ thể
      if (error.response) {
        switch (error.response.status) {
          case 400:
            Alert.alert(
              'Không thể khai thác', 
              'Khai thác thất bại vì thời gian cooldown chưa hết. Vui lòng đợi hết thời gian chờ.'
            );
            break;
          case 401:
            Alert.alert(
              'Không được xác thực', 
              'Vui lòng đăng nhập lại để tiếp tục.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    // TODO: Chuyển người dùng đến màn hình đăng nhập nếu cần
                    // navigation.navigate('Login');
                  }
                }
              ]
            );
            break;
          case 500:
            Alert.alert(
              'Lỗi máy chủ', 
              'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.'
            );
            break;
          default:
            Alert.alert('Lỗi', error.response?.data?.message || 'Không thể thực hiện mining. Vui lòng thử lại.');
        }
      } else {
        Alert.alert('Lỗi kết nối', 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.');
      }
      
      // Cập nhật lại trạng thái mining sau khi gặp lỗi
      fetchMiningData();
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      setLoading(true);
      const result = await miningService.checkIn();
      setCheckInResult(result);
      Alert.alert(
        'Thành công',
        `${result.message}\n\nNhận được: ${result.reward} COBIC\nSố dư mới: ${result.newBalance} COBIC`,
        [
          {
            text: 'OK',
            onPress: async () => {
              await fetchMiningData(); // Cập nhật lại dữ liệu mining
              await userService.getUser(); // Cập nhật lại thông tin người dùng và số dư
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Check-in error:', error);
      console.error('Check-in error response:', error.response?.data);
      
      // Xử lý các mã lỗi cụ thể
      if (error.response) {
        switch (error.response.status) {
          case 400:
            const errorData = error.response.data as DailyCheckInError;
            Alert.alert(
              'Không thể điểm danh', 
              `Điểm danh thất bại vì đã điểm danh trong 24 giờ qua.\nCòn ${errorData.remainingHours} giờ nữa có thể điểm danh lại.`
            );
            // Không gọi fetchMiningData ngay lập tức khi gặp lỗi 400
            break;
          case 401:
            Alert.alert(
              'Không được xác thực', 
              'Vui lòng đăng nhập lại để tiếp tục.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    // TODO: Chuyển người dùng đến màn hình đăng nhập nếu cần
                    // navigation.navigate('Login');
                  }
                }
              ]
            );
            break;
          case 500:
            Alert.alert(
              'Lỗi máy chủ', 
              'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.'
            );
            break;
          default:
            Alert.alert('Lỗi', error.response?.data?.message || 'Điểm danh thất bại. Vui lòng thử lại.');
        }
      } else {
        Alert.alert('Lỗi kết nối', 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.');
      }
      
      // Chỉ gọi fetchMiningData sau 2 giây nếu không phải lỗi 400
      if (error.response?.status !== 400) {
        setTimeout(() => {
          fetchMiningData();
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      if (!dateString) return 'Chưa có dữ liệu';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Thời gian không hợp lệ';
      return formatDistanceToNow(date, { addSuffix: true, locale: vi });
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Lỗi định dạng thời gian';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}>
        <ThemedText lightColor = {Colors.light.text} darkColor = {Colors.light.text} style={styles.headerTitle}>Mining</ThemedText>
        <ThemedText lightColor = {Colors.light.text} darkColor = {Colors.light.text} style={styles.headerSubtitle}>Kiếm tiền điện tử</ThemedText>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Ionicons name="reload" size={24} color={Colors[colorScheme ?? 'light'].tint} />
            <ThemedText lightColor = {Colors.light.text} darkColor = {Colors.light.text} style={styles.loadingText}>Đang tải...</ThemedText>
          </View>
        ) : miningStatus ? (
          <>
            <ThemedView style={styles.statusCard}>
              <View style={styles.statusHeader}>
                <Ionicons 
                  name={miningStatus.canMine ? "flash" : "time"} 
                  size={24} 
                  color={miningStatus.canMine ? "#4CAF50" : "#FF9800"} 
                />
                <ThemedText lightColor = {Colors.light.text} darkColor = {Colors.light.text} style={styles.statusTitle}>
                  Trạng thái Mining
                </ThemedText>
              </View>
              <ThemedText lightColor = {Colors.light.text} darkColor = {Colors.light.text} style={[
                styles.statusText,
                { color: miningStatus.canMine ? "#4CAF50" : "#FF9800" }
              ]}>
                {miningStatus.canMine ? 'Có thể mining' : 'Đang trong thời gian chờ'}
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Ionicons name="speedometer" size={24} color={Colors[colorScheme ?? 'light'].tint} />
                <ThemedText lightColor = {Colors.light.text} darkColor = {Colors.light.text} style={styles.infoTitle}>Thông tin Mining</ThemedText>
              </View>
              <View style={styles.infoContent}>
                <View style={styles.infoRow}>
                  <View style={styles.infoLabel}>
                    <Ionicons name="rocket" size={16} color={Colors[colorScheme ?? 'light'].text} />
                    <ThemedText lightColor = {Colors.light.text} darkColor = {Colors.light.text} style={styles.infoLabelText}>Tốc độ mining</ThemedText>
                  </View>
                  <ThemedText lightColor = {Colors.light.text} darkColor = {Colors.light.text} style={styles.infoValue}>{miningStatus.miningRate}</ThemedText>
                </View>
                <View style={styles.infoRow}>
                  <View style={styles.infoLabel}>
                    <Ionicons name="analytics" size={16} color={Colors[colorScheme ?? 'light'].text} />
                    <ThemedText lightColor = {Colors.light.text} darkColor = {Colors.light.text} style={styles.infoLabelText}>Tốc độ cơ bản</ThemedText>
                  </View>
                  <ThemedText lightColor = {Colors.light.text} darkColor = {Colors.light.text} style={styles.infoValue}>{miningStatus.baseMiningRate}</ThemedText>
                </View>
                <View style={styles.infoRow}>
                  <View style={styles.infoLabel}>
                    <Ionicons name="person" size={16} color={Colors[colorScheme ?? 'light'].text} />
                    <ThemedText lightColor = {Colors.light.text} darkColor = {Colors.light.text} style={styles.infoLabelText}>Tốc độ của bạn</ThemedText>
                  </View>
                  <ThemedText lightColor = {Colors.light.text} darkColor = {Colors.light.text} style={styles.infoValue}>{miningStatus.userMiningRate}</ThemedText>
                </View>
              </View>
            </ThemedView>

            <ThemedView style={styles.timeCard}>
              <View style={styles.timeHeader}>
                <Ionicons name="time" size={24} color={Colors[colorScheme ?? 'light'].tint} />
                <ThemedText lightColor = {Colors.light.text} darkColor = {Colors.light.text} style={styles.timeTitle}>Thời gian</ThemedText>
              </View>
              <View style={styles.timeContent}>
                <View style={styles.timeRow}>
                  <View style={styles.timeLabel}>
                    <Ionicons name="calendar" size={16} color={Colors[colorScheme ?? 'light'].text} />
                    <ThemedText lightColor = {Colors.light.text} darkColor = {Colors.light.text} style={styles.timeLabelText}>Lần mining cuối</ThemedText>
                  </View>
                  <ThemedText lightColor = {Colors.light.text} darkColor = {Colors.light.text} style={styles.timeValue}>{formatTime(miningStatus.lastMiningTime)}</ThemedText>
                </View>
                <View style={styles.timeRow}>
                  <View style={styles.timeLabel}>
                    <Ionicons name="timer" size={16} color={Colors[colorScheme ?? 'light'].text} />
                    <ThemedText lightColor = {Colors.light.text} darkColor = {Colors.light.text} style={styles.timeLabelText}>Lần mining tiếp theo</ThemedText>
                  </View>
                  <ThemedText lightColor = {Colors.light.text} darkColor = {Colors.light.text} style={styles.timeValue}>{timeLeft || formatTime(miningStatus.nextMiningTime)}</ThemedText>
                </View>
                <View style={styles.timeRow}>
                  <View style={styles.timeLabel}>
                    <Ionicons name="hourglass" size={16} color={Colors[colorScheme ?? 'light'].text} />
                    <ThemedText lightColor = {Colors.light.text} darkColor = {Colors.light.text} style={styles.timeLabelText}>Thời gian chờ</ThemedText>
                  </View>
                  <ThemedText lightColor = {Colors.light.text} darkColor = {Colors.light.text} style={styles.timeValue}>{miningStatus.cooldownHours} giờ</ThemedText>
                </View>
              </View>
            </ThemedView>

            <TouchableOpacity
              style={[
                styles.mineButton,
                { 
                  backgroundColor: miningStatus.canMine 
                    ? Colors[colorScheme ?? 'light'].tint 
                    : '#ccc',
                  shadowColor: miningStatus.canMine 
                    ? Colors[colorScheme ?? 'light'].tint 
                    : '#ccc',
                }
              ]}
              disabled={!miningStatus.canMine}
              onPress={handleMine}
            >
              <View style={styles.mineButtonContent}>
                <Ionicons 
                  name={miningStatus.canMine ? "flash" : "time"} 
                  size={24} 
                  color="#fff" 
                  style={styles.mineButtonIcon}
                />
                <ThemedText lightColor = {Colors.light.text} darkColor = {Colors.light.text} style={styles.mineButtonText}>
                  {miningStatus.canMine ? 'Bắt đầu Mining' : 'Đang trong thời gian chờ'}
                </ThemedText>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.checkInButton,
                { 
                  backgroundColor: Colors[colorScheme ?? 'light'].tint,
                  shadowColor: Colors[colorScheme ?? 'light'].tint,
                  opacity: (loading || timeLeft) ? 0.5 : 1
                }
              ]}
              disabled={loading || !!timeLeft}
              onPress={handleCheckIn}
            >
              <View style={styles.checkInButtonContent}>
                <Ionicons 
                  name="calendar" 
                  size={24} 
                  color="#fff" 
                  style={styles.checkInButtonIcon}
                />
                <ThemedText lightColor = {Colors.light.text} darkColor = {Colors.light.text} style={styles.checkInButtonText}>
                  {loading ? 'Đang xử lý...' : timeLeft ? `Còn ${timeLeft}` : 'Check-in hàng ngày'}
                </ThemedText>
              </View>
            </TouchableOpacity>

            <View style={styles.bottomSpacer} />
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle" size={48} color={Colors[colorScheme ?? 'light'].text} />
            <ThemedText lightColor = {Colors.light.text} darkColor = {Colors.light.text} style={styles.emptyText}>Không có dữ liệu</ThemedText>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    lineHeight: 40,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  bottomSpacer: {
    height: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statsContent: {
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsLabelText: {
    marginLeft: 8,
  },
  statsValue: {
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  infoContent: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabelText: {
    marginLeft: 8,
  },
  infoValue: {
    fontWeight: '600',
  },
  timeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  timeContent: {
    gap: 12,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeLabelText: {
    marginLeft: 8,
  },
  timeValue: {
    fontWeight: '600',
  },
  mineButton: {
    borderRadius: 16,
    marginTop: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  mineButtonContent: {
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mineButtonIcon: {
    marginRight: 8,
  },
  mineButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  checkInButton: {
    borderRadius: 16,
    marginTop: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checkInButtonContent: {
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkInButtonIcon: {
    marginRight: 8,
  },
  checkInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.7,
  },
}); 