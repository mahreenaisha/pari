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
import { useLedgerEntries } from '@/features/ledger/use-ledger';
import { formatMoney, formatPhone } from '@/lib/format';
import { useContentWidth } from '@/lib/use-content-width';
import type { ListenFor } from '@/types/assistant';
import type { LedgerEntry, PaymentMethod } from '@/types/ledger';
import { colors, screenPadding, spacing, springs } from '@/theme';

import { useVoiceAssistant, type Outcome, type Step } from './use-voice-assistant';

const LISTEN_HINT: Record<ListenFor, string> = {
  entry: 'Who bought what, and how much they paid.',
  phone: 'Say the ten digits.',
  answer: 'Haan ya nahi?',
};

const METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: 'cash',
  upi: 'UPI',
  link: 'by link',
  qr: 'on QR',
};

const VOICE_ANSWER = 'Or tap the sky and say “haan”';

type Action = {
  label: string;
  icon?: IconName;
  tone?: 'accent';
  onPress: () => void;
};

/** What the conversation area shows for a step: Pari's line, a detail, and the replies. */
type Scene = {
  key: string;
  headline: string;
  body?: string;
  /** The body is the merchant's own words as they are heard. */
  live?: boolean;
  note?: string;
  actions?: Action[];
  footnote?: string;
};

function readBack(draft: LedgerEntry) {
  const name = draft.customer.name;
  return draft.pending > 0
    ? `${name}, ${formatMoney(draft.pending)} baaki.\nSave karoon?`
    : `${name}, ${formatMoney(draft.total)} poore mile.\nSave karoon?`;
}

function breakdown(draft: LedgerEntry) {
  const method = draft.payments[0]?.method;
  const paid = method ? `Paid ${formatMoney(draft.paid)} ${METHOD_LABEL[method]}` : 'Nothing paid';
  return `Total ${formatMoney(draft.total)} · ${paid} · Baaki ${formatMoney(draft.pending)}`;
}

const viewLedger: Action = {
  label: 'View in ledger',
  icon: 'ledgerFilled',
  onPress: () => router.navigate('/ledger'),
};

export function ListeningScreen() {
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabBarInset();
  const width = useContentWidth();
  const { height } = useWindowDimensions();
  const assistant = useVoiceAssistant();
  const { step, transcript, level, energy, tapOrb } = assistant;
  const { data: entries } = useLedgerEntries();

  const orbSize = Math.round(Math.min(width * 0.72, height * 0.32, 340));

  const pressScale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.value }] }));

  const onPress = () => {
    if (process.env.EXPO_OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    }
    tapOrb();
  };

  const doneScene = (outcome: Outcome): Scene => {
    switch (outcome.kind) {
      case 'linkSent': {
        const { customer, link } = outcome.entry;
        const live = entries?.find((entry) => entry.id === outcome.entry.id);
        return live?.status === 'closed'
          ? {
              key: 'link-paid',
              headline: `${customer.name} ke ${formatMoney(link?.amount ?? 0)} aa gaye.`,
              body: 'Paid by link, so the entry closed itself.',
              actions: [viewLedger],
            }
          : {
              key: 'link-sent',
              headline: 'Link bhej diya.',
              body: `The entry closes by itself when ${customer.name} pays.`,
              actions: [viewLedger],
            };
      }
      case 'saved':
        return outcome.entry.pending > 0
          ? {
              key: 'saved-open',
              headline: `Theek hai, ${formatMoney(outcome.entry.pending)} baaki likh liya.`,
              body: `If ${outcome.entry.customer.name} pays on your QR, I’ll ask you to match it.`,
              actions: [viewLedger],
            }
          : { key: 'saved-closed', headline: 'Save ho gaya. Hisaab barabar.', actions: [viewLedger] };
      case 'discarded':
        return { key: 'discarded', headline: 'Theek hai, save nahi kiya.', body: 'Tap the sky to try again.' };
      case 'unheard':
        return { key: 'unheard', headline: 'Kuch sunai nahi diya.', body: 'Tap the sky and try again.' };
      case 'unclear':
        return { key: 'unclear', headline: 'Samajh nahi aaya.', body: LISTEN_HINT.entry };
    }
  };

  const sceneFor = (current: Step): Scene => {
    switch (current.kind) {
      case 'idle':
        return {
          key: 'idle',
          headline: 'Tap the sky and speak',
          body: '“Gupta ji ne 350 ka samaan liya, 200 UPI diya, 150 baaki”',
        };
      case 'listening':
        return {
          key: 'listening',
          headline: 'Listening…',
          body: transcript || LISTEN_HINT[current.listenFor],
          live: Boolean(transcript),
        };
      case 'thinking':
        return { key: 'thinking', headline: 'Thinking…', body: transcript };
      case 'working':
        return { key: 'working', headline: current.label };
      case 'confirm': {
        const { draft } = current;
        return {
          key: `confirm-${draft.id}`,
          headline: readBack(draft),
          note: breakdown(draft),
          actions: [
            { label: 'Haan, save karo', icon: 'check', tone: 'accent', onPress: () => void assistant.confirm(draft) },
            { label: 'Nahi', onPress: () => assistant.reject(draft) },
          ],
          footnote: VOICE_ANSWER,
        };
      }
      case 'collect': {
        const { entry } = current;
        const phone = current.phone ?? entry.customer.phone;
        const skip: Action = { label: 'Abhi nahi', onPress: () => assistant.skipLink(entry) };
        return phone
          ? {
              key: `collect-${entry.id}`,
              headline: `${entry.customer.name} ko\n${formatMoney(entry.pending)} ka link bhejoon?`,
              note: `Paytm payment link by SMS to ${formatPhone(phone)}`,
              actions: [
                {
                  label: 'Link bhejo',
                  icon: 'link',
                  tone: 'accent',
                  onPress: () => void assistant.sendLink(entry, current.phone),
                },
                skip,
              ],
              footnote: VOICE_ANSWER,
            }
          : {
              key: `phone-${entry.id}`,
              headline: `${entry.customer.name} ka number?`,
              body: 'Tap the sky and say it. You only need to do this once.',
              actions: [skip],
            };
      }
      case 'done':
        return doneScene(current.outcome);
      case 'error':
        return { key: 'error', headline: 'That didn’t work', body: 'Tap the sky to try again.' };
    }
  };

  const scene = sceneFor(step);
  const busy = step.kind === 'thinking' || step.kind === 'working';

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
          disabled={busy}
          role="button"
          accessibilityLabel={
            step.kind === 'listening'
              ? 'Stop listening'
              : step.kind === 'confirm' || step.kind === 'collect'
                ? 'Answer by voice'
                : 'Speak an entry'
          }>
          <Animated.View style={pressStyle}>
            <SkyOrb size={orbSize} energy={energy} level={level} glow={0.1} ripples />
          </Animated.View>
        </Pressable>

        <View style={[styles.conversation, { marginTop: Math.round(orbSize * 0.17) }]}>
          <SceneView key={scene.key} scene={scene} />
        </View>
      </View>
    </View>
  );
}

function SceneView({ scene }: { scene: Scene }) {
  return (
    <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(150)} style={styles.block}>
      <AppText variant="headline" align="center" numberOfLines={3}>
        {scene.headline}
      </AppText>
      {scene.body ? (
        <AppText
          variant="body"
          align="center"
          numberOfLines={3}
          color={scene.live ? colors.text : colors.textSecondary}>
          {scene.body}
        </AppText>
      ) : null}
      {scene.note ? (
        <AppText variant="caption" align="center">
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
  wordmark: {
    fontSize: 22,
    lineHeight: 28,
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
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});
