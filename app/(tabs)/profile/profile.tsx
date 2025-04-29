import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator, Modal, FlatList } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { userService } from '@/services/user.service';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { COUNTRIES } from '@/constants/countries';
import MaskInput from 'react-native-mask-input';

export default function UpdateProfileScreen() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    dateOfBirth: '',
    country: '',
    address: '',
    bio: '',
    phoneNumber: '',
  });
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const router = useRouter();
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [filteredCountries, setFilteredCountries] = useState(COUNTRIES);
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await userService.getUser();
      if (response) {
        // cập nhật formData và context
        setFormData({
          email: response.email ?? '',
          fullName: response.fullName ?? '',
          dateOfBirth: response.dateOfBirth ?? '',
          country: response.country ?? '',
          address: response.address ?? '',
          bio: response.bio ?? '',
          phoneNumber: response.phoneNumber ?? '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin profile');
    } finally {
      setLoading(false);
    }
  };


  const handleUpdateProfile = async () => {
    try {
      setLoading(true);

      // Tạo object profileData không bao gồm email
      const profileData = {
        fullName: formData.fullName,
        dateOfBirth: formData.dateOfBirth,
        country: formData.country,
        address: formData.address,
        bio: formData.bio,
        phoneNumber: formData.phoneNumber,
      };

      // Gọi API cập nhật profile
      await userService.updateProfile(profileData);
      
      // Hiển thị thông báo thành công và chuyển về trang index.tsx khi nhấn OK
      Alert.alert(
        'Thành công', 
        'Đã cập nhật thông tin thành công',
        [
          {
            text: 'OK',
            onPress: () => {
              router.navigate('/(tabs)/profile');
            }
          }
        ]
      );
      
      await fetchUserProfile();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Lỗi', error.response?.data?.message || 'Cập nhật thông tin thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleCountrySearch = (text: string) => {
    const filtered = COUNTRIES.filter(country => 
      country.name.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredCountries(filtered);
  };

  const renderCountryItem = ({ item }: { item: { code: string; name: string } }) => (
    <TouchableOpacity
      style={[styles.countryItem, { borderBottomColor: Colors[colorScheme ?? 'light'].icon + '60' }]}
      onPress={() => {
        setFormData({ ...formData, country: item.name });
        setShowCountryPicker(false);
      }}
    >
      <ThemedText style={styles.countryItemText}>{item.name}</ThemedText>
    </TouchableOpacity>
  );

  const validatePhoneNumber = (phone: string) => {
    // Xóa tất cả các ký tự không phải số
    const cleanedPhone = phone.replace(/\D/g, '');
    
    // Kiểm tra độ dài số điện thoại
    if (cleanedPhone.length < 10) {
      setPhoneError('Số điện thoại phải có ít nhất 10 chữ số');
      return false;
    }
    
    // Kiểm tra định dạng số điện thoại Việt Nam
    if (!/^(0[3-9][0-9]{8})$/.test(cleanedPhone)) {
      setPhoneError('Số điện thoại không hợp lệ');
      return false;
    }
    
    setPhoneError('');
    return true;
  };

  const handlePhoneChange = (masked: string, unmasked: string) => {
    setFormData({ ...formData, phoneNumber: masked });
    validatePhoneNumber(unmasked);
  };

  return (
    <ThemedView style={styles.container}>
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
          <ThemedText style={styles.loadingText}>Đang tải thông tin cá nhân...</ThemedText>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.formContainer}>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Email</ThemedText>
              <TextInput
                style={[styles.input, {
                  backgroundColor: Colors[colorScheme ?? 'light'].inputBackground,
                  borderColor: colorScheme === 'dark' ? '#666' : '#E5E7EB',
                  color: Colors[colorScheme ?? 'light'].text
                }]}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="Email"
                placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Họ và tên</ThemedText>
              <TextInput
                style={[styles.input, {
                  backgroundColor: Colors[colorScheme ?? 'light'].inputBackground,
                  borderColor: colorScheme === 'dark' ? '#666' : '#E5E7EB',
                  color: Colors[colorScheme ?? 'light'].text
                }]}
                value={formData.fullName}
                onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                placeholder="Họ và tên"
                placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Ngày sinh</ThemedText>
              <TextInput
                style={[styles.input, {
                  backgroundColor: Colors[colorScheme ?? 'light'].inputBackground,
                  borderColor: colorScheme === 'dark' ? '#666' : '#E5E7EB',
                  color: Colors[colorScheme ?? 'light'].text
                }]}
                value={formData.dateOfBirth}
                onChangeText={(text) => setFormData({ ...formData, dateOfBirth: text })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Quốc gia</ThemedText>
              <TouchableOpacity
                style={[styles.input, {
                  backgroundColor: Colors[colorScheme ?? 'light'].inputBackground,
                  borderColor: colorScheme === 'dark' ? '#666' : '#E5E7EB',
                  justifyContent: 'center',
                }]}
                onPress={() => setShowCountryPicker(true)}
              >
                <ThemedText style={styles.countryText}>
                  {formData.country || 'Chọn quốc gia'}
                </ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Địa chỉ</ThemedText>
              <TextInput
                style={[styles.input, {
                  backgroundColor: Colors[colorScheme ?? 'light'].inputBackground,
                  borderColor: colorScheme === 'dark' ? '#666' : '#E5E7EB',
                  color: Colors[colorScheme ?? 'light'].text
                }]}
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                placeholder="Địa chỉ"
                placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Giới thiệu</ThemedText>
              <TextInput
                style={[styles.input, {
                  backgroundColor: Colors[colorScheme ?? 'light'].inputBackground,
                  borderColor: colorScheme === 'dark' ? '#666' : '#E5E7EB',
                  color: Colors[colorScheme ?? 'light'].text,
                  height: 100,
                  textAlignVertical: 'top',
                }]}
                value={formData.bio}
                onChangeText={(text) => setFormData({ ...formData, bio: text })}
                placeholder="Giới thiệu về bản thân"
                placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
                multiline
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Số điện thoại</ThemedText>
              <MaskInput
                style={[styles.input, {
                  backgroundColor: Colors[colorScheme ?? 'light'].inputBackground,
                  borderColor: colorScheme === 'dark' ? '#666' : '#E5E7EB',
                  color: Colors[colorScheme ?? 'light'].text,
                  borderWidth: phoneError ? 1 : 1,
                }]}
                value={formData.phoneNumber}
                onChangeText={handlePhoneChange}
                placeholder="0123 456 789"
                placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
                keyboardType="phone-pad"
                mask={['0', /\d/, /\d/, /\d/, ' ', /\d/, /\d/, /\d/, ' ', /\d/, /\d/, /\d/]}
              />
              {phoneError ? (
                <ThemedText style={styles.errorText}>{phoneError}</ThemedText>
              ) : null}
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleUpdateProfile}
              disabled={loading}
            >
              <ThemedText style={styles.submitButtonText}>
                {loading ? 'Đang xử lý...' : 'Cập nhật'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Country Picker Modal */}
      <Modal
        visible={showCountryPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <ThemedView style={styles.modalContainer}>
          <ThemedView style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Chọn quốc gia</ThemedText>
            
            <TextInput
              style={[styles.searchInput, {
                backgroundColor: Colors[colorScheme ?? 'light'].inputBackground,
                borderColor: colorScheme === 'dark' ? '#666' : '#E5E7EB',
                color: Colors[colorScheme ?? 'light'].text
              }]}
              placeholder="Tìm kiếm quốc gia..."
              placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
              onChangeText={handleCountrySearch}
            />

            <FlatList
              data={filteredCountries}
              renderItem={renderCountryItem}
              keyExtractor={item => item.code}
              style={styles.countryList}
            />

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCountryPicker(false)}
            >
              <ThemedText style={styles.closeButtonText}>Đóng</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
  },
  formContainer: {
    // Giữ nguyên container mà không cần padding vì scrollViewContent đã có padding
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.8,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  searchInput: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  countryList: {
    maxHeight: 300,
  },
  countryItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  countryItemText: {
    fontSize: 16,
  },
  countryText: {
    fontSize: 16,
  },
  closeButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
}); 