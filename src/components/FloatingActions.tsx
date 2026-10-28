import React from 'react';
import { NavTab } from '../types/clinic';
import { Plus, Sparkles, GripVertical } from 'lucide-react';

interface FloatingActionsProps {
  onNavigate: (tab: NavTab) => void;
}

export const FloatingActions: React.FC<FloatingActionsProps> = ({ onNavigate }) => {
  return (
    <aside
      id="citycare-floating-actions"
      aria-label="Quick actions"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 items-end pointer-events-auto select-none"
    >
      {/* Book appointment shortcut */}
      <button
        id="citycare-book-action"
        type="button"
        onClick={() => onNavigate('Appointments')}
        aria-label="Book appointment"
        className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-[#c85d38] text-white hover:bg-[#a84724] shadow-[0_8px_24px_rgba(168,71,36,0.35)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.5)] hover:shadow-[0_10px_28px_rgba(168,71,36,0.45)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-xs md:text-sm font-semibold cursor-pointer border border-[#ffffff33] dark:border-white/15 backdrop-blur-xs group"
      >
        <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs group-hover:rotate-90 transition-transform">
          <Plus className="w-3.5 h-3.5" />
        </span>
        <span>Book appointment</span>
        <span className="opacity-40 hover:opacity-100 cursor-grab ml-0.5 text-xs">
          <GripVertical className="w-3.5 h-3.5 inline" />
        </span>
      </button>

      {/* Assistant shortcut */}
      <button
        id="citycare-assistant-action"
        type="button"
        onClick={() => onNavigate('Assistant')}
        aria-label="Clinic Assistant"
        className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-[#481e0b] dark:bg-[#2b1d16] hover:bg-[#30221d] dark:hover:bg-[#20140e] text-white shadow-[0_8px_24px_rgba(72,30,11,0.3)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.5)] hover:shadow-[0_10px_28px_rgba(72,30,11,0.4)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-xs md:text-sm font-semibold cursor-pointer border border-[#ffffff22] dark:border-[#423026] group"
      >
        <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Sparkles className="w-3.5 h-3.5" />
        </span>
        <span>Assistant</span>
        <span className="opacity-40 hover:opacity-100 cursor-grab ml-0.5 text-xs">
          <GripVertical className="w-3.5 h-3.5 inline" />
        </span>
      </button>
    </aside>
  );
};
