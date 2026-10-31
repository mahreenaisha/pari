import { useState } from 'react';
import { RefreshControl, SectionList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTabBarInset } from '@/components/navigation/tab-bar-inset';
import { AppText } from '@/components/ui/app-text';
import { PillButton } from '@/components/ui/pill-button';
import { useStrings } from '@/i18n/use-strings';
import { colors, radii, screenPadding, spacing } from '@/theme';

import { LedgerHeader } from './ledger-header';
import { LedgerRow } from './ledger-row';
import { groupByDay, summarize, useLedgerEntries, type LedgerFilter } from './use-ledger';

export function LedgerScreen() {
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabBarInset();
  const strings = useStrings();
  const [filter, setFilter] = useState<LedgerFilter>('all');
  const { data, isPending, isError, isRefetching, refetch } = useLedgerEntries();

  const sections = data ? groupByDay(data, filter, strings) : [];
  const summary = data ? summarize(data) : undefined;

  return (
    <View style={styles.screen}>
      <SectionList
        sections={sections}
        keyExtractor={(entry) => entry.id}
        renderItem={({ item, index, section }) => (
          <LedgerRow entry={item} first={index === 0} last={index === section.data.length - 1} />
        )}
        renderSectionHeader={({ section }) => (
          <AppText variant="overline" style={styles.sectionTitle}>
            {section.title}
          </AppText>
        )}
        ListHeaderComponent={
          <LedgerHeader summary={summary} filter={filter} onFilterChange={setFilter} />
        }
        ListEmptyComponent={
          isPending ? (
            <LoadingRows />
          ) : isError ? (
            <View style={styles.message}>
              <AppText variant="body" align="center" color={colors.textSecondary}>
                {strings.ledger.loadFailed}
              </AppText>
              <PillButton label={strings.common.tryAgain} onPress={() => void refetch()} />
            </View>
          ) : (
            <View style={styles.message}>
              <AppText variant="body" align="center" color={colors.textSecondary}>
                {strings.ledger.empty[filter]}
              </AppText>
            </View>
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={colors.textSecondary}
            colors={[colors.accent]}
            progressBackgroundColor={colors.surfaceRaised}
          />
        }
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + spacing.sm,
          paddingBottom: tabBarInset + spacing.md,
          paddingHorizontal: screenPadding,
        }}
      />
    </View>
  );
}

function LoadingRows() {
  return (
    <View style={styles.skeleton}>
      {[0, 1, 2, 3].map((row) => (
        <View key={row} style={styles.skeletonRow}>
          <View style={styles.skeletonAvatar} />
          <View style={styles.skeletonLines}>
            <View style={[styles.skeletonLine, { width: '55%' }]} />
            <View style={[styles.skeletonLine, { width: '35%', opacity: 0.6 }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  sectionTitle: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.xxs,
  },
  message: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  skeleton: {
    marginTop: spacing.xl,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    paddingVertical: spacing.xs,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  skeletonAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceRaised,
  },
  skeletonLines: {
    flex: 1,
    gap: spacing.xs,
  },
  skeletonLine: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.surfaceRaised,
  },
});
