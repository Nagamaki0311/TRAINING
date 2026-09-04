// デザイントークン。出典: project/Training App プロトタイプ.dc.html（Claude Design成果物）
// カテゴリカラー・グロー・アニメーション秒数はここに集約し、画面側では参照のみ行う。

export const colors = {
  bg: '#05060A',
  bgPanel: '#0C0D10',
  bgPanel2: '#0C0D11',
  bgSheet: '#0E1015',
  bgCard: '#0A0A0D',
  text: '#FFFFFF',
  textDim1: 'rgba(255,255,255,.7)',
  textDim2: 'rgba(255,255,255,.5)',
  textDim3: 'rgba(255,255,255,.4)',
  textDim4: 'rgba(255,255,255,.32)',
  hairline: 'rgba(255,255,255,.08)',
  hairlineStrong: 'rgba(255,255,255,.16)',
  teal: '#00E5C7',
  tealGlow: 'rgba(0,229,199,.3)',
  gold: '#FFC53D',
  goldGlow: 'rgba(255,197,61,.3)',
  danger: '#FF4D2E',
} as const;

export type CategoryKey = 'chest' | 'core' | 'arms' | 'back';

export const categoryTokens: Record<
  CategoryKey,
  { name: string; en: string; kanji: string; color: string; glow: string; fg: string }
> = {
  chest: { name: '大胸筋爆発', en: 'CHEST', kanji: '胸', color: '#FF4D2E', glow: 'rgba(255,77,46,.32)', fg: '#0A0505' },
  core: { name: '腹筋崩壊', en: 'CORE', kanji: '腹', color: '#00E5C7', glow: 'rgba(0,229,199,.3)', fg: '#04120F' },
  arms: { name: '両腕山脈', en: 'ARMS', kanji: '腕', color: '#FFC53D', glow: 'rgba(255,197,61,.3)', fg: '#120C02' },
  back: { name: '背筋鬼面', en: 'BACK', kanji: '背', color: '#7C6BFF', glow: 'rgba(124,107,255,.3)', fg: '#0A0812' },
};

export const fonts = {
  jp: 'ZenKakuGothicNew_500Medium',
  jpBold: 'ZenKakuGothicNew_700Bold',
  jpBlack: 'ZenKakuGothicNew_900Black',
  jpRegular: 'ZenKakuGothicNew_400Regular',
  label: 'Barlow_600SemiBold',
  labelBold: 'Barlow_700Bold',
  numeric: 'BarlowCondensed_700Bold_Italic',
  numericBold: 'BarlowCondensed_700Bold',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 } as const;

export const motion = {
  breathe: 2200,
  breatheSlow: 2600,
  flash: 260,
  riseIn: 240,
  flick: 3400,
  pulse: 1100,
  easeOutSlam: [0.2, 0.9, 0.2, 1] as const,
};

// docs/training-science.md 5章「疲労・体調・ディロード」参照。1(楽)〜5(限界)の体感疲労度スケール。
export const FATIGUE_SCALE = [1, 2, 3, 4, 5] as const;
