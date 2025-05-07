import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert, ActivityIndicator, StatusBar, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { qrService } from '@/services/qr.service';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';

const SCREEN_WIDTH = Dimensions.get('window').width;
const FRAME_SIZE = 250;
const FRAME_PADDING = 20;

export default function ScanReceiptScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = async ({ data, bounds }: { data: string, bounds: { origin: { x: number, y: number }, size: { width: number, height: number } } }) => {
    if (scanned || loading) return;

    // Tính toán vị trí của khung quét
    const frameLeft = (SCREEN_WIDTH - FRAME_SIZE) / 2;
    const frameRight = frameLeft + FRAME_SIZE;
    const frameTop = (SCREEN_WIDTH - FRAME_SIZE) / 2;
    const frameBottom = frameTop + FRAME_SIZE;

    // Tính toán vị trí của mã QR
    const qrLeft = bounds.origin.x;
    const qrRight = bounds.origin.x + bounds.size.width;
    const qrTop = bounds.origin.y;
    const qrBottom = bounds.origin.y + bounds.size.height;

    // Kiểm tra xem mã QR có nằm trong khung không
    const isQRInFrame = 
      qrLeft >= (frameLeft + FRAME_PADDING) && 
      qrRight <= (frameRight - FRAME_PADDING) && 
      qrTop >= (frameTop + FRAME_PADDING) && 
      qrBottom <= (frameBottom - FRAME_PADDING);

    if (!isQRInFrame) {
      return; // Bỏ qua nếu mã QR không nằm trong khung
    }

    setScanned(true);
    setLoading(true);

    try {
      if (!data || typeof data !== 'string') {
        throw new Error('Mã QR không hợp lệ');
      }

      console.log('QR Data:', data);

      const response = await qrService.scanQR(data);
      
      if (!response || !response.message) {
        throw new Error('Phản hồi không hợp lệ từ máy chủ');
      }

      Alert.alert(
        'Thành công',
        response.message,
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/(tabs)');
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Lỗi khi quét QR:', error);
      
      if (error.message === 'Mã QR không hợp lệ') {
        Alert.alert('Lỗi', 'Mã QR không hợp lệ. Vui lòng thử lại với mã QR khác.');
      } else if (error.response) {
        switch (error.response.status) {
          case 400:
            Alert.alert('Lỗi', error.response.data.error || 'Mã QR không hợp lệ');
            break;
          case 401:
            Alert.alert('Lỗi', 'Vui lòng đăng nhập để tiếp tục');
            router.replace('/login');
            break;
          case 500:
            Alert.alert('Lỗi', 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.');
            break;
          default:
            Alert.alert('Lỗi', 'Có lỗi xảy ra. Vui lòng thử lại.');
        }
      } else {
        Alert.alert('Lỗi', error.message || 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
      }
    } finally {
      setLoading(false);
      setScanned(false);
    }
  };

  const renderCameraContent = () => {
    if (!permission) {
      return (
        <View style={styles.cameraPermissionContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={styles.cameraPermissionContainer}>
          <ThemedText style={styles.permissionText}>
            Vui lòng cấp quyền truy cập camera trong cài đặt của thiết bị
          </ThemedText>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={requestPermission}
          >
            <ThemedText style={styles.retryButtonText}>Thử lại</ThemedText>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        >
          <View style={styles.overlay}>
            <View style={styles.scanFrame}>
              <View style={styles.cornerTopLeft} />
              <View style={styles.cornerTopRight} />
              <View style={styles.cornerBottomLeft} />
              <View style={styles.cornerBottomRight} />
            </View>
            <ThemedText style={styles.scanText}>
              Đặt mã QR vào khung để quét
            </ThemedText>
          </View>
        </CameraView>

        <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => {
              router.replace('/(tabs)');
              setTimeout(() => router.navigate('/(tabs)'), 100);
            }}
          >
            <IconSymbol name="close" size={24} color={Colors[colorScheme ?? 'light'].text} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      {renderCameraContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  cameraPermissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  scanFrame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    borderWidth: 2,
    borderColor: '#fff',
    position: 'relative',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 50,
    height: 50,
    borderLeftWidth: 4,
    borderTopWidth: 4,
    borderColor: Colors.light.tint,
  },
  cornerTopRight: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 50,
    height: 50,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderColor: Colors.light.tint,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 50,
    height: 50,
    borderLeftWidth: 4,
    borderBottomWidth: 4,
    borderColor: Colors.light.tint,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 50,
    height: 50,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderColor: Colors.light.tint,
  },
  scanText: {
    color: '#fff',
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  closeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
    marginBottom: 20,
    color: '#fff',
  },
  retryButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export const screenOptions = {
  headerShown: false,
  tabBarStyle: { display: 'none' },
};