import React, { useState } from 'react';
import { FollowupReminder } from '../../types/jarvis';
import { loadReminders, addReminder, deleteReminder } from '../../services/tools';
import { Clock, Plus, Trash2, X, CheckCircle2 } from 'lucide-react';

interface RemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRemindersChanged?: () => void;
}

export const RemindersModal: React.FC<RemindersModalProps> = ({ isOpen, onClose, onRemindersChanged }) => {
  const [reminders, setReminders] = useState<FollowupReminder[]>(loadReminders());
  const [taskText, setTaskText] = useState('');
  const [whenText, setWhenText] = useState('in 15 minutes');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskText.trim()) return;
    addReminder(taskText.trim(), whenText.trim() || 'in 15 minutes');
    setTaskText('');
    setReminders(loadReminders());
    onRemindersChanged?.();
  };

  const handleDelete = (id: string) => {
    deleteReminder(id);
    setReminders(loadReminders());
    onRemindersChanged?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#071019] border border-[#37e6ff]/40 rounded-2xl shadow-[0_0_35px_rgba(55,230,255,0.25)] flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#37e6ff]/25 bg-[#091624]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#37e6ff]/10 border border-[#37e6ff]/30 text-[#37e6ff]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-orbitron text-base font-bold text-[#eafcff] tracking-wide">
                FOLLOW-UP REMINDER ENGINE
              </h2>
              <p className="text-xs text-[#8fc9dd] font-mono-tech">
                ~/.jarvis/followups.json • Daemon scheduler active
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
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Add form */}
          <form onSubmit={handleAdd} className="space-y-2 bg-[#04080f] p-4 rounded-xl border border-[#37e6ff]/25">
            <span className="text-xs font-semibold text-[#37e6ff] tracking-wider block">
              SCHEDULE NEW TASK / REMINDER
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input
                type="text"
                value={taskText}
                onChange={(e) => setTaskText(e.target.value)}
                placeholder="Task description..."
                className="md:col-span-2 bg-[#091624] border border-[#37e6ff]/30 rounded-xl px-3 py-2 text-sm text-[#eafcff] focus:outline-none focus:border-[#37e6ff]"
              />
              <input
                type="text"
                value={whenText}
                onChange={(e) => setWhenText(e.target.value)}
                placeholder="When (in 30 mins, 5pm...)"
                className="bg-[#091624] border border-[#37e6ff]/30 rounded-xl px-3 py-2 text-sm text-[#eafcff] focus:outline-none focus:border-[#37e6ff]"
              />
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={!taskText.trim()}
                className="px-4 py-2 rounded-xl bg-[#37e6ff]/20 hover:bg-[#37e6ff]/30 border border-[#37e6ff] text-[#eafcff] font-semibold text-xs tracking-wider flex items-center gap-1.5 transition-all disabled:opacity-40"
              >
                <Plus className="w-4 h-4" /> ARM REMINDER
              </button>
            </div>
          </form>

          {/* Reminders List */}
          <div className="space-y-2">
            {reminders.length === 0 ? (
              <div className="text-center py-10 text-[#8fc9dd] text-sm">
                No active follow-ups scheduled, Sir.
              </div>
            ) : (
              reminders.map((r) => {
                const isOverdue = new Date(r.dueTime).getTime() <= Date.now();
                return (
                  <div
                    key={r.id}
                    className={`flex items-start justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                      r.triggered || isOverdue
                        ? 'bg-[#181116] border-[#ff7a7a]/40'
                        : 'bg-[#04080f]/80 border-[#37e6ff]/20 hover:border-[#37e6ff]/40'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {r.triggered ? (
                          <CheckCircle2 className="w-4 h-4 text-[#ff7a7a]" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-[#5dffb0] animate-pulse" />
                        )}
                        <span className="text-sm font-medium text-[#f2fdff]">{r.task}</span>
                      </div>
                      <div className="text-xs text-[#8fc9dd] mt-1 flex items-center gap-2">
                        <span>Due: {new Date(r.dueTime).toLocaleString()}</span>
                        <span>•</span>
                        <span className="text-[10px] text-[#1b8fa8] font-mono-tech">Created {r.created}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="p-1.5 text-[#ff7a7a]/70 hover:text-[#ff7a7a] hover:bg-[#ff7a7a]/10 rounded-lg transition-colors"
                      title="Remove reminder"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#37e6ff]/25 bg-[#091624] text-xs text-[#8fc9dd]">
          The scheduler pops audio alerts and toasts immediately when a follow-up hits its target time.
        </div>
      </div>
    </div>
  );
};
