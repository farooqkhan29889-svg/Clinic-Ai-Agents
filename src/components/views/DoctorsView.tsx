import React from 'react';
import { NavTab } from '../../types/clinic';
import { DOCTORS_SEED } from '../../data/clinicData';
import { Calendar, Clock, Award } from 'lucide-react';

interface DoctorsViewProps {
  onNavigate: (tab: NavTab, doctorId?: number) => void;
}

export const DoctorsView: React.FC<DoctorsViewProps> = ({ onNavigate }) => {
  const doctors = DOCTORS_SEED;

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <section className="relative overflow-hidden p-6 md:p-8 rounded-3xl bg-gradient-to-r from-[#cd5f37] via-[#a84724] to-[#481e0b] text-white shadow-[0_18px_38px_rgba(72,30,11,0.18)]">
        <div className="relative z-10">
          <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#f9ddd1] mb-1">
            THE CITYCARE TEAM
          </div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-white mb-2">
            Our doctors
          </h1>
          <p className="text-xs md:text-sm text-[#fff1eb] max-w-xl leading-relaxed mb-4">
            Meet the CityCare team and review qualifications and consultation fees.
          </p>

          <div className="flex flex-wrap gap-2">
            <span className="inline-block px-3 py-1 rounded-full border border-white/30 text-white text-[11px] font-medium bg-white/10 backdrop-blur-xs">
              Three doctors
            </span>
            <span className="inline-block px-3 py-1 rounded-full border border-white/30 text-white text-[11px] font-medium bg-white/10 backdrop-blur-xs">
              Fees shown up front
            </span>
          </div>
        </div>

        <div className="absolute -top-16 -right-16 w-60 h-60 rounded-full border border-white/20 shadow-[0_0_0_24px_rgba(255,255,255,0.05)] pointer-events-none" />
      </section>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {doctors.map((doctor) => {
          const initials = doctor.name
            .replace('Dr.', '')
            .trim()
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase();

          return (
            <div
              key={doctor.id}
              className="p-6 rounded-2xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-xs flex flex-col justify-between hover:shadow-md transition-all"
            >
              <div>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#cd5f37] to-[#481e0b] text-white font-heading font-bold text-xl flex items-center justify-center mb-4 shadow-sm">
                  {initials}
                </div>

                <h3 className="font-heading font-bold text-lg text-[#481e0b] dark:text-[#f7eee9] mb-1">
                  {doctor.name}
                </h3>

                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] text-xs font-semibold mb-3">
                  <Award className="w-3.5 h-3.5" />
                  <span>{doctor.spec}</span>
                </div>

                <p className="text-xs text-[#786b65] dark:text-[#c4b5ae] leading-relaxed mb-4">
                  {doctor.about}
                </p>

                <div className="text-sm font-bold text-[#a84724] dark:text-[#f38360] mb-4 pb-3 border-b border-[#f0e8e3] dark:border-[#33251e]">
                  ₹{doctor.fee}{' '}
                  <span className="text-xs text-[#786b65] dark:text-[#a89991] font-normal">
                    consultation fee
                  </span>
                </div>

                <div className="mb-6">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#481e0b] dark:text-[#f7eee9] mb-2">
                    <Clock className="w-3.5 h-3.5 text-[#a84724] dark:text-[#f38360]" />
                    <span>Sample appointment times</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {doctor.slots.map((slot) => (
                      <span
                        key={slot}
                        className="px-2 py-0.5 rounded-md bg-[#f7f3f0] dark:bg-[#281e19] border border-[#dcc9bf] dark:border-[#3f2e26] text-[11px] font-medium text-[#56473f] dark:text-[#e8dcd5]"
                      >
                        {slot}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigate('Appointments', doctor.id)}
                className="w-full py-2.5 px-4 rounded-full bg-[#c85d38] hover:bg-[#a84724] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Book this doctor</span>
              </button>
            </div>
          );
        })}
      </div>

      <div className="text-center p-4 rounded-xl bg-white/70 dark:bg-[#1e1714]/80 border border-[#d5e5db] dark:border-[#382b24] text-xs text-[#786b65] dark:text-[#a89991]">
        Availability is prototype schedule data and may not reflect the clinic's live calendar. All
        doctor fees are confirmed upon arrival.
      </div>
    </div>
  );
};
