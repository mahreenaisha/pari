import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/ui/screen-header';
import { startOver } from '@/features/listening/conversation-store';
import { useProfile, useSetLanguage } from '@/features/qr/use-profile';
import { LANGUAGES, type Language } from '@/i18n/languages';
import { useStrings } from '@/i18n/use-strings';
import { useContentWidth } from '@/lib/use-content-width';
import { colors, radii, screenPadding, spacing } from '@/theme';

const GAP = spacing.sm;

function leave() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

/** Every language in its own script. Shown on first launch, and from the chip on the Listen screen. */
export function LanguageScreen() {
  const insets = useSafeAreaInsets();
  const width = useContentWidth();
  const strings = useStrings();
  const current = useProfile().data?.language ?? null;
  const save = useSetLanguage();
  const shown = save.isPending ? save.variables : current;
  const tileWidth = (width - screenPadding * 2 - GAP) / 2;

  const choose = (language: Language) => {
    if (process.env.EXPO_OS !== 'web') void Haptics.selectionAsync();
    if (language === current) return leave();
    save.mutate(language, {
      onSuccess: () => {
        startOver().catch(() => {});
        leave();
      },
    });
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xl },
      ]}
      showsVerticalScrollIndicator={false}>
      <ScreenHeader overline="pyari pari" title={strings.language.title} />
      <AppText variant="body" color={colors.textSecondary}>
        {strings.language.note}
      </AppText>

      <View role="radiogroup" style={styles.grid}>
        {LANGUAGES.map((language) => {
          const selected = language.code === shown;
          return (
            <Pressable
              key={language.code}
              role="radio"
              aria-checked={selected}
              disabled={save.isPending}
              onPress={() => choose(language.code)}
              style={({ pressed }) => [
                styles.tile,
                { width: tileWidth },
                selected && styles.selected,
                pressed && styles.pressed,
              ]}>
              <View style={styles.names}>
                <AppText variant="title" numberOfLines={1} style={styles.name}>
                  {language.name}
                </AppText>
                <AppText variant="caption">{language.english}</AppText>
              </View>
              {selected ? <Icon name="check" size={18} color={colors.accentText} /> : null}
            </Pressable>
          );
        })}
      </View>

      {save.isError ? (
        <AppText variant="body" color={colors.due}>
          {strings.language.failed}
        </AppText>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    gap: spacing.lg,
    paddingHorizontal: screenPadding,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  selected: {
    backgroundColor: colors.accentSoft,
    borderColor: 'rgba(150, 182, 255, 0.28)',
  },
  pressed: {
    opacity: 0.6,
  },
  names: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 26,
    lineHeight: 36,
  },
});
