import { StyleSheet, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import Svg, { Circle, Path } from 'react-native-svg';
import { useState } from 'react';
import { router } from 'expo-router';
import { authService } from '@/services/auth.service';
import { useColorScheme } from '@/hooks/useColorScheme';

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

  const handleRegister = async () => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu không khớp');
      return;
    }

    try {
      setLoading(true);
      await authService.register(username, email, password);
      Alert.alert('Thành công', 'Đăng ký thành công! Vui lòng đăng nhập');
      router.replace('/login');
    } catch (error: any) {
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
  const disabledButtonBackgroundColor = colorScheme === 'dark' ? '#252728' : '#EDE9FE';

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ThemedView style={styles.content}>
        <View style={styles.logoContainer}>
          <Logo color={tintColor}/>
          <ThemedText type="title" style={[styles.title, { color: tintColor }]}>Cobic</ThemedText>
          <ThemedText style={[styles.subtitle, { color: iconColor }]}>Hệ Thống Quản Lý Chuỗi Cà Phê</ThemedText>
        </View>

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

          <View style={styles.inputContainer}>
            <ThemedText style={[styles.label, { color: iconColor }]}>Xác nhận mật khẩu</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: inputBackgroundColor, color: textColor, borderColor: iconColor + '40' }]}
              placeholder="Nhập lại mật khẩu"
              placeholderTextColor={iconColor}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!loading}
            />
          </View>

          <TouchableOpacity 
            style={[styles.registerButton, { backgroundColor: tintColor }, (!username || !email || !password || !confirmPassword || loading) && [styles.registerButtonDisabled, {backgroundColor: disabledButtonBackgroundColor }]]}
            onPress={handleRegister}
            disabled={!username || !email || !password || !confirmPassword || loading}
          >
            <ThemedText style={styles.registerButtonText}>
              {loading ? 'Đang đăng ký...' : 'Đăng Ký'}
            </ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <ThemedText style={[styles.footerText, { color: iconColor }]}>Đã có tài khoản? </ThemedText>
          <TouchableOpacity onPress={() => router.replace('/login')}>
            <ThemedText style={[styles.footerLink, { color: tintColor }]}>Đăng nhập ngay</ThemedText>
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
  registerButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: '6%',
    width: '100%',
  },
  registerButtonDisabled: {
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
}); 