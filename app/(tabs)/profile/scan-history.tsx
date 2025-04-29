import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, ActivityIndicator, RefreshControl, SafeAreaView, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { qrService } from '@/services/qr.service';
import { formatDate } from '@/src/utils/date';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { router, Stack } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface ScanHistoryItem {
  id: number;
  userId: number;
  qrContent: string;
  amount: string;
  pointsEarned: string;
  createdAt: string;
  status: string;
}

export default function ScanHistoryScreen() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setError(null);
      const response = await qrService.getScanHistory();
      setHistory(response);
    } catch (err: any) {
      setError(err.message || 'Không thể tải lịch sử quét mã');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const renderItem = ({ item }: { item: ScanHistoryItem }) => (
    <ThemedView style={[styles.item, { 
      backgroundColor: Colors[colorScheme ?? 'light'].inputBackground,
      borderColor: colorScheme === 'dark' ? '#666' : '#E5E7EB',
    }]}>
      <View style={styles.itemHeader}>
        <ThemedText style={styles.amount}>+{item.pointsEarned} điểm</ThemedText>
        <ThemedText style={styles.date}>{formatDate(item.createdAt)}</ThemedText>
      </View>
      <View style={styles.itemDetails}>
        <ThemedText style={styles.label}>Số tiền:</ThemedText>
        <ThemedText style={styles.value}>{parseInt(item.amount).toLocaleString('vi-VN')}đ</ThemedText>
      </View>
      <View style={styles.itemDetails}>
        <ThemedText style={styles.label}>Trạng thái:</ThemedText>
        <ThemedText style={[
          styles.status,
          { color: item.status === 'completed' ? '#10B981' : '#F59E0B' }
        ]}>
          {item.status === 'completed' ? 'Hoàn thành' : 'Đang xử lý'}
        </ThemedText>
      </View>
    </ThemedView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <Stack.Screen
        options={{
          title: 'Lịch sử quét mã',
          headerShown: true,
        }}
      />
      <LoadingOverlay visible={loading} />
      {error ? (
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors[colorScheme ?? 'light'].tint}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>Chưa có lịch sử quét mã</ThemedText>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  rightSpace: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  list: {
    padding: 16,
  },
  item: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  amount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10B981',
  },
  date: {
    fontSize: 12,
    color: '#6B7280',
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    color: '#6B7280',
    textAlign: 'center',
  },
}); 