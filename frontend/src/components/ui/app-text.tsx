import { Text, type TextProps, type TextStyle } from 'react-native';

import { textVariants, type TextVariant } from '@/theme';

export type AppTextProps = TextProps & {
  variant?: TextVariant;
  color?: string;
  align?: TextStyle['textAlign'];
};

/** Letter spacing pulls apart the joined letters of Indian scripts, so their text keeps none. */
const INDIC_SCRIPT = /[\u0900-\u0dff]/;
const untracked = { letterSpacing: 0 } satisfies TextStyle;

export function AppText({
  variant = 'body',
  color,
  align,
  style,
  maxFontSizeMultiplier = 1.4,
  ...props
}: AppTextProps) {
  const indic = typeof props.children === 'string' && INDIC_SCRIPT.test(props.children);
  return (
    <Text
      {...props}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[
        textVariants[variant],
        indic ? untracked : null,
        color ? { color } : null,
        align ? { textAlign: align } : null,
        style,
      ]}
    />
  );
}
