import React from 'react';

interface AudioVisualizerProps {
  isSpeaking: boolean;
  isListening: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isSpeaking, isListening }) => {
  if (!isSpeaking && !isListening) return null;

  return (
    <div className="flex items-center justify-center gap-1.5 h-6 px-3 py-1 rounded-full bg-[#04080f]/80 border border-[#37e6ff]/30 backdrop-blur-sm select-none">
      <span className="text-[10px] font-mono-tech mr-1 uppercase text-[#37e6ff]">
        {isSpeaking ? 'TRANSMITTING' : 'LISTENING'}
      </span>
      {[40, 75, 100, 60, 90, 45, 80, 55, 30].map((h, i) => (
        <span
          key={i}
          className={`w-[2.5px] rounded-full transition-all duration-150 ${
            isSpeaking ? 'bg-[#37e6ff]' : 'bg-[#5dffb0]'
          }`}
          style={{
            height: `${Math.max(6, (h * (isSpeaking ? 1 : 0.8)) / 4)}px`,
            animation: 'core-pulse 0.4s ease-in-out infinite alternate',
            animationDelay: `${i * 0.06}s`,
          }}
        />
      ))}
    </div>
  );
};
