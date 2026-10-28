import React from 'react';
import { CLINIC } from '../data/clinicData';
import { Instagram, Facebook, Phone } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-12 pt-6 pb-8 border-t border-[#d5e5db] dark:border-[#382b24] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#786b65] dark:text-[#a89991] transition-colors">
      <div className="leading-relaxed text-center md:text-left">
        <div>
          <strong className="text-[#481e0b] dark:text-[#f7eee9] font-semibold">
            CityCare Clinic
          </strong>{' '}
          · Appointments and clinic information ·{' '}
          <a
            href={`tel:${CLINIC.phone.replace(/\s+/g, '')}`}
            className="text-[#176541] dark:text-[#34d399] font-semibold hover:underline inline-flex items-center gap-1"
          >
            <Phone className="w-3 h-3 inline" />
            {CLINIC.phone}
          </a>{' '}
          · {CLINIC.hours}
        </div>
        <div className="mt-1 text-[11px] text-[#938781] dark:text-[#786b65]">
          Illustrative photos: Unsplash · Medical prototype system
        </div>
      </div>

      <div className="flex items-center flex-wrap gap-2">
        <a
          href="https://wa.me/918770465561"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#d5e5db] dark:border-[#3d2e26] rounded-full bg-white dark:bg-[#251d19] text-[#245b40] dark:text-[#34d399] font-bold text-xs hover:-translate-y-0.5 hover:border-[#9fc6ad] dark:hover:border-[#34d399]/40 hover:bg-[#edf7f0] dark:hover:bg-[#1a2d22] transition-all shadow-xs"
        >
          <span className="w-4 h-4 rounded-full bg-[#e5f2e9] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] flex items-center justify-center text-[10px] font-black">
            W
          </span>
          WhatsApp
        </a>

        <a
          href="https://www.instagram.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#d5e5db] dark:border-[#3d2e26] rounded-full bg-white dark:bg-[#251d19] text-[#245b40] dark:text-[#34d399] font-bold text-xs hover:-translate-y-0.5 hover:border-[#9fc6ad] dark:hover:border-[#34d399]/40 hover:bg-[#edf7f0] dark:hover:bg-[#1a2d22] transition-all shadow-xs"
        >
          <Instagram className="w-3.5 h-3.5 text-[#176541] dark:text-[#34d399]" />
          Instagram
        </a>

        <a
          href="https://www.facebook.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#d5e5db] dark:border-[#3d2e26] rounded-full bg-white dark:bg-[#251d19] text-[#245b40] dark:text-[#34d399] font-bold text-xs hover:-translate-y-0.5 hover:border-[#9fc6ad] dark:hover:border-[#34d399]/40 hover:bg-[#edf7f0] dark:hover:bg-[#1a2d22] transition-all shadow-xs"
        >
          <Facebook className="w-3.5 h-3.5 text-[#176541] dark:text-[#34d399]" />
          Facebook
        </a>
      </div>
    </footer>
  );
};
