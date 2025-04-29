import React from 'react';
import { View, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface LoadingOverlayProps {
  visible: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ visible }) => {
  const colorScheme = useColorScheme();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
          backgroundColor: Colors[colorScheme ?? 'light'].background + 'CC', // Thêm alpha channel
        }
      ]}
    >
      <View style={styles.container}>
        <ActivityIndicator 
          size="large" 
          color={Colors[colorScheme ?? 'light'].tint}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  container: {
    backgroundColor: 'transparent',
    padding: 20,
    borderRadius: 10,
  },
}); 