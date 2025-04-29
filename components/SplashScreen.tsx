import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Image, Animated } from 'react-native';
import { ThemedText } from './ThemedText';
import { Colors } from '@/constants/Colors';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(30)).current;
  const subtitleTranslateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Chạy các animation tuần tự
    Animated.sequence([
      // 1. Hiển thị logo với hiệu ứng xoay và scale
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      
      // 2. Hiển thị tiêu đề và phụ đề
      Animated.parallel([
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(subtitleTranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Kết thúc splash screen sau 2.5 giây
    const timer = setTimeout(() => {
      onFinish();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const spin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <View style={[styles.container, { backgroundColor: Colors.dark.background }]}>
      <View style={styles.contentContainer}>
        {/* Logo */}
        <Animated.View style={[
          styles.logoContainer,
          { 
            opacity: fadeAnim,
            transform: [
              { scale: logoScale },
              { rotate: spin }
            ]
          }
        ]}>
          <Image
            source={require('../assets/images/logo-cobic.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
        
        {/* Tiêu đề */}
        <Animated.View style={[
          styles.titleContainer,
          { 
            opacity: fadeAnim,
            transform: [{ translateY: titleTranslateY }]
          }
        ]}>
          <ThemedText style={styles.appName}>Cobic App</ThemedText>
        </Animated.View>
        
        {/* Phụ đề */}
        <Animated.View style={[
          styles.subtitleContainer,
          { 
            opacity: fadeAnim,
            transform: [{ translateY: subtitleTranslateY }]
          }
        ]}>
          <ThemedText style={styles.tagline}>Hệ thống quản lý chuỗi cà phê</ThemedText>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 40,
  },
  logo: {
    width: 150,
    height: 150,
  },
  titleContainer: {
    marginBottom: 10,
  },
  appName: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 40,
  },
  subtitleContainer: {
    marginBottom: 40,
  },
  tagline: {
    color: '#E5E7EB',
    fontSize: 16,
    textAlign: 'center',
  },
}); 