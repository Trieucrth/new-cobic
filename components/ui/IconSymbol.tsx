// IconSymbol.tsx
import React from 'react';
import { Platform, StyleProp, TextStyle } from 'react-native';
import {
  ShieldCheckIcon, HomeIcon, UserIcon, EnvelopeIcon, CreditCardIcon, LockClosedIcon, StarIcon, CheckCircleIcon, QrCodeIcon, GiftIcon, UsersIcon, BoltIcon, ShoppingCartIcon, ChartBarIcon, DocumentDuplicateIcon, ClockIcon, PlusCircleIcon, CakeIcon, SparklesIcon, UserPlusIcon
} from 'react-native-heroicons/solid';
import type { ViewStyle } from 'react-native';

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
  weight?: 'regular' | 'bold';
}

const ICON_MAP: Record<string, any> = {
  'home': HomeIcon,
  'person': UserIcon,
  'envelope': EnvelopeIcon,
  'credit-card': CreditCardIcon,
  'lock': LockClosedIcon,
  'star': StarIcon,
  'verified-user': CheckCircleIcon,
  'qr-code-scanner': QrCodeIcon,
  'card-giftcard': GiftIcon,
  'people': UsersIcon,
  'bolt': BoltIcon,
  'shopping-cart': ShoppingCartIcon,
  'trending-up': ChartBarIcon,
  'content-copy': DocumentDuplicateIcon,
  'history': ClockIcon,
  'person-add': UserPlusIcon,
  'local-cafe': CakeIcon,
  'snowflake': SparklesIcon,
  'energy-savings-leaf': SparklesIcon,
  // ... thêm các icon khác nếu cần
};

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = 'regular',
}: IconSymbolProps) {
  // Fallback cho biểu tượng KYC
  if (name === 'person.badge.shield.checkmark.fill') {
    return (
      <ShieldCheckIcon width={size} height={size} color={color} style={style as ViewStyle} />
    );
  }

  // Map tên icon sang component heroicons
  const materialName = NAME_MAPPING[name] ?? 'home';
  const IconComponent = ICON_MAP[materialName] || HomeIcon;
  return (
    <IconComponent width={size} height={size} color={color} style={[{ width: size, height: size }, style]} />
  );
}
