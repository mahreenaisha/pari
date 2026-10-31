import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { PillButton } from '@/components/ui/pill-button';
import type { Strings } from '@/i18n/strings';
import { useStrings } from '@/i18n/use-strings';
import { formatMoney, formatTime } from '@/lib/format';
import type { QrPayment } from '@/types/payments';
import { colors, radii, spacing } from '@/theme';

import { useResolveQrPayment } from './use-qr-payments';

function settles(amount: number, pending: number, { qr }: Strings) {
  const left = pending - amount;
  if (left > 0) return qr.staysPending(formatMoney(left), formatMoney(pending));
  if (left < 0) return qr.clearsWithExtra(formatMoney(pending), formatMoney(-left));
  return qr.clears(formatMoney(pending));
}

type PaymentMatchCardProps = {
  payment: QrPayment;
  /** Other payments waiting behind this one. */
  waiting: number;
};

/**
 * Asks whether a QR payment is for the entry Pari is asking about aloud, else its best match. "Nahi" is
 * answered on the server like the spoken word, so the card and Pari move on to the same next suggestion.
 */
export function PaymentMatchCard({ payment, waiting }: PaymentMatchCardProps) {
  const strings = useStrings();
  const resolve = useResolveQrPayment();
  const suggestion =
    payment.suggestions.find((s) => s.entryId === payment.askedEntryId) ?? payment.suggestions.at(0);
  const amount = formatMoney(payment.amount);

  const dismiss = () => resolve.mutate({ paymentId: payment.id });

  const via = payment.source === 'link' ? strings.qr.overLink : strings.qr.onQr;
  const meta = [
    `${via} · ${formatTime(payment.receivedAt, strings.locale)}`,
    waiting > 0 ? strings.qr.waiting(waiting) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.card}>
      <View style={styles.meta}>
        <Icon name={payment.source === 'link' ? 'link' : 'qr'} size={13} color={colors.accentText} />
        <AppText variant="caption" numberOfLines={1}>
          {meta}
        </AppText>
      </View>

      <Animated.View key={suggestion?.entryId ?? 'none'} entering={FadeIn.duration(250)} style={styles.question}>
        <AppText variant="headline" style={styles.headline}>
          {suggestion ? strings.qr.ask(amount, suggestion.customerName) : strings.qr.askWhose(amount)}
        </AppText>
        <AppText variant="caption">
          {suggestion ? settles(payment.amount, suggestion.pending, strings) : strings.qr.noMatch}
        </AppText>
      </Animated.View>

      <View style={styles.actions}>
        {suggestion ? (
          <>
            <PillButton
              tone="accent"
              icon="check"
              label={strings.common.yes}
              disabled={resolve.isPending}
              onPress={() => resolve.mutate({ paymentId: payment.id, entryId: suggestion.entryId })}
              style={styles.action}
            />
            <PillButton
              label={strings.common.no}
              disabled={resolve.isPending}
              onPress={() => resolve.mutate({ paymentId: payment.id, entryId: suggestion.entryId, declined: true })}
              style={styles.action}
            />
          </>
        ) : (
          <PillButton label={strings.qr.okay} disabled={resolve.isPending} onPress={dismiss} style={styles.action} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.xl,
    backgroundColor: colors.surfaceRaised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    boxShadow: '0 -8px 40px rgba(0, 0, 0, 0.7)',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  question: {
    gap: spacing.xxs,
  },
  headline: {
    fontSize: 25,
    lineHeight: 30,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  action: {
    flex: 1,
  },
});
