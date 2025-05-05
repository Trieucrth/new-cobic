import { StyleSheet, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import Svg, { Circle, Path } from 'react-native-svg';
import { useState, useCallback } from 'react';
import { router } from 'expo-router';
import { authService } from '@/services/auth.service';
import { useColorScheme } from '@/hooks/useColorScheme';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';

const Logo = ({ color }: { color: string }) => (
  <Svg width={80} height={80} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="1"/>
    <Path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z"/>
    <Path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z"/>
  </Svg>
);

export default function RegisterScreen() {
  const colorScheme = useColorScheme();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validateForm = useCallback(() => {
    const newErrors: typeof errors = {};
    
    if (!username.trim()) {
      newErrors.username = 'Vui lòng nhập tên đăng nhập';
    }
    
    if (!email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!email.includes('@')) {
      newErrors.email = 'Email không hợp lệ';
    }
    
    if (!password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu không khớp';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [username, email, password, confirmPassword]);

  const handleRegister = async () => {
    if (!validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      setLoading(true);
      await authService.register(username, email, password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Thành công', 'Đăng ký thành công! Vui lòng đăng nhập');
      router.replace('/login');
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Lỗi', error.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const iconColor = Colors[colorScheme ?? 'light'].icon;
  const textColor = Colors[colorScheme ?? 'light'].text;
  const inputBackgroundColor = Colors[colorScheme ?? 'light'].inputBackground;
  const backgroundColor = Colors[colorScheme ?? 'light'].background;

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ThemedView style={styles.content}>
        <Animated.View 
          entering={FadeIn.duration(500)} 
          style={styles.logoContainer}
        >
          <Logo color={tintColor}/>
          <ThemedText type="title" style={[styles.title, { color: tintColor }]}>Cobic</ThemedText>
          <ThemedText style={[styles.subtitle, { color: iconColor }]}>Hệ Thống Quản Lý Chuỗi Cà Phê</ThemedText>
        </Animated.View>

        <Animated.View 
          entering={FadeIn.delay(300).duration(500)} 
          style={styles.formContainer}
        >
          <View style={styles.inputContainer}>
            <ThemedText style={[styles.label, { color: iconColor }]}>Tên đăng nhập</ThemedText>
            <TextInput
              style={[
                styles.input, 
                { backgroundColor: inputBackgroundColor, color: textColor, borderColor: iconColor + '40' },
                errors.username && styles.inputError
              ]}
              placeholder="Nhập tên đăng nhập"
              placeholderTextColor={iconColor}
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                setErrors(prev => ({ ...prev, username: undefined }));
              }}
              autoCapitalize="none"
              editable={!loading}
            />
            {errors.username && (
              <ThemedText style={styles.errorText}>{errors.username}</ThemedText>
            )}
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={[styles.label, { color: iconColor }]}>Email</ThemedText>
            <TextInput
              style={[
                styles.input, 
                { backgroundColor: inputBackgroundColor, color: textColor, borderColor: iconColor + '40' },
                errors.email && styles.inputError
              ]}
              placeholder="Nhập email của bạn"
              placeholderTextColor={iconColor}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrors(prev => ({ ...prev, email: undefined }));
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
            {errors.email && (
              <ThemedText style={styles.errorText}>{errors.email}</ThemedText>
            )}
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={[styles.label, { color: iconColor }]}>Mật khẩu</ThemedText>
            <TextInput
              style={[
                styles.input, 
                { backgroundColor: inputBackgroundColor, color: textColor, borderColor: iconColor + '40' },
                errors.password && styles.inputError
              ]}
              placeholder="Nhập mật khẩu"
              placeholderTextColor={iconColor}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrors(prev => ({ ...prev, password: undefined }));
              }}
              secureTextEntry
              editable={!loading}
              autoComplete="off"
              textContentType="none"
              autoCapitalize="none"
            />
            {errors.password && (
              <ThemedText style={styles.errorText}>{errors.password}</ThemedText>
            )}
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={[styles.label, { color: iconColor }]}>Xác nhận mật khẩu</ThemedText>
            <TextInput
              style={[
                styles.input, 
                { backgroundColor: inputBackgroundColor, color: textColor, borderColor: iconColor + '40' },
                errors.confirmPassword && styles.inputError
              ]}
              placeholder="Nhập lại mật khẩu"
              placeholderTextColor={iconColor}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setErrors(prev => ({ ...prev, confirmPassword: undefined }));
              }}
              secureTextEntry
              editable={!loading}
              autoComplete="off"
              textContentType="none"
              autoCapitalize="none"
            />
            {errors.confirmPassword && (
              <ThemedText style={styles.errorText}>{errors.confirmPassword}</ThemedText>
            )}
          </View>

          <TouchableOpacity 
            style={[
              styles.registerButton, 
              { backgroundColor: tintColor },
              (!username || !email || !password || !confirmPassword || loading) && styles.registerButtonDisabled
            ]}
            onPress={handleRegister}
            disabled={!username || !email || !password || !confirmPassword || loading}
          >
            <ThemedText style={styles.registerButtonText}>
              {loading ? 'Đang đăng ký...' : 'Đăng Ký'}
            </ThemedText>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View 
          entering={FadeIn.delay(600).duration(500)} 
          style={styles.footer}
        >
          <ThemedText style={[styles.footerText, { color: iconColor }]}>Đã có tài khoản? </ThemedText>
          <TouchableOpacity onPress={() => router.replace('/login')}>
            <ThemedText style={[styles.footerLink, { color: tintColor }]}>Đăng nhập ngay</ThemedText>
          </TouchableOpacity>
        </Animated.View>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={tintColor} />
          </View>
        )}
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
    marginBottom: '8%',
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
    marginBottom: '4%',
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
    width: '100%',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  registerButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: '6%',
    width: '100%',
  },
  registerButtonDisabled: {
    opacity: 0.5,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: '8%',
    flexWrap: 'wrap',
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
}); 