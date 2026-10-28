import React, { useState, useRef, useEffect } from 'react';
import { NavTab, ChatMessage, ChatAction } from '../../types/clinic';
import { createAssistantReply, AssistantState } from '../../utils/assistantEngine';
import {
  Sparkles,
  Send,
  Trash2,
  Calendar,
  Stethoscope,
  Info,
  RotateCcw,
  Bot,
  User,
} from 'lucide-react';

interface AssistantViewProps {
  onNavigate: (tab: NavTab, doctorId?: number) => void;
}

export const AssistantView: React.FC<AssistantViewProps> = ({ onNavigate }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'msg-welcome',
        role: 'assistant',
        text: 'Welcome to CityCare Clinic! I am your AI assistant desk. How can I help you today? You can choose one of the options below or ask a question.',
        actions: [
          { t: '📅 Book appointment', m: '__mode__booking' },
          { t: '🩺 Doctors & fees', m: '__mode__doctors' },
          { t: 'ℹ️ Clinic information', m: '__mode__clinic_info' },
          { t: '↪ Cancel booking', m: '__mode__manage' },
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [input, setInput] = useState<string>('');
  const [assistantState, setAssistantState] = useState<AssistantState>({ mode: 'idle' });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    if (!textToSend) setInput('');

    setTimeout(() => {
      const { reply, actions, newState } = createAssistantReply(query, assistantState);
      setAssistantState(newState);

      const botMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: reply,
        actions: actions || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMessage]);
    }, 250);
  };

  const handleActionClick = (action: ChatAction) => {
    handleSendMessage(action.m);
  };

  const handleClearChat = () => {
    setAssistantState({ mode: 'idle' });
    setMessages([
      {
        id: 'msg-welcome-new',
        role: 'assistant',
        text: 'Chat cleared. How can I assist you with CityCare Clinic today?',
        actions: [
          { t: '📅 Book appointment', m: '__mode__booking' },
          { t: '🩺 Doctors & fees', m: '__mode__doctors' },
          { t: 'ℹ️ Clinic information', m: '__mode__clinic_info' },
          { t: '↪ Cancel booking', m: '__mode__manage' },
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const renderFormattedText = (rawText: string) => {
    return rawText.split('\n').map((paragraph, pIdx) => {
      if (!paragraph.trim()) return <div key={pIdx} className="h-2" />;

      const parts = paragraph.split(/(\*\*.*?\*\*|`.*?`)/g);

      return (
        <p key={pIdx} className="mb-1 leading-relaxed">
          {parts.map((part, idx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={idx} className="font-semibold text-[#481e0b] dark:text-[#f7eee9]">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            if (part.startsWith('`') && part.endsWith('`')) {
              return (
                <code
                  key={idx}
                  className="bg-[#f0e8e3] dark:bg-[#342721] text-[#c85d38] dark:text-[#f38360] font-bold px-1.5 py-0.5 rounded text-xs"
                >
                  {part.slice(1, -1)}
                </code>
              );
            }
            return part;
          })}
        </p>
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <section className="relative overflow-hidden p-6 md:p-8 rounded-3xl bg-gradient-to-r from-[#cd5f37] via-[#a84724] to-[#481e0b] text-white shadow-[0_18px_38px_rgba(72,30,11,0.18)]">
        <div className="relative z-10">
          <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#f9ddd1] mb-1">
            YOUR CLINIC HELP DESK
          </div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-white mb-2">
            CityCare Assistant
          </h1>
          <p className="text-xs md:text-sm text-[#fff1eb] max-w-xl leading-relaxed mb-4">
            Choose a specialist assistant to get started, or type a question below.
          </p>

          <div className="flex flex-wrap gap-2">
            <span className="inline-block px-3 py-1 rounded-full border border-white/30 text-white text-[11px] font-medium bg-white/10 backdrop-blur-xs">
              Appointments
            </span>
            <span className="inline-block px-3 py-1 rounded-full border border-white/30 text-white text-[11px] font-medium bg-white/10 backdrop-blur-xs">
              Clinic information
            </span>
            <span className="inline-block px-3 py-1 rounded-full border border-white/30 text-white text-[11px] font-medium bg-white/10 backdrop-blur-xs">
              Booking support
            </span>
          </div>
        </div>

        <div className="absolute -top-16 -right-16 w-60 h-60 rounded-full border border-white/20 shadow-[0_0_0_24px_rgba(255,255,255,0.05)] pointer-events-none" />
      </section>

      {/* 4 Agent Starter Cards */}
      {messages.length <= 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => handleSendMessage('__mode__booking')}
            className="p-4 rounded-2xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] hover:border-[#c85d38] dark:hover:border-[#e0734d] text-left transition-all shadow-xs hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] flex items-center justify-center mb-2">
                <Calendar className="w-4 h-4" />
              </div>
              <h4 className="font-heading font-bold text-xs text-[#481e0b] dark:text-[#f7eee9] mb-1">
                📅 Appointment booking
              </h4>
              <p className="text-[11px] text-[#786b65] dark:text-[#a89991] leading-relaxed">
                Choose a doctor and find a sample time slot interactively.
              </p>
            </div>
            <span className="mt-3 text-[11px] font-bold text-[#c85d38] dark:text-[#f38360]">
              Start booking →
            </span>
          </button>

          <button
            onClick={() => handleSendMessage('__mode__doctors')}
            className="p-4 rounded-2xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] hover:border-[#c85d38] dark:hover:border-[#e0734d] text-left transition-all shadow-xs hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] flex items-center justify-center mb-2">
                <Stethoscope className="w-4 h-4" />
              </div>
              <h4 className="font-heading font-bold text-xs text-[#481e0b] dark:text-[#f7eee9] mb-1">
                🩺 Doctors and fees
              </h4>
              <p className="text-[11px] text-[#786b65] dark:text-[#a89991] leading-relaxed">
                Compare doctors, specialties, and consultation fees.
              </p>
            </div>
            <span className="mt-3 text-[11px] font-bold text-[#c85d38] dark:text-[#f38360]">
              Show doctors →
            </span>
          </button>

          <button
            onClick={() => handleSendMessage('__mode__clinic_info')}
            className="p-4 rounded-2xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] hover:border-[#c85d38] dark:hover:border-[#e0734d] text-left transition-all shadow-xs hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] flex items-center justify-center mb-2">
                <Info className="w-4 h-4" />
              </div>
              <h4 className="font-heading font-bold text-xs text-[#481e0b] dark:text-[#f7eee9] mb-1">
                ℹ️ Clinic information
              </h4>
              <p className="text-[11px] text-[#786b65] dark:text-[#a89991] leading-relaxed">
                Check clinic hours, address, and visit information.
              </p>
            </div>
            <span className="mt-3 text-[11px] font-bold text-[#c85d38] dark:text-[#f38360]">
              View details →
            </span>
          </button>

          <button
            onClick={() => handleSendMessage('__mode__manage')}
            className="p-4 rounded-2xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] hover:border-[#c85d38] dark:hover:border-[#e0734d] text-left transition-all shadow-xs hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] flex items-center justify-center mb-2">
                <RotateCcw className="w-4 h-4" />
              </div>
              <h4 className="font-heading font-bold text-xs text-[#481e0b] dark:text-[#f7eee9] mb-1">
                ↪ Manage a booking
              </h4>
              <p className="text-[11px] text-[#786b65] dark:text-[#a89991] leading-relaxed">
                Cancel an appointment using booking reference & phone.
              </p>
            </div>
            <span className="mt-3 text-[11px] font-bold text-[#c85d38] dark:text-[#f38360]">
              Manage booking →
            </span>
          </button>
        </div>
      )}

      {/* Main Chat Interface */}
      <div className="rounded-3xl border border-[#d5e5db] dark:border-[#382b24] bg-white dark:bg-[#1e1714] shadow-[0_8px_28px_rgba(72,30,11,0.06)] dark:shadow-[0_8px_28px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col min-h-[500px] transition-colors">
        {/* Chat Header */}
        <div className="px-6 py-3.5 border-b border-[#f0e8e3] dark:border-[#33251e] bg-[#fdfaf8] dark:bg-[#251d19] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#a84724] text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="font-heading font-bold text-xs text-[#481e0b] dark:text-[#f7eee9]">
                CityCare Clinic Assistant
              </div>
              <div className="text-[10px] text-[#176541] dark:text-[#34d399] font-semibold">
                ● Live & Ready to assist
              </div>
            </div>
          </div>

          <button
            onClick={handleClearChat}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-[#786b65] dark:text-[#a89991] hover:text-[#a84724] dark:hover:text-[#f38360] hover:bg-[#f0e8e3] dark:hover:bg-[#342721] transition-colors cursor-pointer"
            title="Clear conversation"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear conversation</span>
          </button>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 p-4 md:p-6 space-y-4 overflow-y-auto max-h-[500px]">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-2xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser
                      ? 'bg-[#c85d38] text-white'
                      : 'bg-gradient-to-br from-[#481e0b] to-[#a84724] text-white'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`p-4 rounded-2xl text-xs shadow-xs transition-colors ${
                    isUser
                      ? 'bg-[#c85d38] text-white rounded-tr-xs'
                      : 'bg-[#f7f3f0] dark:bg-[#281e19] border border-[#eee4df] dark:border-[#3d2e26] text-[#30221d] dark:text-[#f4eae5] rounded-tl-xs'
                  }`}
                >
                  {renderFormattedText(msg.text)}

                  {/* Action Buttons */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-[#e2d5ce] dark:border-[#3d2e26] flex flex-wrap gap-1.5">
                      {msg.actions.map((act, aIdx) => (
                        <button
                          key={aIdx}
                          onClick={() => handleActionClick(act)}
                          className="px-3 py-1.5 rounded-full bg-white dark:bg-[#1e1714] border border-[#dcc9bf] dark:border-[#42332a] hover:border-[#c85d38] dark:hover:border-[#e0734d] hover:text-[#a84724] dark:hover:text-[#f38360] text-[#481e0b] dark:text-[#e8dcd5] font-medium text-xs transition-colors cursor-pointer shadow-2xs"
                        >
                          {act.t}
                        </button>
                      ))}
                    </div>
                  )}

                  <div
                    className={`mt-1.5 text-[10px] text-right ${
                      isUser ? 'text-white/70' : 'text-[#786b65] dark:text-[#a89991]'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 md:p-4 border-t border-[#f0e8e3] dark:border-[#33251e] bg-white dark:bg-[#1e1714] flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about doctors, fees, clinic hours, or type to book..."
            className="flex-1 px-4 py-2.5 rounded-full border border-[#d9c9c2] dark:border-[#42332a] bg-white dark:bg-[#251d19] text-[#481e0b] dark:text-[#f7eee9] text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#c85d38]/30 focus:border-[#c85d38]"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="w-10 h-10 rounded-full bg-[#c85d38] hover:bg-[#a84724] disabled:bg-gray-300 dark:disabled:bg-gray-800 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
