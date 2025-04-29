import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Alert, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Stack, router } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function ChangePasswordScreen() {
  const colorScheme = useColorScheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu mới không khớp');
      return;
    }

    try {
      setChangePasswordLoading(true);
      const response = await userService.changePassword(currentPassword, newPassword);
      if (response && response.id) {
        Alert.alert('Thành công', 'Đổi mật khẩu thành công', [
          { text: 'OK', onPress: () => router.back() }
        ]);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        Alert.alert('Lỗi', 'Đổi mật khẩu thất bại');
      }
    } catch (error: any) {
      console.error('Change password error:', error);
      Alert.alert('Lỗi', error.response?.data?.message || 'Đổi mật khẩu thất bại');
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const inputBackgroundColor = Colors[colorScheme === 'dark' ? 'dark' : 'light'].inputBackground;
  const inputTextColor = Colors[colorScheme === 'dark' ? 'dark' : 'light'].text;
  const inputPlaceholderColor = Colors[colorScheme === 'dark' ? 'dark' : 'light'].icon;

  return (
    <SafeAreaView style={styles.container}>
      <LoadingOverlay visible={changePasswordLoading} />
      <Stack.Screen options={{ title: 'Đổi mật khẩu' }} />
      <KeyboardAvoidingView 
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ThemedView style={styles.content}>
          <ThemedView style={styles.changePasswordForm}>
            <ThemedText style={styles.label}>Mật khẩu hiện tại</ThemedText>
            <TextInput
              style={[styles.input, {
                backgroundColor: inputBackgroundColor,
                borderColor: colorScheme === 'dark' ? '#666' : '#E5E7EB',
                color: inputTextColor
              }]}
              placeholder="Nhập mật khẩu hiện tại"
              placeholderTextColor={inputPlaceholderColor}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              editable={!changePasswordLoading}
            />
            <ThemedText style={styles.label}>Mật khẩu mới</ThemedText>
            <TextInput
              style={[styles.input, {
                backgroundColor: inputBackgroundColor,
                borderColor: colorScheme === 'dark' ? '#666' : '#E5E7EB',
                color: inputTextColor
              }]}
              placeholder="Nhập mật khẩu mới"
              placeholderTextColor={inputPlaceholderColor}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              editable={!changePasswordLoading}
            />
            <ThemedText style={styles.label}>Xác nhận mật khẩu mới</ThemedText>
            <TextInput
              style={[styles.input, {
                backgroundColor: inputBackgroundColor,
                borderColor: colorScheme === 'dark' ? '#666' : '#E5E7EB',
                color: inputTextColor
              }]}
              placeholder="Nhập lại mật khẩu mới"
              placeholderTextColor={inputPlaceholderColor}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!changePasswordLoading}
            />
            <TouchableOpacity 
              style={[styles.submitButton, changePasswordLoading && styles.submitButtonDisabled]}
              onPress={handleChangePassword}
              disabled={changePasswordLoading || !currentPassword || !newPassword || !confirmPassword}
            >
              <ThemedText style={styles.submitButtonText}>
                Xác nhận
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  changePasswordForm: {
    borderRadius: 8,
    padding: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#F5F3FF',
  },
  submitButton: {
    backgroundColor: Colors.light.tint,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#EDE9FE',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 