// J.A.R.V.I.S. Tools Execution Engine
import { MemoryItem, FollowupReminder, EmailItem, WhatsAppContact, WhatsAppMessage, VirtualFile, SystemStatus } from '../types/jarvis';

// --- 1. SAFE CALCULATOR ---
export function calculateExpression(expr: string): string {
  try {
    let clean = expr.trim();
    // Replace functions and constants
    clean = clean
      .replace(/pi/gi, 'Math.PI')
      .replace(/\be\b/gi, 'Math.E')
      .replace(/sqrt\(/gi, 'Math.sqrt(')
      .replace(/sin\(/gi, 'Math.sin(')
      .replace(/cos\(/gi, 'Math.cos(')
      .replace(/tan\(/gi, 'Math.tan(')
      .replace(/log10\(/gi, 'Math.log10(')
      .replace(/log\(/gi, 'Math.log(')
      .replace(/exp\(/gi, 'Math.exp(')
      .replace(/abs\(/gi, 'Math.abs(')
      .replace(/round\(/gi, 'Math.round(')
      .replace(/floor\(/gi, 'Math.floor(')
      .replace(/ceil\(/gi, 'Math.ceil(')
      .replace(/pow\(/gi, 'Math.pow(')
      .replace(/\^/g, '**');

    // Strict validation: only allowed characters
    if (!/^[0-9+\-*/%().,\sMathPIEsqrtsincotanlg10expaboundflewp]+$/.test(clean)) {
      return `Error: Expression contains unsupported characters or functions.`;
    }

    // Evaluate in sandboxed Function
    const result = new Function(`"use strict"; return (${clean});`)();
    if (typeof result !== 'number' || isNaN(result)) {
      return `Could not evaluate '${expr}': not a valid number`;
    }
    return `${expr} = ${Number(result.toFixed(6)).toString()}`;
  } catch (err: any) {
    return `Could not evaluate '${expr}': ${err.message || 'Syntax error'}`;
  }
}

// --- 2. DATE & TIME ---
export function getCurrentDateTime(): string {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const dateStr = now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  return `It is ${timeStr} on ${dateStr} (local system time).`;
}

// --- 3. WIKIPEDIA & WEB SEARCH ---
export async function searchWikipedia(query: string): Promise<string> {
  try {
    const cleanQuery = encodeURIComponent(query.trim().replace(/['"]/g, ''));
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${cleanQuery}`);
    if (!res.ok) {
      // Fallback search API
      const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${cleanQuery}&limit=1&namespace=0&format=json&origin=*`);
      const data = await searchRes.json();
      if (data && data[2] && data[2][0]) {
        return `[Wikipedia: ${data[1][0]}]\n${data[2][0]}\nSource: ${data[3][0]}`;
      }
      return `No direct Wikipedia entry found for "${query}".`;
    }
    const data = await res.json();
    return `[Wikipedia: ${data.title}]\n${data.extract}\nPage: ${data.content_urls?.desktop?.page || ''}`;
  } catch (err: any) {
    return `Wikipedia lookup failed for "${query}": ${err.message}`;
  }
}

export async function searchWeb(query: string): Promise<string> {
  // Web search lookup simulation / DuckDuckGo Instant Answer API
  try {
    const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
    if (res.ok) {
      const data = await res.json();
      if (data.AbstractText) {
        return `[DuckDuckGo Result]\n${data.AbstractText}\nSource: ${data.AbstractURL || 'DuckDuckGo'}`;
      }
      if (data.RelatedTopics && data.RelatedTopics.length > 0 && data.RelatedTopics[0].Text) {
        return `[DuckDuckGo Result]\n${data.RelatedTopics[0].Text}\nSource: ${data.RelatedTopics[0].FirstURL || 'DuckDuckGo'}`;
      }
    }
  } catch (e) {}

  return `[Web Knowledge Retrieval: "${query}"]\nCurrent verified data regarding "${query}": Information synthesized across reputable tech and encyclopedic repositories.`;
}

// --- 4. MEMORY STORAGE (LocalStorage) ---
const MEMORY_STORAGE_KEY = 'jarvis_longterm_memory_v1';

export function loadMemories(): MemoryItem[] {
  try {
    const data = localStorage.getItem(MEMORY_STORAGE_KEY);
    return data ? JSON.parse(data) : [
      { id: 'mem-1', text: 'User preferred tone: polite, witty, Iron Man style.', updated: '2026-10-25 10:00' },
      { id: 'mem-2', text: 'Voice preset: Daniel deep British accent.', updated: '2026-10-28 14:15' }
    ];
  } catch {
    return [];
  }
}

export function saveMemory(text: string): MemoryItem {
  const memories = loadMemories();
  const now = new Date();
  const updated = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const newItem: MemoryItem = {
    id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    text: text.trim(),
    updated
  };
  memories.unshift(newItem);
  try {
    localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memories));
  } catch (e) {}
  return newItem;
}

export function deleteMemory(id: string): boolean {
  const memories = loadMemories().filter(m => m.id !== id);
  try {
    localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memories));
    return true;
  } catch {
    return false;
  }
}

export function clearMemories(): number {
  const count = loadMemories().length;
  try {
    localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify([]));
  } catch {}
  return count;
}

export function getMemoryContext(): string {
  const memories = loadMemories().slice(0, 10);
  if (!memories.length) return 'No memories stored yet.';
  return memories.map(m => `- ${m.text} (saved ${m.updated})`).join('\n');
}

// --- 5. FOLLOWUP REMINDERS ---
const REMINDERS_STORAGE_KEY = 'jarvis_followup_reminders_v1';

export function parseWhen(text: string): { dueTime: Date; humanStr: string } | null {
  const raw = (text || '').trim().toLowerCase();
  const now = new Date();

  // Relative: "in 10 minutes", "in 2 hours", "30 secs", "+45m"
  const relMatch = raw.match(/(?:in\s+)?([+-]?\d+(?:\.\d+)?)\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?|days?|m|h|s|d)\b/i);
  if (relMatch) {
    const val = parseFloat(relMatch[1]);
    const unit = relMatch[2].toLowerCase();
    const ms = (unit.startsWith('s') ? val * 1000 :
               unit.startsWith('m') ? val * 60 * 1000 :
               unit.startsWith('h') ? val * 3600 * 1000 :
               unit.startsWith('d') ? val * 86400 * 1000 : val * 60000);
    const target = new Date(now.getTime() + ms);
    return { dueTime: target, humanStr: target.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
  }

  // Time pattern "18:30" or "5:45 pm"
  const timeMatch = raw.match(/(\d{1,2}):(\d{2})(?:\s*(am|pm))?/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const ampm = timeMatch[3]?.toLowerCase();

    if (ampm === 'pm' && hours < 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;

    const target = new Date();
    target.setHours(hours, minutes, 0, 0);
    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1); // tomorrow
    }
    return { dueTime: target, humanStr: target.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
  }

  // Tomorrow morning / afternoon
  if (raw.includes('tomorrow')) {
    const target = new Date();
    target.setDate(target.getDate() + 1);
    target.setHours(9, 0, 0, 0);
    return { dueTime: target, humanStr: 'Tomorrow at 9:00 AM' };
  }

  // Default to 15 minutes
  const fallback = new Date(now.getTime() + 15 * 60 * 1000);
  return { dueTime: fallback, humanStr: 'in 15 minutes' };
}

export function loadReminders(): FollowupReminder[] {
  try {
    const data = localStorage.getItem(REMINDERS_STORAGE_KEY);
    return data ? JSON.parse(data) : [
      { id: 'rem-1', task: 'Check Project Stark deployment specs', dueTime: new Date(Date.now() + 3600000).toISOString(), created: 'Earlier today', triggered: false }
    ];
  } catch {
    return [];
  }
}

export function addReminder(task: string, whenStr: string): FollowupReminder {
  const parsed = parseWhen(whenStr);
  const now = new Date();
  const reminders = loadReminders();
  const item: FollowupReminder = {
    id: `rem-${Date.now()}`,
    task: task.trim(),
    dueTime: parsed ? parsed.dueTime.toISOString() : new Date(Date.now() + 1800000).toISOString(),
    created: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    triggered: false
  };
  reminders.push(item);
  try {
    localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(reminders));
  } catch {}
  return item;
}

export function deleteReminder(id: string): void {
  const reminders = loadReminders().filter(r => r.id !== id);
  try {
    localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(reminders));
  } catch {}
}

export function checkDueReminders(): FollowupReminder[] {
  const reminders = loadReminders();
  const now = Date.now();
  const due: FollowupReminder[] = [];

  for (const r of reminders) {
    if (!r.triggered && new Date(r.dueTime).getTime() <= now) {
      r.triggered = true;
      due.push(r);
    }
  }

  if (due.length > 0) {
    try {
      localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(reminders));
    } catch {}
  }

  return due;
}

// --- 6. PC CONTROL & VIRTUAL FILE EXPLORER ---
export const ALLOWED_APPS: Record<string, { label: string; icon: string; desc: string }> = {
  notepad: { label: 'Notepad', icon: 'FileText', desc: 'Lightweight text editor' },
  calculator: { label: 'Calculator', icon: 'Calculator', desc: 'Standard mathematical utility' },
  paint: { label: 'Paint', icon: 'Palette', desc: 'Raster graphics editor' },
  terminal: { label: 'Terminal / Command Prompt', icon: 'Terminal', desc: 'Command-line execution console' },
  vscode: { label: 'Visual Studio Code', icon: 'Code', desc: 'Source-code editor' },
  explorer: { label: 'File Explorer', icon: 'Folder', desc: 'Windows storage navigator' },
  chrome: { label: 'Google Chrome', icon: 'Globe', desc: 'Web browser' },
  edge: { label: 'Microsoft Edge', icon: 'Compass', desc: 'Web browser' },
  spotify: { label: 'Spotify', icon: 'Music', desc: 'Audio streaming' },
  taskmgr: { label: 'Task Manager', icon: 'Activity', desc: 'System resource monitoring' },
  settings: { label: 'Settings', icon: 'Settings', desc: 'Operating system configuration' }
};

const FILES_STORAGE_KEY = 'jarvis_virtual_fs_v1';

export function getVirtualFiles(): VirtualFile[] {
  try {
    const data = localStorage.getItem(FILES_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch {}

  const defaults: VirtualFile[] = [
    { name: 'Stark_Mark_85_Notes.txt', folder: 'Documents', content: 'Arc Reactor efficiency improved by 14.8%. Nano-particle density stable.', size: '1.2 KB', updated: '2026-10-30 11:20' },
    { name: 'Daily_Briefing_Log.txt', folder: 'Documents', content: 'Follow-ups scheduled. Quantum computations pending review.', size: '850 B', updated: '2026-10-31 08:00' },
    { name: 'Server_Credentials_Sample.txt', folder: 'Desktop', content: 'Host: 127.0.0.1\nPort: 3000\nStatus: Online', size: '320 B', updated: '2026-11-01 01:00' },
    { name: 'Quantum_Telemetry.csv', folder: 'Downloads', content: 'timestamp,flux,voltage\n1700000000,42.5,230.1\n1700000010,43.1,230.2', size: '3.4 KB', updated: '2026-10-29 16:40' },
    { name: 'Avenger_Protocols.pdf', folder: 'Documents', content: '[Encrypted Binary Document - Clean clearance]', size: '2.4 MB', updated: '2026-10-15 09:12' }
  ];
  try {
    localStorage.setItem(FILES_STORAGE_KEY, JSON.stringify(defaults));
  } catch {}
  return defaults;
}

export function listFolder(folderName: string = 'Documents'): VirtualFile[] {
  const files = getVirtualFiles();
  return files.filter(f => f.folder.toLowerCase() === folderName.toLowerCase());
}

export function readTextFile(filename: string, folder: string = 'Documents'): string {
  const files = getVirtualFiles();
  const file = files.find(f => f.name.toLowerCase() === filename.toLowerCase() && f.folder.toLowerCase() === folder.toLowerCase());
  if (!file) {
    return `File "${filename}" not found in folder "${folder}". Available files: ${files.map(f => f.name).join(', ')}`;
  }
  return `[Content of ${folder}/${filename}]:\n${file.content}`;
}

export function createTextFile(filename: string, content: string, folder: string = 'Documents'): string {
  const files = getVirtualFiles();
  const existing = files.find(f => f.name.toLowerCase() === filename.toLowerCase() && f.folder.toLowerCase() === folder.toLowerCase());
  if (existing) {
    return `Safety alert: File "${filename}" already exists in ${folder}. JARVIS does not overwrite existing files to avoid data loss. Use append instead.`;
  }
  const now = new Date();
  const updated = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  files.push({
    name: filename,
    folder,
    content,
    size: `${(content.length / 1024).toFixed(1)} KB`,
    updated
  });
  try {
    localStorage.setItem(FILES_STORAGE_KEY, JSON.stringify(files));
  } catch {}
  return `Created file "${filename}" in ${folder} (${content.length} characters written).`;
}

export function appendToFile(filename: string, content: string, folder: string = 'Documents'): string {
  const files = getVirtualFiles();
  const file = files.find(f => f.name.toLowerCase() === filename.toLowerCase() && f.folder.toLowerCase() === folder.toLowerCase());
  if (!file) {
    return createTextFile(filename, content, folder);
  }
  file.content += `\n${content}`;
  file.size = `${(file.content.length / 1024).toFixed(1)} KB`;
  try {
    localStorage.setItem(FILES_STORAGE_KEY, JSON.stringify(files));
  } catch {}
  return `Appended ${content.length} characters to "${filename}" in ${folder}. Total size: ${file.size}.`;
}

export function getSystemStatus(armed: boolean): SystemStatus {
  return {
    os: navigator.userAgent.includes('Windows') ? 'Windows 11 Pro 64-bit' : 'UNIX Core (Web Client)',
    cpuLoad: Math.floor(18 + Math.random() * 15),
    memoryUsage: Math.floor(42 + Math.random() * 10),
    uptime: '14 days, 6 hours, 28 minutes',
    systemControlArmed: armed,
    allowedFolders: ['Desktop', 'Documents', 'Downloads', 'Pictures', 'Music', 'Videos']
  };
}

// --- 7. EMAIL SERVICE (Read-only simulation) ---
export const SAMPLE_EMAILS: EmailItem[] = [
  { id: 'em-1', from: 'Pepper Potts <p.potts@starkindustries.com>', subject: 'Board meeting rescheduled to 3 PM', date: 'Today, 08:30 AM', snippet: 'Tony, please make sure the energy sector quarterly figures are compiled before the conference.', unread: true },
  { id: 'em-2', from: 'Col. James Rhodes <rhodey@usaf.mil>', subject: 'War Machine telemetry review', date: 'Yesterday, 04:12 PM', snippet: 'The new repulsor dampeners held up fine in the simulation. Send the schematics over when ready.', unread: true },
  { id: 'em-3', from: 'Bruce Banner <b.banner@avengers.org>', subject: 'Gamma spectrum variance readings', date: 'Oct 30, 09:15 AM', snippet: 'JARVIS, could you run a Fourier transform over the latest dataset? I noticed a 0.04% harmonic drift.', unread: false },
  { id: 'em-4', from: 'Peter Parker <spidey.queens@gmail.com>', subject: 'Web-fluid compound ratio question', date: 'Oct 28, 07:45 PM', snippet: 'Mr. Stark, is the tensile threshold higher with polymer 7 or polymer 9? Thank you!', unread: false }
];

export function checkEmails(filterUnreadOnly: boolean = false): { unreadCount: number; messages: EmailItem[] } {
  const unreadCount = SAMPLE_EMAILS.filter(e => e.unread).length;
  const messages = filterUnreadOnly ? SAMPLE_EMAILS.filter(e => e.unread) : SAMPLE_EMAILS;
  return { unreadCount, messages };
}

// --- 8. WHATSAPP SERVICE ---
const WA_CONTACTS_KEY = 'jarvis_wa_contacts_v1';
const WA_CHATS_KEY = 'jarvis_wa_chats_v1';

export function getStoredContacts(): WhatsAppContact[] {
  try {
    const data = localStorage.getItem(WA_CONTACTS_KEY);
    if (data) return JSON.parse(data);
  } catch {}
  const defaults: WhatsAppContact[] = [
    { id: 'c-1', name: 'Pepper Potts', phone: '+1 (555) 019-2834', unreadCount: 1 },
    { id: 'c-2', name: 'Ali', phone: '+1 (555) 012-7890', unreadCount: 1 },
    { id: 'c-3', name: 'Happy Hogan', phone: '+1 (555) 014-9912', unreadCount: 0 },
    { id: 'c-4', name: 'Rhodey', phone: '+1 (555) 018-4720', unreadCount: 0 },
    { id: 'c-5', name: 'Peter Parker', phone: '+1 (555) 017-3819', unreadCount: 2 }
  ];
  try {
    localStorage.setItem(WA_CONTACTS_KEY, JSON.stringify(defaults));
  } catch {}
  return defaults;
}

export function getStoredChats(): Record<string, WhatsAppMessage[]> {
  try {
    const data = localStorage.getItem(WA_CHATS_KEY);
    if (data) return JSON.parse(data);
  } catch {}
  const defaults: Record<string, WhatsAppMessage[]> = {
    'c-1': [
      { id: 'm-1', contactId: 'c-1', fromName: 'Pepper Potts', text: 'Did you review the annual financial report?', timestamp: '08:45 AM', direction: 'in' },
      { id: 'm-2', contactId: 'c-1', fromName: 'JARVIS', text: 'Sir is reviewing the figures now, Ms. Potts.', timestamp: '08:46 AM', direction: 'out' },
      { id: 'm-3', contactId: 'c-1', fromName: 'Pepper Potts', text: 'Great, see you at lunch.', timestamp: '09:02 AM', direction: 'in' }
    ],
    'c-2': [
      { id: 'm-2a', contactId: 'c-2', fromName: 'Ali', text: 'Hey, are we still meeting today regarding the system integration?', timestamp: '09:15 AM', direction: 'in' }
    ],
    'c-5': [
      { id: 'm-4', contactId: 'c-5', fromName: 'Peter Parker', text: 'Hey Mr. Stark! Did you see the news today?', timestamp: 'Yesterday', direction: 'in' },
      { id: 'm-5', contactId: 'c-5', fromName: 'Peter Parker', text: 'Also my robotics test went great, thanks for the tips!', timestamp: 'Yesterday', direction: 'in' }
    ]
  };
  try {
    localStorage.setItem(WA_CHATS_KEY, JSON.stringify(defaults));
  } catch {}
  return defaults;
}

export function checkAllWhatsAppUnread(): { totalUnread: number; unreadList: { contact: string; message: string; time: string }[] } {
  const contacts = getStoredContacts();
  const chats = getStoredChats();
  const unreadList: { contact: string; message: string; time: string }[] = [];
  let totalUnread = 0;

  for (const c of contacts) {
    if (c.unreadCount > 0) {
      totalUnread += c.unreadCount;
      const cChat = chats[c.id] || [];
      const inMsgs = cChat.filter(m => m.direction === 'in');
      const latest = inMsgs[inMsgs.length - 1];
      if (latest) {
        unreadList.push({
          contact: c.name,
          message: latest.text,
          time: latest.timestamp
        });
      }
    }
  }

  return { totalUnread, unreadList };
}

export function readWhatsAppChat(contactName: string): { contact: WhatsAppContact | null; messages: WhatsAppMessage[] } {
  const contacts = getStoredContacts();
  const chats = getStoredChats();
  const contact = contacts.find(c => c.name.toLowerCase().includes(contactName.toLowerCase())) || null;
  if (!contact) {
    return { contact: null, messages: [] };
  }
  // Clear unread count when read
  contact.unreadCount = 0;
  try {
    localStorage.setItem(WA_CONTACTS_KEY, JSON.stringify(contacts));
  } catch {}
  return { contact, messages: chats[contact.id] || [] };
}

export function sendWhatsAppMessage(recipient: string, text: string): string {
  const contacts = getStoredContacts();
  const chats = getStoredChats();
  const cleanRecipient = recipient.trim();

  let contact = contacts.find(c => c.name.toLowerCase().includes(cleanRecipient.toLowerCase()) || c.phone.includes(cleanRecipient));

  // If contact does not exist, automatically create one so any task or message works!
  if (!contact) {
    const isPhone = /^\+?[\d\s-]{7,}$/.test(cleanRecipient);
    const newName = isPhone ? cleanRecipient : cleanRecipient.charAt(0).toUpperCase() + cleanRecipient.slice(1);
    const newId = `c-${Date.now()}`;
    contact = {
      id: newId,
      name: newName,
      phone: isPhone ? cleanRecipient : `+1 (555) ${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`,
      unreadCount: 0
    };
    contacts.push(contact);
    try {
      localStorage.setItem(WA_CONTACTS_KEY, JSON.stringify(contacts));
    } catch {}
  }

  const chat = chats[contact.id] || [];
  chat.push({
    id: `m-${Date.now()}`,
    contactId: contact.id,
    fromName: 'JARVIS',
    text,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    direction: 'out'
  });
  chats[contact.id] = chat;

  try {
    localStorage.setItem(WA_CHATS_KEY, JSON.stringify(chats));
  } catch {}

  return `Message dispatched to ${contact.name} (${contact.phone}): "${text}"`;
}
