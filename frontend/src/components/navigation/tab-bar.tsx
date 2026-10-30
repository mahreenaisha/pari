import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import { colors, fonts, radii, springs } from '@/theme';

import { TAB_BAR_HEIGHT, useTabBarOffset } from './tab-bar-inset';

const BAR_PADDING = 6;
const ICON_SIZE = 22;
/** How far above the bar scrolling content starts fading out. */
const SCRIM_LEAD = 28;

export function TabBar({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const bottom = useTabBarOffset();
  const [trackWidth, setTrackWidth] = useState(0);
  const itemWidth = trackWidth / state.routes.length;

  const indicatorX = useSharedValue(0);
  const hasLayout = itemWidth > 0;

  useEffect(() => {
    if (!hasLayout) return;
    indicatorX.set(withSpring(state.index * itemWidth, springs.indicator));
  }, [hasLayout, indicatorX, itemWidth, state.index]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  return (
    <View style={[styles.wrapper, { paddingBottom: bottom }]}>
      <View style={[styles.scrim, { height: bottom + TAB_BAR_HEIGHT + SCRIM_LEAD }]}>
        <LinearGradient
          colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.86)', colors.background]}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <View
        style={styles.bar}
        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width - BAR_PADDING * 2)}>
        {hasLayout && (
          <Animated.View style={[styles.indicator, { width: itemWidth }, indicatorStyle]} />
        )}

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const color = focused ? colors.text : colors.textTertiary;
          const label = typeof options.title === 'string' ? options.title : route.name;

          const onPress = () => {
            const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (focused || event.defaultPrevented) return;
            if (process.env.EXPO_OS !== 'web') void Haptics.selectionAsync();
            navigateToTab(route.key);
          };

          return (
            <Pressable
              key={route.key}
              role="tab"
              aria-selected={focused}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              onPress={onPress}
              onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}
              style={styles.item}>
              <View>
                {options.tabBarIcon?.({ focused, color, size: ICON_SIZE })}
                {options.tabBarBadge === undefined ? null : <View style={styles.badge} />}
              </View>
              <AppText variant="caption" color={color} style={styles.label}>
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: 28,
    pointerEvents: 'box-none',
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  bar: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 380,
    height: TAB_BAR_HEIGHT,
    padding: BAR_PADDING,
    borderRadius: radii.pill,
    backgroundColor: '#0D0E13',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)',
  },
  indicator: {
    position: 'absolute',
    top: BAR_PADDING,
    bottom: BAR_PADDING,
    left: BAR_PADDING,
    borderRadius: radii.pill,
    backgroundColor: colors.accentSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(150, 182, 255, 0.28)',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    lineHeight: 14,
  },
  badge: {
    position: 'absolute',
    top: -1,
    right: -4,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: colors.accent,
    borderWidth: 1.5,
    borderColor: '#0D0E13',
  },
});
