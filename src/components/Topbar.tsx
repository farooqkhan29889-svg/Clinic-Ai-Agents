import { Phone, Clock, Sun, Moon, Stethoscope, MapPin } from 'lucide-react';
import { CLINIC } from '../data/clinicData';

interface TopbarProps {
  onNavigate: (tab: any) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onNavigate, isDark, onToggleTheme }) => {
  return (
    <header className="w-full mb-2 pt-2">
      <div className="bg-white/90 dark:bg-[#1f1815]/95 backdrop-blur-sm border border-[#eee4df] dark:border-[#382b24] rounded-2xl px-4 py-3 shadow-[0_8px_26px_rgba(72,30,11,0.05)] dark:shadow-[0_8px_26px_rgba(0,0,0,0.3)] grid grid-cols-1 md:grid-cols-3 items-center gap-3 transition-colors">
        {/* Left: Clinic hours */}
        <div className="hidden md:flex items-center gap-2.5 text-xs text-[#786b65] dark:text-[#a89991]">
          <div className="w-8 h-8 rounded-lg bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] flex items-center justify-center shrink-0 transition-colors">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <strong className="block text-[11px] uppercase tracking-wider text-[#481e0b] dark:text-[#e8dcd5] font-semibold">
              Clinic hours
            </strong>
            <span>{CLINIC.hours} · Sunday closed</span>
          </div>
        </div>

        {/* Center: Brand */}
        <div
          onClick={() => onNavigate('Home')}
          className="flex items-center justify-start md:justify-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d97853] to-[#a84724] text-white font-heading font-bold text-xl flex items-center justify-center shadow-[0_6px_14px_rgba(119,55,28,0.25)] group-hover:scale-105 transition-transform shrink-0">
            C
          </div>
          <div>
            <div className="font-heading font-bold text-lg text-[#481e0b] dark:text-[#f7eee9] leading-tight transition-colors">
              CityCare Clinic
            </div>
            <div className="text-[11px] text-[#786b65] dark:text-[#a89991] font-medium transition-colors">
              Care, closer to home
            </div>
          </div>
        </div>

        {/* Right: Phone CTA, Doctor Login & Dark Mode Toggle */}
        <div className="flex items-center justify-end gap-2.5 text-right">
          <div className="hidden lg:block text-right">
            <strong className="block text-[10px] md:text-[11px] uppercase tracking-wider text-[#481e0b] dark:text-[#e8dcd5] font-semibold">
              Call the clinic
            </strong>
            <a
              href={`tel:${CLINIC.phone.replace(/\s+/g, '')}`}
              className="inline-flex items-center gap-1.5 mt-0.5 px-3 py-1 border border-[#cfe1d5] dark:border-[#2b4434] rounded-full bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] text-xs font-bold hover:bg-[#dceee2] dark:hover:bg-[#233c2e] transition-colors"
            >
              <Phone className="w-3 h-3 text-[#176541] dark:text-[#34d399]" />
              <span>{CLINIC.phone}</span>
            </a>
          </div>

          {/* Quick Clinic Map CTA */}
          <button
            onClick={() => onNavigate('Contact')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#dcc9bf] dark:border-[#42332a] bg-[#fdfaf8] dark:bg-[#251d19] hover:border-[#c85d38] dark:hover:border-[#e0734d] text-xs font-semibold text-[#481e0b] dark:text-[#f7eee9] transition-all cursor-pointer shrink-0"
            title="View Clinic on Map & Directions"
          >
            <MapPin className="w-3.5 h-3.5 text-[#c85d38]" />
            <span className="hidden sm:inline">Map & Location</span>
          </button>

          {/* Quick Doctor Login CTA */}
          <button
            onClick={() => onNavigate('Doctor portal')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#cfe1d5] dark:border-[#2b4434] bg-[#edf7f0] dark:bg-[#1a2d22] hover:bg-[#dceee2] dark:hover:bg-[#233c2e] text-[#176541] dark:text-[#34d399] text-xs font-bold transition-all shadow-2xs hover:scale-102 cursor-pointer shrink-0"
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Doctor Login</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-full border border-[#dcc9bf] dark:border-[#42332a] bg-[#f7f3f0] dark:bg-[#2c211b] text-[#56473f] dark:text-[#e8dcd5] hover:border-[#c85d38] dark:hover:border-[#e0734d] hover:text-[#c85d38] dark:hover:text-[#e0734d] transition-all cursor-pointer shadow-xs flex items-center justify-center shrink-0 active:scale-95"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-180 duration-300" />
            ) : (
              <Moon className="w-4 h-4 text-[#481e0b]" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
