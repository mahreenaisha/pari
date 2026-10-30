import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTabBarInset } from '@/components/navigation/tab-bar-inset';
import { SkyOrb } from '@/components/sky/sky-orb';
import { AppText } from '@/components/ui/app-text';
import { PillButton } from '@/components/ui/pill-button';
import { formatSignedMoney } from '@/lib/format';
import { useContentWidth } from '@/lib/use-content-width';
import type { AssistantTurn } from '@/types/assistant';
import { colors, screenPadding, spacing, springs } from '@/theme';

import { useVoiceAssistant, type AssistantStatus } from './use-voice-assistant';

const PROMPTS: Record<Exclude<AssistantStatus, 'replied'>, { headline: string; hint: string }> = {
  idle: { headline: 'Tap the sky to talk', hint: 'Tell me who paid you, or what you spent.' },
  listening: { headline: 'Listening…', hint: 'Go ahead, I’m all ears.' },
  thinking: { headline: 'Thinking…', hint: '' },
  error: { headline: 'That didn’t work', hint: 'Tap the sky to try again.' },
};

export function ListeningScreen() {
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabBarInset();
  const width = useContentWidth();
  const { height } = useWindowDimensions();
  const { status, transcript, turn, level, energy, toggle } = useVoiceAssistant();

  const orbSize = Math.round(Math.min(width * 0.72, height * 0.34, 340));

  const pressScale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.value }] }));

  const onPress = () => {
    if (process.env.EXPO_OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    }
    toggle();
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.sm, paddingBottom: tabBarInset }]}>
      <AppText variant="headline" align="center" color={colors.textSecondary} style={styles.wordmark}>
        pyari pari
      </AppText>

      <View style={styles.stage}>
        <Pressable
          onPress={onPress}
          onPressIn={() => pressScale.set(withSpring(0.96, springs.press))}
          onPressOut={() => pressScale.set(withSpring(1, springs.press))}
          disabled={status === 'thinking'}
          role="button"
          accessibilityLabel={status === 'listening' ? 'Stop listening' : 'Start talking'}>
          <Animated.View style={pressStyle}>
            <SkyOrb size={orbSize} energy={energy} level={level} glow={0.1} ripples />
          </Animated.View>
        </Pressable>

        <View style={[styles.conversation, { marginTop: Math.round(orbSize * 0.2) }]}>
          {status !== 'replied' ? (
            <Prompt key={status} status={status} transcript={transcript} />
          ) : turn ? (
            <Reply key={`reply-${turn.entry?.id ?? turn.reply}`} turn={turn} />
          ) : null}
        </View>
      </View>
    </View>
  );
}

function Prompt({
  status,
  transcript,
}: {
  status: Exclude<AssistantStatus, 'replied'>;
  transcript: string;
}) {
  const { headline, hint } = PROMPTS[status];
  const live = status === 'listening' || status === 'thinking';
  const body = live && transcript ? transcript : hint;

  return (
    <Animated.View entering={FadeIn.duration(350)} exiting={FadeOut.duration(150)} style={styles.block}>
      <AppText variant="headline" align="center">
        {headline}
      </AppText>
      {body ? (
        <AppText
          variant="body"
          align="center"
          numberOfLines={3}
          color={status === 'listening' && transcript ? colors.text : colors.textSecondary}>
          {body}
        </AppText>
      ) : null}
    </Animated.View>
  );
}

function Reply({ turn }: { turn: AssistantTurn }) {
  return (
    <Animated.View entering={FadeIn.duration(450)} exiting={FadeOut.duration(150)} style={styles.block}>
      <AppText variant="headline" align="center" numberOfLines={3}>
        {turn.reply}
      </AppText>
      {turn.transcript ? (
        <AppText variant="caption" align="center" numberOfLines={2}>
          “{turn.transcript}”
        </AppText>
      ) : null}
      {turn.entry ? (
        <PillButton
          tone="accent"
          icon="ledgerFilled"
          label={`${formatSignedMoney(turn.entry.amount, turn.entry.direction)} · View in ledger`}
          onPress={() => router.navigate('/ledger')}
          style={styles.ledgerLink}
        />
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: screenPadding,
  },
  wordmark: {
    fontSize: 22,
    lineHeight: 28,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Sized for the idle prompt so the orb stays centered; taller replies overflow downwards.
  conversation: {
    alignSelf: 'stretch',
    height: 120,
  },
  block: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: spacing.sm,
  },
  ledgerLink: {
    marginTop: spacing.xs,
  },
});
