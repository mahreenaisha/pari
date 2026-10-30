import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { StyleProp, ViewStyle } from 'react-native';

import { colors } from '@/theme';

/** SF Symbols on iOS, Material Symbols on Android and web. */
const glyphs = {
  listen: { ios: 'mic', android: 'mic', web: 'mic' },
  listenFilled: { ios: 'mic.fill', android: 'mic', web: 'mic' },
  qr: { ios: 'qrcode', android: 'qr_code_2', web: 'qr_code_2' },
  ledger: { ios: 'book.closed', android: 'book_2', web: 'book_2' },
  ledgerFilled: { ios: 'book.closed.fill', android: 'book_2', web: 'book_2' },
  share: { ios: 'square.and.arrow.up', android: 'ios_share', web: 'ios_share' },
  copy: { ios: 'doc.on.doc', android: 'content_copy', web: 'content_copy' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  link: { ios: 'link', android: 'link', web: 'link' },
  open: { ios: 'clock', android: 'schedule', web: 'schedule' },
  closed: { ios: 'checkmark.circle', android: 'check_circle', web: 'check_circle' },
  moneyIn: { ios: 'arrow.down.left', android: 'south_west', web: 'south_west' },
} satisfies Record<string, SymbolViewProps['name']>;

export type IconName = keyof typeof glyphs;

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

export function Icon({ name, size = 22, color = colors.text, style }: IconProps) {
  return <SymbolView name={glyphs[name]} size={size} tintColor={color} style={style} />;
}
