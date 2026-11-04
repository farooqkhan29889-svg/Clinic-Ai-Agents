import React, { useState } from 'react';
import { JarvisSettings, HudThemeId } from '../../types/jarvis';
import { HUD_THEMES, HudTheme, getHudTheme } from '../../theme/hudThemes';
import { VOICE_PRESETS } from '../../services/speechService';
import { soundFX } from '../../services/soundEffects';
import {
  X,
  Palette,
  Sparkles,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Cpu,
  Key,
  Shield,
  CheckCircle2,
  Sliders,
  RotateCcw,
  Zap
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: JarvisSettings;
  onUpdateSettings: (newSettings: Partial<JarvisSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'theme' | 'tone' | 'voice' | 'wake' | 'model'>('theme');
  const [showKeyInput, setShowKeyInput] = useState(false);

  if (!isOpen) return null;

  const currentTheme: HudTheme = getHudTheme(settings.hudTheme);

  const handleSelectTheme = (themeId: HudThemeId) => {
    soundFX.playClick();
    onUpdateSettings({ hudTheme: themeId });
  };

  const handleResetDefaults = () => {
    soundFX.playScanPing();
    onUpdateSettings({
      hudTheme: 'cyan',
      responseTone: 'Formal',
      voicePreset: 'JARVIS (Avengers)',
      voiceRate: 0.94,
      voicePitch: 0.72,
      ttsEnabled: true,
      wakeWordEnabled: true,
      wakeWordLang: 'en',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden border shadow-2xl transition-all duration-300"
        style={{
          backgroundColor: currentTheme.bgCard,
          borderColor: currentTheme.borderHighlight,
          boxShadow: `0 0 35px ${currentTheme.glow}`,
        }}
      >
        {/* Modal Header */}
        <div
          className="p-5 border-b flex items-center justify-between"
          style={{
            borderColor: currentTheme.borderAlpha,
            backgroundColor: currentTheme.bgSurface,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{
                borderColor: currentTheme.primary,
                backgroundColor: currentTheme.badgeBg,
                boxShadow: `0 0 15px ${currentTheme.glow}`,
              }}
            >
              <Palette className="w-5 h-5" style={{ color: currentTheme.primary }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-orbitron font-bold text-lg text-white tracking-wider">
                  STARK SYSTEM PREFERENCES
                </h2>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-mono-tech uppercase font-bold"
                  style={{
                    backgroundColor: currentTheme.badgeBg,
                    color: currentTheme.primary,
                    border: `1px solid ${currentTheme.primary}`,
                  }}
                >
                  {currentTheme.name} Active
                </span>
              </div>
              <p className="text-xs text-gray-400 font-mono-tech">
                MARK LXXXV Core Telemetry • HUD Color Matrix & Persona Configurations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefaults}
              className="px-3 py-1.5 rounded-lg border border-gray-700 hover:border-gray-500 text-gray-300 text-xs font-mono-tech flex items-center gap-1.5 transition-colors"
              title="Reset Settings to Defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
            </button>
            <button
              onClick={() => {
                soundFX.playClick();
                onClose();
              }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          className="flex items-center gap-2 px-6 pt-3 border-b overflow-x-auto text-xs font-orbitron"
          style={{ borderColor: currentTheme.borderAlpha }}
        >
          {[
            { id: 'theme', label: 'HUD Color Palette', icon: Palette },
            { id: 'tone', label: 'Response Tone', icon: Sparkles },
            { id: 'voice', label: 'Voice Modulation', icon: Volume2 },
            { id: 'wake', label: 'Always-On Listener', icon: Mic },
            { id: 'model', label: 'Neural Intelligence', icon: Cpu },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundFX.playClick();
                  setActiveTab(tab.id as any);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium tracking-wide transition-all whitespace-nowrap ${
                  isActive
                    ? 'text-white'
                    : 'text-gray-400 hover:text-gray-200 border-transparent'
                }`}
                style={{
                  borderColor: isActive ? currentTheme.primary : 'transparent',
                  color: isActive ? currentTheme.primary : undefined,
                }}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-gray-200">
          {/* TAB: HUD COLOR PALETTE */}
          {activeTab === 'theme' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-orbitron font-bold text-white text-base tracking-wide flex items-center gap-2">
                  <Palette className="w-4 h-4" style={{ color: currentTheme.primary }} />
                  SELECT HUD COLOR PALETTE
                </h3>
                <p className="text-xs text-gray-400 font-mono-tech mt-1">
                  Reconfigures the optical spectrum of the Arc Reactor, targeting matrices, holographic rings,
                  border telemetry, and visualizer elements across the Stark environment.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
                {Object.values(HUD_THEMES).map((theme) => {
                  const isSelected = (settings.hudTheme || 'cyan') === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => handleSelectTheme(theme.id)}
                      className={`relative p-4 rounded-xl border text-left transition-all duration-300 flex flex-col justify-between group ${
                        isSelected
                          ? 'scale-[1.02]'
                          : 'hover:scale-[1.01] hover:border-gray-500'
                      }`}
                      style={{
                        backgroundColor: isSelected ? theme.bgSurface : theme.bgCard,
                        borderColor: isSelected ? theme.primary : 'rgba(255,255,255,0.12)',
                        boxShadow: isSelected ? `0 0 20px ${theme.glow}` : undefined,
                      }}
                    >
                      {/* Active Checkmark Badge */}
                      {isSelected && (
                        <div
                          className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono-tech font-bold"
                          style={{
                            backgroundColor: theme.badgeBg,
                            color: theme.primary,
                            border: `1px solid ${theme.primary}`,
                          }}
                        >
                          <CheckCircle2 className="w-3 h-3" /> ACTIVE
                        </div>
                      )}

                      <div>
                        {/* Suit Tag */}
                        <span
                          className="text-[10px] font-mono-tech tracking-wider uppercase font-semibold block mb-1"
                          style={{ color: theme.secondary }}
                        >
                          {theme.suitTag}
                        </span>

                        {/* Title */}
                        <div className="font-orbitron font-black text-base text-white tracking-wide flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: theme.primary,
                              boxShadow: `0 0 8px ${theme.primary}`,
                            }}
                          />
                          {theme.name}
                        </div>

                        {/* Description */}
                        <p className="text-xs text-gray-300 font-sans mt-2 line-clamp-2">
                          {theme.description}
                        </p>
                      </div>

                      {/* Swatches & Selector Bar */}
                      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {theme.swatches.map((color, idx) => (
                            <span
                              key={idx}
                              className="w-4 h-4 rounded-full border border-black/30 shadow-sm"
                              style={{
                                backgroundColor: color,
                                boxShadow: idx === 0 ? `0 0 6px ${color}` : undefined,
                              }}
                              title={color}
                            />
                          ))}
                        </div>

                        <span
                          className="text-[11px] font-orbitron uppercase tracking-wider font-semibold"
                          style={{ color: isSelected ? theme.primary : '#9ca3af' }}
                        >
                          {isSelected ? 'ENGAGED' : 'SELECT'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Live Preview Box */}
              <div
                className="p-4 rounded-xl border mt-4 flex items-center justify-between"
                style={{
                  backgroundColor: currentTheme.bgSurface,
                  borderColor: currentTheme.borderHighlight,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full border-2 flex items-center justify-center animate-spin-clockwise"
                    style={{
                      borderColor: currentTheme.primary,
                      borderTopColor: 'transparent',
                      boxShadow: `0 0 12px ${currentTheme.primary}`,
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{
                        backgroundColor: currentTheme.primary,
                        boxShadow: `0 0 10px ${currentTheme.primary}`,
                      }}
                    />
                  </div>
                  <div>
                    <div className="font-orbitron font-bold text-xs text-white">
                      ACTIVE SPECTRUM: {currentTheme.name.toUpperCase()} ({currentTheme.suitTag})
                    </div>
                    <div className="text-[11px] font-mono-tech text-gray-400">
                      Primary: {currentTheme.primary} • Secondary: {currentTheme.secondary} • Glow: {currentTheme.glow}
                    </div>
                  </div>
                </div>

                <div
                  className="px-3 py-1 rounded text-xs font-mono-tech uppercase font-bold"
                  style={{
                    backgroundColor: currentTheme.badgeBg,
                    color: currentTheme.primary,
                    border: `1px solid ${currentTheme.primary}`,
                  }}
                >
                  SYSTEM PERSISTED
                </div>
              </div>
            </div>
          )}

          {/* TAB: RESPONSE TONE */}
          {activeTab === 'tone' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-orbitron font-bold text-white text-base tracking-wide flex items-center gap-2">
                  <Sparkles className="w-4 h-4" style={{ color: currentTheme.primary }} />
                  JARVIS PERSONA & RESPONSE TONE
                </h3>
                <p className="text-xs text-gray-400 font-mono-tech mt-1">
                  Adjust how J.A.R.V.I.S. formulates answers, ranging from noble British butler etiquette to razor-sharp Stark sarcasm.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {(
                  [
                    {
                      id: 'Formal',
                      title: 'Formal Dignity',
                      desc: 'Classic British butler etiquette. Impeccably courteous, addresses you as "Sir" and speaks with high eloquence.',
                      icon: '🎩',
                      badge: 'Avengers Default',
                    },
                    {
                      id: 'Casual',
                      title: 'Warm Casual',
                      desc: 'Approachable, direct, and conversational. Friendly partner for rapid day-to-day workflow tasks.',
                      icon: '☕',
                      badge: 'Colloquial',
                    },
                    {
                      id: 'Sarcastic',
                      title: 'Stark Sarcasm',
                      desc: 'Dry British wit and playful Iron Man banter. Highly intelligent with subtle satirical commentary on your plans.',
                      icon: '😏',
                      badge: 'Tony Stark Wit',
                    },
                    {
                      id: 'Tactical',
                      title: 'Tactical Military',
                      desc: 'Ultra-concise combat HUD telemetry. No pleasantries—strictly coordinates, action items, and data readouts.',
                      icon: '🎯',
                      badge: 'Combat Protocol',
                    },
                  ] as const
                ).map((tone) => {
                  const isSelected = settings.responseTone === tone.id;
                  return (
                    <button
                      key={tone.id}
                      type="button"
                      onClick={() => {
                        soundFX.playClick();
                        onUpdateSettings({ responseTone: tone.id });
                      }}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-2 shadow-lg'
                          : 'hover:border-gray-500'
                      }`}
                      style={{
                        backgroundColor: isSelected ? currentTheme.bgSurface : currentTheme.bgCard,
                        borderColor: isSelected ? currentTheme.primary : 'rgba(255,255,255,0.12)',
                        boxShadow: isSelected ? `0 0 15px ${currentTheme.glow}` : undefined,
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{tone.icon}</span>
                          <span className="font-orbitron font-bold text-sm text-white">
                            {tone.title}
                          </span>
                        </div>
                        <span
                          className="text-[10px] font-mono-tech px-2 py-0.5 rounded uppercase"
                          style={{
                            backgroundColor: isSelected ? currentTheme.badgeBg : 'rgba(255,255,255,0.05)',
                            color: isSelected ? currentTheme.primary : '#9ca3af',
                            border: `1px solid ${isSelected ? currentTheme.primary : 'rgba(255,255,255,0.1)'}`,
                          }}
                        >
                          {tone.badge}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 font-sans leading-relaxed">
                        {tone.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: VOICE MODULATION */}
          {activeTab === 'voice' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-orbitron font-bold text-white text-base tracking-wide flex items-center gap-2">
                  <Volume2 className="w-4 h-4" style={{ color: currentTheme.primary }} />
                  SPEECH SYNTHESIS & ACOUSTICS
                </h3>
                <p className="text-xs text-gray-400 font-mono-tech mt-1">
                  Configure speech speed, acoustic pitch, and vocal timbre models.
                </p>
              </div>

              <div
                className="p-4 rounded-xl border space-y-4"
                style={{
                  backgroundColor: currentTheme.bgSurface,
                  borderColor: currentTheme.borderAlpha,
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-orbitron font-semibold text-white text-sm">
                      Text-to-Speech Output
                    </div>
                    <div className="text-xs text-gray-400">
                      Enable vocal audio responses from J.A.R.V.I.S.
                    </div>
                  </div>
                  <button
                    onClick={() => onUpdateSettings({ ttsEnabled: !settings.ttsEnabled })}
                    className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 font-mono-tech text-xs transition-colors ${
                      settings.ttsEnabled ? 'text-white' : 'text-gray-400 border-gray-700'
                    }`}
                    style={{
                      borderColor: settings.ttsEnabled ? currentTheme.primary : undefined,
                      backgroundColor: settings.ttsEnabled ? currentTheme.badgeBg : undefined,
                    }}
                  >
                    {settings.ttsEnabled ? (
                      <>
                        <Volume2 className="w-4 h-4" style={{ color: currentTheme.primary }} />
                        ENABLED
                      </>
                    ) : (
                      <>
                        <VolumeX className="w-4 h-4" />
                        MUTED
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono-tech text-gray-300 block">
                    Vocal Timbre Profile
                  </label>
                  <select
                    value={settings.voicePreset}
                    onChange={(e) => onUpdateSettings({ voicePreset: e.target.value })}
                    className="w-full bg-black/60 border rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                    style={{ borderColor: currentTheme.borderAlpha }}
                  >
                    {Object.keys(VOICE_PRESETS).map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <div className="flex justify-between text-xs font-mono-tech mb-1">
                      <span>Rate (Speed):</span>
                      <span style={{ color: currentTheme.primary }}>{settings.voiceRate.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.7"
                      max="1.3"
                      step="0.05"
                      value={settings.voiceRate}
                      onChange={(e) => onUpdateSettings({ voiceRate: parseFloat(e.target.value) })}
                      className="w-full"
                      style={{ accentColor: currentTheme.primary }}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono-tech mb-1">
                      <span>Pitch:</span>
                      <span style={{ color: currentTheme.primary }}>{settings.voicePitch.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.05"
                      value={settings.voicePitch}
                      onChange={(e) => onUpdateSettings({ voicePitch: parseFloat(e.target.value) })}
                      className="w-full"
                      style={{ accentColor: currentTheme.primary }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ALWAYS-ON WAKE WORD */}
          {activeTab === 'wake' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-orbitron font-bold text-white text-base tracking-wide flex items-center gap-2">
                  <Mic className="w-4 h-4" style={{ color: currentTheme.primary }} />
                  ALWAYS-ON WAKE WORD DETECTION
                </h3>
                <p className="text-xs text-gray-400 font-mono-tech mt-1">
                  Enables continuous hands-free background microphone listening for “Hello JARVIS” or “Hey JARVIS”.
                </p>
              </div>

              <div
                className="p-4 rounded-xl border space-y-4"
                style={{
                  backgroundColor: currentTheme.bgSurface,
                  borderColor: currentTheme.borderAlpha,
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-orbitron font-semibold text-white text-sm">
                      Always Ready Hands-Free Listener
                    </div>
                    <div className="text-xs text-gray-400">
                      When armed, J.A.R.V.I.S. awakens instantly upon hearing your voice trigger.
                    </div>
                  </div>
                  <button
                    onClick={() => onUpdateSettings({ wakeWordEnabled: !settings.wakeWordEnabled })}
                    className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 font-mono-tech text-xs transition-colors`}
                    style={{
                      borderColor: settings.wakeWordEnabled ? currentTheme.primary : 'gray',
                      backgroundColor: settings.wakeWordEnabled ? currentTheme.badgeBg : undefined,
                      color: settings.wakeWordEnabled ? 'white' : 'gray',
                    }}
                  >
                    {settings.wakeWordEnabled ? <Mic className="w-4 h-4" style={{ color: currentTheme.primary }} /> : <MicOff className="w-4 h-4" />}
                    {settings.wakeWordEnabled ? 'ACTIVE' : 'STANDBY'}
                  </button>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-xs text-white">Listener Dialect</div>
                    <div className="text-[11px] text-gray-400">English or Hindi phoneme detection</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onUpdateSettings({ wakeWordLang: 'en' })}
                      className="px-3 py-1 rounded text-xs font-mono-tech font-bold"
                      style={{
                        backgroundColor: settings.wakeWordLang === 'en' ? currentTheme.primary : 'rgba(255,255,255,0.05)',
                        color: settings.wakeWordLang === 'en' ? '#000' : '#d1d5db',
                      }}
                    >
                      English
                    </button>
                    <button
                      onClick={() => onUpdateSettings({ wakeWordLang: 'hi' })}
                      className="px-3 py-1 rounded text-xs font-mono-tech font-bold"
                      style={{
                        backgroundColor: settings.wakeWordLang === 'hi' ? currentTheme.primary : 'rgba(255,255,255,0.05)',
                        color: settings.wakeWordLang === 'hi' ? '#000' : '#d1d5db',
                      }}
                    >
                      हिन्दी
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: NEURAL INTELLIGENCE */}
          {activeTab === 'model' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-orbitron font-bold text-white text-base tracking-wide flex items-center gap-2">
                  <Cpu className="w-4 h-4" style={{ color: currentTheme.primary }} />
                  NEURAL MODEL & INFERENCE CORE
                </h3>
                <p className="text-xs text-gray-400 font-mono-tech mt-1">
                  Choose neural architecture model for reasoning, planning, and task execution.
                </p>
              </div>

              <div
                className="p-4 rounded-xl border space-y-4"
                style={{
                  backgroundColor: currentTheme.bgSurface,
                  borderColor: currentTheme.borderAlpha,
                }}
              >
                <div>
                  <label className="text-xs font-mono-tech text-gray-300 block mb-1.5">
                    Primary Inference Model
                  </label>
                  <select
                    value={settings.model}
                    onChange={(e) => onUpdateSettings({ model: e.target.value })}
                    className="w-full bg-black/60 border rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                    style={{ borderColor: currentTheme.borderAlpha }}
                  >
                    <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile (Fast & Reliable)</option>
                    <option value="openai/gpt-oss-120b">GPT-OSS 120B (High Reasoning)</option>
                    <option value="openai/gpt-oss-20b">GPT-OSS 20B (Low Latency)</option>
                    <option value="qwen/qwen3.8-27b">Qwen 3.8 27B (Multilingual)</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono-tech text-gray-300 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5" style={{ color: currentTheme.primary }} />
                      Groq API Key (Optional)
                    </label>
                    <button
                      onClick={() => setShowKeyInput(!showKeyInput)}
                      className="text-xs font-mono-tech hover:underline"
                      style={{ color: currentTheme.primary }}
                    >
                      {showKeyInput ? 'Hide' : 'Configure'}
                    </button>
                  </div>

                  {showKeyInput && (
                    <input
                      type="password"
                      value={settings.apiKey}
                      onChange={(e) => onUpdateSettings({ apiKey: e.target.value })}
                      placeholder="gsk_... (Blank uses built-in Stark heuristic core)"
                      className="w-full bg-black/60 border rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                      style={{ borderColor: currentTheme.borderAlpha }}
                    />
                  )}
                  <p className="text-[11px] text-gray-400">
                    If not specified, J.A.R.V.I.S. operates via the autonomous client intelligence engine with full WhatsApp, email, reminders, and PC simulation control.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className="p-4 border-t flex items-center justify-between text-xs font-mono-tech"
          style={{
            borderColor: currentTheme.borderAlpha,
            backgroundColor: currentTheme.bgSurface,
          }}
        >
          <div className="flex items-center gap-2 text-gray-400">
            <span
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: currentTheme.primary,
                boxShadow: `0 0 6px ${currentTheme.primary}`,
              }}
            />
            <span>THEME: {currentTheme.name.toUpperCase()}</span>
            <span>•</span>
            <span>TONE: {settings.responseTone.toUpperCase()}</span>
          </div>

          <button
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl font-orbitron font-bold text-xs uppercase tracking-wider transition-all"
            style={{
              backgroundColor: currentTheme.primary,
              color: '#000',
              boxShadow: `0 0 15px ${currentTheme.glow}`,
            }}
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
