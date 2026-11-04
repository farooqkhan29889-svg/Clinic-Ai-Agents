export interface ToolCall {
  id: string;
  tool: string;
  input: string;
  result?: string;
  status: 'calling' | 'done' | 'error';
}

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user' | 'system';
  content: string;
  timestamp: string;
  toolCalls?: ToolCall[];
  imageAttachment?: {
    name: string;
    url: string;
    type?: string;
  };
}

export interface MemoryItem {
  id: string;
  text: string;
  updated: string;
}

export interface FollowupReminder {
  id: string;
  task: string;
  dueTime: string; // ISO string or human string
  created: string;
  triggered?: boolean;
}

export interface EmailItem {
  id: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
  unread: boolean;
}

export interface WhatsAppContact {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  unreadCount: number;
}

export interface WhatsAppMessage {
  id: string;
  contactId: string;
  fromName: string;
  text: string;
  timestamp: string;
  direction: 'in' | 'out';
}

export interface VirtualFile {
  name: string;
  folder: string; // 'Desktop' | 'Documents' | 'Downloads' | 'Pictures'
  content: string;
  size: string;
  updated: string;
}

export interface SystemStatus {
  os: string;
  cpuLoad: number;
  memoryUsage: number;
  uptime: string;
  systemControlArmed: boolean;
  allowedFolders: string[];
}

export interface VoicePreset {
  name: string;
  voiceNames: string[];
  rate: number;
  pitch: number;
  lang: string;
}

export type HudThemeId = 'cyan' | 'stark-red' | 'gold' | 'stealth' | 'emerald';

export interface JarvisSettings {
  apiKey: string;
  geminiKey: string;
  model: string;
  voicePreset: string;
  voiceRate: number;
  voicePitch: number;
  ttsEnabled: boolean;
  wakeWordEnabled: boolean;
  wakeWordLang: 'en' | 'hi';
  pcControlEnabled: boolean;
  remindersEnabled: boolean;
  briefingOn: boolean;
  briefingHour: number;
  mailWatchOn: boolean;
  waWatchOn: boolean;
  responseTone: 'Formal' | 'Casual' | 'Sarcastic' | 'Tactical';
  hudTheme: HudThemeId;
}

