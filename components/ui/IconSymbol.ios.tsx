import { Platform } from 'react-native';
import { ShieldCheckIcon, HomeIcon, UserIcon, EnvelopeIcon, CreditCardIcon, LockClosedIcon, StarIcon, CheckCircleIcon, QrCodeIcon, GiftIcon, UsersIcon, BoltIcon, ShoppingCartIcon, ChartBarIcon, DocumentDuplicateIcon, ClockIcon, PlusCircleIcon, CakeIcon, SparklesIcon, UserPlusIcon } from 'react-native-heroicons/solid';
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
      <ShieldCheckIcon width={size} height={size} color={color} style={style} />
    );
  }

  // Map tên icon sang component heroicons
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

  const materialName = name.replace(/\./g, '-');
  const IconComponent = ICON_MAP[materialName] || HomeIcon;
  return (
    <IconComponent width={size} height={size} color={color} style={[{ width: size, height: size }, style]} />
  );
}
