import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { initials } from '@/lib/format';
import { colors, fonts, sky } from '@/theme';

type AvatarProps = {
  name: string;
  size?: number;
};

/** Initials inside a thin sky-gradient ring. */
export function Avatar({ name, size = 42 }: AvatarProps) {
  const round = { width: size, height: size, borderRadius: size / 2 };
  return (
    <LinearGradient
      colors={[sky.deep, sky.cloud]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[styles.ring, round]}>
      <View style={styles.face}>
        <AppText style={styles.initials}>{initials(name)}</AppText>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  ring: {
    padding: 1.5,
  },
  face: {
    flex: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
  },
  initials: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.4,
    color: colors.text,
  },
});
