import React from 'react';
import { HudTheme, HUD_THEMES } from '../theme/hudThemes';

interface AudioVisualizerProps {
  isSpeaking: boolean;
  isListening: boolean;
  theme?: HudTheme;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isSpeaking,
  isListening,
  theme = HUD_THEMES.cyan,
}) => {
  if (!isSpeaking && !isListening) return null;

  return (
    <div
      className="flex items-center justify-center gap-1.5 h-6 px-3 py-1 rounded-full border backdrop-blur-sm select-none"
      style={{
        backgroundColor: `${theme.bgBase}cc`,
        borderColor: theme.borderAlpha,
        boxShadow: `0 0 10px ${theme.glow}`,
      }}
    >
      <span
        className="text-[10px] font-mono-tech mr-1 uppercase font-bold"
        style={{ color: theme.primary }}
      >
        {isSpeaking ? 'TRANSMITTING' : 'LISTENING'}
      </span>
      {[40, 75, 100, 60, 90, 45, 80, 55, 30].map((h, i) => (
        <span
          key={i}
          className="w-[2.5px] rounded-full transition-all duration-150"
          style={{
            backgroundColor: isSpeaking ? theme.primary : theme.accent,
            boxShadow: isSpeaking ? `0 0 6px ${theme.primary}` : `0 0 6px ${theme.accent}`,
            height: `${Math.max(6, (h * (isSpeaking ? 1 : 0.8)) / 4)}px`,
            animation: 'core-pulse 0.4s ease-in-out infinite alternate',
            animationDelay: `${i * 0.06}s`,
          }}
        />
      ))}
    </div>
  );
};
