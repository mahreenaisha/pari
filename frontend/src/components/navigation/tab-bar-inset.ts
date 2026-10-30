import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing } from '@/theme';

export const TAB_BAR_HEIGHT = 64;

export function useTabBarOffset() {
  const insets = useSafeAreaInsets();
  return Math.max(insets.bottom - 4, spacing.md);
}

/** Space a screen should leave at the bottom so content clears the floating tab bar. */
export function useTabBarInset() {
  return useTabBarOffset() + TAB_BAR_HEIGHT + spacing.md;
}
