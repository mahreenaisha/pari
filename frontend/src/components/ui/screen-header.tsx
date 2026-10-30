import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { spacing } from '@/theme';

import { AppText } from './app-text';

type ScreenHeaderProps = {
  overline?: string;
  title: string;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function ScreenHeader({ overline, title, right, style }: ScreenHeaderProps) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.titles}>
        {overline ? <AppText variant="overline">{overline}</AppText> : null}
        <AppText variant="title" accessibilityRole="header">
          {title}
        </AppText>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  titles: {
    flexShrink: 1,
    gap: spacing.xs,
  },
});
