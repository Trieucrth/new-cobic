import { Platform } from 'react-native';
import { SymbolView, SymbolWeight } from 'expo-symbols';
import { Ionicons } from '@expo/vector-icons';
import type { StyleProp, ViewStyle } from 'react-native';

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = 'regular',
}: {
  name: string;
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  // Fallback cho biểu tượng KYC
  if (name === 'person.badge.shield.checkmark.fill') {
    return (
      <Ionicons
        name="shield-checkmark"
        size={size}
        color={color}
        style={style}
      />
    );
  }

  // SF Symbol mặc định
  return (
    <SymbolView
      name={name as any}
      weight={weight}
      tintColor={color}
      resizeMode="scaleAspectFit"
      style={[{ width: size, height: size }, style]}
    />
  );
}
