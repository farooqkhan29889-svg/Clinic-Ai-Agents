import React from 'react';
import { NavTab } from '../types/clinic';
import { Sparkles, Calendar, UserCheck, FolderHeart, Stethoscope, FlaskConical, Video } from 'lucide-react';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab }) => {
  const tabs: NavTab[] = [
    'Home',
    'Our doctors',
    'Services',
    'Diagnostics',
    'Appointments',
    'Patient portal',
    'Doctor portal',
    'Telehealth',
    'Contact',
    'Assistant',
  ];

  return (
    <nav className="w-full border-b border-[#d5e5db] dark:border-[#382b24] pb-3 mb-5 overflow-x-auto scrollbar-none transition-colors">
      <div className="flex items-center gap-1.5 md:gap-2 min-w-max py-1">
        {tabs.map((tab) => {
          const isActive = currentTab === tab;
          const isAppointments = tab === 'Appointments';
          const isPatientPortal = tab === 'Patient portal';
          const isDoctorPortal = tab === 'Doctor portal' || tab === 'Staff';
          const isDiagnostics = tab === 'Diagnostics';
          const isTelehealth = tab === 'Telehealth';
          const isAssistant = tab === 'Assistant';

          let buttonClass = '';

          if (isAppointments) {
            buttonClass = isActive
              ? 'bg-[#a84724] text-white font-bold shadow-[0_5px_14px_rgba(168,71,36,0.3)] ring-2 ring-[#a84724]/20'
              : 'bg-[#c85d38] text-white hover:bg-[#a84724] font-semibold shadow-[0_4px_10px_rgba(168,71,36,0.2)]';
          } else if (isDiagnostics && isActive) {
            buttonClass =
              'bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] font-bold border border-[#cfe1d5] dark:border-[#2b4434] shadow-xs';
          } else if (isTelehealth && isActive) {
            buttonClass =
              'bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 font-bold border border-sky-200 dark:border-sky-800 shadow-xs';
          } else if (isDoctorPortal && isActive) {
            buttonClass =
              'bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] font-bold border border-[#cfe1d5] dark:border-[#2b4434] shadow-xs';
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
              {isDiagnostics && <FlaskConical className="w-3.5 h-3.5 text-[#176541] dark:text-[#34d399] shrink-0" />}
              {isPatientPortal && <FolderHeart className="w-3.5 h-3.5 text-[#176541] dark:text-[#34d399] shrink-0" />}
              {isDoctorPortal && <Stethoscope className="w-3.5 h-3.5 text-[#176541] dark:text-[#34d399] shrink-0" />}
              {isTelehealth && <Video className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />}
              {isAssistant && <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
              <span>{tab}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
