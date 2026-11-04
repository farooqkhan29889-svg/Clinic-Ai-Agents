import React from 'react';
import { HudTheme, HUD_THEMES } from '../theme/hudThemes';

interface ArcReactorProps {
  isSpeaking: boolean;
  isListening: boolean;
  isWakeArmed?: boolean;
  onClick?: () => void;
  size?: number;
  theme?: HudTheme;
}

export const ArcReactor: React.FC<ArcReactorProps> = ({
  isSpeaking,
  isListening,
  isWakeArmed,
  onClick,
  size = 76,
  theme = HUD_THEMES.cyan,
}) => {
  const primaryColor = theme.primary;
  const secondaryColor = theme.secondary;
  const glowColor = theme.glow;

  return (
    <div
      onClick={onClick}
      title="J.A.R.V.I.S. Mark Core — Click to speak"
      className="relative cursor-pointer transition-transform duration-300 hover:scale-105 select-none"
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      {/* Outer Ring */}
      <div
        className="absolute inset-0 rounded-full border-2 animate-spin-clockwise"
        style={{
          borderColor: `${primaryColor}40`,
          borderTopColor: primaryColor,
          boxShadow: isWakeArmed
            ? '0 0 16px #f2b23e'
            : isSpeaking
            ? `0 0 24px ${primaryColor}, inset 0 0 12px ${primaryColor}`
            : `0 0 10px ${glowColor}`,
        }}
      />

      {/* Middle Counter-Rotating Ring */}
      <div
        className="absolute rounded-full border border-transparent animate-spin-counter"
        style={{
          inset: `${size * 0.15}px`,
          borderRightColor: primaryColor,
          borderBottomColor: `${secondaryColor}60`,
        }}
      />

      {/* Inner Fast Ring */}
      <div
        className="absolute rounded-full border-2 border-transparent animate-spin-fast"
        style={{
          inset: `${size * 0.28}px`,
          borderTopColor: primaryColor,
          borderLeftColor: `${primaryColor}cc`,
        }}
      />

      {/* Glowing Arc Core */}
      <div
        className={`absolute rounded-full transition-all duration-300 ${
          isSpeaking
            ? 'animate-core-speaking'
            : isListening
            ? 'scale-110 shadow-[0_0_25px_#5dffb0]'
            : isWakeArmed
            ? 'shadow-[0_0_25px_#f2b23e]'
            : 'animate-core-idle'
        }`}
        style={{
          inset: `${size * 0.38}px`,
          background: isWakeArmed
            ? 'radial-gradient(circle, #ffffff, #f2b23e 55%, rgba(242,178,62,0) 75%)'
            : isListening
            ? 'radial-gradient(circle, #ffffff, #5dffb0 55%, rgba(93,255,176,0) 75%)'
            : `radial-gradient(circle, #ffffff, ${primaryColor} 55%, ${secondaryColor} 75%, transparent 100%)`,
          boxShadow: isSpeaking
            ? `0 0 28px #ffffff, 0 0 65px ${primaryColor}`
            : isWakeArmed
            ? '0 0 20px #f2b23e, 0 0 40px rgba(242,178,62,0.8)'
            : `0 0 18px ${primaryColor}, 0 0 40px ${glowColor}`,
        }}
      />

      {/* Crosshairs & HUD ticks */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-60">
        <div
          className="w-full h-[1px]"
          style={{
            background: `linear-gradient(to right, transparent, ${primaryColor}66, transparent)`,
          }}
        />
      </div>
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-60">
        <div
          className="h-full w-[1px]"
          style={{
            background: `linear-gradient(to bottom, transparent, ${primaryColor}66, transparent)`,
          }}
        />
      </div>
    </div>
  );
};
