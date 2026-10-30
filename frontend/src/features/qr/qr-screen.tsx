import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTabBarInset } from '@/components/navigation/tab-bar-inset';
import { SkyOrb } from '@/components/sky/sky-orb';
import { AppText } from '@/components/ui/app-text';
import { PillButton } from '@/components/ui/pill-button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useContentWidth } from '@/lib/use-content-width';
import type { Profile } from '@/types/profile';
import { colors, screenPadding, spacing } from '@/theme';

import { QrCode } from './qr-code';
import { useProfile } from './use-profile';

/** Space kept below the orb for the name and actions; the orb is sized to fit what's left. */
const FOOTER_HEIGHT = 144;

export function QrScreen() {
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabBarInset();
  const width = useContentWidth();
  const [stageHeight, setStageHeight] = useState(0);

  const stageSize = Math.round(
    Math.min(width - screenPadding * 2, stageHeight - FOOTER_HEIGHT - spacing.lg, 340),
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.sm, paddingBottom: tabBarInset }]}>
      <ScreenHeader overline="Get paid" title="Your code" />

      <View style={styles.stage} onLayout={(event) => setStageHeight(event.nativeEvent.layout.height)}>
        {stageSize > 0 ? (
          <Animated.View entering={FadeIn.duration(300)}>
            <MyCode size={stageSize} />
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

function MyCode({ size }: { size: number }) {
  const { data: profile, isError, refetch } = useProfile();
  const cardSize = Math.round(size * 0.6);

  return (
    <View style={styles.centered}>
      <SkyOrb size={size} glow={0.16}>
        {profile ? (
          <Animated.View entering={ZoomIn.duration(400)} style={[styles.card, cardStyle(cardSize)]}>
            <QrCode value={profile.qrPayload} size={Math.round(cardSize * 0.8)} />
          </Animated.View>
        ) : null}
      </SkyOrb>

      {isError ? (
        <View style={styles.footer}>
          <AppText variant="body" align="center" color={colors.textSecondary}>
            Couldn’t load your code.
          </AppText>
          <PillButton label="Try again" onPress={() => void refetch()} />
        </View>
      ) : (
        <Identity profile={profile} />
      )}
    </View>
  );
}

function Identity({ profile }: { profile?: Profile }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    if (!profile) return;
    await Clipboard.setStringAsync(profile.paymentAddress);
    setCopied(true);
  };

  const share = () => {
    if (!profile) return;
    void Share.share({ message: `Pay ${profile.name} with Pyari Pari: ${profile.qrPayload}` });
  };

  return (
    <View style={styles.footer}>
      <View style={styles.names}>
        <AppText variant="title" align="center" style={styles.name}>
          {profile?.name ?? ' '}
        </AppText>
        <AppText variant="caption" align="center">
          {profile?.paymentAddress ?? ' '}
        </AppText>
      </View>
      <View style={styles.actions}>
        <PillButton
          icon={copied ? 'check' : 'copy'}
          label={copied ? 'Copied' : 'Copy ID'}
          onPress={() => void copy()}
          disabled={!profile}
        />
        <PillButton icon="share" label="Share" onPress={share} disabled={!profile} />
      </View>
    </View>
  );
}

const cardStyle = (side: number) => ({
  width: side,
  height: side,
  borderRadius: Math.round(side * 0.16),
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: screenPadding,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    alignItems: 'center',
  },
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    boxShadow: '0 18px 40px rgba(12, 28, 84, 0.38)',
  },
  footer: {
    height: FOOTER_HEIGHT,
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  names: {
    alignItems: 'center',
    gap: spacing.xxs,
  },
  name: {
    fontSize: 30,
    lineHeight: 36,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
