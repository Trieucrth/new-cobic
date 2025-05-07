import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Image, Platform, StatusBar, Modal, Button, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import axios from 'axios';
import api from '@/services/api.client';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/ui/IconSymbol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';

type KYCForm = {
  fullName: string;
  dateOfBirth: string;
  address: string;
  identityNumber: string;
  idCardFrontImage: string;
  idCardBackImage: string;
  selfieWithIdCard: string;
  idCardFrontImageBase64: string;
  idCardBackImageBase64: string;
  selfieWithIdCardBase64: string;
};

type CameraMode = 'front' | 'back' | 'selfie' | null;

export default function KYCScreen() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tempDate, setTempDate] = useState(new Date());
  const [showCamera, setShowCamera] = useState<CameraMode>(null);
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [showDateModal, setShowDateModal] = useState(false);
  
  const [formData, setFormData] = useState<KYCForm>({
    fullName: '',
    dateOfBirth: '',
    address: '',
    identityNumber: '',
    idCardFrontImage: '',
    idCardBackImage: '',
    selfieWithIdCard: '',
    idCardFrontImageBase64: '',
    idCardBackImageBase64: '',
    selfieWithIdCardBase64: '',
  });

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const confirmDateSelection = () => {
    setSelectedDate(tempDate);
    setFormData({
      ...formData,
      dateOfBirth: format(tempDate, 'yyyy-MM-dd'),
    });
    setShowDateModal(false);
    setShowDatePicker(false);
  };

  const cancelDateSelection = () => {
    setTempDate(selectedDate);
    setShowDateModal(false);
    setShowDatePicker(false);
  };

  const openDatePicker = () => {
    setTempDate(selectedDate);
    if (Platform.OS === 'ios') {
      setShowDateModal(true);
    } else {
      setShowDatePicker(true);
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        // @ts-ignore - Type error with cameraRef.current
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          base64: true,
          ...(showCamera === 'selfie' ? { skipProcessing: false } : {}),
        });
        
        // Xử lý ảnh sau khi chụp
        const processedPhoto = {
          ...photo,
          uri: photo.uri,
          base64: photo.base64,
        };
        
        handleCameraCapture(processedPhoto);
      } catch (error) {
        console.error('Lỗi khi chụp ảnh:', error);
        Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại.');
      }
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: showCamera === 'selfie' ? [3, 4] : [4, 3],
        quality: 0.7,
        base64: true,
      });
      
      if (!result.canceled && result.assets[0].base64) {
        const photo = {
          uri: result.assets[0].uri,
          base64: result.assets[0].base64,
        };
        handleCameraCapture(photo);
      } else if (!result.canceled) {
        Alert.alert('Lỗi', 'Không thể lấy dữ liệu ảnh. Vui lòng thử lại hoặc chụp ảnh mới.');
      }
    } catch (error) {
      console.error('Lỗi khi chọn ảnh từ thư viện:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
    }
  };

  const handleCameraCapture = (photo: any) => {
    if (showCamera === 'front') {
      setFormData({ 
        ...formData, 
        idCardFrontImage: photo.uri,
        idCardFrontImageBase64: photo.base64
      });
    } else if (showCamera === 'back') {
      setFormData({ 
        ...formData, 
        idCardBackImage: photo.uri,
        idCardBackImageBase64: photo.base64
      });
    } else if (showCamera === 'selfie') {
      setFormData({ 
        ...formData, 
        selfieWithIdCard: photo.uri,
        selfieWithIdCardBase64: photo.base64
      });
    }
    setShowCamera(null);
  };

  const handleSubmit = async () => {
    // Kiểm tra validate dữ liệu
    if (!formData.fullName || !formData.dateOfBirth || !formData.address || !formData.identityNumber) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin cá nhân');
      return;
    }
    
    if (!formData.idCardFrontImage || !formData.idCardBackImage || !formData.selfieWithIdCard) {
      Alert.alert('Lỗi', 'Vui lòng tải lên đầy đủ các ảnh yêu cầu');
      return;
    }
    
    // Kiểm tra kết nối mạng trước khi gửi
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      Alert.alert(
        'Lỗi kết nối mạng', 
        'Bạn đang offline. Vui lòng kiểm tra kết nối mạng và thử lại.',
        [
          { text: 'OK' },
          { 
            text: 'Mở cài đặt', 
            onPress: () => Linking.openSettings() 
          }
        ]
      );
      return;
    }
    
    try {
      setLoading(true);
      
      // Cập nhật payload với các trường bắt buộc theo yêu cầu API
      const payload = {
        fullName: formData.fullName,
        dateOfBirth: formData.dateOfBirth,
        address: formData.address,
        identityNumber: formData.identityNumber,
        // Các trường thông tin mới bắt buộc
        documentType: "national_id", // Sử dụng chứng minh nhân dân/căn cước công dân
        documentFront: formData.idCardFrontImageBase64, // Ảnh mặt trước CMND/CCCD
        documentBack: formData.idCardBackImageBase64, // Ảnh mặt sau CMND/CCCD
        country: "VN", // Mã quốc gia Việt Nam
        // Các trường gốc (giữ lại để tương thích)
        idCardFrontImage: formData.idCardFrontImageBase64,
        idCardBackImage: formData.idCardBackImageBase64,
        selfieWithIdCard: formData.selfieWithIdCardBase64,
      };
      
      // In ra payload để kiểm tra (bỏ phần ảnh để tránh log quá dài)
      console.log('Dữ liệu KYC sẽ gửi:', {
        ...payload,
        documentFront: '[base64-data]', 
        documentBack: '[base64-data]',
        selfieWithIdCard: '[base64-data]',
        idCardFrontImage: '[base64-data]',
        idCardBackImage: '[base64-data]',
      });
      
      console.log('Đang gửi dữ liệu KYC...');
      const token = await AsyncStorage.getItem('token');
      
      // Kiểm tra có token hay không
      if (!token) {
        Alert.alert('Lỗi', 'Bạn chưa đăng nhập, vui lòng đăng nhập lại');
        return;
      }
      
      // Sử dụng URL đầy đủ cho API và thêm timeout
      const response = await api.post('/kyc/submit', payload, {
        timeout: 30000, // 30 giây timeout
      });
      
      console.log('Phản hồi từ server:', response.data);
      
      // Cập nhật trạng thái KYC của user
      if (user) {
        setUser({
          ...user,
          kycStatus: 'pending'
        });
      }
      Alert.alert('Thành công', 'Đã gửi thông tin KYC thành công');
      router.back();
    } catch (error: any) {
      console.error('Lỗi khi gửi KYC:', error);
      
      // Thêm log chi tiết về lỗi để phân tích
      if (error.response) {
        console.error('Phản hồi lỗi từ server:', error.response.data);
        console.error('Mã lỗi HTTP:', error.response.status);
        console.error('Headers:', error.response.headers);
      } else if (error.request) {
        console.error('Không nhận được phản hồi:', error.request);
      } else {
        console.error('Lỗi cấu hình request:', error.message);
      }
      
      // Xử lý lỗi một cách chi tiết hơn
      if (error.message && error.message.includes('Network Error')) {
        Alert.alert(
          'Lỗi kết nối mạng',
          'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet của bạn và thử lại.',
          [
            { text: 'OK' },
            { 
              text: 'Mở cài đặt mạng', 
              onPress: () => Linking.openSettings() 
            }
          ]
        );
      } else if (error.code === 'ECONNABORTED') {
        Alert.alert('Lỗi', 'Yêu cầu bị hủy do mất quá nhiều thời gian. Vui lòng thử lại.');
      } else if (error.response?.status === 400) {
        // Nếu có thông tin chi tiết từ server, hiển thị nó
        const errorMessage = error.response.data?.message || 'Dữ liệu không hợp lệ';
        Alert.alert('Lỗi', errorMessage);
      } else if (error.response?.status === 401) {
        Alert.alert('Lỗi', 'Không được xác thực');
      } else if (error.response?.status >= 500) {
        Alert.alert('Lỗi', 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.');
      } else {
        Alert.alert('Lỗi', `Có lỗi xảy ra, vui lòng thử lại: ${error.message || 'Lỗi không xác định'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderCameraContent = () => {
    if (!permission) {
      // Camera permissions are still loading
      return (
        <View style={styles.cameraPermissionContainer}>
          <Text style={styles.message}>Đang tải quyền camera...</Text>
        </View>
      );
    }

    if (!permission.granted) {
      // Camera permissions are not granted yet
      return (
        <View style={styles.cameraPermissionContainer}>
          <Text style={styles.message}>Chúng tôi cần quyền truy cập camera của bạn</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Cấp quyền</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    const isSelfieMode = showCamera === 'selfie';
    const isFrontMode = showCamera === 'front';
    const isBackMode = showCamera === 'back';
    
    return (
      <View style={styles.cameraContainer}>
        <CameraView 
          style={[
            styles.camera,
            isSelfieMode ? styles.selfieCamera : {}
          ]} 
          facing={isSelfieMode ? 'front' : 'back'}
          ref={cameraRef}
          ratio="4:3"
        >
          <View style={styles.cameraControls}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setShowCamera(null)}
            >
              <IconSymbol name="xmark" size={24} color="#ffffff" />
            </TouchableOpacity>
            
            {isSelfieMode && (
              <>
                <View style={styles.selfieGuideContainer}>
                  <View style={styles.selfieFrame}>
                    <View style={styles.personIcon}>
                      <View style={styles.head} />
                      <View style={styles.body} />
                    </View>
                    <View style={styles.cardIcon}>
                      <View style={styles.cardInner} />
                    </View>
                  </View>
                  <Text style={styles.selfieInstructions}>
                    Xoay điện thoại dọc và đặt khuôn mặt cùng CMND/CCCD của bạn vào khung hình
                  </Text>
                </View>
              </>
            )}
            
            {isFrontMode && (
              <>
                <View style={styles.idCardGuideContainer}>
                  <View style={styles.idCardFrame}>
                    <View style={styles.idCardFrameInner} />
                  </View>
                  <Text style={styles.idCardInstructions}>
                    Đặt mặt trước CMND/CCCD vào trong khung hình
                  </Text>
                </View>
              </>
            )}
            
            {isBackMode && (
              <>
                <View style={styles.idCardGuideContainer}>
                  <View style={styles.idCardFrame}>
                    <View style={styles.idCardFrameInner} />
                  </View>
                  <Text style={styles.idCardInstructions}>
                    Đặt mặt sau CMND/CCCD vào trong khung hình
                  </Text>
                </View>
              </>
            )}
            
            <View style={styles.bottomControls}>
              <TouchableOpacity 
                style={styles.galleryButton} 
                onPress={pickImage}
              >
                <IconSymbol name="photo" size={24} color="#ffffff" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.captureButton} 
                onPress={takePicture}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
              
              <View style={{width: 40}} />
            </View>
          </View>
        </CameraView>
      </View>
    );
  };

  const renderImagePreview = (imageUri: string, type: CameraMode) => {
    if (!imageUri) return null;
    
    return (
      <View style={styles.imagePreviewContainer}>
        <Image 
          source={{ uri: imageUri }} 
          style={[
            styles.imagePreview,
            type === 'selfie' ? styles.selfieImagePreview : {}
          ]} 
        />
        <TouchableOpacity 
          style={styles.retakeButton}
          onPress={() => setShowCamera(type)}
        >
          <Text style={styles.retakeButtonText}>Chụp lại</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Hàm render trạng thái KYC pending (đang chờ duyệt)
  const renderPendingStatus = () => {
    return (
      <View style={styles.statusContainer}>
        <IconSymbol name="clock" size={60} color={Colors[colorScheme ?? 'light'].tint} />
        <Text style={[styles.statusTitle, {color: Colors[colorScheme ?? 'light'].text}]}>Đang chờ duyệt</Text>
        <Text style={[styles.statusMessage, {color: Colors[colorScheme ?? 'light'].text}]}>
          Thông tin KYC của bạn đã được gửi và đang chờ được phê duyệt. 
          Quá trình này có thể mất từ 1-3 ngày làm việc.
        </Text>
        <TouchableOpacity 
          style={[
            styles.submitButton, 
            { backgroundColor: Colors[colorScheme ?? 'light'].tint }
          ]} 
          onPress={() => router.back()}
        >
          <Text style={styles.submitButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Hàm render trạng thái KYC đã được xác thực
  const renderVerifiedStatus = () => {
    return (
      <View style={styles.statusContainer}>
        <IconSymbol name="checkmark.circle" size={60} color="#4CAF50" />
        <Text style={styles.statusTitle}>Đã xác thực</Text>
        <Text style={styles.statusMessage}>
          Thông tin KYC của bạn đã được xác thực thành công. 
          Bạn có thể sử dụng đầy đủ tính năng của ứng dụng.
        </Text>
        <TouchableOpacity 
          style={[
            styles.submitButton, 
            { backgroundColor: Colors[colorScheme ?? 'light'].tint }
          ]} 
          onPress={() => router.back()}
        >
          <Text style={styles.submitButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Hàm render trạng thái KYC bị từ chối
  const renderRejectedStatus = () => {
    return (
      <View style={styles.statusContainer}>
        <IconSymbol name="xmark.circle" size={60} color="#F44336" />
        <Text style={styles.statusTitle}>Xác thực không thành công</Text>
        <Text style={styles.statusMessage}>
          Thông tin KYC của bạn đã bị từ chối. Vui lòng kiểm tra lại thông tin và thử lại.
        </Text>
        <TouchableOpacity 
          style={[
            styles.submitButton, 
            { backgroundColor: Colors[colorScheme ?? 'light'].tint }
          ]} 
          onPress={() => {
            if (user) {
              setUser({
                ...user,
                kycStatus: null
              });
            }
          }}
        >
          <Text style={styles.submitButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Hàm render form KYC (chỉ hiển thị khi trạng thái là chưa xác thực)
  const renderKYCForm = () => {
    return (
      <View style={styles.form}>
        <Text style={[styles.label, {color: Colors[colorScheme ?? 'dark'].text}]}>Họ và tên</Text>
        <TextInput
          style={styles.input}
          value={formData.fullName}
          onChangeText={(text) => setFormData({ ...formData, fullName: text })}
          placeholder="Nhập họ và tên"
        />

        <Text style={[styles.label, {color: Colors[colorScheme ?? 'dark'].text}]}>Ngày sinh</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={openDatePicker}>
          <Text style={{color: Colors[colorScheme ?? 'dark'].text}}>{format(selectedDate, 'dd/MM/yyyy', { locale: vi })}</Text>
        </TouchableOpacity>

        {showDatePicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={tempDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}

        <Text style={[styles.label, {color: Colors[colorScheme ?? 'dark'].text}]}>Địa chỉ</Text>
        <TextInput
          style={styles.input}
          value={formData.address}
          onChangeText={(text) => setFormData({ ...formData, address: text })}
          placeholder="Nhập địa chỉ"
        />

        <Text style={[styles.label, {color: Colors[colorScheme ?? 'dark'].text}]}>Số CMND/CCCD</Text>
        <TextInput
          style={styles.input}
          value={formData.identityNumber}
          onChangeText={(text) => setFormData({ ...formData, identityNumber: text })}
          placeholder="Nhập số CMND/CCCD"
          keyboardType="numeric"
        />

        <Text style={[styles.label, {color: Colors[colorScheme ?? 'dark'].text}]}>Mặt trước CMND/CCCD</Text>
        {formData.idCardFrontImage ? 
          renderImagePreview(formData.idCardFrontImage, 'front') :
          <TouchableOpacity
            style={[styles.uploadButton, { borderColor: '#ddd' }]}
            onPress={() => setShowCamera('front')}>
            <IconSymbol name="camera.fill" size={20} color={Colors[colorScheme ?? 'light'].text} />
            <Text style={[styles.uploadButtonText, {color: Colors[colorScheme ?? 'light'].text}]}>Tải lên mặt trước CMND/CCCD</Text>
          </TouchableOpacity>
        }

        <Text style={[styles.label, {color: Colors[colorScheme ?? 'dark'].text}]}>Mặt sau CMND/CCCD</Text>
        {formData.idCardBackImage ? 
          renderImagePreview(formData.idCardBackImage, 'back') :
          <TouchableOpacity
            style={[styles.uploadButton, { borderColor: '#ddd' }]}
            onPress={() => setShowCamera('back')}>
            <IconSymbol name="camera.fill" size={20} color={Colors[colorScheme ?? 'light'].text} />
            <Text style={[styles.uploadButtonText, {color: Colors[colorScheme ?? 'light'].text}]}>Tải lên mặt sau CMND/CCCD</Text>
          </TouchableOpacity>
        }

        <Text style={[styles.label, {color: Colors[colorScheme ?? 'dark'].text}]}>Ảnh chân dung với CMND/CCCD</Text>
        {formData.selfieWithIdCard ? 
          renderImagePreview(formData.selfieWithIdCard, 'selfie') :
          <TouchableOpacity
            style={[styles.uploadButton, { borderColor: '#ddd' }]}
            onPress={() => setShowCamera('selfie')}>
            <IconSymbol name="camera.fill" size={20} color={Colors[colorScheme ?? 'light'].text} />
            <Text style={[styles.uploadButtonText, {color: Colors[colorScheme ?? 'light'].text}]}>Tải lên ảnh chân dung kèm CMND/CCCD</Text>
          </TouchableOpacity>
        }

        <TouchableOpacity 
          style={[
            styles.submitButton, 
            { backgroundColor: Colors[colorScheme ?? 'light'].tint }
          ]} 
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>Gửi thông tin</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Hàm render nội dung trang dựa trên trạng thái KYC
  const renderContent = () => {
    // Kiểm tra user và trạng thái KYC
    if (!user) {
      return (
        <View style={styles.statusContainer}>
          <Text style={styles.statusMessage}>Vui lòng đăng nhập để tiếp tục</Text>
          <TouchableOpacity 
            style={[
              styles.submitButton, 
              { backgroundColor: Colors[colorScheme ?? 'light'].tint }
            ]} 
            onPress={() => router.replace('/login')}
          >
            <Text style={styles.submitButtonText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Hiển thị nội dung dựa trên trạng thái KYC
    switch (user.kycStatus) {
      case 'pending':
        return renderPendingStatus();
      case 'verified':
        return renderVerifiedStatus();
      case 'rejected':
        return renderRejectedStatus();
      default:
        return renderKYCForm(); // Chưa KYC hoặc trạng thái là null
    }
  };

  return (
    <>
      <ScrollView style={[styles.container, {backgroundColor: colorScheme === 'dark' ? '#360265' : '#fff'}]}>
        <LoadingOverlay visible={loading} />
        
        {renderContent()}
        
        <View style={[styles.bottomSpacer, { height: 80 + insets.bottom }]} />
      </ScrollView>
      
      <Modal
        visible={showDateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={cancelDateSelection}
      >
        <View style={styles.dateModalContainer}>
          <View style={styles.dateModalContent}>
            <View style={styles.dateModalHeader}>
              <Text style={styles.dateModalTitle}>Chọn ngày sinh</Text>
            </View>
            
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              onChange={handleDateChange}
              maximumDate={new Date()}
              style={styles.datePicker}
              textColor={Colors[colorScheme ?? 'light'].text}
            />
            
            <View style={styles.dateModalButtons}>
              <TouchableOpacity 
                style={[styles.dateModalButton, styles.dateModalCancelButton]} 
                onPress={cancelDateSelection}
              >
                <Text style={styles.dateModalButtonText}>Hủy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.dateModalButton, styles.dateModalConfirmButton]} 
                onPress={confirmDateSelection}
              >
                <Text style={[styles.dateModalButtonText, styles.dateModalConfirmText]}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      <Modal
        visible={showCamera !== null}
        transparent={false}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => setShowCamera(null)}
      >
        <StatusBar barStyle="light-content" backgroundColor="black" />
        {renderCameraContent()}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonText: {
    marginLeft: 8,
  },
  submitButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  dateModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
    width: '100%',
  },
  dateModalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  dateModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  datePicker: {
    height: 200,
    width: '100%', 
    alignSelf: 'center',
  },
  dateModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  dateModalButton: {
    flex: 1,
    padding: 12,
    margin: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  dateModalCancelButton: {
    backgroundColor: '#f1f1f1',
  },
  dateModalConfirmButton: {
    backgroundColor: '#007AFF',
  },
  dateModalButtonText: {
    fontSize: 16,
  },
  dateModalConfirmText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  cameraPermissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'black',
  },
  message: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
    color: 'white',
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  camera: {
    flex: 1,
  },
  selfieCamera: {
    flex: 1,
    alignSelf: 'center',
  },
  selfieGuideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selfieFrame: {
    width: '70%',
    height: '60%',
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 12,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  personIcon: {
    alignItems: 'center',
    opacity: 0.4,
  },
  head: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'white',
  },
  body: {
    width: 40,
    height: 60,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: 'white',
    marginTop: 5,
  },
  cardIcon: {
    width: 60, 
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 5,
    position: 'absolute',
    bottom: 40,
    right: '25%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInner: {
    width: 50,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 3,
  },
  selfieInstructions: {
    color: 'white',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 20,
    marginTop: 20,
    fontWeight: 'bold',
  },
  cameraControls: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 20,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  galleryButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  imagePreviewContainer: {
    marginBottom: 16,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  selfieImagePreview: {
    aspectRatio: 3/4,
    height: 280,
    alignSelf: 'center',
  },
  retakeButton: {
    backgroundColor: '#f1f1f1',
    padding: 8,
    borderRadius: 4,
    alignSelf: 'flex-end',
  },
  retakeButtonText: {
    color: '#007AFF',
  },
  bottomSpacer: {
    height: 80,
  },
  idCardGuideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  idCardFrame: {
    width: '85%',
    height: '50%',
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 12,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  idCardFrameInner: {
    width: '90%',
    height: '80%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  idCardInstructions: {
    color: 'white',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 20,
    marginTop: 20,
    fontWeight: 'bold',
  },
  statusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 300,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  statusMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
}); 