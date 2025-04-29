import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, View, Text, Alert, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Định nghĩa type cho dữ liệu từ API
type ReferredUser = {
  username: string;
  joinedAt: string;
};

type WhoReferredMe = {
  username: string;
  referralCode: string;
};

type ReferralStats = {
  currentReferrals: number;
  maxReferrals: number;
  remainingReferrals: number;
  referredByMe: ReferredUser[];
  whoReferredMe: WhoReferredMe[];
};

export default function ReferralScreen() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets(); // Lấy safe area insets
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingStats, setFetchingStats] = useState(true);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  
  // Kiểm tra xem người dùng đã được giới thiệu chưa
  const alreadyReferred = user?.referredBy !== null && user?.referredBy !== undefined;
  
  // Lấy thông tin về giới thiệu khi component được mount
  useEffect(() => {
    fetchReferralStats();
  }, []);
  
  const fetchReferralStats = async () => {
    try {
      setFetchingStats(true);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        console.log('ReferralScreen: Không có token, bỏ qua fetchReferralStats');
        return;
      }
      
      console.log('ReferralScreen: Đang gọi userService.getReferralStats()');
      const stats = await userService.getReferralStats();
      console.log('ReferralScreen: Dữ liệu nhận được từ getReferralStats:', JSON.stringify(stats, null, 2)); // Log chi tiết dữ liệu
      
      if (stats === null) {
        console.log('ReferralScreen: Lỗi xác thực (stats là null), bỏ qua cập nhật thống kê');
        return;
      }
      
      // Log cụ thể giá trị của whoReferredMe
      console.log('ReferralScreen: Giá trị whoReferredMe nhận được:', JSON.stringify(stats?.whoReferredMe, null, 2));
      
      setReferralStats(stats);
      console.log('ReferralScreen: Đã cập nhật state referralStats');
      
    } catch (error: any) {
      console.error('ReferralScreen: Lỗi trong fetchReferralStats:', error);
      if (error.response?.status === 401) {
        console.log('ReferralScreen: Token hết hạn khi fetchReferralStats');
        // Không cần xử lý thêm vì interceptor đã xử lý
      }
    } finally {
      setFetchingStats(false);
    }
  };
  
  const handleSubmit = async () => {
    if (!referralCode.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã giới thiệu');
      return;
    }
    
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Alert.alert('Lỗi', 'Bạn chưa đăng nhập, vui lòng đăng nhập lại');
        router.replace('/login');
        return;
      }
      
      console.log('ReferralScreen: Đang gửi mã giới thiệu:', referralCode.trim());
      
      // Sử dụng userService để gửi mã giới thiệu
      const submitResponseData = await userService.submitReferral(referralCode.trim());
      
      if (submitResponseData === null) {
        setLoading(false);
        return;
      }
      
      console.log('ReferralScreen: Submit thành công, gọi fetchReferralStats()');
      await fetchReferralStats(); // Gọi để cập nhật stats
      
      // Sau đó, cập nhật thông tin User đầy đủ từ /getMe
      try {
        const latestUserData = await authService.getMe();
        if (latestUserData) {
          setUser(latestUserData);
        }
      } catch (fetchUserError) {
        console.error('ReferralScreen: Lỗi khi lấy thông tin user sau khi nhập mã giới thiệu:', fetchUserError);
      }
      
      Alert.alert(
        'Thành công', 
        'Bạn đã nhập mã giới thiệu thành công!',
        [{ text: 'OK', onPress: () => {} }]
      );
      
    } catch (error: any) {
      console.error('ReferralScreen: Lỗi trong handleSubmit:', error);
      
      if (error.response) {
        console.log('ReferralScreen: Lỗi response:', error.response.status, error.response.data);
        switch (error.response.status) {
          case 400:
            // Sửa lại để kiểm tra cả error.response.data.error
            const errorMessage = error.response.data?.message || error.response.data?.error || 'Yêu cầu không hợp lệ (đã được giới thiệu, không thể tự giới thiệu mình, đã đạt giới hạn giới thiệu)';
            Alert.alert('Lỗi', errorMessage);
            // Nếu lỗi là đã được giới thiệu, cập nhật lại stats
            if (errorMessage.includes('Already referred')) {
              fetchReferralStats();
            }
            break;
          case 401:
            // Xử lý lỗi xác thực ở đây, không cần alert vì đã được xử lý ở handleUnauthorized
            console.log('ReferralScreen: Lỗi xác thực, chuyển hướng tới trang đăng nhập');
            AsyncStorage.removeItem('token');
            router.replace('/login');
            break;
          case 404:
            Alert.alert('Lỗi', 'Mã giới thiệu không hợp lệ');
            break;
          default:
            Alert.alert('Lỗi', `ReferralScreen: Lỗi máy chủ: ${error.response.status}`);
        }
      } else if (error.request) {
        console.log('ReferralScreen: Lỗi request:', error.request);
        Alert.alert(
          'ReferralScreen: Lỗi kết nối', 
          'Không nhận được phản hồi từ máy chủ. Vui lòng kiểm tra kết nối mạng của bạn.',
          [
            { text: 'Thử lại', onPress: () => handleSubmit() },
            { text: 'Hủy' }
          ]
        );
      } else if (error.message && error.message.includes('Network Error')) {
        Alert.alert(
          'ReferralScreen: Lỗi kết nối mạng', 
          'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối của bạn và thử lại.'
        );
      } else {
        Alert.alert('ReferralScreen: Lỗi', `ReferralScreen: Có lỗi xảy ra: ${error.message || 'ReferralScreen: Lỗi không xác định'}`);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const renderReferralStatusCard = () => {
    if (fetchingStats) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors[colorScheme ?? 'light'].tint} />
          <Text style={[styles.loadingText, { color: Colors[colorScheme ?? 'light'].text }]}>
            Đang tải thông tin giới thiệu...
          </Text>
        </View>
      );
    }
    
    if (!referralStats) return null;
    
    // Lấy thông tin người giới thiệu từ mảng (nếu có)
    const referrer = referralStats.whoReferredMe && referralStats.whoReferredMe.length > 0 
                     ? referralStats.whoReferredMe[0] 
                     : null;
    
    return (
      <View style={[styles.statsContainer, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        {/* Hiển thị người đã giới thiệu mình (kiểm tra referrer) */}
        {referrer && (
          <View style={styles.statsSection}>
            <Text style={[styles.statsSectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              Bạn được giới thiệu bởi
            </Text>
            <View style={styles.referredByInfo}>
              <Text style={[styles.referredByName, { color: Colors[colorScheme ?? 'light'].text }]}>
                {referrer.username}
              </Text>
              <Text style={[styles.referredByCode, { color: Colors[colorScheme ?? 'light'].tint }]}>
                Mã: {referrer.referralCode}
              </Text>
            </View>
          </View>
        )}
        
        {/* Thống kê số lượng giới thiệu */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors[colorScheme ?? 'light'].tint }]}>
              {referralStats.currentReferrals}
            </Text>
            <Text style={[styles.statLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
              Đã giới thiệu
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors[colorScheme ?? 'light'].tint }]}>
              {referralStats.maxReferrals}
            </Text>
            <Text style={[styles.statLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
              Tối đa
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors[colorScheme ?? 'light'].tint }]}>
              {referralStats.remainingReferrals}
            </Text>
            <Text style={[styles.statLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
              Còn lại
            </Text>
          </View>
        </View>
        
        {/* Danh sách người đã giới thiệu */}
        {referralStats.referredByMe.length > 0 && (
          <View style={styles.statsSection}>
            <Text style={[styles.statsSectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              Người dùng bạn đã giới thiệu
            </Text>
            {referralStats.referredByMe.map((user, index) => (
              <View key={index} style={styles.referredUserItem}>
                <Text style={[styles.referredUsername, { color: Colors[colorScheme ?? 'light'].text }]}>
                  {user.username}
                </Text>
                <Text style={[styles.referredJoinedDate, { color: Colors[colorScheme ?? 'light'].text + '80' }]}>
                  Tham gia: {formatDate(user.joinedAt)}
                </Text>
              </View>
            ))}
          </View>
        )}
        
        {/* Hiển thị mã giới thiệu của người dùng */}
        {user?.referralCode && (
          <View style={styles.referralCodeContainer}>
            <Text style={[styles.statsSectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              Mã giới thiệu của bạn
            </Text>
            <View style={styles.referralCodeBox}>
              <Text style={[styles.referralCodeText, { color: Colors[colorScheme ?? 'light'].tint }]}>
                {user.referralCode}
              </Text>
            </View>
            <Text style={[styles.referralCodeHint, { color: Colors[colorScheme ?? 'light'].text + '80' }]}>
              Chia sẻ mã này với bạn bè để nhận ưu đãi
            </Text>
          </View>
        )}
      </View>
    );
  };
  
  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      {/* Header đã được xóa bỏ */}
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Hiển thị thống kê giới thiệu */} 
          {renderReferralStatusCard()}
          
          {/* Form nhập mã giới thiệu (kiểm tra mảng whoReferredMe rỗng) */} 
          {!fetchingStats && (!referralStats || referralStats.whoReferredMe.length === 0) && (
            <View style={styles.inputSection}>
              <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}> 
                Mã giới thiệu
              </Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    color: Colors[colorScheme ?? 'light'].text,
                    borderColor: Colors[colorScheme ?? 'light'].tint,
                    backgroundColor: Colors[colorScheme ?? 'light'].background,
                  }
                ]}
                value={referralCode}
                onChangeText={setReferralCode}
                placeholder="Nhập mã giới thiệu từ bạn bè"
                placeholderTextColor="#999"
                autoCapitalize="none"
                autoCorrect={false}
              />
              
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: Colors[colorScheme ?? 'light'].tint }
                ]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Xác nhận</Text>
                )}
              </TouchableOpacity>
              
              <Text style={[styles.description, { color: Colors[colorScheme ?? 'light'].text, marginTop: 24 }]}> 
                Nhập mã giới thiệu từ bạn bè để nhận được những ưu đãi hấp dẫn
              </Text>
            </View>
          )}
          
          {/* Hiển thị thông báo khi đã được giới thiệu */} 
          {!fetchingStats && referralStats && referralStats.whoReferredMe.length > 0 && (
            <Text style={[styles.message, { color: Colors[colorScheme ?? 'light'].text }]}>
              Bạn đã được giới thiệu bởi người dùng khác.
            </Text>
          )}
          
          {/* Spacer để tránh bị che bởi tab bar - Tăng thêm khoảng trống */}
          <View style={{ height: insets.bottom + 40 }} /> 
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  label: { // Thêm style cho label
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  description: {
    fontSize: 14, // Giảm kích thước chữ
    textAlign: 'center',
    marginBottom: 0, // Bỏ margin bottom
    opacity: 0.7,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  inputSection: {
    marginTop: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 20,
    // Sử dụng màu border từ Colors
    // backgroundColor được set theo theme
  },
  submitButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    // backgroundColor được set theo theme
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },
  statsContainer: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
    // backgroundColor được set theo theme
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsSection: {
    marginBottom: 16,
  },
  statsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ddd',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  referredByInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 12,
    borderRadius: 8,
  },
  referredByName: {
    fontWeight: '600',
    fontSize: 15,
  },
  referredByCode: {
    fontSize: 13,
  },
  referredUserItem: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  referredUsername: {
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 4,
  },
  referredJoinedDate: {
    fontSize: 13,
  },
  referralCodeContainer: {
    marginTop: 16,
  },
  referralCodeBox: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  referralCodeText: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  referralCodeHint: {
    textAlign: 'center',
    fontSize: 13,
  },
}); 