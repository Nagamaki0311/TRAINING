import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme/tokens';

interface Props {
  visible: boolean;
  onClose: () => void;
  dailyTimeCapMinutes: number;
  onChangeDailyCap: (minutes: number) => void;
  onResetAll: () => void;
}

export function SettingsSheet({ visible, onClose, dailyTimeCapMinutes, onChangeDailyCap, onResetAll }: Props) {
  const [confirming, setConfirming] = useState(false);
  if (!visible) return null;
  return (
    <>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <Text style={styles.title}>設定</Text>

        <View style={styles.row}>
          <Text style={styles.label}>1日の上限時間</Text>
          <View style={styles.stepper}>
            <Pressable style={styles.stepBtn} onPress={() => onChangeDailyCap(Math.max(5, dailyTimeCapMinutes - 5))}>
              <Text style={styles.stepBtnText}>−</Text>
            </Pressable>
            <Text style={styles.stepValue}>{dailyTimeCapMinutes}分</Text>
            <Pressable style={styles.stepBtn} onPress={() => onChangeDailyCap(Math.min(60, dailyTimeCapMinutes + 5))}>
              <Text style={styles.stepBtnText}>＋</Text>
            </Pressable>
          </View>
        </View>

        {!confirming ? (
          <Pressable style={styles.dangerBtn} onPress={() => setConfirming(true)}>
            <Text style={styles.dangerText}>データを削除</Text>
          </Pressable>
        ) : (
          <View style={styles.confirmRow}>
            <Text style={styles.confirmText}>記録・PIN・プログラムをすべて削除します。よろしいですか？</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <Pressable style={styles.cancelBtn} onPress={() => setConfirming(false)}>
                <Text style={styles.cancelText}>キャンセル</Text>
              </Pressable>
              <Pressable
                style={styles.dangerBtn}
                onPress={() => {
                  setConfirming(false);
                  onResetAll();
                }}
              >
                <Text style={styles.dangerText}>削除する</Text>
              </Pressable>
            </View>
          </View>
        )}

        <Pressable style={styles.closeCta} onPress={onClose}>
          <Text style={styles.closeCtaText}>閉じる</Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,.64)', zIndex: 8 },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9,
    backgroundColor: colors.bgSheet,
    borderTopWidth: 1,
    borderColor: colors.hairlineStrong,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 28,
  },
  title: { fontFamily: fonts.jpBlack, fontSize: 18, color: colors.text, marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  label: { fontFamily: fonts.jp, fontSize: 13, color: colors.textDim1 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { color: colors.textDim1, fontSize: 18 },
  stepValue: { fontFamily: fonts.numericBold, fontSize: 18, color: colors.text, minWidth: 48, textAlign: 'center' },
  dangerBtn: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,77,46,.4)',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  dangerText: { fontFamily: fonts.jpBold, fontSize: 13, color: colors.danger },
  confirmRow: { marginTop: 4 },
  confirmText: { fontFamily: fonts.jpRegular, fontSize: 12, color: colors.textDim1, lineHeight: 18 },
  cancelBtn: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  cancelText: { fontFamily: fonts.jp, fontSize: 13, color: colors.textDim1 },
  closeCta: { marginTop: 18, height: 48, borderRadius: 12, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center' },
  closeCtaText: { fontFamily: fonts.jpBlack, fontSize: 14, color: '#04120F' },
});
