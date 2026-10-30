import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radii, spacing } from '@/theme';

import { AppText } from './app-text';
import { Icon, type IconName } from './icon';

type PillButtonProps = {
  label: string;
  icon?: IconName;
  onPress?: () => void;
  tone?: 'neutral' | 'accent';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function PillButton({
  label,
  icon,
  onPress,
  tone = 'neutral',
  disabled,
  style,
}: PillButtonProps) {
  const color = tone === 'accent' ? colors.accentText : colors.text;
  return (
    <Pressable
      role="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.pill,
        tone === 'accent' && styles.accent,
        (pressed || disabled) && styles.dimmed,
        style,
      ]}>
      {icon ? <Icon name={icon} size={16} color={color} /> : null}
      <AppText variant="label" color={color}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 44,
    paddingHorizontal: spacing.md + 2,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  accent: {
    backgroundColor: colors.accentSoft,
    borderColor: 'rgba(150, 182, 255, 0.28)',
  },
  dimmed: {
    opacity: 0.6,
  },
});
