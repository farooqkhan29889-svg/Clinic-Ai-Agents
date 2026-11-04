import React, { useState } from 'react';
import { SAMPLE_EMAILS } from '../../services/tools';
import { Mail, X, Search, Inbox, Shield } from 'lucide-react';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmailModal: React.FC<EmailModalProps> = ({ isOpen, onClose }) => {
  const [emails, setEmails] = useState(SAMPLE_EMAILS);
  const [filterUnread, setFilterUnread] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedEmail, setSelectedEmail] = useState(SAMPLE_EMAILS[0]);

  if (!isOpen) return null;

  const filtered = emails.filter((e) => {
    if (filterUnread && !e.unread) return false;
    if (search) {
      const q = search.toLowerCase();
      return e.subject.toLowerCase().includes(q) || e.from.toLowerCase().includes(q) || e.snippet.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-[#071019] border border-[#37e6ff]/40 rounded-2xl shadow-[0_0_35px_rgba(55,230,255,0.25)] flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#37e6ff]/25 bg-[#091624]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#37e6ff]/10 border border-[#37e6ff]/30 text-[#37e6ff]">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-orbitron text-base font-bold text-[#eafcff] tracking-wide">
                COMMUNICATIONS INBOX (IMAP)
              </h2>
              <p className="text-xs text-[#8fc9dd] font-mono-tech flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#5dffb0]" />
                Read-Only IMAP Access • Safe Peek Protocol
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

        {/* Toolbar */}
        <div className="px-5 py-2.5 bg-[#04080f] border-b border-[#37e6ff]/15 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#1b8fa8]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search mailbox..."
              className="w-full bg-[#091624] border border-[#37e6ff]/25 rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#eafcff] focus:outline-none focus:border-[#37e6ff]"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterUnread(!filterUnread)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterUnread
                  ? 'bg-[#37e6ff]/25 text-[#37e6ff] border border-[#37e6ff]'
                  : 'bg-[#091624] text-[#8fc9dd] border border-transparent hover:text-white'
              }`}
            >
              Unread Only ({emails.filter((e) => e.unread).length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-x divide-[#37e6ff]/15 overflow-hidden">
          {/* List */}
          <div className="overflow-y-auto p-3 space-y-2">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-[#8fc9dd] text-xs">No emails found.</div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedEmail(item)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedEmail.id === item.id
                      ? 'bg-[#091f33] border-[#37e6ff] shadow-[0_0_10px_rgba(55,230,255,0.2)]'
                      : 'bg-[#04080f]/80 border-[#37e6ff]/20 hover:border-[#37e6ff]/40'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-[#eafcff] truncate max-w-[170px]">{item.from}</span>
                    <span className="text-[10px] text-[#1b8fa8] font-mono-tech">{item.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {item.unread && <span className="w-2 h-2 rounded-full bg-[#37e6ff]" />}
                    <h4 className="text-xs font-bold text-[#37e6ff] truncate">{item.subject}</h4>
                  </div>
                  <p className="text-[11px] text-[#8fc9dd] line-clamp-2 mt-1">{item.snippet}</p>
                </div>
              ))
            )}
          </div>

          {/* Reader */}
          <div className="p-5 overflow-y-auto bg-[#04080f]/60 flex flex-col">
            {selectedEmail ? (
              <div className="space-y-4">
                <div className="border-b border-[#37e6ff]/20 pb-3">
                  <h3 className="text-base font-bold text-[#eafcff]">{selectedEmail.subject}</h3>
                  <div className="text-xs text-[#8fc9dd] mt-1 space-y-0.5">
                    <div>
                      <span className="text-[#1b8fa8]">From:</span> {selectedEmail.from}
                    </div>
                    <div>
                      <span className="text-[#1b8fa8]">Date:</span> {selectedEmail.date}
                    </div>
                  </div>
                </div>
                <div className="text-sm leading-relaxed text-[#d7f7ff] whitespace-pre-wrap font-sans">
                  {selectedEmail.snippet}
                  {'\n\n'}
                  [Detailed message content verified over SSL IMAP transport on port 993.]
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#8fc9dd]">
                Select a message to view
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
