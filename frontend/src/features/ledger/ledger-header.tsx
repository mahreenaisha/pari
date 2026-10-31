import { StyleSheet, View } from 'react-native';

import { SkyOrb } from '@/components/sky/sky-orb';
import { AppText } from '@/components/ui/app-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SegmentedControl, type SegmentOption } from '@/components/ui/segmented-control';
import { useStrings } from '@/i18n/use-strings';
import { formatMoney, formatMonth } from '@/lib/format';
import { useContentWidth } from '@/lib/use-content-width';
import type { LedgerSummary } from '@/types/ledger';
import { colors, radii, screenPadding, spacing } from '@/theme';

import type { LedgerFilter } from './use-ledger';

const FILTERS: readonly LedgerFilter[] = ['all', 'open', 'closed'];

type LedgerHeaderProps = {
  summary?: LedgerSummary;
  filter: LedgerFilter;
  onFilterChange: (filter: LedgerFilter) => void;
};

export function LedgerHeader({ summary, filter, onFilterChange }: LedgerHeaderProps) {
  const width = useContentWidth();
  const strings = useStrings();
  const orbSize = Math.round(Math.min(width * 0.6, 300));
  const filters: SegmentOption<LedgerFilter>[] = FILTERS.map((value) => ({
    value,
    label: strings.ledger.filters[value],
  }));

  return (
    <View style={styles.header}>
      <SkyOrb
        size={orbSize}
        glow={0.14}
        style={[styles.orb, { top: -orbSize * 0.46, right: -screenPadding - orbSize * 0.34 }]}
      />

      <ScreenHeader overline={formatMonth(strings.locale)} title={strings.ledger.title} />

      <View style={styles.balance}>
        <AppText variant="caption">{strings.ledger.toCollect}</AppText>
        <AppText variant="display" style={styles.figure}>
          {summary ? formatMoney(summary.toCollect) : '—'}
        </AppText>
      </View>

      <View style={styles.stats}>
        <Stat
          icon="moneyIn"
          label={strings.ledger.collectedToday}
          value={summary ? formatMoney(summary.collectedToday) : undefined}
          color={colors.text}
        />
        <Stat
          icon="open"
          label={strings.ledger.openEntries}
          value={summary ? String(summary.openCount) : undefined}
          color={colors.due}
        />
      </View>

      <SegmentedControl options={filters} value={filter} onChange={onFilterChange} />
    </View>
  );
}

type StatProps = {
  icon: IconName;
  label: string;
  value?: string;
  color: string;
};

function Stat({ icon, label, value, color }: StatProps) {
  return (
    <View style={styles.stat}>
      <View style={styles.statLabel}>
        <View style={styles.statIcon}>
          <Icon name={icon} size={13} color={color} />
        </View>
        <AppText variant="caption">{label}</AppText>
      </View>
      <AppText variant="bodyStrong" color={color} style={styles.statValue}>
        {value ?? '—'}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.lg,
    paddingBottom: spacing.xs,
  },
  orb: {
    position: 'absolute',
  },
  balance: {
    gap: spacing.xxs,
    marginTop: spacing.xs,
  },
  figure: {
    fontVariant: ['tabular-nums'],
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stat: {
    flex: 1,
    justifyContent: 'space-between',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  statLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  statValue: {
    fontSize: 18,
    lineHeight: 24,
    fontVariant: ['tabular-nums'],
  },
});
