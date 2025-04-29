import React from 'react';
import { Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { AuthProvider } from '@/contexts/AuthContext';

export default function ProfileLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: true,
          headerStyle: { 
            backgroundColor: Colors[colorScheme ?? 'light'].background 
          },
          headerTintColor: Colors[colorScheme ?? 'light'].text,
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'Thông tin cá nhân',
          }}
        />
        <Stack.Screen
          name="change-password"
          options={{
            title: 'Đổi mật khẩu',
          }}
        />
        <Stack.Screen
          name="username"
          options={{
            title: 'Đổi tên đăng nhập',
          }}
        />
        <Stack.Screen
          name="profile"
          options={{
            title: 'Cập nhật thông tin',
          }}
        />
        <Stack.Screen
          name="kyc"
          options={{
            title: 'Xác thực KYC',
          }}
        />
        <Stack.Screen
          name="referral"
          options={{
            title: 'Mã giới thiệu',
          }}
        />
        <Stack.Screen
          name="scan-receipt"
          options={{
            title: 'Quét mã tích điểm',
          }}
        />
      </Stack>
    </AuthProvider>
  );
} 