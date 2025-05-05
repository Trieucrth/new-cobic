// IconSymbol.tsx
import React from 'react';
import { Platform, StyleProp, TextStyle } from 'react-native';
import { Symbol as SFSymbol, SymbolWeight } from 'expo-symbols';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const NAME_MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'hammer.fill': 'build',
  'checklist': 'checklist',
  'arrow.left.arrow.right': 'swap-horiz',
  'person.fill': 'person',
  'envelope.fill': 'mail',
  'creditcard.fill': 'credit-card',
  'bolt.fill': 'bolt',
  'person.2.fill': 'people',
  'mug.fill': 'local-cafe',
  'star.fill': 'star',
  'cup.and.saucer.fill': 'local-cafe',
  'lock.rectangle.stack.fill': 'lock',
  'person.crop.circle.fill': 'account-circle',
  'person.text.rectangle.fill': 'card-membership',
  'snowflake': 'ac-unit',
  'leaf.fill': 'energy-savings-leaf',
  'cart.fill': 'shopping-cart',
  'chart.line.uptrend.xyaxis': 'trending-up',
  'gift.fill': 'card-giftcard',
  'person.3.fill': 'people',
  'doc.on.doc': 'content-copy',
  'qrcode.viewfinder': 'qr-code-scanner',
  'lock.fill': 'lock-outline',
  'person.crop.circle.badge.plus': 'person-add',
  'checkmark.shield.fill': 'verified-user',
  'doc.text.fill': 'history',
  'person.badge.shield.checkmark.fill': 'shield',
  'person.circle.fill': 'account-circle',
} as const;

export type IconSymbolName = keyof typeof NAME_MAPPING;

interface IconSymbolProps {
  name: IconSymbolName;
  size?: number;
  color: string;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = 'regular',
}: IconSymbolProps) {
  // On iOS use the native SF Symbol; everywhere else use MaterialIcons.
  if (Platform.OS === 'ios') {
    return (
      <SFSymbol
        name={name}
        size={size}
        weight={weight}
        color={color}
        style={style}
      />
    );
  }

  // Look up the Material icon name, or fall back to a placeholder.
  const materialName = NAME_MAPPING[name] ?? 'help-outline';
  return (
    <MaterialIcons
      name={materialName}
      size={size}
      color={color}
      style={style}
    />
  );
}
