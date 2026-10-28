import React, { useState } from 'react';
import { NavTab } from '../../types/clinic';
import { CLINIC, DOCTORS_SEED, CLINIC_FAQS } from '../../data/clinicData';
import { ChevronDown, ChevronUp, MapPin, AlertCircle, Calendar } from 'lucide-react';

interface ServicesViewProps {
  onNavigate: (tab: NavTab, doctorId?: number) => void;
}

export const ServicesView: React.FC<ServicesViewProps> = ({ onNavigate }) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <section className="relative overflow-hidden p-6 md:p-8 rounded-3xl bg-gradient-to-r from-[#cd5f37] via-[#a84724] to-[#481e0b] text-white shadow-[0_18px_38px_rgba(72,30,11,0.18)]">
        <div className="relative z-10">
          <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#f9ddd1] mb-1">
            BEFORE YOUR VISIT
          </div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-white mb-2">
            Clinic information
          </h1>
          <p className="text-xs md:text-sm text-[#fff1eb] max-w-xl leading-relaxed mb-4">
            Useful details to help you prepare for an appointment.
          </p>

          <div className="flex flex-wrap gap-2">
            <span className="inline-block px-3 py-1 rounded-full border border-white/30 text-white text-[11px] font-medium bg-white/10 backdrop-blur-xs">
              {CLINIC.hours}
            </span>
            <span className="inline-block px-3 py-1 rounded-full border border-white/30 text-white text-[11px] font-medium bg-white/10 backdrop-blur-xs">
              Call {CLINIC.phone}
            </span>
          </div>
        </div>

        <div className="absolute -top-16 -right-16 w-60 h-60 rounded-full border border-white/20 shadow-[0_0_0_24px_rgba(255,255,255,0.05)] pointer-events-none" />
      </section>

      {/* Grid: Doctors & Fees vs FAQs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Doctor Qualifications and Fees */}
        <div className="lg:col-span-6 space-y-4">
          <h2 className="font-heading text-xl font-bold text-[#481e0b] dark:text-[#f7eee9]">
            Doctor qualifications and fees
          </h2>

          <div className="space-y-3">
            {DOCTORS_SEED.map((d) => (
              <div
                key={d.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-xs hover:border-[#c85d38] dark:hover:border-[#e0734d] transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="font-heading font-bold text-base text-[#481e0b] dark:text-[#f7eee9]">
                      {d.name}
                    </h3>
                    <div className="text-xs font-semibold text-[#176541] dark:text-[#34d399]">
                      {d.spec}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-[#a84724] dark:text-[#f38360]">
                      ₹{d.fee}
                    </span>
                    <div className="text-[10px] text-[#786b65] dark:text-[#a89991]">
                      consultation
                    </div>
                  </div>
                </div>
                <p className="text-xs text-[#786b65] dark:text-[#c4b5ae] leading-relaxed mb-3">
                  {d.about}
                </p>
                <button
                  onClick={() => onNavigate('Appointments', d.id)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#a84724] dark:text-[#f38360] hover:underline cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Book with {d.name}</span>
                </button>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-[#edf7f0] dark:bg-[#1a2d22] border border-[#cfe1d5] dark:border-[#2b4434] flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-[#176541] dark:text-[#34d399] shrink-0 mt-0.5" />
            <div className="text-xs text-[#176541] dark:text-[#34d399] leading-relaxed">
              <strong>Need emergency care?</strong> CityCare Clinic provides outpatient primary care
              and specialist appointments. For urgent trauma or life-threatening emergencies, please
              contact your nearest hospital emergency center immediately.
            </div>
          </div>
        </div>

        {/* Right: Frequently Asked Questions */}
        <div className="lg:col-span-6 space-y-4">
          <h2 className="font-heading text-xl font-bold text-[#481e0b] dark:text-[#f7eee9]">
            Frequently asked questions
          </h2>

          <div className="space-y-2.5">
            {CLINIC_FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-[#d5e5db] dark:border-[#382b24] bg-white dark:bg-[#1e1714] overflow-hidden transition-all shadow-xs"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-3 hover:bg-[#f7f3f0] dark:hover:bg-[#251d19] transition-colors cursor-pointer"
                  >
                    <span className="text-sm font-semibold text-[#481e0b] dark:text-[#f7eee9]">
                      {faq.question}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-[#a84724] dark:text-[#f38360] shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#786b65] dark:text-[#a89991] shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="p-4 pt-1 text-xs text-[#685a53] dark:text-[#c4b5ae] leading-relaxed border-t border-[#f0e8e3] dark:border-[#33251e] bg-[#fffdfa] dark:bg-[#251d19]">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Clinic Address Info Banner */}
      <div className="p-4 rounded-2xl bg-[#edf7f0] dark:bg-[#1a2d22] border border-[#cfe1d5] dark:border-[#2b4434] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#176541] dark:text-[#34d399]">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#176541] dark:text-[#34d399] shrink-0" />
          <span>
            <strong>Clinic address:</strong> {CLINIC.address} · Sunday closed.
          </span>
        </div>
        <button
          onClick={() => onNavigate('Appointments')}
          className="px-4 py-1.5 rounded-full bg-[#176541] dark:bg-[#34d399] text-white dark:text-[#132219] font-bold hover:bg-[#124d32] dark:hover:bg-[#2ecc71] transition-colors cursor-pointer shrink-0"
        >
          Book an appointment
        </button>
      </div>
    </div>
  );
};
