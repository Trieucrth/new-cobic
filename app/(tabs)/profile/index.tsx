import { StyleSheet, View, ScrollView, TouchableOpacity, Alert, SafeAreaView, Text, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { router } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { userService } from '@/services/user.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React from 'react';
import { authHandler } from '@/services/auth.handler';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const { user, logout, setUser, isLoggingOut, isInitialized } = useAuth();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);
  const fetchRef = useRef(false);
  const [referralStats, setReferralStats] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  
  // Kiểm tra token khi component mount
  useEffect(() => {
    if (!isInitialized) return;
    
    const checkToken = async () => {
      const isAuthenticated = await authHandler.checkAuthStatus();
      if (!isAuthenticated) {
        router.replace('/login');
        setShouldRender(false);
        return;
      }
    };
    checkToken();
  }, [isInitialized]);

  // Chỉ fetch user info khi có token và không đang đăng xuất
  useEffect(() => {
    if (!isInitialized || isLoggingOut || !shouldRender) return;
    
    const fetchUser = async () => {
      if (fetchRef.current) return;
      fetchRef.current = true;
      
      try {
        setLoadingUser(true);
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          router.replace('/login');
          setShouldRender(false);
          return;
        }

        const userData = await authService.getMe();
        if (!userData) {
          router.replace('/login');
          setShouldRender(false);
          return;
        }
        
        setUser(userData);
        setUserInfo(userData);

        // Lấy thông tin giới thiệu
        const stats = await userService.getReferralStats();
        if (stats) {
          setReferralStats(stats);
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
        router.replace('/login');
        setShouldRender(false);
      } finally {
        setLoadingUser(false);
        fetchRef.current = false;
      }
    };

    fetchUser();
  }, [isLoggingOut, shouldRender, isInitialized]);

  // Thêm useFocusEffect để fetch dữ liệu mới nhất khi vào lại trang
  useFocusEffect(
    React.useCallback(() => {
      if (!isInitialized || isLoggingOut || !shouldRender) return;
      
      const fetchUser = async () => {
        try {
          setLoadingUser(true);
          const token = await AsyncStorage.getItem('token');
          if (!token) return;

          const userData = await authService.getMe();
          if (userData) {
            setUser(userData);
            setUserInfo(userData);
          }

          // Cập nhật thông tin giới thiệu
          const stats = await userService.getReferralStats();
          if (stats) {
            setReferralStats(stats);
          }
        } catch (error) {
          console.error('Error fetching latest user info:', error);
        } finally {
          setLoadingUser(false);
        }
      };

      fetchUser();
    }, [isLoggingOut, shouldRender, isInitialized])
  );

  // Xử lý cập nhật profile
  const handleUpdateProfile = async () => {
    try {
      setLoading(true);

      // 1) Gửi lên server
      //    Giả sử API trả về object `user` đã được cập nhật
      const updatedUser = await userService.updateProfile({
        fullName: userInfo?.fullName,
        dateOfBirth: userInfo?.dateOfBirth,
        country: userInfo?.country,
        address: userInfo?.address,
        bio: userInfo?.bio,
        phoneNumber: userInfo?.phoneNumber
      });

      Alert.alert('Thành công', 'Đã cập nhật thông tin profile thành công');

      // 2) Cập nhật ngay vào Context để mọi màn hình đọc useAuth() lấy luôn giá trị mới
      if (updatedUser) {
        setUser(updatedUser);
      } else {
        // Nếu API không trả user, fetch lại qua endpoint getMe
        const me = await authService.getMe();
        if (me) setUser(me);
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Lỗi', error.response?.data?.message || 'Cập nhật thông tin thất bại');
    } finally {
      setLoading(false);
    }
  };
    

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setShouldRender(false);
    fetchRef.current = true;
    
    try {
      await logout();
    } catch (error) {
      console.error('ProfileScreen: Error during logout:', error);
      Alert.alert('Lỗi', 'Đăng xuất thất bại. Vui lòng thử lại.');
      setShouldRender(true);
      fetchRef.current = false;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Chưa có';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  };

  const getKycStatusText = (status: string | null) => {
    if (!status) return 'Chưa xác thực';
    switch (status) {
      case 'pending': return 'Đang chờ duyệt';
      case 'approved': return 'Đã xác thực';
      case 'rejected': return 'Bị từ chối';
      default: return 'Không xác định';
    }
  };

  const getKycStatusColor = (status: string | null) => {
    if (!status) return Colors.light.icon;
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'approved': return '#10B981';
      case 'rejected': return '#EF4444';
      default: return Colors.light.icon;
    }
  };

  const handleTestTokenExpiration = async () => {
    try {
      setLoading(true);
      await authService.testExpireToken();
      Alert.alert(
        'Thành công',
        'Token đã được làm hết hạn. Vui lòng thử các chức năng khác để kiểm tra.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Test token expiration error:', error);
      Alert.alert('Lỗi', 'Không thể làm token hết hạn');
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    {
      icon: 'person-outline',
      title: 'Thông tin cá nhân',
      onPress: () => router.push('/profile/profile'),
    },
    {
      icon: 'person-circle-outline',
      title: 'Tên người dùng',
      onPress: () => router.push('/profile/username'),
    },
    {
      icon: 'lock-closed-outline',
      title: 'Đổi mật khẩu',
      onPress: () => router.push('/profile/change-password'),
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Xác thực KYC',
      onPress: () => router.push('/profile/kyc'),
    },
    {
      icon: 'gift-outline',
      title: 'Nhập mã giới thiệu',
      onPress: () => router.push('/profile/referral'),
    },
    {
      icon: 'receipt-outline',
      title: 'Lịch sử quét mã',
      onPress: () => router.push('/profile/scan-history'),
    },
    ...(process.env.NODE_ENV === 'development' ? [{
      icon: 'warning-outline',
      title: 'Test Token Hết Hạn',
      onPress: handleTestTokenExpiration,
    }] : []),
  ];

  if (!shouldRender) {
    return null;
  }

  if (loadingUser) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
        <ThemedText style={styles.loadingText}>Đang tải thông tin cá nhân...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <LoadingOverlay visible={loading} />
      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.profileContent}>
          {/* Header nổi bật */}
          <View style={[styles.profileHeader, {backgroundColor: colorScheme === 'dark' ? '#4C0099' : '#fff',}]}>
            <View style={styles.avatarWrapper}>
              <IconSymbol name="person.circle.fill" size={90} color={Colors[colorScheme ?? 'light'].tint} />
            </View>
            <ThemedText type="title" style={[styles.profileUsername, {color: colorScheme === 'dark' ? '#fff' : '#333'}]}>{userInfo?.username || user?.username}</ThemedText>
            <ThemedText style={styles.profileAccountType}>{userInfo?.isGuest ? 'Tài khoản khách' : 'Tài khoản chính thức'}</ThemedText>
          </View>

          {/* Card thông tin tài khoản */}
          <ThemedView style={[styles.infoCard, {backgroundColor: colorScheme === 'dark' ? '#4C0099' : '#fff',}]}>
            <ThemedText type="title" style={[styles.sectionTitle, {color: colorScheme === 'dark' ? '#fff' : '#222'}]}>Thông tin tài khoản</ThemedText>
            <View style={styles.infoList}>
              <View style={styles.infoRow}>
                <IconSymbol name="envelope.fill" size={18} color={colorScheme === 'dark' ? '#fff' : Colors[colorScheme ?? 'light'].tint} style={styles.infoIcon} />
                <ThemedText style={[styles.infoLabel, {color: colorScheme === 'dark' ? '#fff' : '#333'}]}>Email</ThemedText>
                <ThemedText style={[styles.infoValue, {color: colorScheme === 'dark' ? '#FFD700' : '#333'}]}>{userInfo?.email || 'Chưa cập nhật'}</ThemedText>
              </View>
              <View style={styles.infoRow}>
                <IconSymbol name="creditcard.fill" size={18} color={colorScheme === 'dark' ? '#fff' : Colors[colorScheme ?? 'light'].tint} style={styles.infoIcon} />
                <ThemedText style={[styles.infoLabel, {color: colorScheme === 'dark' ? '#fff' : '#333'}]}>Số dư</ThemedText>
                <ThemedText style={[styles.infoValue, {color: colorScheme === 'dark' ? '#fff' : '#333'}]}>{userInfo?.balance || '0'}</ThemedText>
              </View>
              <View style={styles.infoRow}>
                <IconSymbol name="lock.fill" size={18} color={colorScheme === 'dark' ? '#fff' : Colors[colorScheme ?? 'light'].tint} style={styles.infoIcon} />
                <ThemedText style={[styles.infoLabel, {color: colorScheme === 'dark' ? '#fff' : '#333'}]}>Số dư không thể chuyển</ThemedText>
                <ThemedText style={[styles.infoValue, {color: colorScheme === 'dark' ? '#fff' : '#333'}]}>{userInfo?.nonTransferableBalance || '0'}</ThemedText>
              </View>
              <View style={styles.infoRow}>
                <IconSymbol name="bolt.fill" size={18} color={colorScheme === 'dark' ? '#fff' : Colors[colorScheme ?? 'light'].tint} style={styles.infoIcon} />
                <ThemedText style={[styles.infoLabel, {color: colorScheme === 'dark' ? '#fff' : '#333'}]}>Tốc độ đào</ThemedText>
                <ThemedText style={[styles.infoValue, {color: colorScheme === 'dark' ? '#fff' : '#333'}]}>{userInfo?.miningRate || '0'}/phút</ThemedText>
              </View>
              <View style={styles.infoRow}>
                <IconSymbol name="person.crop.circle.badge.plus" size={18} color={colorScheme === 'dark' ? '#fff' : Colors[colorScheme ?? 'light'].tint} style={styles.infoIcon} />
                <ThemedText style={[styles.infoLabel, {color: colorScheme === 'dark' ? '#fff' : '#333'}]}>Mã giới thiệu</ThemedText>
                <ThemedText style={[styles.infoValue, {color: colorScheme === 'dark' ? '#fff' : '#333'}]}>{userInfo?.referralCode || 'Chưa có'}</ThemedText>
              </View>
              <View style={styles.infoRow}>
                <IconSymbol name="person.2.fill" size={18} color={colorScheme === 'dark' ? '#fff' : Colors[colorScheme ?? 'light'].tint} style={styles.infoIcon} />
                <ThemedText style={[styles.infoLabel, {color: colorScheme === 'dark' ? '#fff' : '#333'}]}>Được giới thiệu bởi</ThemedText>
                <ThemedText style={[styles.infoValue, {color: colorScheme === 'dark' ? '#fff' : '#333'}]}>{referralStats?.whoReferredMe?.[0]?.username || 'Không có'}</ThemedText>
              </View>
              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}> 
                <IconSymbol name="checkmark.shield.fill" size={18} color={getKycStatusColor(userInfo?.kycStatus)} style={styles.infoIcon} />
                <ThemedText style={[styles.infoLabel, {color: colorScheme === 'dark' ? '#fff' : '#333'}]}>Trạng thái xác thực</ThemedText>
                <ThemedText style={[styles.infoValue, { color: getKycStatusColor(userInfo?.kycStatus) }]}>{getKycStatusText(userInfo?.kycStatus)}</ThemedText>
              </View>
            </View>
          </ThemedView>

          {/* Card hành động/cài đặt */}
          <ThemedView style={[styles.actionCard,{backgroundColor: colorScheme === 'dark' ? '#4C0099' : '#fff',}]}>
            <ThemedText type="title" style={[styles.sectionTitle, {color: colorScheme === 'dark' ? '#fff' : '#333'}]}>Cài đặt & Hành động</ThemedText>
            <View style={styles.actionGrid}>
              <TouchableOpacity style={[styles.actionItem, {backgroundColor: colorScheme === 'dark' ? '#600EBD' : '#F7F7F7'}]} onPress={() => router.push('/(tabs)/profile/change-password')}>
                <IconSymbol name="lock.rectangle.stack.fill" size={22} color={Colors[colorScheme ?? 'light'].tint} style={styles.actionIcon} />
                <ThemedText style={[styles.actionLabel, {color: colorScheme === 'dark' ? '#fff' : '#333'}]}>Đổi mật khẩu</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionItem, {backgroundColor: colorScheme === 'dark' ? '#600EBD' : '#F7F7F7'}]} onPress={() => router.push('/(tabs)/profile/username')}>
                <IconSymbol name="person.crop.circle.fill" size={22} color={Colors[colorScheme ?? 'light'].tint} style={styles.actionIcon} />
                <ThemedText style={[styles.actionLabel, {color: colorScheme === 'dark' ? '#fff' : '#333'}]}>Đổi tên đăng nhập</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionItem, {backgroundColor: colorScheme === 'dark' ? '#600EBD' : '#F7F7F7'}]} onPress={() => router.push('/(tabs)/profile/profile')}>
                <IconSymbol name="person.text.rectangle.fill" size={22} color={Colors[colorScheme ?? 'light'].tint} style={styles.actionIcon} />
                <ThemedText style={[styles.actionLabel, {color: colorScheme === 'dark' ? '#fff' : '#333'}]}>Cập nhật thông tin</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionItem, {backgroundColor: colorScheme === 'dark' ? '#600EBD' : '#F7F7F7'}]} onPress={() => router.push('/profile/kyc')}>
                <IconSymbol name="person.badge.shield.checkmark.fill" size={22} color={Colors[colorScheme ?? 'light'].tint} style={styles.actionIcon} />
                <ThemedText style={[styles.actionLabel, {color: colorScheme === 'dark' ? '#fff' : '#333'}]}>Xác thực KYC</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionItem, {backgroundColor: colorScheme === 'dark' ? '#600EBD' : '#F7F7F7'}]} onPress={() => router.push('/profile/referral')}>
                <IconSymbol name="gift.fill" size={22} color={Colors[colorScheme ?? 'light'].tint} style={styles.actionIcon} />
                <ThemedText style={[styles.actionLabel, {color: colorScheme === 'dark' ? '#fff' : '#333'}]}>Nhập mã giới thiệu</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionItem, {backgroundColor: colorScheme === 'dark' ? '#600EBD' : '#F7F7F7'}]} onPress={() => router.push('/profile/scan-history')}>
                <IconSymbol name="doc.text.fill" size={22} color={Colors[colorScheme ?? 'light'].tint} style={styles.actionIcon} />
                <ThemedText style={[styles.actionLabel, {color: colorScheme === 'dark' ? '#fff' : '#333'}]}>Lịch sử quét mã</ThemedText>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={loading}>
              <ThemedText style={styles.logoutButtonText}>Đăng xuất</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  profileContent: {
    flex: 1,
    padding: 20,
    paddingBottom: 96,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarWrapper: {
    marginBottom: 12,
  },
  profileUsername: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    color: '#333',
  },
  profileAccountType: {
    fontSize: 14,
    color: '#888',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  infoList: {
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 4,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    color: '#333',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    color: '#333',
  },
  actionCard: {
    backgroundColor: '#000',
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  actionGrid: {
    flexDirection: 'column',
    marginBottom: 16,
    gap: 0,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#600EBD',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  actionIcon: {
    marginRight: 12,
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#222',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '600',
  },
}); 