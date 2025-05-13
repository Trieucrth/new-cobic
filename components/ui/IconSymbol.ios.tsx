import { Platform } from 'react-native';
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
  weight?: 'regular' | 'bold';
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

  // Chuyển đổi SF Symbol sang Ionicons
  const iconName = name.replace(/\./g, '-');
  return (
    <Ionicons
      name={iconName as any}
      size={size}
      color={color}
      style={[{ width: size, height: size }, style]}
    />
  );
}
