import React from 'react';
import { Smartphone, X, QrCode, Wifi, Mic } from 'lucide-react';

interface PhoneConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PhoneConnectModal: React.FC<PhoneConnectModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'http://localhost:3000';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#071019] border border-[#37e6ff]/40 rounded-2xl shadow-[0_0_35px_rgba(55,230,255,0.25)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#37e6ff]/25 bg-[#091624]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#37e6ff]/10 border border-[#37e6ff]/30 text-[#37e6ff]">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-orbitron text-base font-bold text-[#eafcff] tracking-wide">
                REMOTE PHONE CONTROL
              </h2>
              <p className="text-xs text-[#8fc9dd] font-mono-tech flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-[#5dffb0]" />
                Local Wi-Fi Network Interface
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8fc9dd] hover:text-white hover:bg-[#37e6ff]/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-center">
          <div className="p-4 bg-[#04080f] rounded-xl border border-[#37e6ff]/25 inline-block mx-auto shadow-[0_0_20px_rgba(55,230,255,0.15)]">
            <QrCode className="w-36 h-36 text-[#37e6ff] mx-auto p-2" />
            <div className="text-[11px] font-mono-tech text-[#8fc9dd] mt-1 break-all max-w-[220px]">
              {currentUrl}
            </div>
          </div>

          <div className="space-y-2 text-left bg-[#091624] p-4 rounded-xl border border-[#37e6ff]/20 text-xs text-[#d7f7ff] leading-relaxed">
            <h4 className="font-bold text-[#37e6ff] uppercase tracking-wider flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5" /> Hands-Free Mobile Walkie-Talkie
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-[#8fc9dd]">
              <li>Connect your phone to the same Wi-Fi network as this workstation.</li>
              <li>Scan the QR code or open the link above in Chrome/Safari on your phone.</li>
              <li>Enable the always-on microphone listener on your phone screen.</li>
              <li>Say <span className="text-[#37e6ff] font-semibold">“Hello JARVIS”</span> from anywhere in your home to dictate commands!</li>
            </ol>
          </div>
        </div>

        <div className="px-6 py-3.5 border-t border-[#37e6ff]/25 bg-[#091624] text-center text-xs text-[#8fc9dd]">
          Keep the browser tab active on your mobile device for uninterrupted wake-word detection.
        </div>
      </div>
    </div>
  );
};
