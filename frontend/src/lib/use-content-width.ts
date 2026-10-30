import { useWindowDimensions } from 'react-native';

import { maxContentWidth } from '@/theme';

/** Width of the app column, which is narrower than the window on tablets and desktop browsers. */
export function useContentWidth() {
  const { width } = useWindowDimensions();
  return Math.min(width, maxContentWidth);
}
