import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, JarvisSettings, FollowupReminder } from './types/jarvis';
import { ArcReactor } from './components/ArcReactor';
import { ChatMessageItem } from './components/ChatMessage';
import { Sidebar } from './components/Sidebar';
import { AudioVisualizer } from './components/AudioVisualizer';
import { StarkHolographicHUD } from './components/StarkHolographicHUD';
import { MemoryModal } from './components/Modals/MemoryModal';
import { RemindersModal } from './components/Modals/RemindersModal';
import { FileManagerModal } from './components/Modals/FileManagerModal';
import { EmailModal } from './components/Modals/EmailModal';
import { WhatsAppModal } from './components/Modals/WhatsAppModal';
import { PhoneConnectModal } from './components/Modals/PhoneConnectModal';
import { speechService } from './services/speechService';
import { processJarvisCommand } from './services/jarvisBrain';
import { checkDueReminders } from './services/tools';
import { soundFX } from './services/soundEffects';
import {
  Send,
  Mic,
  MicOff,
  Square,
  Sparkles,
  Paperclip,
  X,
  Bell,
  Sun,
  Clock,
  Calculator,
  Brain,
  Monitor,
  Mail,
  MessageSquare,
  Search,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Activity,
  Layers,
  Terminal,
  Volume2,
  VolumeX,
  Radio,
  Zap
} from 'lucide-react';

export const App: React.FC = () => {
  // --- SETTINGS STATE ---
  const [settings, setSettings] = useState<JarvisSettings>(() => {
    return {
      apiKey: '',
      geminiKey: '',
      model: 'llama-3.3-70b-versatile',
      voicePreset: 'JARVIS (Avengers)',
      voiceRate: 0.94,
      voicePitch: 0.72,
      ttsEnabled: true,
      wakeWordEnabled: true, // Always ready by default!
      wakeWordLang: 'en',
      pcControlEnabled: true,
      remindersEnabled: true,
      briefingOn: true,
      briefingHour: 8,
      mailWatchOn: false,
      waWatchOn: false,
      responseTone: 'Formal',
    };
  });

  // --- VIEW MODE ---
  const [activeTab, setActiveTab] = useState<'console' | 'diagnostics'>('console');

  // --- MESSAGES STATE ---
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content:
        'Good day, Sir. J.A.R.V.I.S. is fully online and all-time ready.\n\nI am listening for your voice: simply say **“Hello JARVIS”** or **“Hey JARVIS”** anytime. I can manage your daily workflow, check WhatsApp messages, dispatch communications to any contact, inspect emails, calculate data, and execute Stark security protocols.\n\nAlways at your service, Sir. What would you like me to handle today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [isWakeArmed, setIsWakeArmed] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [wakeError, setWakeError] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<{ name: string; url: string } | null>(null);
  const [reminderToast, setReminderToast] = useState<FollowupReminder | null>(null);

  // --- MODAL VISIBILITY ---
  const [openModal, setOpenModal] = useState<
    'memory' | 'reminders' | 'files' | 'email' | 'whatsapp' | 'phone' | null
  >(null);

  // --- CHAT CONSOLE SEARCH & FILTER STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchRoleFilter, setSearchRoleFilter] = useState<'all' | 'user' | 'assistant' | 'tools'>('all');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeTab === 'console' && !searchQuery.trim() && searchRoleFilter === 'all') {
      scrollToBottom();
    }
  }, [messages, isProcessing, activeTab, searchQuery, searchRoleFilter]);

  // Connect speech state callback
  useEffect(() => {
    speechService.setSpeechStateCallback((speaking) => {
      setIsSpeaking(speaking);
    });
  }, []);

  // Initialize and keep Wake Word listener active
  const startWakeListener = (lang: 'en' | 'hi' = settings.wakeWordLang) => {
    setWakeError(null);
    speechService.startWakeWordListener(
      lang,
      () => {
        setIsWakeArmed(true);
        soundFX.playJarvisChime();
      },
      (command) => {
        setIsWakeArmed(false);
        setLiveTranscript('');
        executeCommand(command);
      },
      (err) => {
        console.warn('Wake word error:', err);
        setWakeError(err);
        setIsWakeArmed(false);
      },
      (transcript, armed) => {
        setLiveTranscript(transcript);
        if (armed) {
          setIsWakeArmed(true);
        }
      }
    );
  };

  useEffect(() => {
    if (settings.wakeWordEnabled) {
      startWakeListener(settings.wakeWordLang);
    } else {
      speechService.stopWakeWordListener();
      setIsWakeArmed(false);
      setLiveTranscript('');
    }

    return () => {
      speechService.stopWakeWordListener();
    };
  }, [settings.wakeWordEnabled, settings.wakeWordLang]);

  // Update Settings handler
  const handleUpdateSettings = (newSettings: Partial<JarvisSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      return updated;
    });
  };

  // Background Follow-up Reminder Checker
  useEffect(() => {
    const timer = setInterval(() => {
      const due = checkDueReminders();
      if (due.length > 0) {
        const item = due[0];
        setReminderToast(item);
        soundFX.playJarvisChime();
        if (settings.ttsEnabled) {
          speechService.speak(
            `Sir, pardon the interruption. Your follow-up task "${item.task}" is now due.`,
            settings.voicePreset,
            settings.voiceRate,
            settings.voicePitch
          );
        }
        setTimeout(() => setReminderToast(null), 8000);
      }
    }, 4000);

    return () => clearInterval(timer);
  }, [settings.ttsEnabled, settings.voicePreset, settings.voiceRate, settings.voicePitch]);

  // Execute Agent Command
  const executeCommand = async (promptText: string, attachedImg?: { name: string; url: string }) => {
    if (!promptText.trim() && !attachedImg) return;

    soundFX.playClick();

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      role: 'user',
      content: promptText || '(Sent image for visual analysis)',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      imageAttachment: attachedImg,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setPendingImage(null);
    setIsProcessing(true);

    try {
      const result = await processJarvisCommand(promptText, settings, attachedImg);

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-a`,
        role: 'assistant',
        content: result.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolCalls: result.toolCalls,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsProcessing(false);
      soundFX.playJarvisChime();

      // Voice response
      if (settings.ttsEnabled) {
        speechService.speak(
          result.content,
          settings.voicePreset,
          settings.voiceRate,
          settings.voicePitch
        );
      }
    } catch (err: any) {
      setIsProcessing(false);
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        role: 'assistant',
        content: `I apologize, Sir. An unforeseen anomaly occurred: ${err.message || 'System diagnostic failure.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    executeCommand(inputPrompt, pendingImage || undefined);
  };

  // Push-to-talk Mic
  const handleMicClick = () => {
    if (isListeningMic) return;
    soundFX.playScanPing();
    setIsListeningMic(true);

    speechService.listenOnce(
      settings.wakeWordLang === 'hi' ? 'hi-IN' : 'en-US',
      (transcript) => {
        setIsListeningMic(false);
        if (transcript.trim()) {
          executeCommand(transcript, pendingImage || undefined);
        }
      },
      (err) => {
        console.warn('Mic error', err);
        setIsListeningMic(false);
      },
      () => {
        setIsListeningMic(false);
      }
    );
  };

  // Stop button (stop_signal)
  const handleStop = () => {
    soundFX.playClick();
    speechService.stopSpeaking();
    setIsProcessing(false);
  };

  // Image Upload handler
  const handleImageFile = (file: File) => {
    soundFX.playScanPing();
    const reader = new FileReader();
    reader.onload = (e) => {
      setPendingImage({
        name: file.name,
        url: e.target?.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  // Everyday Tony Stark quick tasks
  const quickActions = [
    { label: '💬 Check WhatsApp Messages', prompt: 'Check all my new WhatsApp messages.' },
    { label: '📨 Message Ali', prompt: 'Send WhatsApp message to Ali saying: We are on schedule for the project review today.' },
    { label: '📋 Handle My Work Today', prompt: 'Handle my work today: organize my agenda, check messages, and summarize priorities.' },
    { label: '⚡ House Party Protocol', prompt: 'Initiate House Party Protocol: Deploy all automated armors.' },
    { label: '🌅 Morning Briefing', prompt: 'Give me my morning briefing report, Sir.' },
    { label: '⏰ Remind in 15 mins', prompt: 'Remind me in 15 minutes to inspect the latest data feed.' },
    { label: '🔢 Calculate 3.14 * 42', prompt: 'Calculate 3.14 * 42' },
    { label: '🧠 Save memory', prompt: 'Save this: Important contact Ali email is ali@starkindustries.com' },
    { label: '🖥 PC Hardware Status', prompt: 'What is the current PC system status?' },
    { label: '✉️ Check Email Inbox', prompt: 'Check my email inbox for unread messages.' },
  ];

  // Filter messages based on search query and category/role filter
  const isFiltering = searchQuery.trim().length > 0 || searchRoleFilter !== 'all';

  const filteredMessages = messages.filter((msg) => {
    if (searchRoleFilter === 'user' && msg.role !== 'user') return false;
    if (searchRoleFilter === 'assistant' && msg.role !== 'assistant') return false;
    if (searchRoleFilter === 'tools' && (!msg.toolCalls || msg.toolCalls.length === 0)) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();

    if (msg.content.toLowerCase().includes(q)) return true;

    if (
      msg.toolCalls?.some(
        (tc) =>
          tc.tool.toLowerCase().includes(q) ||
          tc.input?.toLowerCase().includes(q) ||
          tc.result?.toLowerCase().includes(q)
      )
    ) {
      return true;
    }

    if (msg.imageAttachment?.name.toLowerCase().includes(q)) return true;

    return false;
  });

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#04070d] text-[#d7f7ff]">
      {/* Sidebar Controls */}
      <Sidebar
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onOpenMemory={() => {
          soundFX.playClick();
          setOpenModal('memory');
        }}
        onOpenReminders={() => {
          soundFX.playClick();
          setOpenModal('reminders');
        }}
        onOpenFiles={() => {
          soundFX.playClick();
          setOpenModal('files');
        }}
        onOpenEmail={() => {
          soundFX.playClick();
          setOpenModal('email');
        }}
        onOpenWhatsApp={() => {
          soundFX.playClick();
          setOpenModal('whatsapp');
        }}
        onOpenPhoneConnect={() => {
          soundFX.playClick();
          setOpenModal('phone');
        }}
        onTriggerBriefing={() => executeCommand('Give me my morning briefing report, Sir.')}
        onUploadImage={handleImageFile}
        pendingImage={pendingImage}
        onClearImage={() => setPendingImage(null)}
        isWakeArmed={isWakeArmed}
      />

      {/* Main Command Center */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Header with Arc Reactor */}
        <header className="px-6 py-3.5 border-b border-[#37e6ff]/20 bg-[#061019]/90 backdrop-blur-md flex items-center justify-between z-10 select-none">
          <div className="flex items-center gap-4">
            <ArcReactor
              isSpeaking={isSpeaking}
              isListening={isListeningMic}
              isWakeArmed={isWakeArmed}
              onClick={() => {
                soundFX.playRepulsorArm();
                if (settings.ttsEnabled) {
                  speechService.speak(
                    'At your service, Sir. J.A.R.V.I.S. is all-time ready. Say Hello JARVIS anytime.',
                    settings.voicePreset,
                    settings.voiceRate,
                    settings.voicePitch
                  );
                }
              }}
              size={64}
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-orbitron text-2xl font-black tracking-widest text-[#eafcff] glow-text-cyan">
                  J.A.R.V.I.S.
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#37e6ff]/20 border border-[#37e6ff]/40 text-[#37e6ff] font-mono-tech uppercase">
                  ALL-TIME READY
                </span>
              </div>
              <p className="text-[10px] font-mono-tech text-[#1b8fa8] tracking-[0.25em] uppercase -mt-0.5">
                JUST A RATHER VERY INTELLIGENT SYSTEM • TONY STARK AI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-[#04080f] p-1 rounded-xl border border-[#37e6ff]/30 text-xs font-orbitron">
              <button
                onClick={() => {
                  soundFX.playClick();
                  setActiveTab('console');
                }}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  activeTab === 'console'
                    ? 'bg-[#37e6ff]/25 text-[#eafcff] border border-[#37e6ff] shadow-[0_0_10px_rgba(55,230,255,0.25)]'
                    : 'text-[#8fc9dd] hover:text-white'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" /> Command Console
              </button>
              <button
                onClick={() => {
                  soundFX.playScanPing();
                  setActiveTab('diagnostics');
                }}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  activeTab === 'diagnostics'
                    ? 'bg-[#37e6ff]/25 text-[#eafcff] border border-[#37e6ff] shadow-[0_0_10px_rgba(55,230,255,0.25)]'
                    : 'text-[#8fc9dd] hover:text-white'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-[#37e6ff]" /> Armor Diagnostics
              </button>
            </div>

            <AudioVisualizer isSpeaking={isSpeaking} isListening={isListeningMic} />

            <div className="text-right hidden xl:block font-mono-tech">
              <div className="text-xs text-[#eafcff]">
                {new Date().toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
              <div className="text-[11px] text-[#37e6ff]">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </header>

        {/* ALWAYS-ON WAKE WORD ACTIVE HUD BANNER */}
        <div
          className={`px-6 py-2 border-b flex items-center justify-between transition-all select-none ${
            isWakeArmed
              ? 'bg-[#291b06] border-[#f2b23e] shadow-[0_0_20px_rgba(242,178,62,0.4)]'
              : settings.wakeWordEnabled
              ? 'bg-[#051726]/90 border-[#37e6ff]/30'
              : 'bg-[#181116] border-[#ff7a7a]/40'
          }`}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <span
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                isWakeArmed
                  ? 'bg-[#f2b23e] animate-ping'
                  : settings.wakeWordEnabled
                  ? 'bg-[#5dffb0] animate-pulse'
                  : 'bg-[#ff7a7a]'
              }`}
            />
            <div className="text-xs truncate">
              {isWakeArmed ? (
                <span className="font-bold text-[#f2b23e] font-orbitron tracking-wide flex items-center gap-2">
                  <span>⚡ “YES, SIR?” — LISTENING FOR YOUR COMMAND:</span>
                  <span className="text-white italic font-sans font-normal truncate">
                    {liveTranscript || 'Speak your task aloud...'}
                  </span>
                </span>
              ) : settings.wakeWordEnabled ? (
                <span className="text-[#eafcff] font-medium flex items-center gap-2">
                  <span className="text-[#5dffb0] font-bold font-orbitron text-[11px] uppercase tracking-wider">
                    JARVIS ALL-TIME READY:
                  </span>
                  <span className="text-[#8fc9dd]">
                    Say <strong className="text-[#37e6ff]">“Hello JARVIS”</strong> or <strong className="text-[#37e6ff]">“Hey JARVIS”</strong> aloud anytime to command.
                  </span>
                  {liveTranscript && (
                    <span className="text-xs text-[#37e6ff] italic font-mono-tech ml-2">
                      “{liveTranscript}”
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-[#ff7a7a] font-medium">
                  Wake word listener is currently paused. Click to engage hands-free voice.
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {wakeError && (
              <span className="text-[10px] text-[#ff7a7a] hidden sm:inline-block font-mono-tech">
                {wakeError}
              </span>
            )}
            <button
              onClick={() => {
                soundFX.playClick();
                handleUpdateSettings({ wakeWordEnabled: !settings.wakeWordEnabled });
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                settings.wakeWordEnabled
                  ? 'bg-[#37e6ff]/20 text-[#37e6ff] border border-[#37e6ff]/40 hover:bg-[#37e6ff]/30'
                  : 'bg-[#ff7a7a]/20 text-[#ff7a7a] border border-[#ff7a7a] hover:bg-[#ff7a7a]/30'
              }`}
            >
              {settings.wakeWordEnabled ? (
                <>
                  <Mic className="w-3.5 h-3.5 text-[#5dffb0]" /> Listening Active
                </>
              ) : (
                <>
                  <MicOff className="w-3.5 h-3.5" /> Engage Listener
                </>
              )}
            </button>
          </div>
        </div>

        {/* Due Reminder Toast Popup */}
        {reminderToast && (
          <div className="absolute top-24 right-6 z-50 p-4 rounded-2xl bg-[#1d0e12] border-2 border-[#ff7a7a] shadow-[0_0_25px_rgba(255,122,122,0.5)] flex items-start gap-3 max-w-sm animate-bounce">
            <Bell className="w-5 h-5 text-[#ff7a7a] flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-[#ff7a7a] uppercase tracking-wider">
                Follow-Up Alert Due!
              </h4>
              <p className="text-sm font-semibold text-white mt-0.5">{reminderToast.task}</p>
              <span className="text-[10px] text-[#ff7a7a]/80 font-mono-tech block mt-1">
                Scheduled for {new Date(reminderToast.dueTime).toLocaleTimeString()}
              </span>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        {activeTab === 'diagnostics' ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <StarkHolographicHUD
              isSpeaking={isSpeaking}
              onExecuteVoiceCommand={(cmd) => {
                setActiveTab('console');
                executeCommand(cmd);
              }}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Search Bar & Telemetry Filters */}
            <div className="px-6 py-2.5 bg-[#06121f]/95 border-b border-[#37e6ff]/20 backdrop-blur-md flex flex-col gap-2 z-10 select-none">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#37e6ff]/70 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search past instructions, J.A.R.V.I.S. responses, or tools (e.g., 'WhatsApp', 'calc', 'Mark 85')..."
                    className="w-full bg-[#04080f]/90 border border-[#37e6ff]/30 rounded-xl pl-9 pr-8 py-2 text-xs text-[#eafcff] placeholder-[#8fc9dd]/60 focus:outline-none focus:border-[#37e6ff] focus:ring-1 focus:ring-[#37e6ff] shadow-[inset_0_0_12px_rgba(55,230,255,0.06)]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        soundFX.playClick();
                        setSearchQuery('');
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-[#8fc9dd] hover:text-[#ff7a7a] transition-colors"
                      title="Clear search query"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="hidden sm:flex items-center gap-1 bg-[#04080f] p-1 rounded-xl border border-[#37e6ff]/25 text-[10px] font-orbitron">
                  {(
                    [
                      { key: 'all', label: 'All' },
                      { key: 'user', label: '🧑 Instructions' },
                      { key: 'assistant', label: '🤖 J.A.R.V.I.S.' },
                      { key: 'tools', label: '⚡ Tools' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => {
                        soundFX.playClick();
                        setSearchRoleFilter(tab.key);
                      }}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        searchRoleFilter === tab.key
                          ? 'bg-[#37e6ff]/25 text-[#eafcff] border border-[#37e6ff]/40 shadow-[0_0_8px_rgba(55,230,255,0.2)]'
                          : 'text-[#8fc9dd] hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {isFiltering && (
                  <button
                    onClick={() => {
                      soundFX.playClick();
                      setSearchQuery('');
                      setSearchRoleFilter('all');
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-[#ff7a7a]/15 hover:bg-[#ff7a7a]/25 border border-[#ff7a7a]/40 text-[#ff7a7a] text-[10px] font-semibold transition-all whitespace-nowrap"
                  >
                    Reset Filter
                  </button>
                )}
              </div>

              {/* Status readout when filtering */}
              {isFiltering && (
                <div className="flex items-center justify-between text-[11px] font-mono-tech px-1 text-[#8fc9dd]">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#37e6ff] animate-pulse" />
                    <span>
                      Found <strong className="text-[#37e6ff]">{filteredMessages.length}</strong> of{' '}
                      {messages.length} messages
                      {searchQuery && (
                        <span>
                          {' '}matching &ldquo;<span className="text-white">{searchQuery}</span>&rdquo;
                        </span>
                      )}
                    </span>
                  </div>
                  {searchRoleFilter !== 'all' && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#37e6ff]/10 border border-[#37e6ff]/30 text-[#37e6ff] uppercase">
                      Category: {searchRoleFilter}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Scrollable messages area */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Quick Action Badges */}
              {!isFiltering && (
                <div className="mb-3">
                  <span className="text-[10px] font-orbitron tracking-wider text-[#1b8fa8] uppercase block mb-2">
                    Stark Everyday Action Suite & Direct Tasks
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {quickActions.map((qa, i) => (
                      <button
                        key={i}
                        onClick={() => executeCommand(qa.prompt)}
                        disabled={isProcessing}
                        className="px-3 py-1.5 rounded-xl bg-[#091524]/80 hover:bg-[#37e6ff]/20 border border-[#37e6ff]/30 text-xs text-[#d7f7ff] transition-all hover:scale-[1.02] shadow-[0_0_8px_rgba(55,230,255,0.1)] disabled:opacity-50"
                      >
                        {qa.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Filtered Messages List */}
              {filteredMessages.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#091420]/60 border border-[#37e6ff]/20 text-center my-6 space-y-3">
                  <Search className="w-8 h-8 text-[#37e6ff]/60 mx-auto" />
                  <h4 className="text-sm font-orbitron font-bold text-[#eafcff]">
                    NO COMMUNICATIONS FOUND
                  </h4>
                  <p className="text-xs text-[#8fc9dd] max-w-md mx-auto">
                    No past instructions or J.A.R.V.I.S. responses match &ldquo;{searchQuery}&rdquo;
                    {searchRoleFilter !== 'all' ? ` in the ${searchRoleFilter} category` : ''}.
                  </p>
                  <button
                    onClick={() => {
                      soundFX.playClick();
                      setSearchQuery('');
                      setSearchRoleFilter('all');
                    }}
                    className="px-4 py-1.5 rounded-xl bg-[#37e6ff]/20 hover:bg-[#37e6ff]/30 border border-[#37e6ff] text-[#eafcff] text-xs font-semibold tracking-wider transition-all"
                  >
                    Clear Search & Show All
                  </button>
                </div>
              ) : (
                filteredMessages.map((msg) => (
                  <ChatMessageItem
                    key={msg.id}
                    message={msg}
                    highlightQuery={searchQuery}
                    onSpeak={(text) =>
                      speechService.speak(
                        text,
                        settings.voicePreset,
                        settings.voiceRate,
                        settings.voicePitch
                      )
                    }
                    isSpeakingThis={isSpeaking}
                  />
                ))
              )}

              {/* Processing Indicator */}
              {isProcessing && (
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#091420]/80 border border-[#37e6ff]/30 max-w-sm">
                  <div className="w-4 h-4 rounded-full border-2 border-[#37e6ff] border-t-transparent animate-spin" />
                  <span className="text-xs font-mono-tech text-[#37e6ff] animate-pulse">
                    J.A.R.V.I.S. is processing task & consulting Stark neural networks...
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Pending Image Attachment Bar */}
        {pendingImage && (
          <div className="px-6 py-2 bg-[#091524] border-t border-[#37e6ff]/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src={pendingImage.url}
                alt={pendingImage.name}
                className="w-8 h-8 rounded object-cover border border-[#37e6ff]/40"
              />
              <span className="text-xs text-[#eafcff] font-mono-tech">
                Attachment ready: {pendingImage.name}
              </span>
            </div>
            <button
              onClick={() => setPendingImage(null)}
              className="p-1 rounded text-[#ff7a7a] hover:bg-[#ff7a7a]/20"
              title="Remove attachment"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input Control Console */}
        <div className="p-4 border-t border-[#37e6ff]/20 bg-[#061019]/95 backdrop-blur-md">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            {/* Attach Image button */}
            <label
              title="Show JARVIS an optical schematic or photo"
              className="p-2.5 rounded-xl bg-[#091624] hover:bg-[#37e6ff]/20 border border-[#37e6ff]/30 text-[#8fc9dd] hover:text-[#37e6ff] cursor-pointer transition-all"
            >
              <Paperclip className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleImageFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
            </label>

            {/* Mic push to talk */}
            <button
              type="button"
              onClick={handleMicClick}
              title={isListeningMic ? 'Listening...' : 'Click to speak command directly'}
              className={`p-2.5 rounded-xl border transition-all ${
                isListeningMic
                  ? 'bg-[#5dffb0]/20 border-[#5dffb0] text-[#5dffb0] animate-pulse shadow-[0_0_15px_rgba(93,255,176,0.5)]'
                  : 'bg-[#091624] hover:bg-[#37e6ff]/20 border-[#37e6ff]/30 text-[#8fc9dd] hover:text-[#37e6ff]'
              }`}
            >
              {isListeningMic ? <Mic className="w-4 h-4 text-[#5dffb0]" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Main Prompt Input Box */}
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Dictate with 'Hello JARVIS' or type any task (e.g. 'check whatsapp', 'message Ali', 'handle my work')..."
              className="flex-1 bg-[#091420]/90 border border-[#37e6ff]/35 rounded-xl px-4 py-2.5 text-sm text-[#eafcff] placeholder-[#8fc9dd]/60 focus:outline-none focus:border-[#37e6ff] focus:ring-1 focus:ring-[#37e6ff] shadow-[inset_0_0_15px_rgba(55,230,255,0.05)]"
            />

            {/* Stop button (when processing or speaking) */}
            {(isProcessing || isSpeaking) && (
              <button
                type="button"
                onClick={handleStop}
                title="Halt active speech or reasoning"
                className="p-2.5 rounded-xl bg-[#ff7a7a]/20 hover:bg-[#ff7a7a]/30 border border-[#ff7a7a] text-[#ff7a7a] transition-all"
              >
                <Square className="w-4 h-4" />
              </button>
            )}

            {/* Send Button */}
            <button
              type="submit"
              disabled={(!inputPrompt.trim() && !pendingImage) || isProcessing}
              className="p-2.5 rounded-xl bg-[#37e6ff]/20 hover:bg-[#37e6ff]/35 border border-[#37e6ff] text-[#eafcff] transition-all disabled:opacity-40 shadow-[0_0_12px_rgba(55,230,255,0.3)] hover:scale-105"
              title="Transmit to JARVIS"
            >
              <Send className="w-4 h-4 text-[#37e6ff]" />
            </button>
          </form>

          {/* Quick status footnote */}
          <div className="flex items-center justify-between text-[10px] font-mono-tech text-[#1b8fa8] mt-2 px-1">
            <span>Voice: {settings.ttsEnabled ? settings.voicePreset : 'Muted'} • Tone: {settings.responseTone} • Listener: Always-On</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5dffb0]" />
              Stark Automation Network Active
            </span>
          </div>
        </div>
      </main>

      {/* MODALS */}
      <MemoryModal
        isOpen={openModal === 'memory'}
        onClose={() => setOpenModal(null)}
      />

      <RemindersModal
        isOpen={openModal === 'reminders'}
        onClose={() => setOpenModal(null)}
      />

      <FileManagerModal
        isOpen={openModal === 'files'}
        onClose={() => setOpenModal(null)}
        pcControlEnabled={settings.pcControlEnabled}
      />

      <EmailModal
        isOpen={openModal === 'email'}
        onClose={() => setOpenModal(null)}
      />

      <WhatsAppModal
        isOpen={openModal === 'whatsapp'}
        onClose={() => setOpenModal(null)}
      />

      <PhoneConnectModal
        isOpen={openModal === 'phone'}
        onClose={() => setOpenModal(null)}
      />
    </div>
  );
};

export default App;
