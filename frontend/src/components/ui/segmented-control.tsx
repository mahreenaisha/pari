import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { colors, radii, springs } from '@/theme';

import { AppText } from './app-text';
import { Icon, type IconName } from './icon';

const PADDING = 4;

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
  icon?: IconName;
};

type SegmentedControlProps<T extends string> = {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  style,
}: SegmentedControlProps<T>) {
  const [trackWidth, setTrackWidth] = useState(0);
  const segmentWidth = trackWidth / options.length;
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  const x = useSharedValue(0);
  useEffect(() => {
    if (segmentWidth > 0) x.set(withSpring(selectedIndex * segmentWidth, springs.indicator));
  }, [segmentWidth, selectedIndex, x]);

  const indicatorStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View
      role="tablist"
      style={[styles.track, style]}
      onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width - PADDING * 2)}>
      {segmentWidth > 0 && (
        <Animated.View style={[styles.indicator, { width: segmentWidth }, indicatorStyle]} />
      )}
      {options.map((option) => {
        const selected = option.value === value;
        const color = selected ? colors.text : colors.textSecondary;
        return (
          <Pressable
            key={option.value}
            role="tab"
            aria-selected={selected}
            onPress={() => {
              if (selected) return;
              if (process.env.EXPO_OS !== 'web') void Haptics.selectionAsync();
              onChange(option.value);
            }}
            style={styles.segment}>
            {option.icon ? <Icon name={option.icon} size={16} color={color} /> : null}
            <AppText variant="label" color={color}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    height: 44,
    padding: PADDING,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  indicator: {
    position: 'absolute',
    top: PADDING,
    bottom: PADDING,
    left: PADDING,
    borderRadius: radii.pill,
    backgroundColor: colors.accentSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(150, 182, 255, 0.28)',
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});
