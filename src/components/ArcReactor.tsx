import React from 'react';

interface ArcReactorProps {
  isSpeaking: boolean;
  isListening: boolean;
  isWakeArmed?: boolean;
  onClick?: () => void;
  size?: number;
}

export const ArcReactor: React.FC<ArcReactorProps> = ({
  isSpeaking,
  isListening,
  isWakeArmed,
  onClick,
  size = 76,
}) => {
  return (
    <div
      onClick={onClick}
      title="J.A.R.V.I.S. Mark Core — Click to speak"
      className="relative cursor-pointer transition-transform duration-300 hover:scale-105 select-none"
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      {/* Outer Ring */}
      <div
        className={`absolute inset-0 rounded-full border-2 border-[#37e6ff]/35 border-t-[#37e6ff] animate-spin-clockwise`}
        style={{
          boxShadow: isWakeArmed
            ? '0 0 16px #f2b23e'
            : isSpeaking
            ? '0 0 24px #37e6ff, inset 0 0 12px #37e6ff'
            : '0 0 8px rgba(55,230,255,0.4)',
        }}
      />

      {/* Middle Counter-Rotating Ring */}
      <div
        className="absolute rounded-full border border-transparent border-r-[#37e6ff] border-b-[#37e6ff]/40 animate-spin-counter"
        style={{ inset: `${size * 0.15}px` }}
      />

      {/* Inner Fast Ring */}
      <div
        className="absolute rounded-full border-2 border-transparent border-t-[#37e6ff] border-l-[#37e6ff]/80 animate-spin-fast"
        style={{ inset: `${size * 0.28}px` }}
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
            : 'radial-gradient(circle, #ffffff, #37e6ff 55%, rgba(55,230,255,0) 75%)',
          boxShadow: isSpeaking
            ? '0 0 28px #ffffff, 0 0 65px #37e6ff'
            : isWakeArmed
            ? '0 0 20px #f2b23e, 0 0 40px rgba(242,178,62,0.8)'
            : '0 0 18px #37e6ff, 0 0 40px rgba(55,230,255,0.7)',
        }}
      />

      {/* Crosshairs & HUD ticks */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-60">
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#37e6ff]/40 to-transparent" />
      </div>
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-60">
        <div className="h-full w-[1px] bg-gradient-to-b from-transparent via-[#37e6ff]/40 to-transparent" />
      </div>
    </div>
  );
};
