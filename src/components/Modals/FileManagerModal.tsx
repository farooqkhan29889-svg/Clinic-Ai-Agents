import React, { useState } from 'react';
import { VirtualFile } from '../../types/jarvis';
import { getVirtualFiles, createTextFile, getSystemStatus } from '../../services/tools';
import { Folder, FileText, Plus, X, Monitor, ShieldCheck, Activity, Cpu } from 'lucide-react';

interface FileManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pcControlEnabled: boolean;
}

export const FileManagerModal: React.FC<FileManagerModalProps> = ({
  isOpen,
  onClose,
  pcControlEnabled,
}) => {
  const [selectedFolder, setSelectedFolder] = useState<string>('Documents');
  const [files, setFiles] = useState<VirtualFile[]>(getVirtualFiles());
  const [activeFile, setActiveFile] = useState<VirtualFile | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');

  if (!isOpen) return null;

  const folders = ['Documents', 'Desktop', 'Downloads', 'Pictures'];
  const folderFiles = files.filter(
    (f) => f.folder.toLowerCase() === selectedFolder.toLowerCase()
  );
  const sysStatus = getSystemStatus(pcControlEnabled);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    createTextFile(newFileName.trim(), newFileContent, selectedFolder);
    setFiles(getVirtualFiles());
    setNewFileName('');
    setNewFileContent('');
    setShowCreate(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-[#071019] border border-[#37e6ff]/40 rounded-2xl shadow-[0_0_35px_rgba(55,230,255,0.25)] flex flex-col max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#37e6ff]/25 bg-[#091624]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#37e6ff]/10 border border-[#37e6ff]/30 text-[#37e6ff]">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-orbitron text-base font-bold text-[#eafcff] tracking-wide">
                SANDBOXED PC CONTROL & FILESYSTEM
              </h2>
              <p className="text-xs text-[#8fc9dd] font-mono-tech flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#5dffb0]" />
                Protected Sandbox: Safe Desktop / Documents / Downloads access
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

        {/* Telemetry Bar */}
        <div className="px-6 py-2.5 bg-[#04080f] border-b border-[#37e6ff]/15 flex flex-wrap items-center justify-between text-xs font-mono-tech text-[#8fc9dd]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[#eafcff]">
              <Cpu className="w-3.5 h-3.5 text-[#37e6ff]" /> CPU: {sysStatus.cpuLoad}%
            </span>
            <span className="flex items-center gap-1.5 text-[#eafcff]">
              <Activity className="w-3.5 h-3.5 text-[#5dffb0]" /> MEMORY: {sysStatus.memoryUsage}%
            </span>
            <span className="text-[#1b8fa8]">OS: {sysStatus.os}</span>
          </div>
          <div className="text-[11px] text-[#5dffb0] flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#5dffb0] animate-pulse" />
            SECURITY SHIELD ENGAGED
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Folders navigation */}
          <div className="w-48 bg-[#04080f]/90 border-r border-[#37e6ff]/20 p-3 space-y-1 select-none">
            <span className="text-[10px] font-orbitron tracking-wider text-[#1b8fa8] uppercase px-2 mb-2 block">
              Allowed Roots
            </span>
            {folders.map((f) => (
              <button
                key={f}
                onClick={() => {
                  setSelectedFolder(f);
                  setActiveFile(null);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
                  selectedFolder === f
                    ? 'bg-[#37e6ff]/20 text-[#eafcff] border border-[#37e6ff]/40 shadow-[0_0_10px_rgba(55,230,255,0.2)]'
                    : 'text-[#8fc9dd] hover:bg-[#091624] hover:text-[#d7f7ff]'
                }`}
              >
                <Folder className="w-4 h-4 text-[#37e6ff]" />
                {f}
              </button>
            ))}
          </div>

          {/* Files List / Preview */}
          <div className="flex-1 flex flex-col bg-[#071019] overflow-hidden">
            {/* Folder toolbar */}
            <div className="px-5 py-3 border-b border-[#37e6ff]/15 flex items-center justify-between bg-[#091524]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono-tech text-[#8fc9dd]">C:\Users\TonyStark\{selectedFolder}\</span>
                <span className="text-xs px-2 py-0.5 rounded bg-[#37e6ff]/15 text-[#37e6ff]">
                  {folderFiles.length} items
                </span>
              </div>
              <button
                onClick={() => setShowCreate(true)}
                className="px-3 py-1.5 rounded-lg bg-[#37e6ff]/20 hover:bg-[#37e6ff]/30 border border-[#37e6ff] text-[#eafcff] text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> New File
              </button>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-x divide-[#37e6ff]/15 overflow-hidden">
              {/* File list */}
              <div className="p-4 overflow-y-auto space-y-2">
                {folderFiles.length === 0 ? (
                  <div className="text-center py-12 text-[#8fc9dd] text-xs">
                    No files found in {selectedFolder}.
                  </div>
                ) : (
                  folderFiles.map((file) => (
                    <div
                      key={file.name}
                      onClick={() => setActiveFile(file)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        activeFile?.name === file.name
                          ? 'bg-[#091f33] border-[#37e6ff] shadow-[0_0_12px_rgba(55,230,255,0.2)]'
                          : 'bg-[#04080f]/80 border-[#37e6ff]/20 hover:border-[#37e6ff]/40'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#37e6ff]" />
                        <span className="text-sm font-semibold text-[#f2fdff] truncate">{file.name}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#8fc9dd] mt-1.5 font-mono-tech">
                        <span>{file.size}</span>
                        <span>{file.updated}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* File preview / creator */}
              <div className="p-4 overflow-y-auto bg-[#04080f]/60">
                {showCreate ? (
                  <form onSubmit={handleCreate} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#37e6ff] uppercase tracking-wider">
                        Create Text File
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowCreate(false)}
                        className="text-xs text-[#8fc9dd] hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                    <input
                      type="text"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      placeholder="Filename.txt..."
                      className="w-full bg-[#071019] border border-[#37e6ff]/30 rounded-lg px-3 py-2 text-xs text-[#eafcff] focus:outline-none focus:border-[#37e6ff]"
                    />
                    <textarea
                      value={newFileContent}
                      onChange={(e) => setNewFileContent(e.target.value)}
                      placeholder="File text content..."
                      rows={8}
                      className="w-full bg-[#071019] border border-[#37e6ff]/30 rounded-lg p-3 text-xs text-[#eafcff] font-mono-tech focus:outline-none focus:border-[#37e6ff]"
                    />
                    <button
                      type="submit"
                      disabled={!newFileName.trim()}
                      className="w-full py-2 rounded-lg bg-[#37e6ff]/20 hover:bg-[#37e6ff]/30 border border-[#37e6ff] text-[#eafcff] text-xs font-semibold transition-all disabled:opacity-40"
                    >
                      Save Document
                    </button>
                  </form>
                ) : activeFile ? (
                  <div>
                    <div className="border-b border-[#37e6ff]/20 pb-2 mb-3">
                      <h4 className="text-sm font-bold text-[#37e6ff]">{activeFile.name}</h4>
                      <p className="text-[11px] text-[#8fc9dd] font-mono-tech">
                        Folder: {activeFile.folder} • Size: {activeFile.size} • Modified: {activeFile.updated}
                      </p>
                    </div>
                    <pre className="text-xs text-[#d7f7ff] font-mono-tech whitespace-pre-wrap bg-[#071019] p-3 rounded-lg border border-[#37e6ff]/20 max-h-72 overflow-y-auto">
                      {activeFile.content}
                    </pre>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-center text-[#8fc9dd] text-xs">
                    Select a document to inspect or click "New File" to create one.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
