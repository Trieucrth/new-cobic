import React from 'react';
import { Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function TransactionLayout() {
  const colorScheme = useColorScheme();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { 
          backgroundColor: Colors[colorScheme ?? 'light'].background
        },
        headerTitleStyle: {
          fontSize: 18
        },
        headerTintColor: Colors[colorScheme ?? 'light'].text,
        headerShadowVisible: false,
        headerBackTitle: 'Back'
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Giao dịch'
        }}
      />
      <Stack.Screen
        name="history"
        options={{
          title: 'Lịch sử giao dịch'
        }}
      />
      <Stack.Screen
        name="transfer"
        options={{
          title: 'Chuyển COBIC'
        }}
      />
    </Stack>
  );
} 