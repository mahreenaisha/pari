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
import type { IconName } from '@/components/ui/icon';
import { PillButton } from '@/components/ui/pill-button';
import { LanguageChip } from '@/features/language/language-chip';
import type { Notice, Strings } from '@/i18n/strings';
import { useStrings } from '@/i18n/use-strings';
import { formatMoney, formatPhone } from '@/lib/format';
import { useContentWidth } from '@/lib/use-content-width';
import type { LedgerEntry, PaymentLink } from '@/types/ledger';
import { colors, screenPadding, spacing, springs } from '@/theme';

import type { Turn } from './conversation-store';
import { useVoiceAssistant } from './use-voice-assistant';

/** Longer lines get a smaller headline so they still fit. */
const LONG_LINE = 64;

type Action = {
  label: string;
  icon?: IconName;
  tone?: 'accent';
  onPress: () => void;
};

/** What the conversation area shows: Pari's line, a detail, and the replies. */
type Scene = {
  key: string;
  headline: string;
  body?: string;
  /** The body says what went wrong rather than what the merchant said. */
  alert?: boolean;
  note?: string;
  /** Pari wasn't sure she heard the amounts right. */
  flagged?: boolean;
  actions?: Action[];
  footnote?: string;
};

/** "…150 baaki. Save karoon?" puts the question on its own line, after a full stop or a danda (।). */
function breakBeforeQuestion(text: string) {
  return text.replace(/([.।]) (?=[^.।]*\?( \([^)]*\))?$)/, '$1\n');
}

function breakdown(entry: LedgerEntry, { listen }: Strings) {
  return listen.breakdown(formatMoney(entry.total), formatMoney(entry.paid), formatMoney(entry.pending));
}

function linkOffer(entry: LedgerEntry | undefined, { listen }: Strings) {
  const phone = entry?.customer.phone;
  return phone ? listen.linkOfferTo(formatPhone(phone)) : listen.linkOffer;
}

function linkSent(link: PaymentLink, { listen }: Strings) {
  return listen.linkSent(formatPhone(link.phone));
}

function viewLedger({ listen }: Strings): Action {
  return { label: listen.viewLedger, icon: 'ledgerFilled', onPress: () => router.navigate('/ledger') };
}

function turnScene(turn: Turn, answer: (text: 'haan' | 'nahi') => void, strings: Strings): Scene {
  const { listen, common } = strings;
  if (!turn.reply) {
    return { key: 'start', headline: listen.start, body: listen.example };
  }

  const yes = (label: string, icon: IconName = 'check'): Action => ({
    label,
    icon,
    tone: 'accent',
    onPress: () => answer('haan'),
  });
  const no = (label: string): Action => ({ label, onPress: () => answer('nahi') });
  const said = {
    key: `turn-${turn.id}`,
    headline: breakBeforeQuestion(turn.reply.text),
    body: turn.transcript ? `“${turn.transcript}”` : undefined,
  };

  switch (turn.state) {
    case 'AWAITING_NAME':
    case 'AWAITING_AMOUNT':
      return { ...said, actions: [no(listen.skip)], footnote: listen.sayAnswer };
    case 'AWAITING_CUSTOMER_CHOICE':
      return { ...said, actions: [yes(common.yes), no(common.no)], footnote: listen.sayYes };
    case 'AWAITING_ENTRY_CONFIRM':
      return {
        ...said,
        note: turn.entry && breakdown(turn.entry, strings),
        flagged: turn.needsReview,
        actions: [yes(listen.save), no(common.no)],
        footnote: listen.sayYes,
      };
    case 'AWAITING_PAYMENT_CONFIRM':
      // Pari first asks whether QR money of the same amount is this cash.
      if (turn.reply.key === 'qrSameMoney') {
        return { ...said, note: listen.paidToQr, actions: [yes(common.yes), no(common.no)], footnote: listen.sayYes };
      }
      return { ...said, actions: [yes(listen.save), no(common.no)], footnote: listen.sayYes };
    case 'AWAITING_COLLECT_CHOICE':
      return {
        ...said,
        note: linkOffer(turn.entry, strings),
        actions: [yes(listen.sendLink, 'link'), no(listen.notNow)],
        footnote: listen.sayYes,
      };
    case 'AWAITING_PHONE':
      return { ...said, actions: [no(listen.skip)], footnote: listen.sayNumber };
    case 'AWAITING_PHONE_CONFIRM':
      return { ...said, actions: [yes(common.yes), no(common.no)], footnote: listen.sayYes };
    case 'AWAITING_QR_MATCH':
      return {
        ...said,
        note: listen.paidToQr,
        actions: [yes(common.yes), no(common.no)],
        footnote: listen.sayYes,
      };
    case 'IDLE':
      return {
        ...said,
        note: turn.link?.status === 'sent' ? linkSent(turn.link, strings) : undefined,
        actions: turn.entry && turn.entry.status !== 'rejected' ? [viewLedger(strings)] : undefined,
      };
  }
}

/** An open question stays on screen, with the problem in place of the merchant's words. */
function withNotice(scene: Scene, notice: Notice | null, waiting: boolean): Scene {
  if (!notice) return scene;
  if (waiting) return { ...scene, key: `${scene.key}-notice`, body: notice.title, alert: true };
  return { key: 'notice', headline: notice.title, body: notice.detail };
}

export function ListeningScreen() {
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabBarInset();
  const width = useContentWidth();
  const { height } = useWindowDimensions();
  const strings = useStrings();
  const { turn, phase, notice, level, energy, tapOrb, answer } = useVoiceAssistant();

  const orbSize = Math.round(Math.min(width * 0.72, height * 0.32, 340));

  const pressScale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.value }] }));

  const onPress = () => {
    if (process.env.EXPO_OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    }
    tapOrb();
  };

  const waiting = turn.state !== 'IDLE';
  const scene: Scene =
    phase === 'recording'
      ? { key: 'recording', headline: strings.listen.listening, body: strings.listen.hints[turn.state] }
      : phase === 'transcribing'
        ? { key: 'transcribing', headline: strings.listen.thinking }
        : withNotice(
            turnScene(turn, (text) => void answer(text), strings),
            notice,
            waiting,
          );
  const busy = phase === 'transcribing' || phase === 'answering';

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.sm, paddingBottom: tabBarInset }]}>
      <View style={styles.top}>
        <AppText variant="headline" align="center" color={colors.textSecondary} style={styles.wordmark}>
          pyari pari
        </AppText>
        <LanguageChip style={styles.chip} />
      </View>

      <View style={styles.stage}>
        <Pressable
          onPress={onPress}
          onPressIn={() => pressScale.set(withSpring(0.96, springs.press))}
          onPressOut={() => pressScale.set(withSpring(1, springs.press))}
          disabled={busy}
          role="button"
          accessibilityLabel={
            phase === 'recording'
              ? strings.listen.stopListening
              : waiting
                ? strings.listen.answerByVoice
                : strings.listen.speakEntry
          }>
          <Animated.View style={pressStyle}>
            <SkyOrb size={orbSize} energy={energy} level={level} glow={0.1} ripples />
          </Animated.View>
        </Pressable>

        <View style={[styles.conversation, { marginTop: Math.round(orbSize * 0.17) }]}>
          <SceneView key={scene.key} scene={scene} disabled={busy} />
        </View>
      </View>
    </View>
  );
}

function SceneView({ scene, disabled }: { scene: Scene; disabled: boolean }) {
  return (
    <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(150)} style={styles.block}>
      <AppText
        variant="headline"
        align="center"
        numberOfLines={4}
        style={scene.headline.length > LONG_LINE && styles.longHeadline}>
        {scene.headline}
      </AppText>
      {scene.body ? (
        <AppText
          variant="body"
          align="center"
          numberOfLines={3}
          color={scene.alert ? colors.text : colors.textSecondary}>
          {scene.body}
        </AppText>
      ) : null}
      {scene.note ? (
        <AppText variant="caption" align="center" color={scene.flagged ? colors.due : undefined}>
          {scene.note}
        </AppText>
      ) : null}
      {scene.actions ? (
        <View style={styles.actions}>
          {scene.actions.map((action) => (
            <PillButton
              key={action.label}
              label={action.label}
              icon={action.icon}
              tone={action.tone}
              disabled={disabled}
              onPress={action.onPress}
            />
          ))}
        </View>
      ) : null}
      {scene.footnote ? (
        <AppText variant="caption" align="center" color={colors.textTertiary}>
          {scene.footnote}
        </AppText>
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
  top: {
    justifyContent: 'center',
  },
  wordmark: {
    fontSize: 22,
    lineHeight: 28,
  },
  chip: {
    position: 'absolute',
    right: 0,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Sized for the idle prompt so the orb stays centered; taller steps overflow downwards.
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
  longHeadline: {
    fontSize: 24,
    lineHeight: 30,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});
