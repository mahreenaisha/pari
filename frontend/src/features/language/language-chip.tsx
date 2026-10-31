import { router } from 'expo-router';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { languageName } from '@/i18n/languages';
import { useLanguage, useStrings } from '@/i18n/use-strings';
import { colors, radii, spacing } from '@/theme';

/** The merchant's language, in its own script. Opens the picker. */
export function LanguageChip({ style }: { style?: StyleProp<ViewStyle> }) {
  const language = useLanguage();
  const strings = useStrings();

  return (
    <Pressable
      role="button"
      accessibilityLabel={strings.listen.changeLanguage}
      hitSlop={8}
      onPress={() => router.push('/language')}
      style={({ pressed }) => [styles.chip, pressed && styles.pressed, style]}>
      <AppText variant="caption" color={colors.text}>
        {languageName(language)}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 30,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  pressed: {
    opacity: 0.6,
  },
});
