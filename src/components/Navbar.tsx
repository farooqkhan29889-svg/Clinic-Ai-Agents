import React from 'react';
import { NavTab } from '../types/clinic';
import { Sparkles, Calendar, UserCheck, FolderHeart } from 'lucide-react';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab }) => {
  const tabs: NavTab[] = [
    'Home',
    'Our doctors',
    'Services',
    'Appointments',
    'Patient portal',
    'Contact',
    'Assistant',
    'Staff',
  ];

  return (
    <nav className="w-full border-b border-[#d5e5db] dark:border-[#382b24] pb-3 mb-5 overflow-x-auto scrollbar-none transition-colors">
      <div className="flex items-center gap-1.5 md:gap-2 min-w-max py-1">
        {tabs.map((tab) => {
          const isActive = currentTab === tab;
          const isAppointments = tab === 'Appointments';
          const isPatientPortal = tab === 'Patient portal';
          const isAssistant = tab === 'Assistant';
          const isStaff = tab === 'Staff';

          let buttonClass = '';

          if (isAppointments) {
            buttonClass = isActive
              ? 'bg-[#a84724] text-white font-bold shadow-[0_5px_14px_rgba(168,71,36,0.3)] ring-2 ring-[#a84724]/20'
              : 'bg-[#c85d38] text-white hover:bg-[#a84724] font-semibold shadow-[0_4px_10px_rgba(168,71,36,0.2)]';
          } else if (isActive) {
            buttonClass =
              'bg-[#e2f0e8] dark:bg-[#2e211b] text-[#a84724] dark:text-[#f38360] font-bold border border-[#cfe1d5] dark:border-[#4a3429] shadow-xs';
          } else {
            buttonClass =
              'text-[#64554d] dark:text-[#a89991] hover:bg-[#e2f0e8]/80 dark:hover:bg-[#281e19] hover:text-[#a84724] dark:hover:text-[#f38360] font-medium';
          }

          return (
            <button
              key={tab}
              onClick={() => onSelectTab(tab)}
              className={`px-3.5 py-1.5 rounded-full text-xs md:text-sm transition-all duration-150 flex items-center gap-1.5 select-none cursor-pointer ${buttonClass}`}
            >
              {isAppointments && <Calendar className="w-3.5 h-3.5 shrink-0" />}
              {isPatientPortal && <FolderHeart className="w-3.5 h-3.5 text-[#176541] dark:text-[#34d399] shrink-0" />}
              {isAssistant && <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
              {isStaff && <UserCheck className="w-3.5 h-3.5 shrink-0 opacity-80" />}
              <span>{tab}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
