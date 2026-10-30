import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  X,
  Lock,
  Smartphone,
  ScanFace,
  Fingerprint,
  Sparkles,
  Info,
  Check,
  RotateCcw,
} from 'lucide-react';
import {
  BiometricPreference,
  getBiometricSettings,
  setBiometricSettings,
} from '../utils/authStorage';
import { BiometricModal } from './BiometricModal';

interface BiometricSettingsModalProps {
  isOpen: boolean;
  phone: string;
  patientName: string;
  onClose: () => void;
  onUpdate: (updated: BiometricPreference) => void;
}

export const BiometricSettingsModal: React.FC<BiometricSettingsModalProps> = ({
  isOpen,
  phone,
  patientName,
  onClose,
  onUpdate,
}) => {
  const currentSettings = getBiometricSettings(phone);
  const [enabled, setEnabled] = useState<boolean>(currentSettings.enabled);
  const [biometricType, setBiometricType] = useState<'faceId' | 'fingerprint' | 'both'>(
    currentSettings.type || 'faceId',
  );
  const [showTestModal, setShowTestModal] = useState<boolean>(false);
  const [testSuccessToast, setTestSuccessToast] = useState<boolean>(false);
  const [justSaved, setJustSaved] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSave = () => {
    const updated = setBiometricSettings(phone, enabled, biometricType);
    setJustSaved(true);
    onUpdate(updated);
    setTimeout(() => {
      setJustSaved(false);
      onClose();
    }, 600);
  };

  const handleTestSuccess = () => {
    setShowTestModal(false);
    setTestSuccessToast(true);
    setTimeout(() => setTestSuccessToast(false), 3500);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#1a1412] border border-[#dcc9bf] dark:border-[#382b24] shadow-2xl p-6 sm:p-7 overflow-hidden text-left">
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-[#f0e6e0] dark:border-[#2e231d]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] flex items-center justify-center shrink-0 border border-[#cfe1d5] dark:border-[#2b4434]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-[#481e0b] dark:text-[#f7eee9]">
                  Biometric Access & Security
                </h3>
                <p className="text-xs text-[#786b65] dark:text-[#a89991]">
                  Configure FaceID & TouchID login for faster, passkey-secured access
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-[#786b65] hover:text-[#481e0b] dark:text-[#a89991] dark:hover:text-white hover:bg-[#f3ede8] dark:hover:bg-[#2a201b] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Test Success Feedback Toast */}
          {testSuccessToast && (
            <div className="mt-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Verification passed!</strong> Biometric hardware simulated seamlessly on this device.
              </span>
            </div>
          )}

          {/* Master Toggle */}
          <div className="mt-5 p-4 rounded-2xl bg-[#fdfaf8] dark:bg-[#241c18] border border-[#e8dcd5] dark:border-[#3a2d26] flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[#481e0b] dark:text-[#f7eee9]">
                  Enable Biometric Login
                </span>
                {enabled ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                    Active
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-[#eee6e2] dark:bg-[#342721] text-[#786b65] dark:text-[#a89991] font-bold text-[10px]">
                    Disabled
                  </span>
                )}
              </div>
              <p className="text-xs text-[#786b65] dark:text-[#a89991]">
                Sign in with 1-tap using your device's biometric sensor instead of typing your 4-digit PIN.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#176541]"></div>
            </label>
          </div>

          {/* Biometric Modality Selection */}
          <div className="mt-5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#481e0b] dark:text-[#f7eee9] mb-2.5">
              Preferred Biometric Modality
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: FaceID */}
              <button
                type="button"
                disabled={!enabled}
                onClick={() => setBiometricType('faceId')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 disabled:opacity-40 disabled:cursor-not-allowed ${
                  biometricType === 'faceId' && enabled
                    ? 'border-[#c85d38] bg-[#fff5f0] dark:bg-[#2c1c14] ring-1 ring-[#c85d38]'
                    : 'border-[#e0d3cb] dark:border-[#382b24] bg-white dark:bg-[#1e1714] hover:border-[#c85d38]'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    biometricType === 'faceId' && enabled
                      ? 'bg-[#c85d38] text-white'
                      : 'bg-[#f4eae4] dark:bg-[#2a201b] text-[#786b65] dark:text-[#a89991]'
                  }`}
                >
                  <ScanFace className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#481e0b] dark:text-[#f7eee9] flex items-center justify-between">
                    <span>FaceID / Facial Scan</span>
                    {biometricType === 'faceId' && enabled && (
                      <Check className="w-3.5 h-3.5 text-[#c85d38]" />
                    )}
                  </div>
                  <div className="text-[11px] text-[#786b65] dark:text-[#a89991] mt-0.5">
                    Fast 3D facial geometry scan via front sensor
                  </div>
                </div>
              </button>

              {/* Option 2: Fingerprint */}
              <button
                type="button"
                disabled={!enabled}
                onClick={() => setBiometricType('fingerprint')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 disabled:opacity-40 disabled:cursor-not-allowed ${
                  biometricType === 'fingerprint' && enabled
                    ? 'border-[#176541] bg-[#edf7f0] dark:bg-[#1a2d22] ring-1 ring-[#176541]'
                    : 'border-[#e0d3cb] dark:border-[#382b24] bg-white dark:bg-[#1e1714] hover:border-[#176541]'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    biometricType === 'fingerprint' && enabled
                      ? 'bg-[#176541] text-white'
                      : 'bg-[#f4eae4] dark:bg-[#2a201b] text-[#786b65] dark:text-[#a89991]'
                  }`}
                >
                  <Fingerprint className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#481e0b] dark:text-[#f7eee9] flex items-center justify-between">
                    <span>TouchID / Fingerprint</span>
                    {biometricType === 'fingerprint' && enabled && (
                      <Check className="w-3.5 h-3.5 text-[#176541]" />
                    )}
                  </div>
                  <div className="text-[11px] text-[#786b65] dark:text-[#a89991] mt-0.5">
                    Capacitive or optical under-display fingerprint
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Device & Security Details */}
          <div className="mt-5 p-3.5 rounded-2xl bg-[#faf5f2] dark:bg-[#221a16] border border-[#ebdcd3] dark:border-[#33261f] text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[#786b65] dark:text-[#a89991]">Device Authenticator</span>
              <span className="font-semibold text-[#481e0b] dark:text-[#f7eee9] flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-[#176541]" />
                WebAuthn / FIDO2 Enclave
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#786b65] dark:text-[#a89991]">Registered Account</span>
              <span className="font-semibold text-[#481e0b] dark:text-[#f7eee9]">
                {patientName} (+91 {phone.slice(-10)})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#786b65] dark:text-[#a89991]">Security Standard</span>
              <span className="font-semibold text-[#176541] dark:text-[#34d399] flex items-center gap-1">
                <Lock className="w-3 h-3" />
                End-to-End Cryptographic Match
              </span>
            </div>
          </div>

          {/* Interactive Simulation / Test button */}
          {enabled && (
            <div className="mt-4 flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#fff8f5] dark:bg-[#2a1e18] border border-[#f5ded5] dark:border-[#42291d]">
              <div className="text-[11px] text-[#786b65] dark:text-[#a89991]">
                Want to test the biometric response on this device?
              </div>
              <button
                type="button"
                onClick={() => setShowTestModal(true)}
                className="px-3 py-1.5 rounded-xl border border-[#c85d38]/30 bg-white dark:bg-[#1a1412] hover:bg-[#c85d38] hover:text-white text-[#c85d38] dark:text-[#f38360] font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Test Biometric Scan</span>
              </button>
            </div>
          )}

          {/* Modal Actions */}
          <div className="mt-6 pt-4 border-t border-[#f0e6e0] dark:border-[#2e231d] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-[#dcc9bf] dark:border-[#42332a] text-[#56473f] dark:text-[#e8dcd5] text-xs font-semibold hover:bg-[#f5ede7] dark:hover:bg-[#251d19] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-full bg-[#176541] hover:bg-[#124d32] text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              {justSaved ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Apply & Save</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Test Scan Simulation Modal */}
      <BiometricModal
        isOpen={showTestModal}
        mode="test"
        biometricType={biometricType}
        patientName={patientName}
        onSuccess={handleTestSuccess}
        onCancel={() => setShowTestModal(false)}
      />
    </>
  );
};
