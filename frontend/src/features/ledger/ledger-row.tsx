import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { env } from '@/config/env';
import type { Strings } from '@/i18n/strings';
import { useStrings } from '@/i18n/use-strings';
import { formatDayLabel, formatMoney, formatTime } from '@/lib/format';
import { simulateLinkPaid } from '@/services/demo-service';
import type { LedgerEntry, Payment } from '@/types/ledger';
import { colors, radii, spacing } from '@/theme';

import { Avatar } from './avatar';
import { lastActivity, ledgerKeys } from './use-ledger';

const AVATAR = 42;
const INSET = spacing.md;

type LedgerRowProps = {
  entry: LedgerEntry;
  first: boolean;
  last: boolean;
};

/** "₹500 by QR", with the part of it that was more than was owed. */
function paidBy({ amount, extra = 0, method }: Payment, { ledger }: Strings) {
  const paid = formatMoney(amount + extra);
  const text = method === 'counter' ? ledger.history.atCounter(paid) : ledger.paidBy[method](paid);
  return extra > 0 ? `${text} · ${ledger.history.extra(formatMoney(extra))}` : text;
}

/** What happened last, to go with the time from `lastActivity`. */
function describe(entry: LedgerEntry, strings: Strings): { icon: IconName; text: string } {
  const { ledger } = strings;
  const latest = entry.payments.at(-1);
  if (entry.status === 'closed') {
    if (latest?.method === 'link') return { icon: 'closed', text: ledger.closedByLink };
    if (latest?.method === 'qr') return { icon: 'closed', text: ledger.closedByQr };
    if (latest?.method === 'cash') return { icon: 'closed', text: ledger.closedByCash };
    return { icon: 'closed', text: ledger.paidInFull };
  }
  const repaid = latest?.method === 'counter' ? undefined : latest;
  const link = entry.link?.status === 'sent' ? entry.link : undefined;
  if (repaid && !(link && Date.parse(link.sentAt) > Date.parse(repaid.at))) {
    return { icon: 'open', text: paidBy(repaid, strings) };
  }
  if (link) return { icon: 'link', text: ledger.linkSent };
  if (entry.paid > 0) return { icon: 'open', text: ledger.paid(formatMoney(entry.paid)) };
  return { icon: 'open', text: ledger.nothingPaid };
}

/** What was bought, then the link and each payment in the order they happened. */
function history(entry: LedgerEntry, strings: Strings) {
  const { ledger } = strings;
  const lines = entry.payments.map((payment) => ({ text: paidBy(payment, strings), at: payment.at }));
  if (entry.link) lines.push({ text: ledger.history.linkSent(formatMoney(entry.link.amount)), at: entry.link.sentAt });
  lines.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  return [{ text: ledger.history.bought(formatMoney(entry.total)), at: entry.createdAt }, ...lines];
}

export function LedgerRow({ entry, first, last }: LedgerRowProps) {
  const strings = useStrings();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const open = entry.status === 'open';
  const { icon, text } = describe(entry, strings);

  // Demo only: the customer pays the link, and Pari announces it like a real payment.
  const payLink =
    env.demoTools && open && entry.link?.status === 'sent'
      ? () => {
          if (process.env.EXPO_OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          simulateLinkPaid(entry.id)
            .then(() => queryClient.invalidateQueries({ queryKey: ledgerKeys.all }))
            .catch(() => {});
        }
      : undefined;

  return (
    <View style={[styles.item, first && styles.first, last && styles.last]}>
      <Pressable
        onPress={() => setExpanded(!expanded)}
        onLongPress={payLink}
        role="button"
        aria-expanded={expanded}
        style={styles.row}>
        <Avatar name={entry.customer.name} size={AVATAR} />
        <View style={styles.body}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {entry.customer.name}
          </AppText>
          <View style={styles.meta}>
            <Icon name={icon} size={13} color={open ? colors.due : colors.textTertiary} />
            <AppText variant="caption" numberOfLines={1} style={styles.shrink}>
              {`${text} · ${formatTime(lastActivity(entry), strings.locale)}`}
            </AppText>
          </View>
        </View>
        <View style={styles.amount}>
          <AppText variant="bodyStrong" color={open ? colors.due : colors.textSecondary} style={styles.figure}>
            {formatMoney(open ? entry.pending : entry.total)}
          </AppText>
          <AppText variant="caption" color={colors.textTertiary}>
            {open ? strings.ledger.pending : strings.ledger.settled}
          </AppText>
        </View>
      </Pressable>
      {expanded ? (
        <View style={styles.history}>
          {history(entry, strings).map((line, index) => (
            <View key={index} style={styles.line}>
              <AppText variant="caption" style={styles.shrink}>
                {line.text}
              </AppText>
              <AppText variant="caption" color={colors.textTertiary} style={styles.when}>
                {`${formatDayLabel(line.at, strings)}, ${formatTime(line.at, strings.locale)}`}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}
      {last ? null : <View style={styles.divider} />}
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    backgroundColor: colors.surface,
  },
  first: {
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
  },
  last: {
    borderBottomLeftRadius: radii.lg,
    borderBottomRightRadius: radii.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: INSET,
    paddingVertical: 14,
  },
  body: {
    flex: 1,
    gap: 3,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  shrink: {
    flexShrink: 1,
  },
  amount: {
    alignItems: 'flex-end',
    gap: 1,
  },
  figure: {
    fontVariant: ['tabular-nums'],
  },
  history: {
    gap: spacing.xs,
    marginTop: -spacing.xxs,
    paddingLeft: INSET + AVATAR + spacing.sm,
    paddingRight: INSET,
    paddingBottom: 14,
  },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  when: {
    flexShrink: 0,
  },
  divider: {
    position: 'absolute',
    left: INSET + AVATAR + spacing.sm,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
