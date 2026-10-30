import { InstrumentSerif_400Regular } from '@expo-google-fonts/instrument-serif/400Regular';
import { InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif/400Regular_Italic';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import type { TextStyle } from 'react-native';

import { colors } from './colors';

export const fontAssets = {
  InstrumentSerif_400Regular,
  InstrumentSerif_400Regular_Italic,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
};

export const fonts = {
  serif: 'InstrumentSerif_400Regular',
  serifItalic: 'InstrumentSerif_400Regular_Italic',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
} as const;

export const textVariants = {
  display: {
    fontFamily: fonts.serif,
    fontSize: 52,
    lineHeight: 58,
    letterSpacing: -0.5,
    color: colors.text,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 38,
    lineHeight: 44,
    letterSpacing: -0.3,
    color: colors.text,
  },
  headline: {
    fontFamily: fonts.serifItalic,
    fontSize: 30,
    lineHeight: 36,
    color: colors.text,
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 23,
    color: colors.text,
  },
  bodyStrong: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
  },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
  },
  caption: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  overline: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.textTertiary,
  },
} satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof textVariants;
