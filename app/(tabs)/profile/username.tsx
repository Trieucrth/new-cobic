import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { userService } from '@/services/user.service';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

export default function ChangeUsernameScreen() {
  const [newUsername, setNewUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
  const { user, setUser } = useAuth();
  const router = useRouter();

  const handleChangeUsername = async () => {
    if (!newUsername.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên đăng nhập mới');
      return;
    }

    if (newUsername.trim() === user?.username) {
      Alert.alert('Lỗi', 'Tên đăng nhập mới phải khác tên đăng nhập hiện tại');
      return;
    }

    try {
      setLoading(true);
      await userService.updateUsername(newUsername.trim());
      
      // Cập nhật user trong context
      if (user) {
        setUser({
          ...user,
          username: newUsername.trim()
        });
      }

      // Hiển thị thông báo thành công và chuyển về trang index.tsx khi nhấn OK
      Alert.alert(
        'Thành công', 
        'Đã cập nhật tên đăng nhập thành công',
        [
          {
            text: 'OK',
            onPress: () => {
              router.navigate('/(tabs)/profile');
            }
          }
        ]
      );
      
      setNewUsername('');
    } catch (error: any) {
      console.error('Error changing username:', error);
      Alert.alert('Lỗi', error.response?.data?.message || 'Cập nhật tên đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.formContainer}>
        <ThemedText style={styles.title}>Đổi tên đăng nhập</ThemedText>
        <ThemedText style={styles.subtitle}>
          Tên đăng nhập hiện tại: {user?.username}
        </ThemedText>

        <TextInput
          style={[styles.input, {
            backgroundColor: Colors[colorScheme ?? 'light'].inputBackground,
            borderColor: colorScheme === 'dark' ? '#666' : '#E5E7EB',
            color: Colors[colorScheme ?? 'light'].text
          }]}
          value={newUsername}
          onChangeText={setNewUsername}
          placeholder="Tên đăng nhập mới"
          placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleChangeUsername}
          disabled={loading || !newUsername.trim()}
        >
          <ThemedText style={styles.submitButtonText}>
            {loading ? 'Đang xử lý...' : 'Xác nhận'}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    opacity: 0.8,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  submitButton: {
    backgroundColor: Colors.light.tint,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
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