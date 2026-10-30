import React from 'react';
import { NavTab } from '../../types/clinic';
import { CLINIC } from '../../data/clinicData';
import { Phone, Clock, Calendar, MessageSquare, AlertCircle } from 'lucide-react';
import { ClinicLocationMap } from '../ClinicLocationMap';

interface ContactViewProps {
  onNavigate: (tab: NavTab) => void;
}

export const ContactView: React.FC<ContactViewProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <section className="relative overflow-hidden p-6 md:p-8 rounded-3xl bg-gradient-to-r from-[#cd5f37] via-[#a84724] to-[#481e0b] text-white shadow-[0_18px_38px_rgba(72,30,11,0.18)]">
        <div className="relative z-10">
          <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#f9ddd1] mb-1">
            WE’RE HERE TO HELP
          </div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-white mb-2">
            Contact & Clinic Location
          </h1>
          <p className="text-xs md:text-sm text-[#fff1eb] max-w-xl leading-relaxed mb-4">
            Reach the clinic for appointment questions, get live Google Maps directions, or explore nearby medical amenities.
          </p>

          <div className="flex flex-wrap gap-2">
            <span className="inline-block px-3 py-1 rounded-full border border-white/30 text-white text-[11px] font-medium bg-white/10 backdrop-blur-xs">
              Call the clinic
            </span>
            <span className="inline-block px-3 py-1 rounded-full border border-white/30 text-white text-[11px] font-medium bg-white/10 backdrop-blur-xs">
              Monday to Saturday
            </span>
          </div>
        </div>

        <div className="absolute -top-16 -right-16 w-60 h-60 rounded-full border border-white/20 shadow-[0_0_0_24px_rgba(255,255,255,0.05)] pointer-events-none" />
      </section>

      {/* Interactive Google Map & Gemini Maps Grounding Section */}
      <section>
        <ClinicLocationMap />
      </section>

      {/* Contact Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Clinic Desk */}
        <div className="p-6 md:p-8 rounded-2xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-xs flex flex-col justify-between transition-colors">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] flex items-center justify-center mb-4">
              <Phone className="w-5 h-5" />
            </div>
            <h2 className="font-heading text-xl font-bold text-[#481e0b] dark:text-[#f7eee9] mb-4">
              Clinic desk
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <strong className="block text-[11px] uppercase tracking-wider text-[#786b65] dark:text-[#a89991] mb-1">
                  Telephone & WhatsApp
                </strong>
                <a
                  href={`tel:${CLINIC.phone.replace(/\s+/g, '')}`}
                  className="text-base font-bold text-[#176541] dark:text-[#34d399] hover:underline"
                >
                  {CLINIC.phone}
                </a>
              </div>

              <div>
                <strong className="block text-[11px] uppercase tracking-wider text-[#786b65] dark:text-[#a89991] mb-1">
                  Clinic Location
                </strong>
                <div className="text-sm text-[#481e0b] dark:text-[#f7eee9] font-medium leading-relaxed">
                  {CLINIC.address}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#f0e8e3] dark:border-[#33251e]">
            <a
              href="https://wa.me/918770465561"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-bold text-[#176541] dark:text-[#34d399] hover:underline"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat on WhatsApp (+91 87704 65561)</span>
            </a>
          </div>
        </div>

        {/* Right: Opening Hours & Emergency Notice */}
        <div className="p-6 md:p-8 rounded-2xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-xs flex flex-col justify-between transition-colors">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] flex items-center justify-center mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="font-heading text-xl font-bold text-[#481e0b] dark:text-[#f7eee9] mb-4">
              Opening hours
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#f0e8e3] dark:border-[#33251e]">
                <span className="font-medium text-[#481e0b] dark:text-[#f7eee9]">
                  Monday to Saturday
                </span>
                <span className="font-bold text-[#176541] dark:text-[#34d399]">
                  9:00 AM – 8:00 PM
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-[#f0e8e3] dark:border-[#33251e]">
                <span className="font-medium text-[#481e0b] dark:text-[#f7eee9]">Sunday</span>
                <span className="font-bold text-red-500">Closed</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-[#f0e8e3] dark:border-[#33251e]">
                <span className="font-medium text-[#481e0b] dark:text-[#f7eee9]">
                  Doctor Consultations
                </span>
                <span className="text-[#786b65] dark:text-[#a89991]">By Appointment / Walk-in</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#f0e8e3] dark:border-[#33251e] text-xs text-[#786b65] dark:text-[#a89991] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-[#c85d38] dark:text-[#f38360] shrink-0 mt-0.5" />
            <span>For urgent medical care, contact your local emergency service.</span>
          </div>
        </div>
      </div>

      {/* Call to action */}
      <div className="text-center pt-2">
        <button
          onClick={() => onNavigate('Appointments')}
          className="px-6 py-3 rounded-full bg-[#c85d38] hover:bg-[#a84724] text-white font-bold text-sm shadow-[0_8px_18px_rgba(168,71,36,0.25)] transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          <span>Start an appointment booking</span>
        </button>
      </div>
    </div>
  );
};
