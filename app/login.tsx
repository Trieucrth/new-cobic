import { StyleSheet, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import Svg, { Circle, Path } from 'react-native-svg';
import { useState, useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { useColorScheme } from '@/hooks/useColorScheme';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import { IconSymbol } from '@/components/ui/IconSymbol';

const Logo = ({ color }: { color: string }) => (
  <Svg width={80} height={80} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="1"/>
    <Path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z"/>
    <Path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z"/>
  </Svg>
);

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const { isAuthenticated, login } = useAuth();
  const [guestInfo, setGuestInfo] = useState<null | { 
    username: string; 
    password: string;
    token: string;
    user: any;
  }>(null);
  const infoRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const saveScreenshot = async () => {
      if (guestInfo && infoRef.current) {
        try {
          const { status } = await MediaLibrary.requestPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Lỗi', 'Không có quyền truy cập thư viện ảnh');
            return;
          }
          const uri = await captureRef(infoRef, { format: 'png', quality: 1 });
          await MediaLibrary.saveToLibraryAsync(uri);
          // Không hiển thị thông báo lưu ảnh thành công
        } catch (e) {
          console.error('Error saving screenshot:', e);
          // Không hiển thị thông báo lỗi
        }
      }
    };
    saveScreenshot();
  }, [guestInfo]);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    try {
      setLoading(true);
      const response = await authService.login(username, password);
      console.log('Login response:', response);
      
      await login(response.token, response.user);
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Lỗi', error.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestRegister = async () => {
    setLoading(true);
    try {
      const response = await authService.guestRegister();
      
      // Lưu toàn bộ thông tin cần thiết
      setGuestInfo({ 
        username: response.user.username, 
        password: response.user.plainPassword,
        token: response.token,
        user: response.user
      });
      
      // Tự động sao chép mật khẩu vào clipboard
      await Clipboard.setStringAsync(response.user.plainPassword);
      
    } catch (error: any) {
      console.error('Guest register error (login page):', error);
      Alert.alert('Lỗi', error.response?.data?.message || 'Đăng ký nhanh thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý khi người dùng xác nhận đã lưu thông tin
  const handleSaveInfoConfirm = async () => {
    if (!guestInfo) return;
    
    try {
      setLoading(true);
      // Đăng nhập và chuyển hướng
      await login(guestInfo.token, {
        ...guestInfo.user,
        plainPassword: guestInfo.password
      });
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error during login after save info:', error);
      Alert.alert('Lỗi', 'Không thể đăng nhập. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Lỗi', 'Vui lòng nhập email');
      return;
    }

    try {
      setLoading(true);
      await authService.forgotPassword(email);
      Alert.alert(
        'Thành công',
        'Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.',
        [{ text: 'OK', onPress: () => setShowForgotPassword(false) }]
      );
    } catch (error: any) {
      console.error('Forgot password error:', error);
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể gửi email đặt lại mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return null;
  }

  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const iconColor = Colors[colorScheme ?? 'light'].icon;
  const textColor = Colors[colorScheme ?? 'light'].text;
  const inputBackgroundColor = Colors[colorScheme ?? 'light'].inputBackground;
  const backgroundColor = Colors[colorScheme ?? 'light'].background;
  const disabledButtonBackgroundColor = colorScheme === 'dark' ? '#252728' : '#EDE9FE';

  if (guestInfo) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colorScheme === 'dark' ? '#4C0099' : '#fff', padding: 24 }}>
        <View ref={infoRef} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 }}>
          <ThemedText type="title" style={{ fontSize: 22, marginBottom: 12, color: Colors.light.tint }}>Lưu lại thông tin tài khoản</ThemedText>
          
          <View style={{ width: '100%', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <ThemedText style={{ fontSize: 16, fontWeight: 'bold', color:'#000' }}>Tên đăng nhập:</ThemedText>
              <TouchableOpacity 
                onPress={async () => {
                  await Clipboard.setStringAsync(guestInfo.username);
                  Alert.alert('Thành công', 'Đã sao chép tên đăng nhập');
                }}
                style={{ padding: 8 }}
              >
                <IconSymbol name="doc.on.doc" size={20} color={Colors.light.tint} />
              </TouchableOpacity>
            </View>
            <ThemedText style={{ fontSize: 18, fontWeight: 'bold', color: colorScheme === 'dark' ? '#B5A0A0' : '#B5A0A0' }}>{guestInfo.username}</ThemedText>
          </View>

          <View style={{ width: '100%', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <ThemedText style={{ fontSize: 16, fontWeight: 'bold', color:'#000' }}>Mật khẩu:</ThemedText>
              <TouchableOpacity 
                onPress={async () => {
                  await Clipboard.setStringAsync(guestInfo.password);
                  Alert.alert('Thành công', 'Đã sao chép mật khẩu');
                }}
                style={{ padding: 8 }}
              >
                <IconSymbol name="doc.on.doc" size={20} color={Colors.light.tint} />
              </TouchableOpacity>
            </View>
            <ThemedText style={{ fontSize: 18, fontWeight: 'bold', color: colorScheme === 'dark' ? '#B5A0A0' : '#B5A0A0' }}>{guestInfo.password}</ThemedText>
          </View>

          <ThemedText style={{ fontSize: 14, color: '#EF4444', marginBottom: 16, textAlign: 'center' }}>
            Ảnh chụp màn hình thông tin này đã được lưu vào thư viện ảnh của bạn. Hãy giữ kỹ để không bị mất tài khoản!
          </ThemedText>
        </View>
        <TouchableOpacity 
          style={{ marginTop: 32, backgroundColor: Colors.light.tint, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 }} 
          onPress={handleSaveInfoConfirm}
          disabled={loading}
        >
          <ThemedText style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
            {loading ? 'Đang xử lý...' : 'Tôi đã lưu, tiếp tục'}
          </ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ThemedView style={styles.content}>
        <View style={styles.logoContainer}>
          <Logo color={tintColor} />
          <ThemedText type="title" style={[styles.title, { color: tintColor }]}>Cobic</ThemedText>
          <ThemedText style={[styles.subtitle, { color: iconColor }]}>Hệ Thống Quản Lý Chuỗi Cà Phê</ThemedText>
        </View>

        {showForgotPassword ? (
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <ThemedText style={[styles.label, { color: iconColor }]}>Email</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: inputBackgroundColor, color: textColor, borderColor: iconColor + '40' }]}
                placeholder="Nhập email của bạn"
                placeholderTextColor={iconColor}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.loginButton, { backgroundColor: tintColor }, (!email || loading) && [styles.loginButtonDisabled, { backgroundColor: disabledButtonBackgroundColor }]]}
                onPress={handleForgotPassword}
                disabled={!email || loading}
              >
                <ThemedText style={styles.loginButtonText}>
                  {loading ? 'Đang gửi...' : 'Gửi email đặt lại mật khẩu'}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.backButton, { borderColor: iconColor }]}
                onPress={() => setShowForgotPassword(false)}
                disabled={loading}
              >
                <ThemedText style={[styles.backButtonText, { color: iconColor }]}>Quay lại đăng nhập</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <ThemedText style={[styles.label, { color: iconColor }]}>Tên đăng nhập</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: inputBackgroundColor, color: textColor, borderColor: iconColor + '40' }]}
                placeholder="Nhập tên đăng nhập"
                placeholderTextColor={iconColor}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={[styles.label, { color: iconColor }]}>Mật khẩu</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: inputBackgroundColor, color: textColor, borderColor: iconColor + '40' }]}
                placeholder="Nhập mật khẩu"
                placeholderTextColor={iconColor}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>

            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={() => setShowForgotPassword(true)}
              disabled={loading}
            >
              <ThemedText style={[styles.forgotPasswordText, { color: tintColor }]}>Quên mật khẩu?</ThemedText>
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <TouchableOpacity 
                style={[styles.loginButton, { backgroundColor: tintColor }, (!username || !password || loading) && [styles.loginButtonDisabled, { backgroundColor: disabledButtonBackgroundColor }]]}
                onPress={handleLogin}
                disabled={!username || !password || loading}
              >
                <ThemedText style={styles.loginButtonText}>
                  {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
                </ThemedText>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: iconColor }]} />
                <ThemedText style={[styles.dividerText, { color: iconColor }]}>hoặc</ThemedText>
                <View style={[styles.dividerLine, { backgroundColor: iconColor }]} />
              </View>

              <TouchableOpacity 
                style={[
                  styles.guestButton, 
                  { backgroundColor: tintColor }, 
                  loading && [styles.guestButtonDisabled, { backgroundColor: disabledButtonBackgroundColor }]
                ]}
                onPress={handleGuestRegister}
                disabled={loading}
              >
                <ThemedText style={styles.guestButtonText}>
                  {loading ? 'Đang xử lý...' : 'Đăng ký nhanh'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <ThemedText style={[styles.footerText, { color: iconColor }]}>Chưa có tài khoản? </ThemedText>
          <TouchableOpacity onPress={() => router.replace('/register')}>
            <ThemedText style={[styles.footerLink, { color: tintColor }]}>Đăng ký ngay</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 36,
    marginTop: 16,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  loginContainer: {
    marginVertical: 16,
  },
  loginButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  loginButtonDisabled: {
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    opacity: 0.4,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
  },
  guestButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  guestButtonDisabled: {
  },
  guestButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    marginVertical: 16,
  },
  backButton: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 