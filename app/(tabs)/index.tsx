import React from 'react';
import { StyleSheet, View, ScrollView, SafeAreaView, Image, Animated, TouchableOpacity, Alert, TextInput, Dimensions, ActivityIndicator, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import Svg, { Circle, Path } from 'react-native-svg';
import { useEffect, useRef, useState, useCallback } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';
import { systemService } from '@/services/system.service';
import * as Clipboard from 'expo-clipboard';
import { Logo } from '@/components/ui/Logo';
import { useColorScheme } from '@/hooks/useColorScheme';
import { miningService, DailyCheckInResult, DailyCheckInError } from '@/services/mining.service';
import { useFocusEffect } from '@react-navigation/native';
import { authHandler } from '@/services/auth.handler';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { qrService } from '@/services/qr.service';
import { Audio } from 'expo-av';
import { notificationService } from '@/services/notification.service';

// Định nghĩa kiểu dữ liệu cho stats
interface SystemStats {
  globalMiningRate: string;
  decayFactor: string;
  lastDecayDate: string;
  totalSupply: string;
  currentSupply: string;
  userCount: number;
  lastDecayUserCount: number;
}

interface MiningStatus {
  nextMiningTime: string;
}

export default function HomeScreen() {
  const { isAuthenticated, user, logout, login, setIsAuthenticated, setUser, isLoggingOut, isInitialized } = useAuth();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const spinValue = useRef(new Animated.Value(0)).current;
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const colorScheme = useColorScheme();
  const [miningStatus, setMiningStatus] = useState<MiningStatus | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isFetching, setIsFetching] = useState(false);
  const [hasFetchedWhenZero, setHasFetchedWhenZero] = useState(false);
  const fetchRef = useRef(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [countdownEnded, setCountdownEnded] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);

  // Chỉ fetch dữ liệu khi đã khởi tạo xong và không đang logout
  useEffect(() => {
    if (!isInitialized || isLoggingOut) return;
    
    const checkTokenAndFetch = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        router.replace('/login');
        return;
      }
      
      if (isAuthenticated && !fetchRef.current) {
        fetchRef.current = true;
        fetchMiningStatus();
        fetchUserInfo();
      }
    };
    
    checkTokenAndFetch();
  }, [isAuthenticated, isLoggingOut, isInitialized]);

  // Chỉ fetch system stats khi lần đầu component được mount
  useEffect(() => {
    if (!isInitialized) return;
    
    const fetchInitialStats = async () => {
      if (!systemStats) {
        try {
          setStatsLoading(true);
          const stats = await systemService.getPublicStats();
          setSystemStats(stats);
        } catch (error) {
          console.error('Error fetching initial stats:', error);
        } finally {
          setStatsLoading(false);
        }
      }
    };

    fetchInitialStats();
  }, [isInitialized]);

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // Thêm useFocusEffect để fetch dữ liệu mới nhất khi vào lại trang
  useFocusEffect(
    React.useCallback(() => {
      if (!isInitialized || isLoggingOut) return;
      
      const checkTokenAndFetch = async () => {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          setIsAuthenticated(false);
          setUser(null);
          router.replace('/login');
          return;
        }
        
        if (isAuthenticated) {
          await Promise.all([
            fetchMiningStatus(),
            fetchUserInfo()
          ]);
        }
      };

      checkTokenAndFetch();
    }, [isAuthenticated, isLoggingOut, isInitialized])
  );

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const fetchMiningStatus = async () => {
    if (isFetching || isLoggingOut || !isInitialized) return;
    try {
      setIsFetching(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const status = await miningService.getMiningStatus();
      if (status && typeof status === 'object' && 'error' in status && (status as any).error && ((status as any).error === 'Invalid token' || (status as any).error === 'invalid token')) {
        await logout();
        router.replace('/login');
        return;
      }
      setMiningStatus(status);
      
      // Lưu thời gian điểm danh tiếp theo và lên lịch thông báo
      if (status?.nextMiningTime) {
        await AsyncStorage.setItem('nextCheckInTime', status.nextMiningTime);
        await notificationService.scheduleDailyCheckInNotification();
      }
    } catch (error: any) {
      console.error('Error fetching mining status:', error);
      if (error.response && error.response.status === 401) {
        if (!isAuthenticated) return;
        await authHandler.handleUnauthorized(error);
      }
    } finally {
      setIsFetching(false);
    }
  };

  const fetchUserInfo = async () => {
    if (isLoggingOut || !isInitialized) return;
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const userData = await userService.getUser();
      if (userData && (userData.error === 'Invalid token' || userData.error === 'invalid token')) {
        await logout();
        router.replace('/login');
        return;
      }
      if (userData) {
        setUserInfo(userData);
        setUser(userData);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return 'Chưa có';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDailyCheckIn = async () => {
    try {
      setLoading(true);
      const result = await miningService.checkIn();
      Alert.alert(
        'Thành công',
        `${result.message}\n\nNhận được: ${result.reward} COBIC\nSố dư mới: ${result.newBalance} COBIC`,
        [
          {
            text: 'OK',
            onPress: async () => {
              await fetchMiningStatus(); // Cập nhật lại trạng thái mining
              await fetchUserInfo(); // Cập nhật lại thông tin người dùng và số dư
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Check-in error:', error);
      console.error('Check-in error response:', error.response?.data);
      
      if (error.response) {
        switch (error.response.status) {
          case 400:
            const errorData = error.response.data as DailyCheckInError;
            Alert.alert(
              'Không thể điểm danh', 
              `Điểm danh thất bại vì đã điểm danh trong 24 giờ qua.\nCòn ${errorData.remainingHours} giờ nữa có thể điểm danh lại.`
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
                    logout();
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
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await notificationService.cancelAllNotifications();
      await logout();
    } catch (error) {
      Alert.alert('Lỗi', 'Đăng xuất thất bại. Vui lòng thử lại.');
    }
  };

  const handleGuestRegister = async () => {
    try {
      setLoading(true);
      const response = await authService.guestRegister();
      console.log('Guest register response (home page):', JSON.stringify(response, null, 2));
      
      Alert.alert(
        'Thông tin tài khoản',
        `Tên đăng nhập: ${response.user.username}\nMật khẩu: ${response.user.plainPassword}\n\nVui lòng ghi nhớ thông tin này để đăng nhập lại sau!`,
        [
          { 
            text: 'Sao chép Mật khẩu',
            onPress: async () => {
              await Clipboard.setStringAsync(response.user.plainPassword);
              Alert.alert('Đã sao chép', 'Mật khẩu đã được sao chép vào bộ nhớ tạm.');
              await login(response.token, {
                ...response.user,
                plainPassword: response.user.plainPassword 
              });
              setShowUpdateForm(true);
              setNewUsername(response.user.username);
            }
          },
          { 
            text: 'OK',
            onPress: async () => {
              await login(response.token, {
                ...response.user,
                plainPassword: response.user.plainPassword 
              });
              setShowUpdateForm(true);
              setNewUsername(response.user.username);
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Guest register error (home page):', error);
      Alert.alert('Lỗi', error.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAccount = async () => {
    if (!newUsername.trim() || !newPassword || !confirmPassword) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu mới không khớp');
      return;
    }

    const currentPassword = user?.plainPassword;
    if (!currentPassword) {
      Alert.alert('Lỗi', 'Không tìm thấy mật khẩu hiện tại để thực hiện thay đổi.');
      return;
    }

    try {
      setUpdateLoading(true);
      if (newUsername.trim() !== user?.username) {
        await userService.updateUsername(newUsername.trim());
      }
      await userService.changePassword(currentPassword, newPassword);
      Alert.alert('Thành công', 'Cập nhật thông tin tài khoản thành công');
      setShowUpdateForm(false);
      fetchUserInfo();
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setUpdateLoading(false);
    }
  };

  const formatTimeLeft = (diff: number) => {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (miningStatus?.nextMiningTime) {
      const updateTimeLeft = () => {
        const now = new Date().getTime();
        const nextTime = new Date(miningStatus.nextMiningTime).getTime();
        const diff = nextTime - now;
        
        // Nếu đã hết thời gian
        if (diff <= 0) {
          clearInterval(interval);
          setTimeLeft('');
          setCountdownEnded(true);
          fetchMiningStatus();
          return;
        }
        
        // Tính toán thời gian còn lại
        const totalSeconds = Math.floor(diff / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        // Chỉ cập nhật nếu thời gian thực sự thay đổi
        const newTimeLeft = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        if (newTimeLeft !== timeLeft) {
          setTimeLeft(newTimeLeft);
        }
      };

      // Reset trạng thái
      setCountdownEnded(false);
      
      // Cập nhật ngay lập tức
      updateTimeLeft();
      
      // Cập nhật mỗi giây
      interval = setInterval(updateTimeLeft, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [miningStatus?.nextMiningTime]);

  // Cập nhật lại trạng thái khi countdown kết thúc
  useEffect(() => {
    if (countdownEnded) {
      fetchMiningStatus();
    }
  }, [countdownEnded]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.container}>
          {/* Header Section */}
          <View style={styles.header}>
            <Animated.Image
              source={require('@/assets/images/logo-cobic.png')}
              style={[styles.logoLarge, { transform: [{ rotate: spin }] }]}
              resizeMode="contain"
            />
          </View>

          {/* Hai nút lớn dưới logo */}
          {isAuthenticated && (
            <>
              <TouchableOpacity 
                style={styles.checkInButtonPro} 
                onPress={handleDailyCheckIn} 
                disabled={loading || !!timeLeft}
              >
                <ThemedText style={styles.checkInButtonTextPro}>
                  {loading ? 'Đang xử lý...' : timeLeft ? `Còn ${timeLeft}` : 'ĐIỂM DANH HÀNG NGÀY'}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.checkInButtonPro} onPress={() => setShowQRModal(true)} disabled={loading}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <IconSymbol name="qrcode.viewfinder" size={16} color="#fff" style={{ marginRight: 6 }} />
                  <ThemedText style={styles.checkInButtonTextPro}>Quét mã nhận thưởng</ThemedText>
                </View>
              </TouchableOpacity>
            </>
          )}

          {/* Card Thông tin cá nhân */}
          {isAuthenticated ? (
            <ThemedView style={[styles.profileCardPro, {backgroundColor: colorScheme === 'dark' ? '#4C0099' : '#fff'}]}>
              <View style={styles.profileHeaderRow}>
                <ThemedText type="title" style={[styles.sectionTitle, {color: colorScheme === 'dark' ? '#fff' : '#333'}]} >Thông tin cá nhân</ThemedText>
                <TouchableOpacity onPress={handleLogout}>
                  <ThemedText style={[styles.logoutButton, { color: Colors.light.tint}]}>Đăng xuất</ThemedText>
                </TouchableOpacity>
              </View>
              <View style={styles.profileInfoList}>
                <View style={[styles.profileInfoListItem, {backgroundColor: colorScheme === 'dark' ? '#600EBD' : '#fff',}]}>
                  <IconSymbol name="person.fill" size={18} color={Colors[colorScheme ?? 'light'].tint} />
                  <ThemedText style={[styles.profileInfoLabelList, {fontWeight: 'bold'}, {  color:  colorScheme === 'dark' ? '#fff' : '#333'},]}>Tên</ThemedText>
                  <ThemedText style={[styles.profileInfoValueList, {color: colorScheme === 'dark' ? '#fff' : '#333'}]} numberOfLines={1} ellipsizeMode='tail'>{user?.username}</ThemedText>
                </View>
                <View style={[styles.profileInfoListItem, {backgroundColor: colorScheme === 'dark' ? '#600EBD' : '#fff',}]}>
                  <IconSymbol name="envelope.fill" size={18} color={Colors[colorScheme ?? 'light'].tint} />
                  <ThemedText style={[styles.profileInfoLabelList, {fontWeight: 'bold'}, {  color:  colorScheme === 'dark' ? '#fff' : '#333'},]}>Email</ThemedText>
                  <ThemedText style={[styles.profileInfoValueList, {color: colorScheme === 'dark' ? '#fff' : '#333'}]} numberOfLines={1} ellipsizeMode='tail'>{user?.email || 'Chưa cập nhật email'}</ThemedText>
                </View>
                <View style={[styles.profileInfoListItem, {backgroundColor: colorScheme === 'dark' ? '#600EBD' : '#fff',}]}>
                  <IconSymbol name="creditcard.fill" size={18} color={Colors[colorScheme ?? 'light'].tint} />
                  <ThemedText style={[styles.profileInfoLabelList, {fontWeight: 'bold'}, {  color:  colorScheme === 'dark' ? '#fff' : '#333'},]}>Số dư</ThemedText>
                  <ThemedText style={[styles.profileInfoValueList, {color: colorScheme === 'dark' ? '#fff' : '#333'}]}>{user?.balance || '0.00'}</ThemedText>
                </View>
                <View style={[styles.profileInfoListItem, {backgroundColor: colorScheme === 'dark' ? '#600EBD' : '#fff',}]}>
                  <IconSymbol name="bolt.fill" size={18} color={Colors[colorScheme ?? 'light'].tint} />
                  <ThemedText style={[styles.profileInfoLabelList, {fontWeight: 'bold'}, {  color:  colorScheme === 'dark' ? '#fff' : '#333'},]}>Tốc độ</ThemedText>
                  <ThemedText style={[styles.profileInfoValueList, {color: colorScheme === 'dark' ? '#fff' : '#333'}]}>{user?.miningRate || '0'}/giờ</ThemedText>
                </View>
                <View style={[styles.profileInfoListItem, {backgroundColor: colorScheme === 'dark' ? '#600EBD' : '#fff',}]}>
                  <IconSymbol name="person.2.fill" size={18} color={Colors[colorScheme ?? 'light'].tint} />
                  <ThemedText style={[styles.profileInfoLabelList, {fontWeight: 'bold'}, {  color:  colorScheme === 'dark' ? '#fff' : '#333'},]}>Mã mời</ThemedText>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <ThemedText style={[[styles.profileInfoValueList, {color: colorScheme === 'dark' ? '#fff' : '#333'}], { flex: 1 }]} numberOfLines={1} ellipsizeMode='tail'>{user?.referralCode || 'N/A'}</ThemedText>
                    {user?.referralCode && (
                      <TouchableOpacity onPress={async () => {
                        if (user.referralCode) {
                          await Clipboard.setStringAsync(user.referralCode);
                          Alert.alert('Đã sao chép');
                        }
                      }} style={styles.copyButtonSmall}>
                        <IconSymbol name="doc.on.doc" size={14} color={Colors[colorScheme ?? 'light'].tint} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </ThemedView>
          ) : (
            <View style={styles.guestActions}>
              <TouchableOpacity 
                style={styles.loginButton}
                onPress={() => router.push('/login')}
              >
                <ThemedText style={styles.loginButtonText}>Đăng nhập</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.guestRegisterButton}
                onPress={handleGuestRegister}
                disabled={loading}
              >
                <ThemedText style={styles.guestRegisterButtonText}>
                  {loading ? 'Đang xử lý...' : 'Đăng ký nhanh'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {/* Card Dịch vụ trong hệ sinh thái Cobic */}
          <ThemedView style={[styles.ecosystemCard, {backgroundColor: colorScheme === 'dark' ? '#4C0099' : '#fff'}]}>
            <View style={styles.ecosystemHeaderRow}>
              <ThemedText type="title" style={[styles.sectionTitle, {color: colorScheme === 'dark' ? '#fff' : '#333'}]}>Dịch vụ trong hệ sinh thái Cobic</ThemedText>
            </View>
            <View style={styles.ecosystemGrid}>
              <View style={[styles.ecosystemItem, {backgroundColor: colorScheme === 'dark' ? '#600EBD' : '#fff'}]}>
                <IconSymbol name="cup.and.saucer.fill" size={28} color={Colors[colorScheme ?? 'light'].tint} />
                <ThemedText style={[styles.ecosystemLabel, {color: colorScheme === 'dark' ? '#fff' : '#000'}]}>Cà phê</ThemedText>
                <ThemedText style={styles.ecosystemStatusActive}>Đang hoạt động</ThemedText>
              </View>
              <View style={[styles.ecosystemItem, {backgroundColor: colorScheme === 'dark' ? '#600EBD' : '#fff'}]}>
                <IconSymbol name="snowflake" size={28} color={Colors[colorScheme ?? 'light'].tint} />
                <ThemedText style={[styles.ecosystemLabel, {color: colorScheme === 'dark' ? '#fff' : '#000'}]}>Kem</ThemedText>
                <ThemedText style={styles.ecosystemStatusDev}>Đang phát triển</ThemedText>
              </View>
              <View style={[styles.ecosystemItem, {backgroundColor: colorScheme === 'dark' ? '#600EBD' : '#fff'}]}>
                <IconSymbol name="leaf.fill" size={28} color={Colors[colorScheme ?? 'light'].tint} />
                <ThemedText style={[styles.ecosystemLabel, {color: colorScheme === 'dark' ? '#fff' : '#000'}]}>Trà sữa</ThemedText>
                <ThemedText style={styles.ecosystemStatusDev}>Đang phát triển</ThemedText>
              </View>
              <View style={[styles.ecosystemItem, {backgroundColor: colorScheme === 'dark' ? '#600EBD' : '#fff'}]}>
                <IconSymbol name="cart.fill" size={28} color={Colors[colorScheme ?? 'light'].tint} />
                <ThemedText style={[styles.ecosystemLabel, {color: colorScheme === 'dark' ? '#fff' : '#000'}]}>Dịch vụ khác</ThemedText>
                <ThemedText style={styles.ecosystemStatusDev}>Đang phát triển</ThemedText>
              </View>
            </View>
          </ThemedView>

          {/* Card Quick Stats đồng bộ style */}
          <ThemedView style={[styles.quickStatsCard, {backgroundColor: colorScheme === 'dark' ? '#4C0099' : '#fff'}]}>
            <View style={styles.quickStatsRow}>
              <View style={styles.quickStatsItem}>
                <IconSymbol name="chart.line.uptrend.xyaxis" size={28} color={Colors[colorScheme ?? 'light'].tint} />
                <ThemedText style={[styles.quickStatsLabel, {fontWeight: 'bold'} , {color: colorScheme === 'dark' ? '#fff' : '#000'}]}>Tổng đã đào</ThemedText>
                <ThemedText style={[styles.quickStatsValue, {color: colorScheme === 'dark' ? '#fff' : '#000'}]}>{user?.totalMined || '0'} COBIC</ThemedText>
              </View>
              <View style={styles.quickStatsItem}>
                <IconSymbol name="gift.fill" size={28} color={Colors[colorScheme ?? 'light'].tint} />
                <ThemedText style={[styles.quickStatsLabel, {fontWeight: 'bold'} , {color: colorScheme === 'dark' ? '#fff' : '#000'}]}>Hệ số thưởng</ThemedText>
                <ThemedText style={[styles.quickStatsValue, {color: colorScheme === 'dark' ? '#fff' : '#000'}]}>{user?.bonusFactor || '1.0'}x</ThemedText>
              </View>
            </View>
          </ThemedView>

          {/* Card Thống kê hệ thống full màn hình, chỉ 3 trường chính */}
          <ThemedView style={[styles.systemStatsCard, {backgroundColor: colorScheme === 'dark' ? '#4C0099' : '#fff'}]}>
            <View style={styles.systemStatsHeaderRow}>
              <ThemedText type="title" style={[styles.sectionTitle, {color: colorScheme === 'dark' ? '#fff' : '#000'}]}>Thống kê hệ thống</ThemedText>
            </View>
            {statsLoading ? (
              <ThemedText style={styles.loadingText}>Đang tải thống kê...</ThemedText>
            ) : systemStats ? (
              <View style={styles.systemStatsList}>
                <View style={[styles.systemStatsListItem, {backgroundColor: colorScheme === 'dark' ? '#600EBD' : '#fff'}]}>
                  <IconSymbol name="chart.line.uptrend.xyaxis" size={18} color={Colors[colorScheme ?? 'light'].tint} />
                  <ThemedText style={[styles.systemStatsLabel, {fontWeight: 'bold'} ,{  color:  colorScheme === 'dark' ? '#fff' : '#333'}]}>Tốc độ đào cơ bản</ThemedText>
                  <ThemedText style={[styles.systemStatsValue, {color: colorScheme === 'dark' ? '#fff' : '#000'}]}>
                    {systemStats.globalMiningRate === 'string' ? 'Đang cập nhật' : `${systemStats.globalMiningRate} COBIC/giờ`}
                  </ThemedText>
                </View>
                <View style={[styles.systemStatsListItem, {backgroundColor: colorScheme === 'dark' ? '#600EBD' : '#fff'}]}>
                  <IconSymbol name="gift.fill" size={18} color={Colors[colorScheme ?? 'light'].tint} />
                  <ThemedText style={[styles.systemStatsLabel, {fontWeight: 'bold'} ,{  color:  colorScheme === 'dark' ? '#fff' : '#333'}]}>Hệ số phân rã</ThemedText>
                  <ThemedText style={[styles.systemStatsValue, {color: colorScheme === 'dark' ? '#fff' : '#000'}]}>
                    {systemStats.decayFactor === 'string' ? 'Đang cập nhật' : systemStats.decayFactor}
                  </ThemedText>
                </View>
                <View style={[styles.systemStatsListItem, {backgroundColor: colorScheme === 'dark' ? '#600EBD' : '#fff'}]}>
                  <IconSymbol name="person.3.fill" size={18} color={Colors[colorScheme ?? 'light'].tint} />
                  <ThemedText style={[styles.systemStatsLabel, {fontWeight: 'bold'} ,{  color:  colorScheme === 'dark' ? '#fff' : '#333'}]}>Tổng số người dùng</ThemedText>
                  <ThemedText style={[styles.systemStatsValue, {color: colorScheme === 'dark' ? '#fff' : '#000'}]}>
                    {systemStats.userCount}
                  </ThemedText>
                </View>
              </View>
            ) : (
              <ThemedText style={styles.errorText}>Không thể tải thống kê.</ThemedText>
            )}
          </ThemedView>

          {/* Update Account Form */}
          {showUpdateForm && isAuthenticated && (
            <ThemedView style={styles.section}>
              <ThemedText type="title" style={styles.sectionTitle}>Cập nhật thông tin tài khoản</ThemedText>
              <ThemedText style={styles.warningText}>
                Vui lòng cập nhật thông tin tài khoản để tránh quên mật khẩu
              </ThemedText>
              <TextInput
                style={[styles.input, {
                  backgroundColor: Colors[colorScheme ?? 'light'].inputBackground,
                  borderColor: colorScheme === 'dark' ? '#666' : '#E5E7EB',
                  color: Colors[colorScheme ?? 'light'].text
                }]}
                value={newUsername}
                onChangeText={setNewUsername}
                placeholder="Tên đăng nhập mới (tùy chọn)"
                placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
              />
              <TextInput
                style={[styles.input, {
                  backgroundColor: Colors[colorScheme ?? 'light'].inputBackground,
                  borderColor: colorScheme === 'dark' ? '#666' : '#E5E7EB',
                  color: Colors[colorScheme ?? 'light'].text
                }]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Mật khẩu mới"
                placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
                secureTextEntry
              />
              <TextInput
                style={[styles.input, {
                  backgroundColor: Colors[colorScheme ?? 'light'].inputBackground,
                  borderColor: colorScheme === 'dark' ? '#666' : '#E5E7EB',
                  color: Colors[colorScheme ?? 'light'].text
                }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Xác nhận mật khẩu mới"
                placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
                secureTextEntry
              />
              <TouchableOpacity 
                style={[styles.button, updateLoading && styles.buttonDisabled]}
                onPress={handleUpdateAccount}
                disabled={updateLoading || !newPassword || newPassword !== confirmPassword}
              >
                <ThemedText style={styles.buttonText}>
                  {updateLoading ? 'Đang xử lý...' : 'Cập nhật'}
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          )}

          {/* Recent Activities */}
          <ThemedView style={styles.section}>
            <ThemedText type="title" style={styles.sectionTitle}>Hoạt động gần đây</ThemedText>
            <View style={[styles.activityCard, { backgroundColor: Colors[colorScheme ?? 'light'].background }]} >
              <ThemedText style={styles.emptyText}>Chưa có hoạt động nào</ThemedText>
            </View>
          </ThemedView>
        </ThemedView>
      </ScrollView>
      <Modal
        visible={showQRModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowQRModal(false)}
      >
        <QRScannerModal onSuccess={() => setShowQRModal(false)} onClose={() => setShowQRModal(false)} />
      </Modal>
    </SafeAreaView>
  );
} 

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 0,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    paddingTop: 16,
    flexDirection: 'column',
  },
  logoLarge: {
    width: 96,
    height: 96,
    marginBottom: 12,
    alignSelf: 'center',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  logoutButton: {
    fontWeight: '500',
  },
  profileCardPro: {
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    padding: 28,
    marginVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    width: '96%',
    alignSelf: 'center',
  },
  profileHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  profileInfoList: {
    width: '100%',
    marginBottom: 18,
  },
  profileInfoListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  profileInfoLabelList: {
    fontSize: 12,
    opacity: 0.7,
    marginLeft: 8,
    minWidth: 60,
  },
  profileInfoValueList: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 8,
    flexShrink: 1,
  },
  checkInButtonPro: {
    width: '70%',
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 4,
    marginBottom: 4,
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  checkInButtonTextPro: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 1,
  },
  guestActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  loginButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  guestRegisterButton: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
  },
  guestRegisterButtonText: {
    fontWeight: '600',
  },
  quickStatsCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    padding: 20,
    marginVertical: 16,
    width: '96%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  quickStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickStatsItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickStatsLabel: {
    fontSize: 13,
    opacity: 0.7,
    marginTop: 8,
  },
  quickStatsValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 2,
  },
  systemStatsCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    padding: 28,
    marginVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    width: '96%',
    alignSelf: 'center',
  },
  systemStatsHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
  systemStatsList: {
    width: '100%',
    marginBottom: 0,
  },
  systemStatsListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  systemStatsLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginLeft: 8,
    minWidth: 120,
  },
  systemStatsValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 8,
    flexShrink: 1,
  },
  loadingText: {
    textAlign: 'center',
    paddingVertical: 16,
    color: Colors.light.icon,
  },
  errorText: {
    textAlign: 'center',
    paddingVertical: 16,
    color: '#EF4444',
  },
  copyButtonSmall: {
    marginLeft: 8,
    padding: 2,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  button: {
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#EDE9FE',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  warningText: {
    color: 'orange',
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 14,
  },
  cafeScroll: {
    marginTop: 8,
  },
  cafeCard: {
    borderRadius: 12,
    padding: 12,
    marginRight: 16,
    width: 250,
  },
  cafeImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cafeInfo: {},
  cafeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cafeAddress: {
    fontSize: 13,
    marginBottom: 8,
  },
  cafeRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 13,
    fontWeight: '500',
  },
  activityCard: {
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.light.icon,
    fontSize: 14,
  },
  ecosystemCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    padding: 28,
    marginVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    width: '96%',
    alignSelf: 'center',
  },
  ecosystemHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
  ecosystemGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  ecosystemItem: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  ecosystemLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 2,
  },
  ecosystemStatusActive: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '500',
    marginTop: 2,
  },
  ecosystemStatusDev: {
    fontSize: 12,
    color: '#F59E42',
    fontWeight: '500',
    marginTop: 2,
  },
});

function QRScannerModal({ onSuccess, onClose }: { onSuccess: () => void, onClose: () => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const [sound, setSound] = useState<Audio.Sound>();

  async function playSound(success: boolean) {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('@/assets/sounds/notification/pristine-609.mp3')
      );
      setSound(sound);
      await sound.playAsync();
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);
    try {
      if (!data || typeof data !== 'string') {
        throw new Error('Mã QR không hợp lệ');
      }
      const response = await qrService.scanQR(data);
      if (!response || !response.message) {
        throw new Error('Phản hồi không hợp lệ từ máy chủ');
      }
      await playSound(true);
      Alert.alert('Thành công', response.message, [
        { text: 'OK', onPress: onSuccess }
      ]);
    } catch (error: any) {
      await playSound(false);
      if (error.message === 'Mã QR không hợp lệ') {
        Alert.alert('Lỗi', 'Mã QR không hợp lệ. Vui lòng thử lại với mã QR khác.');
      } else if (error.response) {
        switch (error.response.status) {
          case 400:
            Alert.alert('Lỗi', error.response.data.error || 'Mã QR không hợp lệ');
            break;
          case 401:
            Alert.alert('Lỗi', 'Vui lòng đăng nhập để tiếp tục');
            onClose();
            break;
          case 500:
            Alert.alert('Lỗi', 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.');
            break;
          default:
            Alert.alert('Lỗi', 'Có lỗi xảy ra. Vui lòng thử lại.');
        }
      } else {
        Alert.alert('Lỗi', error.message || 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
      }
    } finally {
      setLoading(false);
      setScanned(false);
    }
  };

  if (!permission) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' }}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
      </View>
    );
  }
  if (!permission.granted) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' }}>
        <ThemedText style={{ color: '#fff', marginBottom: 20 }}>Vui lòng cấp quyền truy cập camera trong cài đặt của thiết bị</ThemedText>
        <TouchableOpacity style={{ backgroundColor: Colors.light.tint, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }} onPress={requestPermission}>
          <ThemedText style={{ color: '#fff', fontWeight: '600' }}>Thử lại</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      <CameraView
        style={{ flex: 1, width: '100%' }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: 250, height: 250, borderWidth: 2, borderColor: '#fff', position: 'relative' }} />
          <ThemedText style={{ color: '#fff', marginTop: 20, fontSize: 16, textAlign: 'center' }}>Đặt mã QR vào khung để quét</ThemedText>
        </View>
        <View style={{ position: 'absolute', bottom: 40 + insets.bottom, left: 0, right: 0, alignItems: 'center' }}>
          <TouchableOpacity style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }} onPress={onClose}>
            <IconSymbol name="xmark" size={24} color={Colors[colorScheme ?? 'light'].text} />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}
