import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { formatSignedMoney, formatTime } from '@/lib/format';
import type { LedgerEntry } from '@/types/ledger';
import { colors, radii, spacing } from '@/theme';

import { Avatar } from './avatar';

const AVATAR = 42;
const INSET = spacing.md;

type LedgerRowProps = {
  entry: LedgerEntry;
  first: boolean;
  last: boolean;
};

export function LedgerRow({ entry, first, last }: LedgerRowProps) {
  const incoming = entry.direction === 'in';
  const meta = [entry.note, formatTime(entry.createdAt)].filter(Boolean).join(' · ');

  return (
    <View style={[styles.row, first && styles.first, last && styles.last]}>
      <Avatar name={entry.party} size={AVATAR} />
      <View style={styles.body}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {entry.party}
        </AppText>
        <View style={styles.meta}>
          {entry.source !== 'manual' ? (
            <Icon
              name={entry.source === 'voice' ? 'voice' : 'qr'}
              size={13}
              color={colors.textTertiary}
            />
          ) : null}
          <AppText variant="caption" numberOfLines={1} style={styles.metaText}>
            {meta}
          </AppText>
        </View>
      </View>
      <AppText
        variant="bodyStrong"
        color={incoming ? colors.moneyIn : colors.moneyOut}
        style={styles.amount}>
        {formatSignedMoney(entry.amount, entry.direction)}
      </AppText>
      {last ? null : <View style={styles.divider} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: INSET,
    paddingVertical: 14,
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
  body: {
    flex: 1,
    gap: 3,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    flexShrink: 1,
  },
  amount: {
    fontVariant: ['tabular-nums'],
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
