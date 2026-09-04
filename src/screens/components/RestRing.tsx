import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, fonts } from '../../theme/tokens';

interface Props {
  progress: number; // 0..1、1が満タン(休息開始直後)
  color: string;
  clockLabel: string;
}

const SIZE = 220;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function RestRing({ progress, color, clockLabel }: Props) {
  const offset = CIRCUMFERENCE * (1 - Math.max(0, Math.min(1, progress)));
  return (
    <View style={styles.wrap}>
      <Svg width={SIZE} height={SIZE}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke="rgba(255,255,255,.08)"
          strokeWidth={STROKE}
          fill="none"
        />
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={color}
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${SIZE / 2}, ${SIZE / 2}`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={styles.clock}>{clockLabel}</Text>
        <Text style={styles.caption}>残り休息</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  center: { position: 'absolute', alignItems: 'center' },
  clock: { fontFamily: fonts.numericBold, fontSize: 68, color: colors.text, lineHeight: 68 },
  caption: { fontFamily: fonts.jp, fontSize: 10, letterSpacing: 2, color: colors.textDim3, marginTop: 2 },
});
