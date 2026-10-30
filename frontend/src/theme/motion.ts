import type { WithSpringConfig } from 'react-native-reanimated';

export const springs = {
  /** Sliding indicators in the tab bar and segmented controls. */
  indicator: { damping: 20, stiffness: 220, mass: 0.9 },
  /** Press-down feedback on large touch targets. */
  press: { damping: 16, stiffness: 320 },
} satisfies Record<string, WithSpringConfig>;
