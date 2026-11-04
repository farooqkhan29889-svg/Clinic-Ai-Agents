import React, { useState } from 'react';
import { MemoryItem } from '../../types/jarvis';
import { loadMemories, saveMemory, deleteMemory, clearMemories } from '../../services/tools';
import { Brain, Trash2, Plus, X, Search, Sparkles } from 'lucide-react';

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemoryChanged?: () => void;
}

export const MemoryModal: React.FC<MemoryModalProps> = ({ isOpen, onClose, onMemoryChanged }) => {
  const [memories, setMemories] = useState<MemoryItem[]>(loadMemories());
  const [newText, setNewText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    saveMemory(newText.trim());
    setNewText('');
    setMemories(loadMemories());
    onMemoryChanged?.();
  };

  const handleDelete = (id: string) => {
    deleteMemory(id);
    setMemories(loadMemories());
    onMemoryChanged?.();
  };

  const handleClearAll = () => {
    if (window.confirm('Sir, are you certain you wish to purge all durable memory banks?')) {
      clearMemories();
      setMemories([]);
      onMemoryChanged?.();
    }
  };

  const filtered = memories.filter((m) =>
    m.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#071019] border border-[#37e6ff]/40 rounded-2xl shadow-[0_0_35px_rgba(55,230,255,0.25)] flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#37e6ff]/25 bg-[#091624]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#37e6ff]/10 border border-[#37e6ff]/30 text-[#37e6ff]">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-orbitron text-base font-bold text-[#eafcff] tracking-wide">
                LONG-TERM MEMORY ARCHIVE
              </h2>
              <p className="text-xs text-[#8fc9dd] font-mono-tech">
                ~/.jarvis/memory.json • {memories.length} durable facts stored
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
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Commit new fact to J.A.R.V.I.S. memory (e.g. Flight preference: aisle)..."
              className="flex-1 bg-[#04080f] border border-[#37e6ff]/30 rounded-xl px-4 py-2.5 text-sm text-[#eafcff] focus:outline-none focus:border-[#37e6ff] focus:ring-1 focus:ring-[#37e6ff]"
            />
            <button
              type="submit"
              disabled={!newText.trim()}
              className="px-4 py-2.5 rounded-xl bg-[#37e6ff]/20 hover:bg-[#37e6ff]/30 border border-[#37e6ff] text-[#eafcff] font-semibold text-xs tracking-wider flex items-center gap-1.5 transition-all disabled:opacity-40"
            >
              <Plus className="w-4 h-4" /> COMMIT
            </button>
          </form>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1b8fa8]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter memories..."
              className="w-full bg-[#04080f]/80 border border-[#37e6ff]/20 rounded-xl pl-9 pr-4 py-2 text-xs text-[#eafcff] focus:outline-none focus:border-[#37e6ff]"
            />
          </div>

          {/* List */}
          <div className="space-y-2 mt-2">
            {filtered.length === 0 ? (
              <div className="text-center py-10 text-[#8fc9dd] text-sm">
                No memories found matching your search.
              </div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-[#04080f]/80 border border-[#37e6ff]/20 hover:border-[#37e6ff]/40 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm text-[#f2fdff] leading-relaxed">{item.text}</p>
                    <span className="text-[10px] text-[#1b8fa8] font-mono-tech mt-1 block">
                      Saved: {item.updated}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-[#ff7a7a]/70 hover:text-[#ff7a7a] hover:bg-[#ff7a7a]/10 rounded-lg transition-colors"
                    title="Delete fact"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#37e6ff]/25 bg-[#091624] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-[#8fc9dd]">
            <Sparkles className="w-3.5 h-3.5 text-[#37e6ff]" />
            <span>Memories are injected into the neural prompt context automatically.</span>
          </div>
          {memories.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs text-[#ff7a7a] hover:underline"
            >
              Purge All Memory
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
