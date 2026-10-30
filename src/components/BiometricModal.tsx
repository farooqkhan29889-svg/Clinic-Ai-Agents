import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle, X, Lock, Sparkles, Smartphone } from 'lucide-react';

interface BiometricModalProps {
  isOpen: boolean;
  mode: 'login' | 'enroll' | 'test';
  biometricType?: 'faceId' | 'fingerprint' | 'both';
  patientName?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const BiometricModal: React.FC<BiometricModalProps> = ({
  isOpen,
  mode,
  biometricType = 'faceId',
  patientName = 'Patient',
  onSuccess,
  onCancel,
}) => {
  const [step, setStep] = useState<'scanning' | 'verifying' | 'success' | 'failed'>('scanning');
  const [progress, setProgress] = useState(0);

  // Play subtle audio chime on success using Web Audio API
  const playSuccessChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc.frequency.exponentialRampToValueAtTime(880.0, ctx.currentTime + 0.1); // A5

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // Audio not permitted or supported
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setStep('scanning');
      setProgress(0);
      return;
    }

    setStep('scanning');
    setProgress(15);

    // Simulate scanning phase
    const t1 = setTimeout(() => {
      setProgress(55);
      setStep('verifying');
    }, 600);

    // Simulate cryptographic verification
    const t2 = setTimeout(() => {
      setProgress(100);
      setStep('success');
      playSuccessChime();
      try {
        if (navigator.vibrate) navigator.vibrate([35, 40, 35]);
      } catch {}
    }, 1300);

    // Automatically trigger onSuccess after showing the success checkmark
    const t3 = setTimeout(() => {
      onSuccess();
    }, 2000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isFace = biometricType === 'faceId' || biometricType === 'both';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-[#1a1412] border border-[#e2d5cd] dark:border-[#382b24] shadow-2xl p-6 text-center overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-gradient-to-b from-[#c85d38]/20 to-transparent rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#786b65] hover:text-[#481e0b] dark:text-[#a89991] dark:hover:text-white hover:bg-[#f3ede8] dark:hover:bg-[#2a201b] transition-colors cursor-pointer"
          aria-label="Cancel biometric verification"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Secure Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fdf2ec] dark:bg-[#2c1c14] border border-[#f2d0c2] dark:border-[#522b1c] text-[#a84724] dark:text-[#f38360] text-[11px] font-bold uppercase tracking-wider mb-4">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>CityCare Secure Enclave</span>
        </div>

        {/* Biometric Interactive Scanner Graphic */}
        <div className="relative w-28 h-28 mx-auto my-3 flex items-center justify-center">
          {/* Outer Scanner Reticle / Pulsing Ring */}
          <div
            className={`absolute inset-0 rounded-3xl border-2 transition-all duration-500 ${
              step === 'success'
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 scale-105 shadow-[0_0_25px_rgba(16,185,129,0.3)]'
                : step === 'verifying'
                  ? 'border-[#c85d38] animate-pulse bg-[#c85d38]/5 shadow-[0_0_20px_rgba(200,93,56,0.25)]'
                  : 'border-[#c85d38]/60 animate-[pulse_1.5s_infinite]'
            }`}
          />

          {/* Scanning Beam (Line that sweeps vertically during scanning) */}
          {(step === 'scanning' || step === 'verifying') && (
            <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-[#c85d38] to-transparent animate-[bounce_1.2s_infinite] shadow-[0_0_8px_#c85d38]" />
          )}

          {/* Sensor Center Icon */}
          {step === 'success' ? (
            <div className="relative animate-in zoom-in-75 duration-300">
              <CheckCircle2 className="w-14 h-14 text-emerald-500 drop-shadow-sm" />
            </div>
          ) : isFace ? (
            /* FaceID Sensor SVG */
            <svg
              className={`w-14 h-14 text-[#c85d38] transition-all duration-300 ${
                step === 'verifying' ? 'scale-110' : 'scale-100'
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Corner brackets */}
              <path d="M4 8V6a2 2 0 0 1 2-2h2" />
              <path d="M16 4h2a2 2 0 0 1 2 2v2" />
              <path d="M20 16v2a2 2 0 0 1-2 2h-2" />
              <path d="M8 20H6a2 2 0 0 1-2-2v-2" />
              {/* Eyes and Smile */}
              <circle cx="9" cy="10" r="1" fill="currentColor" />
              <circle cx="15" cy="10" r="1" fill="currentColor" />
              <path d="M9.5 15.5c1.5 1 3.5 1 5 0" />
              {/* Center targeting nose pip */}
              <path d="M12 11v2" />
            </svg>
          ) : (
            /* TouchID / Fingerprint Sensor SVG */
            <svg
              className={`w-14 h-14 text-[#c85d38] transition-all duration-300 ${
                step === 'verifying' ? 'scale-110' : 'scale-100'
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
              <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
              <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
              <path d="M2 12a10 10 0 0 1 18-6" />
              <path d="M2 16h.01" />
              <path d="M21.8 16c.2-2 .131-5.354 0-6" />
              <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" />
              <path d="M8.65 22c.21-.66.45-1.32.57-2" />
              <path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
            </svg>
          )}
        </div>

        {/* Status Text */}
        <h3 className="font-heading text-lg font-bold text-[#481e0b] dark:text-[#f7eee9] mt-2">
          {step === 'success'
            ? mode === 'enroll'
              ? 'Biometrics Enrolled!'
              : mode === 'test'
                ? 'Sensor Verified!'
                : 'Welcome Back!'
            : step === 'verifying'
              ? 'Verifying Hardware Token...'
              : isFace
                ? 'Looking for FaceID...'
                : 'Place Finger on Sensor...'}
        </h3>

        <p className="text-xs text-[#786b65] dark:text-[#a89991] mt-1 px-3">
          {step === 'success'
            ? `${patientName}, your identity was cryptographically verified.`
            : step === 'verifying'
              ? 'Matching biometric public key credentials with clinic record.'
              : isFace
                ? 'Hold your device at eye level to unlock your patient records.'
                : 'Rest your finger on the biometric scanner.'}
        </p>

        {/* Progress bar */}
        <div className="w-full bg-[#ede5e0] dark:bg-[#2b221d] rounded-full h-1.5 mt-5 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              step === 'success' ? 'bg-emerald-500' : 'bg-[#c85d38]'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Bottom Actions */}
        <div className="mt-5 pt-3 border-t border-[#f0e6e0] dark:border-[#2e231d] flex items-center justify-between">
          <span className="text-[10px] text-[#786b65] dark:text-[#a89991] flex items-center gap-1">
            <Lock className="w-3 h-3 text-[#176541] dark:text-[#34d399]" />
            FIDO2 / WebAuthn standard
          </span>

          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-semibold text-[#a84724] dark:text-[#f38360] hover:underline cursor-pointer"
          >
            {mode === 'login' ? 'Use PIN Instead' : 'Dismiss'}
          </button>
        </div>
      </div>
    </div>
  );
};
