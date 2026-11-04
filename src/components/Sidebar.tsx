import React, { useState } from 'react';
import { JarvisSettings } from '../types/jarvis';
import { VOICE_PRESETS } from '../services/speechService';
import {
  Settings,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Cpu,
  Brain,
  Clock,
  Monitor,
  Mail,
  MessageSquare,
  Camera,
  Smartphone,
  Sparkles,
  Key,
  Shield,
  Sun,
  Eye,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface SidebarProps {
  settings: JarvisSettings;
  onUpdateSettings: (newSettings: Partial<JarvisSettings>) => void;
  onOpenMemory: () => void;
  onOpenReminders: () => void;
  onOpenFiles: () => void;
  onOpenEmail: () => void;
  onOpenWhatsApp: () => void;
  onOpenPhoneConnect: () => void;
  onTriggerBriefing: () => void;
  onUploadImage: (file: File) => void;
  pendingImage: { name: string; url: string } | null;
  onClearImage: () => void;
  isWakeArmed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  settings,
  onUpdateSettings,
  onOpenMemory,
  onOpenReminders,
  onOpenFiles,
  onOpenEmail,
  onOpenWhatsApp,
  onOpenPhoneConnect,
  onTriggerBriefing,
  onUploadImage,
  pendingImage,
  onClearImage,
  isWakeArmed
}) => {
  const [showKeyInput, setShowKeyInput] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadImage(e.target.files[0]);
    }
  };

  return (
    <aside className="w-80 bg-gradient-to-b from-[#06101a]/95 to-[#03080e]/95 border-r border-[#37e6ff]/20 flex flex-col h-screen overflow-y-auto select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#37e6ff]/20 bg-[#071320]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#37e6ff]/10 border border-[#37e6ff] flex items-center justify-center p-1 shadow-[0_0_8px_rgba(55,230,255,0.5)]">
              <img src="/assets/jarvis_icon_256.png" alt="JARVIS" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-orbitron font-bold text-sm tracking-widest text-[#eafcff]">
                J.A.R.V.I.S.
              </span>
              <span className="block text-[9px] font-mono-tech text-[#1b8fa8] tracking-wider">
                MARK LXXXV AI CORE
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#5dffb0]/10 border border-[#5dffb0]/30 text-[10px] text-[#5dffb0] font-mono-tech">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5dffb0] animate-pulse" />
            ONLINE
          </div>
        </div>
      </div>

      <div className="p-4 space-y-5 text-xs text-[#d6f5ff]">
        {/* Wake Word Banner if active */}
        <div
          className={`p-3 rounded-xl border transition-all ${
            isWakeArmed
              ? 'bg-[#291b06] border-[#f2b23e] shadow-[0_0_15px_rgba(242,178,62,0.3)]'
              : settings.wakeWordEnabled
              ? 'bg-[#071722] border-[#5dffb0]/40'
              : 'bg-[#04080f] border-[#37e6ff]/15'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isWakeArmed ? 'bg-[#f2b23e] animate-ping' : settings.wakeWordEnabled ? 'bg-[#5dffb0]' : 'bg-gray-500'}`} />
              <span className="font-bold tracking-wide uppercase text-[11px] text-[#eafcff]">
                {isWakeArmed ? '“Yes, Sir?” — Listening' : settings.wakeWordEnabled ? 'Wake Word Active' : 'Wake Word Standby'}
              </span>
            </div>
            <button
              onClick={() => onUpdateSettings({ wakeWordEnabled: !settings.wakeWordEnabled })}
              className={`p-1 rounded transition-colors ${settings.wakeWordEnabled ? 'text-[#5dffb0]' : 'text-gray-400'}`}
              title={settings.wakeWordEnabled ? 'Disable Wake Word' : 'Enable Wake Word'}
            >
              {settings.wakeWordEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>
          </div>
          <div className="mt-1.5 text-[11px] text-[#8fc9dd]">
            Say <span className="text-[#37e6ff] font-semibold">“Hello JARVIS”</span> aloud (English/Hindi) to issue hands-free voice commands.
          </div>
          {settings.wakeWordEnabled && (
            <div className="mt-2 pt-2 border-t border-[#37e6ff]/15 flex items-center justify-between text-[10px]">
              <span className="text-[#1b8fa8]">Listener Dialect:</span>
              <div className="flex gap-1">
                <button
                  onClick={() => onUpdateSettings({ wakeWordLang: 'en' })}
                  className={`px-2 py-0.5 rounded ${settings.wakeWordLang === 'en' ? 'bg-[#37e6ff]/30 text-white font-bold' : 'text-[#8fc9dd]'}`}
                >
                  English
                </button>
                <button
                  onClick={() => onUpdateSettings({ wakeWordLang: 'hi' })}
                  className={`px-2 py-0.5 rounded ${settings.wakeWordLang === 'hi' ? 'bg-[#37e6ff]/30 text-white font-bold' : 'text-[#8fc9dd]'}`}
                >
                  हिन्दी
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Neural Inference / Model Configuration */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-orbitron font-semibold tracking-wider text-[#37e6ff] uppercase text-[11px] flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" /> Neural Model
            </span>
            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="text-[10px] text-[#1b8fa8] hover:text-[#37e6ff] flex items-center gap-1"
            >
              <Key className="w-3 h-3" /> {settings.apiKey ? 'Key Set' : 'Set API Key'}
            </button>
          </div>

          <select
            value={settings.model}
            onChange={(e) => onUpdateSettings({ model: e.target.value })}
            className="w-full bg-[#04080f] border border-[#37e6ff]/30 rounded-lg px-2.5 py-1.5 text-xs text-[#eafcff] focus:outline-none focus:border-[#37e6ff]"
          >
            <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile (Default)</option>
            <option value="openai/gpt-oss-120b">GPT-OSS 120B</option>
            <option value="openai/gpt-oss-20b">GPT-OSS 20B</option>
            <option value="qwen/qwen3.8-27b">Qwen 3.8 27B</option>
          </select>

          {showKeyInput && (
            <div className="p-2.5 bg-[#04080f] rounded-lg border border-[#37e6ff]/25 space-y-1.5">
              <label className="text-[10px] text-[#8fc9dd] block">Groq API Key (gsk_...)</label>
              <input
                type="password"
                value={settings.apiKey}
                onChange={(e) => onUpdateSettings({ apiKey: e.target.value })}
                placeholder="Optional (Built-in agent active)"
                className="w-full bg-[#091524] border border-[#37e6ff]/30 rounded px-2 py-1 text-xs text-[#eafcff] focus:outline-none focus:border-[#37e6ff]"
              />
              <span className="text-[9px] text-[#1b8fa8] block leading-tight">
                Stored in session only. If blank, JARVIS operates using local heuristic intelligence.
              </span>
            </div>
          )}
        </div>

        {/* Response Tone / Persona Configuration */}
        <div className="space-y-2 pt-1 border-t border-[#37e6ff]/15">
          <div className="flex items-center justify-between">
            <span className="font-orbitron font-semibold tracking-wider text-[#37e6ff] uppercase text-[11px] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Response Tone
            </span>
            <span className="text-[10px] text-[#5dffb0] font-mono-tech px-1.5 py-0.5 rounded bg-[#5dffb0]/10 border border-[#5dffb0]/30">
              {settings.responseTone}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {(
              [
                { id: 'Formal', label: 'Formal', desc: 'Dignified & articulate', icon: '🎩' },
                { id: 'Casual', label: 'Casual', desc: 'Warm & conversational', icon: '☕' },
                { id: 'Sarcastic', label: 'Sarcastic', desc: 'Dry British Stark wit', icon: '😏' },
                { id: 'Tactical', label: 'Tactical', desc: 'Military telemetry brevity', icon: '🎯' },
              ] as const
            ).map((tone) => (
              <button
                key={tone.id}
                type="button"
                onClick={() => onUpdateSettings({ responseTone: tone.id })}
                className={`p-2 rounded-xl text-left border transition-all ${
                  settings.responseTone === tone.id
                    ? 'bg-[#37e6ff]/20 border-[#37e6ff] text-[#eafcff] shadow-[0_0_10px_rgba(55,230,255,0.25)]'
                    : 'bg-[#04080f] border-[#37e6ff]/20 text-[#8fc9dd] hover:border-[#37e6ff]/40 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-orbitron font-bold text-xs">{tone.label}</span>
                  <span className="text-xs">{tone.icon}</span>
                </div>
                <p className="text-[9px] text-[#8fc9dd]/80 font-mono-tech mt-0.5 leading-tight">
                  {tone.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Voice & Synthesis Tuning */}
        <div className="space-y-2.5 pt-1 border-t border-[#37e6ff]/15">
          <div className="flex items-center justify-between">
            <span className="font-orbitron font-semibold tracking-wider text-[#37e6ff] uppercase text-[11px] flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" /> Voice Modulation
            </span>
            <button
              onClick={() => onUpdateSettings({ ttsEnabled: !settings.ttsEnabled })}
              className={`p-1 rounded transition-colors ${settings.ttsEnabled ? 'text-[#37e6ff]' : 'text-gray-500'}`}
              title={settings.ttsEnabled ? 'Mute Speech Output' : 'Unmute Speech Output'}
            >
              {settings.ttsEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="space-y-2">
            <div>
              <label className="text-[10px] text-[#8fc9dd] mb-1 block">Voice Preset</label>
              <select
                value={settings.voicePreset}
                onChange={(e) => onUpdateSettings({ voicePreset: e.target.value })}
                className="w-full bg-[#04080f] border border-[#37e6ff]/30 rounded-lg px-2.5 py-1.5 text-xs text-[#eafcff] focus:outline-none focus:border-[#37e6ff]"
              >
                {Object.keys(VOICE_PRESETS).map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <span className="text-[#8fc9dd]">Rate: {settings.voiceRate.toFixed(2)}x</span>
                <input
                  type="range"
                  min="0.7"
                  max="1.3"
                  step="0.05"
                  value={settings.voiceRate}
                  onChange={(e) => onUpdateSettings({ voiceRate: parseFloat(e.target.value) })}
                  className="w-full accent-[#37e6ff]"
                />
              </div>
              <div>
                <span className="text-[#8fc9dd]">Pitch: {settings.voicePitch.toFixed(2)}</span>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  value={settings.voicePitch}
                  onChange={(e) => onUpdateSettings({ voicePitch: parseFloat(e.target.value) })}
                  className="w-full accent-[#37e6ff]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Subsystem Tool Panels & Modals */}
        <div className="space-y-1.5 pt-1 border-t border-[#37e6ff]/15">
          <span className="font-orbitron font-semibold tracking-wider text-[#37e6ff] uppercase text-[11px] block mb-2">
            Operational Modules
          </span>

          <button
            onClick={onOpenFiles}
            className="w-full text-left p-2.5 rounded-xl bg-[#04080f] hover:bg-[#091829] border border-[#37e6ff]/20 hover:border-[#37e6ff]/50 flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Monitor className="w-4 h-4 text-[#37e6ff]" />
              <div>
                <div className="font-semibold text-xs text-[#eafcff]">🖥 Control This PC</div>
                <div className="text-[10px] text-[#8fc9dd]">Sandboxed filesystem & apps</div>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-[#5dffb0]" />
          </button>

          <button
            onClick={onOpenMemory}
            className="w-full text-left p-2.5 rounded-xl bg-[#04080f] hover:bg-[#091829] border border-[#37e6ff]/20 hover:border-[#37e6ff]/50 flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Brain className="w-4 h-4 text-[#37e6ff]" />
              <div>
                <div className="font-semibold text-xs text-[#eafcff]">🧠 Long-Term Memory</div>
                <div className="text-[10px] text-[#8fc9dd]">Durable user facts archive</div>
              </div>
            </div>
            <span className="text-[10px] text-[#1b8fa8] font-mono-tech">json</span>
          </button>

          <button
            onClick={onOpenReminders}
            className="w-full text-left p-2.5 rounded-xl bg-[#04080f] hover:bg-[#091829] border border-[#37e6ff]/20 hover:border-[#37e6ff]/50 flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-[#37e6ff]" />
              <div>
                <div className="font-semibold text-xs text-[#eafcff]">⏰ Follow-up Tasks</div>
                <div className="text-[10px] text-[#8fc9dd]">Scheduled scheduler alerts</div>
              </div>
            </div>
            <span className="text-[10px] text-[#5dffb0] font-mono-tech">Active</span>
          </button>

          <button
            onClick={onOpenEmail}
            className="w-full text-left p-2.5 rounded-xl bg-[#04080f] hover:bg-[#091829] border border-[#37e6ff]/20 hover:border-[#37e6ff]/50 flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-[#37e6ff]" />
              <div>
                <div className="font-semibold text-xs text-[#eafcff]">✉️ Email Inbox</div>
                <div className="text-[10px] text-[#8fc9dd]">Read-only IMAP inspection</div>
              </div>
            </div>
            <span className="text-[10px] text-[#37e6ff] font-mono-tech">Peek</span>
          </button>

          <button
            onClick={onOpenWhatsApp}
            className="w-full text-left p-2.5 rounded-xl bg-[#04080f] hover:bg-[#091829] border border-[#37e6ff]/20 hover:border-[#37e6ff]/50 flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-2.5">
              <MessageSquare className="w-4 h-4 text-[#25d366]" />
              <div>
                <div className="font-semibold text-xs text-[#eafcff]">💬 WhatsApp Suite</div>
                <div className="text-[10px] text-[#8fc9dd]">Read chats & send messages</div>
              </div>
            </div>
            <span className="text-[10px] text-[#25d366] font-mono-tech">Web/Cloud</span>
          </button>

          <button
            onClick={onOpenPhoneConnect}
            className="w-full text-left p-2.5 rounded-xl bg-[#04080f] hover:bg-[#091829] border border-[#37e6ff]/20 hover:border-[#37e6ff]/50 flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-[#37e6ff]" />
              <div>
                <div className="font-semibold text-xs text-[#eafcff]">📱 Phone Wi-Fi Link</div>
                <div className="text-[10px] text-[#8fc9dd]">QR Code & Remote Mic</div>
              </div>
            </div>
            <span className="text-[10px] text-[#37e6ff] font-mono-tech">LAN</span>
          </button>
        </div>

        {/* Vision Upload / Image Inspector */}
        <div className="space-y-2 pt-1 border-t border-[#37e6ff]/15">
          <span className="font-orbitron font-semibold tracking-wider text-[#37e6ff] uppercase text-[11px] flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5" /> Vision Analyzer
          </span>

          {pendingImage ? (
            <div className="p-2.5 rounded-xl bg-[#04080f] border border-[#37e6ff]/40 flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <img src={pendingImage.url} alt="Uploaded" className="w-9 h-9 object-cover rounded border border-[#37e6ff]/40" />
                <span className="text-xs text-[#eafcff] truncate">{pendingImage.name}</span>
              </div>
              <button
                onClick={onClearImage}
                className="text-[10px] text-[#ff7a7a] hover:underline ml-2"
              >
                Clear
              </button>
            </div>
          ) : (
            <label className="cursor-pointer block p-2.5 rounded-xl bg-[#04080f] hover:bg-[#091829] border border-dashed border-[#37e6ff]/40 text-center transition-colors">
              <Eye className="w-4 h-4 text-[#37e6ff] mx-auto mb-1" />
              <span className="text-xs text-[#8fc9dd]">Upload schematic or photo</span>
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          )}
        </div>

        {/* Proactivity / Daily Briefing Button */}
        <div className="pt-1 border-t border-[#37e6ff]/15">
          <button
            onClick={onTriggerBriefing}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#14324a] to-[#0d2133] hover:from-[#1b4363] hover:to-[#122e47] border border-[#37e6ff]/50 text-[#eafcff] font-semibold text-xs tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(55,230,255,0.15)] transition-all"
          >
            <Sun className="w-4 h-4 text-[#f2b23e]" />
            GENERATE BRIEFING NOW
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-auto p-4 border-t border-[#37e6ff]/15 bg-[#04080f] text-[10px] font-mono-tech text-[#1b8fa8] flex items-center justify-between">
        <span>JARVIS v4.2 PRO</span>
        <span className="text-[#5dffb0]">SANDBOX ARMED</span>
      </div>
    </aside>
  );
};
