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
  voice: { ios: 'waveform', android: 'graphic_eq', web: 'graphic_eq' },
  share: { ios: 'square.and.arrow.up', android: 'ios_share', web: 'ios_share' },
  copy: { ios: 'doc.on.doc', android: 'content_copy', web: 'content_copy' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  moneyIn: { ios: 'arrow.down.left', android: 'south_west', web: 'south_west' },
  moneyOut: { ios: 'arrow.up.right', android: 'north_east', web: 'north_east' },
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
