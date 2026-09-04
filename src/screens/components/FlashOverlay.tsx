import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { fonts } from '../../theme/tokens';
import type { FlashState } from '../../state/AppState';

export function FlashOverlay({ flash }: { flash: FlashState | null }) {
  const scale = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!flash) return;
    scale.setValue(0.85);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6, tension: 90 }),
      Animated.timing(opacity, { toValue: 1, duration: 140, useNativeDriver: true }),
    ]).start();
  }, [flash]);

  if (!flash) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        { backgroundColor: flash.color, opacity, transform: [{ scale }] },
      ]}
    >
      <Text style={styles.label}>{flash.label}</Text>
      <Text style={styles.sub}>{flash.sub}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '38%',
    height: 118,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  label: { fontFamily: fonts.numeric, fontSize: 44, color: '#0A0505', letterSpacing: -1 },
  sub: {
    fontFamily: fonts.jpBlack,
    fontSize: 14,
    color: '#0A0505',
    backgroundColor: 'rgba(255,255,255,.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    overflow: 'hidden',
  },
});
