export type HudThemeId = 'cyan' | 'stark-red' | 'gold' | 'stealth' | 'emerald';

export interface HudTheme {
  id: HudThemeId;
  name: string;
  suitTag: string;
  description: string;
  primary: string; // hex
  primaryRgb: string; // r, g, b
  primaryDim: string;
  secondary: string;
  accent: string;
  glow: string;
  bgBase: string;
  bgCard: string;
  bgSurface: string;
  borderAlpha: string;
  borderHighlight: string;
  badgeBg: string;
  swatches: string[];
}

export const HUD_THEMES: Record<HudThemeId, HudTheme> = {
  cyan: {
    id: 'cyan',
    name: 'Classic Cyan',
    suitTag: 'Mark III / VI Core',
    description: 'Iconic holographic cyan glow of the original Malibu workshop J.A.R.V.I.S.',
    primary: '#37e6ff',
    primaryRgb: '55, 230, 255',
    primaryDim: '#1b8fa8',
    secondary: '#8fc9dd',
    accent: '#5dffb0',
    glow: 'rgba(55, 230, 255, 0.45)',
    bgBase: '#04070d',
    bgCard: '#061019',
    bgSurface: '#091524',
    borderAlpha: 'rgba(55, 230, 255, 0.25)',
    borderHighlight: 'rgba(55, 230, 255, 0.7)',
    badgeBg: 'rgba(55, 230, 255, 0.15)',
    swatches: ['#37e6ff', '#1b8fa8', '#5dffb0', '#04070d'],
  },
  'stark-red': {
    id: 'stark-red',
    name: 'Stark Red',
    suitTag: 'Mark LXXXV Style',
    description: 'Crimson nanotechnology & gold accents of the flagship Endgame Mark 85 armor.',
    primary: '#ff3b3b',
    primaryRgb: '255, 59, 59',
    primaryDim: '#b91c1c',
    secondary: '#fbbf24',
    accent: '#f59e0b',
    glow: 'rgba(255, 59, 59, 0.5)',
    bgBase: '#0c0406',
    bgCard: '#18070b',
    bgSurface: '#240a10',
    borderAlpha: 'rgba(255, 59, 59, 0.3)',
    borderHighlight: 'rgba(255, 59, 59, 0.8)',
    badgeBg: 'rgba(255, 59, 59, 0.18)',
    swatches: ['#ff3b3b', '#fbbf24', '#f59e0b', '#0c0406'],
  },
  gold: {
    id: 'gold',
    name: 'Arc Gold',
    suitTag: 'Mark XXI Midas',
    description: 'Champagne gold and high-density alloy telemetry with titanium trim.',
    primary: '#fbbf24',
    primaryRgb: '251, 191, 36',
    primaryDim: '#b45309',
    secondary: '#fef08a',
    accent: '#38bdf8',
    glow: 'rgba(251, 191, 36, 0.45)',
    bgBase: '#0a0803',
    bgCard: '#171305',
    bgSurface: '#231c07',
    borderAlpha: 'rgba(251, 191, 36, 0.3)',
    borderHighlight: 'rgba(251, 191, 36, 0.8)',
    badgeBg: 'rgba(251, 191, 36, 0.18)',
    swatches: ['#fbbf24', '#d97706', '#fef08a', '#0a0803'],
  },
  stealth: {
    id: 'stealth',
    name: 'Stealth Amethyst',
    suitTag: 'Mark XL Shotgun',
    description: 'Deep violet optical cloaking with electric blue pulse signatures.',
    primary: '#c084fc',
    primaryRgb: '192, 132, 252',
    primaryDim: '#7e22ce',
    secondary: '#e9d5ff',
    accent: '#38bdf8',
    glow: 'rgba(192, 132, 252, 0.45)',
    bgBase: '#08040f',
    bgCard: '#120921',
    bgSurface: '#1d0e34',
    borderAlpha: 'rgba(192, 132, 252, 0.3)',
    borderHighlight: 'rgba(192, 132, 252, 0.8)',
    badgeBg: 'rgba(192, 132, 252, 0.18)',
    swatches: ['#c084fc', '#7e22ce', '#38bdf8', '#08040f'],
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Matrix',
    suitTag: 'Mark XXXVII Deep Sea',
    description: 'Sub-aquatic gamma-shielded emerald grid for deep pressurized diagnostics.',
    primary: '#10b981',
    primaryRgb: '16, 185, 129',
    primaryDim: '#047857',
    secondary: '#6ee7b7',
    accent: '#38bdf8',
    glow: 'rgba(16, 185, 129, 0.45)',
    bgBase: '#020a06',
    bgCard: '#05160d',
    bgSurface: '#092215',
    borderAlpha: 'rgba(16, 185, 129, 0.3)',
    borderHighlight: 'rgba(16, 185, 129, 0.8)',
    badgeBg: 'rgba(16, 185, 129, 0.18)',
    swatches: ['#10b981', '#047857', '#6ee7b7', '#020a06'],
  },
};

export function getHudTheme(themeId?: HudThemeId): HudTheme {
  if (themeId && HUD_THEMES[themeId]) {
    return HUD_THEMES[themeId];
  }
  return HUD_THEMES.cyan;
}
