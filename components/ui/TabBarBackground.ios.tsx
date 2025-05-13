import { BlurView } from 'expo-blur';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BlurTabBarBackground() {
  // Nếu cần chiều cao tab bar, có thể hardcode hoặc truyền prop từ ngoài vào
  // const insets = useSafeAreaInsets();
  // const tabBarHeight = 60 + insets.bottom;
  return (
    <BlurView
      // System chrome material automatically adapts to the system's theme
      // and matches the native tab bar appearance on iOS.
      tint="systemChromeMaterial"
      intensity={100}
      style={StyleSheet.absoluteFill}
    />
  );
}
