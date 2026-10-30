import { BlurMask, Canvas, Circle, Group, Shader, vec } from '@shopify/react-native-skia';
import { useIsFocused } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import {
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import { sky } from '@/theme';

import { skyEffect } from './sky-shader';

export type SkyOrbProps = {
  size: number;
  /** 0 calm → 1 fully active. Speeds up the clouds and brings out the halo. */
  energy?: SharedValue<number>;
  /** 0–1 live input loudness; swells the orb while it is active. */
  level?: SharedValue<number>;
  /** Resting halo strength, 0–1. */
  glow?: number;
  ripples?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Rendered centred on top of the orb; unaffected by its breathing. */
  children?: ReactNode;
};

/** The canvas extends past the orb on every side to leave room for the halo and ripples. */
const BLEED = 0.34;
const RIPPLE_PHASES = [0, 0.5];

export function SkyOrb({
  size,
  energy,
  level,
  glow = 0.12,
  ripples = false,
  style,
  children,
}: SkyOrbProps) {
  const isFocused = useIsFocused();
  const resting = useSharedValue(0);
  const activity = energy ?? resting;
  const loudness = level ?? resting;

  const bleed = Math.ceil(size * BLEED);
  const canvasSize = size + bleed * 2;
  const center = canvasSize / 2;
  const radius = size / 2;

  const time = useSharedValue(0);
  const clock = useFrameCallback((frame) => {
    const dt = Math.min(frame.timeSincePreviousFrame ?? 16, 50) / 1000;
    time.value += dt * (1 + activity.value * 2.2);
  }, false);

  useEffect(() => {
    clock.setActive(isFocused);
    return () => clock.setActive(false);
  }, [clock, isFocused]);

  const uniforms = useDerivedValue(() => ({
    uCenter: [center, center],
    uRadius: radius,
    uTime: time.value,
    uEnergy: activity.value,
  }));

  const scale = useDerivedValue(() => {
    const breath = Math.sin(time.value * 0.8) * 0.008;
    return 1 + breath + activity.value * (0.015 + loudness.value * 0.05);
  });
  const transform = useDerivedValue(() => [{ scale: scale.value }]);

  const glowRadius = useDerivedValue(() => radius * (0.98 + activity.value * 0.06) * scale.value);
  const glowOpacity = useDerivedValue(() =>
    Math.min(1, glow + activity.value * (0.55 + loudness.value * 0.35)),
  );

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Canvas
        style={{
          position: 'absolute',
          left: -bleed,
          top: -bleed,
          width: canvasSize,
          height: canvasSize,
          pointerEvents: 'none',
        }}>
        {ripples &&
          RIPPLE_PHASES.map((phase) => (
            <Ripple
              key={phase}
              phase={phase}
              center={center}
              radius={radius}
              time={time}
              activity={activity}
              scale={scale}
            />
          ))}
        <Circle cx={center} cy={center} r={glowRadius} color={sky.halo} opacity={glowOpacity}>
          <BlurMask blur={size * 0.09} style="normal" />
        </Circle>
        <Group transform={transform} origin={vec(center, center)}>
          <Circle cx={center} cy={center} r={radius}>
            <Shader source={skyEffect} uniforms={uniforms} />
          </Circle>
        </Group>
      </Canvas>
      {children ? (
        <View style={styles.content}>
          {children}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'box-none',
  },
});

type RippleProps = {
  phase: number;
  center: number;
  radius: number;
  time: SharedValue<number>;
  activity: SharedValue<number>;
  scale: SharedValue<number>;
};

function Ripple({ phase, center, radius, time, activity, scale }: RippleProps) {
  const progress = useDerivedValue(() => (time.value * 0.12 + phase) % 1);
  const r = useDerivedValue(() => radius * scale.value * (1.03 + progress.value * 0.26));
  const opacity = useDerivedValue(() => (1 - progress.value) ** 2 * activity.value ** 2 * 0.5);

  return (
    <Circle
      cx={center}
      cy={center}
      r={r}
      style="stroke"
      strokeWidth={1.2}
      color={sky.cloud}
      opacity={opacity}
    />
  );
}
