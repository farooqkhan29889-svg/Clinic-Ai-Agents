import React, { useState, useEffect } from 'react';
import { getStoredContacts, getStoredChats, sendWhatsAppMessage } from '../../services/tools';
import { WhatsAppContact, WhatsAppMessage } from '../../types/jarvis';
import { MessageSquare, X, Send, User, CheckCheck, Plus } from 'lucide-react';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({ isOpen, onClose }) => {
  const [contacts, setContacts] = useState<WhatsAppContact[]>(getStoredContacts());
  const [selectedContact, setSelectedContact] = useState<WhatsAppContact>(() => {
    const list = getStoredContacts();
    return list[0] || { id: 'c-default', name: 'Ali', phone: '+1 555-0123', unreadCount: 0 };
  });
  const [messageText, setMessageText] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredContacts();
      setContacts(stored);
      if (!selectedContact && stored.length > 0) {
        setSelectedContact(stored[0]);
      }
    }
  }, [isOpen, refreshKey]);

  if (!isOpen) return null;

  const chats = getStoredChats();
  const currentChat: WhatsAppMessage[] = selectedContact ? (chats[selectedContact.id] || []) : [];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedContact) return;
    sendWhatsAppMessage(selectedContact.name, messageText.trim());
    setMessageText('');
    setRefreshKey((k) => k + 1);
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim()) return;
    sendWhatsAppMessage(newContactName.trim(), 'Connection established.');
    setNewContactName('');
    setShowAddContact(false);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-[#071019] border border-[#37e6ff]/40 rounded-2xl shadow-[0_0_35px_rgba(55,230,255,0.25)] flex flex-col h-[75vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#37e6ff]/25 bg-[#091624]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#25d366]/20 border border-[#25d366]/40 text-[#25d366]">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-orbitron text-base font-bold text-[#eafcff] tracking-wide">
                WHATSAPP DESKTOP & CLOUD SUITE
              </h2>
              <p className="text-xs text-[#8fc9dd] font-mono-tech">
                Live Contact Threads • Read, Receive & Outbound Transmission
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
        <div className="flex-1 flex overflow-hidden">
          {/* Contacts list */}
          <div className="w-64 bg-[#04080f]/90 border-r border-[#37e6ff]/20 overflow-y-auto p-2 space-y-1">
            <div className="flex items-center justify-between px-2 py-1 mb-1">
              <span className="text-[10px] font-orbitron tracking-wider text-[#1b8fa8] uppercase">
                Contacts ({contacts.length})
              </span>
              <button
                onClick={() => setShowAddContact(!showAddContact)}
                className="text-[10px] text-[#37e6ff] hover:underline flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>

            {showAddContact && (
              <form onSubmit={handleAddContact} className="p-2 bg-[#091624] rounded-lg mb-2 space-y-1.5">
                <input
                  type="text"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  placeholder="Contact name or phone..."
                  className="w-full bg-[#04080f] border border-[#37e6ff]/30 rounded px-2 py-1 text-xs text-[#eafcff] focus:outline-none"
                />
                <button
                  type="submit"
                  className="w-full py-1 rounded bg-[#25d366]/20 border border-[#25d366] text-[#eafcff] text-[10px] font-bold"
                >
                  Create Contact
                </button>
              </form>
            )}

            {contacts.map((c: WhatsAppContact) => (
              <div
                key={c.id}
                onClick={() => setSelectedContact(c)}
                className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                  selectedContact?.id === c.id
                    ? 'bg-[#091f33] border border-[#37e6ff]/40 text-[#eafcff]'
                    : 'hover:bg-[#091624] text-[#8fc9dd]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#1b8fa8]/30 border border-[#37e6ff]/40 flex items-center justify-center text-xs font-bold text-[#37e6ff] flex-shrink-0">
                    {c.name[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#f2fdff] truncate">{c.name}</div>
                    <div className="text-[10px] text-[#1b8fa8] font-mono-tech truncate">{c.phone}</div>
                  </div>
                </div>
                {c.unreadCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#25d366] text-black text-[10px] font-bold flex items-center justify-center flex-shrink-0 ml-1">
                    {c.unreadCount}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Chat pane */}
          <div className="flex-1 flex flex-col bg-[#071019]">
            {/* Chat header */}
            <div className="px-5 py-3 border-b border-[#37e6ff]/15 bg-[#091524] flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-[#eafcff]">{selectedContact?.name || 'Select Contact'}</h4>
                <p className="text-[11px] text-[#5dffb0] font-mono-tech">{selectedContact?.phone || ''} • Online</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#04080f]/50" key={refreshKey}>
              {currentChat.length === 0 ? (
                <div className="text-center py-12 text-xs text-[#8fc9dd]">
                  No messages yet. Send a message to initiate thread.
                </div>
              ) : (
                currentChat.map((m: WhatsAppMessage) => {
                  const isOut = m.direction === 'out';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isOut ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[75%] p-3 rounded-2xl text-xs leading-relaxed ${
                          isOut
                            ? 'bg-[#005c4b] text-white rounded-br-none border border-[#25d366]/30'
                            : 'bg-[#202c33] text-[#eafcff] rounded-bl-none border border-white/10'
                        }`}
                      >
                        <p>{m.text}</p>
                        <div className="flex items-center justify-end gap-1 text-[9px] opacity-75 mt-1 font-mono-tech">
                          <span>{m.timestamp}</span>
                          {isOut && <CheckCheck className="w-3 h-3 text-[#37e6ff]" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input form */}
            <form onSubmit={handleSend} className="p-3 border-t border-[#37e6ff]/20 bg-[#091624] flex gap-2">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={`Message ${selectedContact?.name || 'recipient'}...`}
                className="flex-1 bg-[#04080f] border border-[#37e6ff]/30 rounded-xl px-4 py-2 text-xs text-[#eafcff] focus:outline-none focus:border-[#37e6ff]"
              />
              <button
                type="submit"
                disabled={!messageText.trim()}
                className="px-4 py-2 rounded-xl bg-[#25d366]/20 hover:bg-[#25d366]/30 border border-[#25d366] text-[#eafcff] font-semibold text-xs tracking-wider flex items-center gap-1.5 transition-all disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
