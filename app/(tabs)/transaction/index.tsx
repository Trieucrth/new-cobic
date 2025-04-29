import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function TransactionScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const menuItems = [
    {
      title: 'Lịch sử giao dịch',
      description: 'Xem tất cả các giao dịch của bạn',
      icon: 'time',
      route: '/transaction/history' as const,
      color: '#4CAF50',
    },
    {
      title: 'Chuyển COBIC',
      description: 'Chuyển COBIC cho người dùng khác',
      icon: 'send',
      route: '/transaction/transfer' as const,
      color: '#2196F3',
    },
  ];

  // Styles dependent on colorScheme
  const dynamicStyles = {
    container: {
      backgroundColor: Colors[colorScheme ?? 'light'].background,
    },
    menuItemContent: {
      backgroundColor: isDarkMode ? '#4c0099' : '#ffffff',
    },
    arrowIcon: {
      color: Colors[colorScheme ?? 'light'].text + '80',
    }
  };

  return (
    <SafeAreaView 
      style={[styles.container, dynamicStyles.container]}
      edges={['left', 'right']}
    >
      <View style={styles.content}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => router.push(item.route)}
          >
            <ThemedView style={[styles.menuItemContent, dynamicStyles.menuItemContent]}>
              <View style={[styles.menuItemIconContainer, { backgroundColor: item.color + '15' }]}>
                <Ionicons 
                  name={item.icon as any} 
                  size={24} 
                  color={item.color} 
                />
              </View>
              <View style={styles.menuItemInfo}>
                <ThemedText style={styles.menuItemTitle}>{item.title}</ThemedText>
                <ThemedText style={styles.menuItemDescription}>{item.description}</ThemedText>
              </View>
              <View style={styles.menuItemArrowContainer}>
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  style={dynamicStyles.arrowIcon}
                />
              </View>
            </ThemedView>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  menuItem: {
    marginBottom: 16,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  menuItemIconContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    marginRight: 16,
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
  menuItemArrowContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 