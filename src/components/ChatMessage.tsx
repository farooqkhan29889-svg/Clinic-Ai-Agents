import React, { useState } from 'react';
import { ChatMessage as ChatMessageType, ToolCall } from '../types/jarvis';
import { Volume2, Copy, Check, Terminal, ChevronDown, ChevronUp, Bot, User } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageType;
  onSpeak?: (text: string) => void;
  isSpeakingThis?: boolean;
  highlightQuery?: string;
}

function renderHighlightedText(text: string, query?: string) {
  if (!query || !query.trim()) return text;
  const q = query.trim();
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  if (parts.length === 1) return text;

  return parts.map((part, index) => {
    if (part.toLowerCase() === q.toLowerCase()) {
      return (
        <mark
          key={index}
          className="bg-[#37e6ff]/35 text-white font-semibold rounded px-1 py-0.5 border border-[#37e6ff]/60 shadow-[0_0_8px_rgba(55,230,255,0.4)]"
        >
          {part}
        </mark>
      );
    }
    return part;
  });
}

export const ChatMessageItem: React.FC<ChatMessageProps> = ({
  message,
  onSpeak,
  isSpeakingThis,
  highlightQuery,
}) => {
  const [copied, setCopied] = useState(false);
  const [expandedTools, setExpandedTools] = useState(false);

  const isAssistant = message.role === 'assistant';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasToolMatch =
    highlightQuery &&
    message.toolCalls?.some(
      (tc) =>
        tc.tool.toLowerCase().includes(highlightQuery.toLowerCase()) ||
        tc.input?.toLowerCase().includes(highlightQuery.toLowerCase()) ||
        tc.result?.toLowerCase().includes(highlightQuery.toLowerCase())
    );

  return (
    <div
      className={`flex items-start gap-3.5 p-4 rounded-xl transition-all duration-300 ${
        isAssistant
          ? 'bg-[#091420]/80 border border-[#37e6ff]/30 shadow-[inset_0_0_22px_rgba(55,230,255,0.07)]'
          : 'bg-[#07101b]/70 border border-[#1b8fa8]/30 ml-8'
      }`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mt-0.5">
        {isAssistant ? (
          <div className="w-9 h-9 rounded-full bg-[#04080f] border border-[#37e6ff]/50 flex items-center justify-center p-1 shadow-[0_0_10px_rgba(55,230,255,0.4)]">
            <img
              src="/assets/jarvis_icon_256.png"
              alt="JARVIS"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
            <Bot className="w-5 h-5 text-[#37e6ff] hidden" />
          </div>
        ) : (
          <div className="w-9 h-9 rounded-full bg-[#142838] border border-[#5dffb0]/40 flex items-center justify-center text-lg">
            <User className="w-5 h-5 text-[#5dffb0]" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span
              className={`font-orbitron text-xs tracking-wider font-semibold ${
                isAssistant ? 'text-[#37e6ff]' : 'text-[#5dffb0]'
              }`}
            >
              {isAssistant ? 'J.A.R.V.I.S.' : 'USER'}
            </span>
            <span className="text-[10px] text-[#1b8fa8] font-mono-tech">
              {message.timestamp}
            </span>
          </div>

          {/* Message Actions */}
          <div className="flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity">
            {isAssistant && onSpeak && (
              <button
                onClick={() => onSpeak(message.content)}
                title="Speak message aloud"
                className={`p-1 rounded hover:bg-[#37e6ff]/20 text-xs transition-colors ${
                  isSpeakingThis ? 'text-[#37e6ff] animate-pulse' : 'text-[#8fc9dd]'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={handleCopy}
              title="Copy message text"
              className="p-1 rounded hover:bg-[#37e6ff]/20 text-[#8fc9dd] text-xs transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#5dffb0]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Image Attachment Preview if any */}
        {message.imageAttachment && (
          <div className="mb-3 max-w-sm rounded-lg overflow-hidden border border-[#37e6ff]/40 bg-[#04080f]/90">
            <img
              src={message.imageAttachment.url}
              alt={message.imageAttachment.name}
              className="w-full max-h-56 object-cover"
            />
            <div className="px-2.5 py-1 text-[11px] font-mono-tech text-[#8fc9dd] border-t border-[#37e6ff]/20">
              Attached: {message.imageAttachment.name}
            </div>
          </div>
        )}

        {/* Tool Execution Steps */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="my-2.5 bg-[#04080f]/90 border border-[#37e6ff]/25 rounded-lg p-2.5 text-xs font-mono-tech">
            <div
              className="flex items-center justify-between cursor-pointer select-none text-[#37e6ff]"
              onClick={() => setExpandedTools(!expandedTools)}
            >
              <div className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-[#37e6ff]" />
                <span className="font-semibold uppercase tracking-wider text-[11px]">
                  Tool Execution Sequence ({message.toolCalls.length})
                  {hasToolMatch && (
                    <span className="ml-2 px-1.5 py-0.2 bg-[#37e6ff]/20 text-[#37e6ff] rounded text-[9px] border border-[#37e6ff]/40">
                      Match in tools
                    </span>
                  )}
                </span>
              </div>
              {expandedTools || hasToolMatch ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </div>

            {expandedTools || hasToolMatch ? (
              <div className="mt-2 space-y-2 border-t border-[#37e6ff]/15 pt-2">
                {message.toolCalls.map((tc) => (
                  <div key={tc.id} className="p-2 rounded bg-[#091524] border border-[#37e6ff]/20">
                    <div className="flex items-center justify-between text-[#d7f7ff]">
                      <span className="font-semibold text-[#37e6ff]">
                        {renderHighlightedText(tc.tool, highlightQuery)}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          tc.status === 'done'
                            ? 'bg-[#5dffb0]/20 text-[#5dffb0]'
                            : 'bg-[#ff7a7a]/20 text-[#ff7a7a]'
                        }`}
                      >
                        {tc.status}
                      </span>
                    </div>
                    {tc.input && (
                      <div className="text-[11px] text-[#8fc9dd] mt-1 break-all">
                        <span className="text-[#1b8fa8]">Input:</span>{' '}
                        {renderHighlightedText(tc.input, highlightQuery)}
                      </div>
                    )}
                    {tc.result && (
                      <div className="text-[11px] text-[#eafcff] mt-1 break-all bg-[#04080f] p-1.5 rounded border border-[#37e6ff]/15">
                        <span className="text-[#5dffb0]">Output:</span>{' '}
                        {renderHighlightedText(tc.result, highlightQuery)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {message.toolCalls.map((tc) => (
                  <span
                    key={tc.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#37e6ff]/10 border border-[#37e6ff]/30 text-[10px] text-[#37e6ff]"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5dffb0]" />
                    {renderHighlightedText(tc.tool, highlightQuery)}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Message Body text */}
        <div className="text-sm leading-relaxed text-[#f2fdff] whitespace-pre-wrap font-sans">
          {renderHighlightedText(message.content, highlightQuery)}
        </div>
      </div>
    </div>
  );
};
