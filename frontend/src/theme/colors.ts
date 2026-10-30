/**
 * Sky palette sampled from the listening-orb reference: deep daylight blue at
 * the top, a bright cloud bank and a soft periwinkle haze below it.
 */
export const sky = {
  deep: '#4675EC',
  horizon: '#5888F3',
  glow: '#6F9BFF',
  /** Light bloom around the orb while it is active. */
  halo: '#86ADFF',
  cloud: '#EAF0FF',
  haze: '#B6C8F9',
} as const;

export const colors = {
  background: '#000000',
  surface: '#0C0D12',
  surfaceRaised: '#13151C',
  border: 'rgba(255, 255, 255, 0.07)',
  borderStrong: 'rgba(255, 255, 255, 0.14)',

  text: '#F3F6FF',
  textSecondary: 'rgba(226, 233, 255, 0.64)',
  textTertiary: 'rgba(226, 233, 255, 0.40)',

  accent: sky.glow,
  accentSoft: 'rgba(111, 155, 255, 0.16)',
  accentText: '#AFC6FF',

  /** Dark ink used on light "cloud" surfaces such as the QR card. */
  ink: '#0B1636',

  /** Money a customer still owes. */
  due: '#A4C0FF',
} as const;
