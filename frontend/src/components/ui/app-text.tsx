import { Text, type TextProps, type TextStyle } from 'react-native';

import { textVariants, type TextVariant } from '@/theme';

export type AppTextProps = TextProps & {
  variant?: TextVariant;
  color?: string;
  align?: TextStyle['textAlign'];
};

export function AppText({
  variant = 'body',
  color,
  align,
  style,
  maxFontSizeMultiplier = 1.4,
  ...props
}: AppTextProps) {
  return (
    <Text
      {...props}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[textVariants[variant], color ? { color } : null, align ? { textAlign: align } : null, style]}
    />
  );
}
