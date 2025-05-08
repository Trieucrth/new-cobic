import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { transactionService, TransferPayload } from '@/services/transaction.service';
import { Audio } from 'expo-av';

export default function TransferScreen() {
  const colorScheme = useColorScheme();
  const [recipientUsername, setRecipientUsername] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const playSound = async (isSuccess: boolean) => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('@/assets/sounds/transfer/pristine-609.mp3')
      );
      setSound(sound);
      await sound.playAsync();
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  const handleTransfer = async () => {
    if (!recipientUsername.trim() || !amount.trim()) {
      await playSound(false);
      Alert.alert('Lỗi', 'Vui lòng nhập Tên người nhận và Số lượng COBIC');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      await playSound(false);
      Alert.alert('Lỗi', 'Số lượng COBIC không hợp lệ');
      return;
    }

    const payload: TransferPayload = {
      recipientUsername: recipientUsername.trim(),
      amount: numericAmount,
      description: description.trim() || undefined,
    };

    setIsLoading(true);
    try {
      const result = await transactionService.transferCobic(payload);
      
      if (result.success) {
        await playSound(true);
        Alert.alert(
          'Thành công',
          `Bạn đã chuyển ${result.transaction.amount} COBIC cho ${recipientUsername} thành công.\nSố dư mới: ${result.newBalance} COBIC`,
          [{ text: 'OK', onPress: () => {
            setRecipientUsername('');
            setAmount('');
            setDescription('');
          }}]
        );
      } else {
        await playSound(false);
        Alert.alert('Lỗi', 'Giao dịch không thành công.');
      }
    } catch (error: any) {
      await playSound(false);
      console.error('Error transferring COBIC:', error);
      
      if (error.response) {
        // Xử lý các mã lỗi cụ thể
        switch (error.response.status) {
          case 400:
            Alert.alert(
              'Không thể chuyển tiền', 
              'Dữ liệu không hợp lệ hoặc số dư không đủ. Vui lòng kiểm tra lại số dư và thông tin nhập vào.'
            );
            break;
          case 401:
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
            break;
          case 404:
            Alert.alert(
              'Không tìm thấy người nhận', 
              'Không tìm thấy người dùng với tên đã nhập. Vui lòng kiểm tra lại tên người nhận.'
            );
            break;
          default:
            // Xử lý các lỗi khác từ server
            const errorMessage = error.response?.data?.message || 'Không thể chuyển COBIC. Vui lòng thử lại.';
            Alert.alert('Lỗi', errorMessage);
        }
      } else {
        // Lỗi kết nối
        Alert.alert('Lỗi kết nối', 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
      edges={['left', 'right']}
    >
      <View style={styles.content}>
        <ThemedView style={[ styles.form, {backgroundColor: colorScheme === 'dark' ? '#4C0099' : '#fff',}]}>
          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Ionicons name="person-outline" size={20} color={Colors[colorScheme ?? 'light'].tint} />
            </View>
            <TextInput
              style={[styles.input, { color: colorScheme === 'dark' ? '#000000' : '#000000',}]}
              placeholder="Tên người nhận (username)"
              placeholderTextColor={Colors[colorScheme ?? 'dark'].icon + '80'}
              value={recipientUsername}
              onChangeText={setRecipientUsername}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Ionicons name="cash-outline" size={20} color={Colors[colorScheme ?? 'light'].tint} />
            </View>
            <TextInput
              style={[styles.input, { color: colorScheme === 'dark' ? '#000000' : '#000000',}]}
              placeholder="Số lượng COBIC"
              placeholderTextColor={Colors[colorScheme ?? 'dark'].icon + '80'}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Ionicons name="document-text-outline" size={20} color={Colors[colorScheme ?? 'light'].tint} />
            </View>
            <TextInput
              style={[styles.input, { color: colorScheme === 'dark' ? '#000000' : '#000000',}]}
              placeholder="Mô tả (tùy chọn)"
              placeholderTextColor={Colors[colorScheme ?? 'dark'].icon + '80'}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <TouchableOpacity
            style={[styles.transferButton, isLoading && styles.buttonDisabled]}
            onPress={handleTransfer}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <View style={styles.transferButtonContent}>
                <Ionicons name="send-outline" size={20} color="#fff" />
                <ThemedText style={styles.transferButtonText}>Chuyển COBIC</ThemedText>
              </View>
            )}
          </TouchableOpacity>
        </ThemedView>
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
    padding: 20,
    paddingTop: 16,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  transferButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 24,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: Colors.light.tint + '80',
  },
  transferButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transferButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
}); 