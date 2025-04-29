import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { transactionService, Transaction } from '@/services/transaction.service';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

// Định nghĩa màu sắc cụ thể
const specificColors = {
  success: '#4CAF50',   // Green
  warning: '#FF9800',   // Orange
  danger: '#F44336',    // Red
  info: '#2196F3',      // Blue
  primary: '#2196F3',   // Blue (for received transfers)
  gray: '#9E9E9E',      // Gray
  purple: '#9C27B0',    // Purple
  teal: '#009688',      // Teal
  lightBg: '#F5F5F5',   // Light background
  darkBg: '#360265',    // Dark background
  darkCard: '#4C0099',  // Dark card
  lightCard: '#FFFFFF', // Light card
};

export default function TransactionHistoryScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await transactionService.getTransactions();
      setTransactions(data);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      
      if (error.response) {
        // Xử lý lỗi 401 (Không được xác thực)
        if (error.response.status === 401) {
          Alert.alert(
            'Không được xác thực', 
            'Vui lòng đăng nhập lại để tiếp tục.',
            [
              {
                text: 'OK',
                onPress: () => {
                  // TODO: Chuyển người dùng đến màn hình đăng nhập nếu cần
                  // navigation.navigate('Login');
                }
              }
            ]
          );
        } else {
          Alert.alert('Lỗi', error.response?.data?.message || 'Không thể tải lịch sử giao dịch. Vui lòng thử lại.');
        }
      } else {
        Alert.alert('Lỗi kết nối', 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy HH:mm', { locale: vi });
    } catch (error) {
      return 'Không xác định';
    }
  };

  // Lấy chi tiết của giao dịch dựa vào loại
  const getTransactionDetails = (type: Transaction['type'], isSending: boolean) => {
    if (type === 'mining') {
      return {
        title: 'Đào coin',
        color: specificColors.teal,
        bgColor: '#009688' + '20'
      };
    }
    
    if (type === 'admin') {
      return {
        title: 'Quản trị',
        color: specificColors.warning,
        bgColor: '#FF9800' + '20'
      };
    }
    
    if (type === 'task_reward') {
      return {
        title: 'Phần thưởng',
        color: specificColors.purple,
        bgColor: '#9C27B0' + '20'
      };
    }
    
    if (type === 'transfer') {
      if (isSending) {
        return {
          title: 'Chuyển tiền',
          color: specificColors.danger,
          bgColor: '#F44336' + '20'
        };
      } else {
        return {
          title: 'Nhận tiền',
          color: specificColors.success,
          bgColor: '#4CAF50' + '20'
        };
      }
    }
    
    return {
      title: 'Khác',
      color: specificColors.gray,
      bgColor: '#9E9E9E' + '20'
    };
  };

  const renderTransaction = (transaction: Transaction) => {
    const isSending = transaction.type === 'transfer' && transaction.senderId != null && transaction.senderId !== 0;
    const { title, color, bgColor } = getTransactionDetails(transaction.type, isSending);
    const amountPrefix = isSending ? '-' : '+';
    
    // Check if description is missing, empty, or the literal string "string"
    const descriptionInvalid = !transaction.description || transaction.description.trim() === '' || transaction.description === 'string';
    const displayDescription = descriptionInvalid ? 'Không có mô tả' : transaction.description;

    return (
      <TouchableOpacity 
        key={transaction.id}
        activeOpacity={0.8}
      >
        <ThemedView
          style={[
            styles.card,
            { backgroundColor: isDarkMode ? specificColors.darkCard : specificColors.lightCard }
          ]}
        >
          <View style={styles.cardMain}>
            <View style={styles.leftSection}>
              <View style={[styles.indicator, { backgroundColor: color }]} />
              {/* Ensure detailsSection has minHeight */}
              <View style={[styles.detailsSection]}>
                {/* Restore ThemedText and use corrected logic */}
                <ThemedText 
                  style={[
                    styles.description, 
                    descriptionInvalid && styles.missingDescription // Apply style if description is invalid
                  ]}
                  numberOfLines={1} // Restore numberOfLines
                >
                  {displayDescription}
                </ThemedText>
                <View style={styles.detailsRow}>
                  <View style={[styles.badgeContainer, { backgroundColor: bgColor }]}>
                    <Text style={[styles.badgeText, { color }]}>{title}</Text>
                  </View>
                  <ThemedText style={styles.date}>{formatDate(transaction.timestamp)}</ThemedText>
                </View>
              </View>
            </View>
            
            <View style={styles.amountSection}>
              <ThemedText style={[styles.amount, { color: isSending ? specificColors.danger : specificColors.success }]}>
                {amountPrefix}{transaction.amount}
              </ThemedText>
              <ThemedText style={styles.currency}>COBIC</ThemedText>
            </View>
          </View>
        </ThemedView>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView 
      style={[
        styles.container, 
        { backgroundColor: isDarkMode ? specificColors.darkBg : specificColors.lightBg }
      ]}
      edges={['left', 'right', 'bottom']}
    >
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
          <ThemedText style={styles.loadingText}>Đang tải giao dịch...</ThemedText>
        </View>
      ) : (
        <>
          {transactions.length > 0 ? (
            <ScrollView 
              style={styles.transactionList}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {transactions.map(transaction => renderTransaction(transaction))}
            </ScrollView>
          ) : (
            <View style={styles.centerContainer}>
              <View style={[styles.emptyCircle, { backgroundColor: isDarkMode ? '#333' : '#e0e0e0' }]} />
              <ThemedText style={styles.emptyTitle}>Không có giao dịch nào</ThemedText>
              <ThemedText style={styles.emptySubtitle}>Các giao dịch của bạn sẽ xuất hiện ở đây</ThemedText>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  transactionList: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.7,
  },
  card: {
    borderRadius: 16,
    marginTop: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 8,
  },
  indicator: {
    width: 4,
    borderRadius: 2,
    height: '100%',
    marginRight: 12,
  },
  detailsSection: {
    flex: 1,
    justifyContent: 'center',
  },
  description: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  date: {
    fontSize: 12,
    opacity: 0.6,
  },
  amountSection: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
  currency: {
    fontSize: 12,
    opacity: 0.7,
  },
  emptyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
  missingDescription: {
    fontStyle: 'italic',
    opacity: 0.7,
  },
}); 
