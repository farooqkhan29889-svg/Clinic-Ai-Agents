import React from 'react';
import { NavTab } from '../../types/clinic';
import { DOCTORS_SEED, CLINIC } from '../../data/clinicData';
import { Check, Calendar, ArrowRight, FlaskConical, Video, Sparkles, ShieldCheck, MapPin, Navigation } from 'lucide-react';

interface HomeViewProps {
  onNavigate: (tab: NavTab, doctorId?: number) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const doctors = DOCTORS_SEED;
  const feeValues = doctors.map((d) => d.fee);
  const minFee = Math.min(...feeValues);
  const maxFee = Math.max(...feeValues);

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="overflow-hidden border border-[#eaded8] dark:border-[#382b24] rounded-3xl bg-gradient-to-br from-[#fffdfa] via-[#fffdfa] to-[#f4e8e3] dark:from-[#211a17] dark:via-[#1c1512] dark:to-[#17110f] text-[#30221d] dark:text-[#f4eae5] shadow-[0_22px_58px_rgba(72,30,11,0.06)] dark:shadow-[0_22px_58px_rgba(0,0,0,0.3)] grid grid-cols-1 lg:grid-cols-12 min-h-[460px] transition-colors">
        {/* Hero Copy */}
        <div className="lg:col-span-7 flex flex-col justify-center p-6 md:p-10 lg:p-12">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#a84724] dark:text-[#f38360] mb-3">
            A WARM WELCOME TO CITYCARE
          </div>
          <h1 className="font-heading text-3xl md:text-5xl lg:text-[3.25rem] font-bold text-[#481e0b] dark:text-[#f7eee9] leading-[1.08] tracking-tight mb-4">
            Care that feels personal. Every visit.
          </h1>
          <p className="text-sm md:text-base text-[#685a53] dark:text-[#c4b5ae] max-w-xl leading-relaxed mb-6">
            Meet our clinic doctors, see consultation fees clearly, and choose an appointment time
            that works for you.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-[#51433c] dark:text-[#d3c5bd] mb-8">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[#c85d38] dark:text-[#f38360] stroke-[3]" />
              Three clinic doctors
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[#c85d38] dark:text-[#f38360] stroke-[3]" />
              Fees shown up front
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[#c85d38] dark:text-[#f38360] stroke-[3]" />
              Simple online booking
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('Appointments')}
              className="px-6 py-3 rounded-full bg-[#c85d38] hover:bg-[#a84724] text-white font-semibold text-sm shadow-[0_8px_18px_rgba(168,71,36,0.25)] transition-all cursor-pointer flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Make an appointment</span>
            </button>
            <button
              onClick={() => onNavigate('Our doctors')}
              className="px-5 py-3 rounded-full border border-[#dcc9bf] dark:border-[#42332a] bg-white dark:bg-[#251d19] hover:border-[#c85d38] dark:hover:border-[#e0734d] hover:text-[#a84724] dark:hover:text-[#f38360] text-[#56473f] dark:text-[#e8dcd5] font-semibold text-sm transition-all cursor-pointer"
            >
              Meet the doctors
            </button>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="lg:col-span-5 relative min-h-[300px] lg:min-h-[460px] bg-gradient-to-br from-[#f9f1ec] to-[#f3e5dc] dark:from-[#211a17] dark:to-[#17110f] flex items-center justify-center p-6 overflow-hidden">
          <img
            src="/assets/clinic-consultation.webp"
            alt="Doctor listening to patient"
            className="absolute inset-0 w-full h-full object-cover object-[58%_center] opacity-90 dark:opacity-75"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#481e0b]/50 dark:from-[#130f0d]/80 via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#fffdfa]/30 dark:lg:from-[#1c1512]/50 lg:to-transparent pointer-events-none" />

          {/* Floating Plan Your Visit Card */}
          <div className="relative z-10 w-full max-w-[340px] p-5 rounded-2xl bg-white/95 dark:bg-[#1e1714]/95 backdrop-blur-md border border-white/80 dark:border-[#382b24] shadow-[0_20px_42px_rgba(72,30,11,0.18)] dark:shadow-[0_20px_42px_rgba(0,0,0,0.5)]">
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c85d38] dark:text-[#f38360] mb-1">
              Plan your visit
            </div>
            <h3 className="font-heading font-bold text-lg text-[#481e0b] dark:text-[#f7eee9] mb-3">
              A clearer way to book care
            </h3>

            <div className="space-y-2.5">
              <div className="flex items-center gap-3 pt-2 border-t border-[#f0e8e3] dark:border-[#33251e] text-xs text-[#56473f] dark:text-[#c4b5ae]">
                <span className="w-6 h-6 rounded-full bg-[#e2f0e8] dark:bg-[#1a2d22] text-[#a84724] dark:text-[#34d399] font-bold flex items-center justify-center text-[10px] shrink-0">
                  01
                </span>
                <span>Choose a clinic doctor</span>
              </div>
              <div className="flex items-center gap-3 pt-2 border-t border-[#f0e8e3] dark:border-[#33251e] text-xs text-[#56473f] dark:text-[#c4b5ae]">
                <span className="w-6 h-6 rounded-full bg-[#e2f0e8] dark:bg-[#1a2d22] text-[#a84724] dark:text-[#34d399] font-bold flex items-center justify-center text-[10px] shrink-0">
                  02
                </span>
                <span>Pick an available time</span>
              </div>
              <div className="flex items-center gap-3 pt-2 border-t border-[#f0e8e3] dark:border-[#33251e] text-xs text-[#56473f] dark:text-[#c4b5ae]">
                <span className="w-6 h-6 rounded-full bg-[#e2f0e8] dark:bg-[#1a2d22] text-[#a84724] dark:text-[#34d399] font-bold flex items-center justify-center text-[10px] shrink-0">
                  03
                </span>
                <span>Keep your booking reference</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About CityCare Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 flex flex-col justify-between bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] rounded-2xl p-6 md:p-8 shadow-xs transition-colors">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#c85d38] dark:text-[#f38360] mb-1">
              ABOUT CITYCARE
            </div>
            <h2 className="font-heading text-2xl font-bold text-[#481e0b] dark:text-[#f7eee9] mb-3">
              A thoughtful clinic visit, from the first step
            </h2>
            <p className="text-sm text-[#786b65] dark:text-[#c4b5ae] leading-relaxed mb-6">
              Review the clinic team, consultation fees, and sample appointment availability before
              choosing a time. Keep your booking reference handy if you need to ask a question or
              modify your visit.
            </p>
          </div>
          <div>
            <button
              onClick={() => onNavigate('Services')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#dcc9bf] dark:border-[#42332a] bg-white dark:bg-[#251d19] hover:border-[#c85d38] text-[#a84724] dark:text-[#f38360] text-xs font-semibold cursor-pointer transition-colors"
            >
              <span>More about the clinic</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 border border-[#d5e5db] dark:border-[#382b24] rounded-2xl bg-gradient-to-br from-white to-[#f5e9e2] dark:from-[#1e1714] dark:to-[#271d17] overflow-hidden flex flex-col shadow-xs transition-colors">
          <div className="h-44 w-full bg-[#e8f3ed] dark:bg-[#1a2d22] relative overflow-hidden">
            <img
              src="/assets/doctor-patient-care.webp"
              alt="Clinic care consultation desk"
              className="w-full h-full object-cover object-center opacity-90 dark:opacity-75"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="p-5 flex-1 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#786b65] dark:text-[#a89991] mb-1">
                CITYCARE AT A GLANCE
              </div>
              <h3 className="font-heading font-bold text-base text-[#481e0b] dark:text-[#f7eee9] mb-1.5">
                Personal care, clearly arranged
              </h3>
              <p className="text-xs text-[#786b65] dark:text-[#c4b5ae] leading-relaxed">
                Doctor details, listed fees, clinic hours, and booking support in one place.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#f0e8e3] dark:border-[#33251e] text-[10px] font-bold text-[#a84724] dark:text-[#f38360] uppercase tracking-wider">
              OPEN MONDAY TO SATURDAY
            </div>
          </div>
        </div>
      </section>

      {/* Important Facts Cards */}
      <section>
        <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#c85d38] dark:text-[#f38360] mb-1">
          IMPORTANT FACTS
        </div>
        <h2 className="font-heading text-2xl font-bold text-[#481e0b] dark:text-[#f7eee9] mb-5">
          The details, at a glance
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] border-l-4 border-l-[#c85d38] dark:border-l-[#f38360] shadow-[0_8px_25px_rgba(72,30,11,0.05)] dark:shadow-none transition-colors">
            <div className="font-heading text-2xl font-bold text-[#481e0b] dark:text-[#f7eee9]">
              {doctors.length}
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#786b65] dark:text-[#a89991] mt-1">
              Clinic doctors
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] border-l-4 border-l-[#c85d38] dark:border-l-[#f38360] shadow-[0_8px_25px_rgba(72,30,11,0.05)] dark:shadow-none transition-colors">
            <div className="font-heading text-2xl font-bold text-[#481e0b] dark:text-[#f7eee9]">
              Mon – Sat
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#786b65] dark:text-[#a89991] mt-1">
              9:00 AM – 8:00 PM (Sun Closed)
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] border-l-4 border-l-[#c85d38] dark:border-l-[#f38360] shadow-[0_8px_25px_rgba(72,30,11,0.05)] dark:shadow-none transition-colors">
            <div className="font-heading text-2xl font-bold text-[#481e0b] dark:text-[#f7eee9]">
              ₹{minFee}–₹{maxFee}
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#786b65] dark:text-[#a89991] mt-1">
              Listed consultation fees
            </div>
          </div>
        </div>
      </section>

      {/* Clinic Services */}
      <section>
        <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#c85d38] dark:text-[#f38360] mb-1">
          CLINIC SERVICES
        </div>
        <h2 className="font-heading text-2xl font-bold text-[#481e0b] dark:text-[#f7eee9] mb-1">
          A simpler way to plan your visit
        </h2>
        <p className="text-xs text-[#786b65] dark:text-[#a89991] mb-5">
          Find the right information, review your options, and book directly with CityCare.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-xs hover:shadow-md hover:-translate-y-1 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#e2f0e8] dark:bg-[#1a2d22] text-[#a84724] dark:text-[#34d399] font-heading font-bold flex items-center justify-center text-sm mb-4">
                01
              </div>
              <h3 className="font-heading font-bold text-base text-[#481e0b] dark:text-[#f7eee9] mb-2">
                Doctor consultations
              </h3>
              <p className="text-xs text-[#786b65] dark:text-[#c4b5ae] leading-relaxed mb-4">
                Compare the clinic doctors, qualifications, and listed consultation fees.
              </p>
            </div>
            <button
              onClick={() => onNavigate('Our doctors')}
              className="w-full py-2 px-3 rounded-full border border-[#dcc9bf] dark:border-[#42332a] bg-white dark:bg-[#251d19] hover:border-[#c85d38] dark:hover:border-[#e0734d] hover:text-[#a84724] dark:hover:text-[#f38360] text-xs font-semibold text-[#56473f] dark:text-[#e8dcd5] transition-colors cursor-pointer"
            >
              Our doctors
            </button>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-xs hover:shadow-md hover:-translate-y-1 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#e2f0e8] dark:bg-[#1a2d22] text-[#a84724] dark:text-[#34d399] font-heading font-bold flex items-center justify-center text-sm mb-4">
                02
              </div>
              <h3 className="font-heading font-bold text-base text-[#481e0b] dark:text-[#f7eee9] mb-2">
                Appointment booking
              </h3>
              <p className="text-xs text-[#786b65] dark:text-[#c4b5ae] leading-relaxed mb-4">
                Choose a doctor and a sample time, then keep your booking reference.
              </p>
            </div>
            <button
              onClick={() => onNavigate('Appointments')}
              className="w-full py-2 px-3 rounded-full bg-[#c85d38] hover:bg-[#a84724] text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Book appointment
            </button>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-xs hover:shadow-md hover:-translate-y-1 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#e2f0e8] dark:bg-[#1a2d22] text-[#a84724] dark:text-[#34d399] font-heading font-bold flex items-center justify-center text-sm mb-4">
                03
              </div>
              <h3 className="font-heading font-bold text-base text-[#481e0b] dark:text-[#f7eee9] mb-2">
                Clinic information
              </h3>
              <p className="text-xs text-[#786b65] dark:text-[#c4b5ae] leading-relaxed mb-4">
                Check the clinic address, contact number, and opening hours.
              </p>
            </div>
            <button
              onClick={() => onNavigate('Services')}
              className="w-full py-2 px-3 rounded-full border border-[#dcc9bf] dark:border-[#42332a] bg-white dark:bg-[#251d19] hover:border-[#c85d38] dark:hover:border-[#e0734d] hover:text-[#a84724] dark:hover:text-[#f38360] text-xs font-semibold text-[#56473f] dark:text-[#e8dcd5] transition-colors cursor-pointer"
            >
              View clinic details
            </button>
          </div>
        </div>
      </section>

      {/* New Clinical Innovations: Diagnostics & Telehealth */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Diagnostic Laboratory & Home Collection */}
        <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-[#edf7f0] to-[#d6ede0] dark:from-[#1a2d22] dark:to-[#122219] border border-[#cfe1d5] dark:border-[#2b4434] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#176541] text-white text-[10px] font-bold uppercase tracking-wider">
                <FlaskConical className="w-3 h-3" />
                Diagnostic Center
              </span>
              <span className="text-[11px] font-bold text-[#176541] dark:text-[#34d399] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Free Home Pickup
              </span>
            </div>

            <h3 className="font-heading text-xl font-bold text-[#176541] dark:text-[#34d399] mb-2">
              Pathology & Health Screenings
            </h3>
            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Book routine and specialized blood panels (CBC, Lipid, HbA1c, Thyroid, LFT, Vit D3/B12). Certified phlebotomists collect samples right at your doorstep. Verified digital medical reports released within hours.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigate('Diagnostics')}
              className="w-full py-2.5 px-4 rounded-2xl bg-[#176541] hover:bg-[#125133] text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Explore Tests & Book Home Sample</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2: Virtual Telehealth & Video Consultations */}
        <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-sky-50 to-blue-100/60 dark:from-[#162738] dark:to-[#0f1d2c] border border-sky-200 dark:border-sky-900 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-700 text-white text-[10px] font-bold uppercase tracking-wider">
                <Video className="w-3 h-3" />
                Virtual Care
              </span>
              <span className="text-[11px] font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-sky-500" />
                Encrypted HD Room
              </span>
            </div>

            <h3 className="font-heading text-xl font-bold text-sky-900 dark:text-sky-200 mb-2">
              Instant Video Teleconsultations
            </h3>
            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Can't make it in person? Connect directly with CityCare duty physicians via secure high-definition video. Instant vital telemetry readout, consultation chat, and automatic digital prescription delivery.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigate('Telehealth')}
              className="w-full py-2.5 px-4 rounded-2xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Launch Virtual Clinic Room</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Our Specialists Preview */}
      <section>
        <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#c85d38] dark:text-[#f38360] mb-1">
          OUR SPECIALISTS
        </div>
        <h2 className="font-heading text-2xl font-bold text-[#481e0b] dark:text-[#f7eee9] mb-1">
          Meet your clinic team
        </h2>
        <p className="text-xs text-[#786b65] dark:text-[#a89991] mb-5">
          Review listed qualifications and consultation fees before you choose an appointment.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                className="p-5 rounded-2xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-xs flex flex-col justify-between transition-colors"
              >
                <div>
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#cd5f37] to-[#481e0b] text-white font-heading font-bold text-lg flex items-center justify-center mb-4 shadow-sm">
                    {initials}
                  </div>
                  <h3 className="font-heading font-bold text-lg text-[#481e0b] dark:text-[#f7eee9] mb-0.5">
                    {doctor.name}
                  </h3>
                  <div className="text-xs text-[#786b65] dark:text-[#a89991] font-medium mb-2">
                    {doctor.spec}
                  </div>
                  <div className="text-sm font-bold text-[#a84724] dark:text-[#f38360] mb-4">
                    ₹{doctor.fee}{' '}
                    <span className="text-xs text-[#786b65] dark:text-[#a89991] font-normal">
                      consultation
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('Appointments', doctor.id)}
                  className="w-full py-2 px-3 rounded-full bg-[#edf7f0] dark:bg-[#1a2d22] hover:bg-[#dceee2] dark:hover:bg-[#233c2e] text-[#176541] dark:text-[#34d399] text-xs font-bold border border-[#cfe1d5] dark:border-[#2b4434] transition-colors cursor-pointer"
                >
                  Book this doctor
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => onNavigate('Our doctors')}
            className="text-xs font-bold text-[#a84724] dark:text-[#f38360] hover:underline cursor-pointer"
          >
            View all doctor schedules →
          </button>
        </div>
      </section>

      {/* Why CityCare */}
      <section>
        <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#c85d38] dark:text-[#f38360] mb-1">
          WHY CITYCARE
        </div>
        <h2 className="font-heading text-2xl font-bold text-[#481e0b] dark:text-[#f7eee9] mb-5">
          The details you need, before you book
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-xs transition-colors">
            <div className="text-[11px] font-bold text-[#c85d38] dark:text-[#f38360] mb-2">01</div>
            <h4 className="font-heading font-bold text-sm text-[#481e0b] dark:text-[#f7eee9] mb-1">
              Clear consultation fees
            </h4>
            <p className="text-xs text-[#786b65] dark:text-[#c4b5ae] leading-relaxed">
              The listed fee is shown alongside each doctor's details with no hidden charges.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-xs transition-colors">
            <div className="text-[11px] font-bold text-[#c85d38] dark:text-[#f38360] mb-2">02</div>
            <h4 className="font-heading font-bold text-sm text-[#481e0b] dark:text-[#f7eee9] mb-1">
              Simple appointment flow
            </h4>
            <p className="text-xs text-[#786b65] dark:text-[#c4b5ae] leading-relaxed">
              Choose a doctor, date, and available sample time in one simple, validated form.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-xs transition-colors">
            <div className="text-[11px] font-bold text-[#c85d38] dark:text-[#f38360] mb-2">03</div>
            <h4 className="font-heading font-bold text-sm text-[#481e0b] dark:text-[#f7eee9] mb-1">
              A useful booking reference
            </h4>
            <p className="text-xs text-[#786b65] dark:text-[#c4b5ae] leading-relaxed">
              Keep the reference shown after saving your appointment for lookup or cancellation.
            </p>
          </div>
        </div>
      </section>

      {/* Clinic Map Location Spotlight */}
      <section className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] text-[11px] font-bold uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5" />
            <span>Clinic Map & Directions</span>
          </div>
          <h3 className="font-heading text-xl md:text-2xl font-bold text-[#481e0b] dark:text-[#f7eee9]">
            Visit CityCare Clinic in Karond, Bhopal
          </h3>
          <p className="text-xs text-[#685a53] dark:text-[#c4b5ae] leading-relaxed">
            {CLINIC.address}. Conveniently connected via Karond Square and Berasia Road. Free patient parking and full wheelchair accessibility.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('Contact')}
            className="px-5 py-2.5 rounded-full bg-[#176541] hover:bg-[#125133] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Open Interactive Map</span>
          </button>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(CLINIC.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-full border border-[#dcc9bf] dark:border-[#42332a] bg-[#fdfaf8] dark:bg-[#251d19] hover:bg-gray-100 text-xs font-semibold text-[#481e0b] dark:text-[#f7eee9] transition-colors cursor-pointer"
          >
            Live Google Maps ↗
          </a>
        </div>
      </section>

      {/* Final Banner CTA */}
      <section className="p-8 md:p-10 rounded-3xl text-white bg-gradient-to-r from-[#cd5f37] via-[#a84724] to-[#481e0b] shadow-[0_16px_35px_rgba(72,30,11,0.16)] flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="text-[10px] uppercase font-bold tracking-[0.18em] text-[#f9ddd1] mb-2">
            YOUR NEXT STEP
          </div>
          <h2 className="font-heading text-2xl md:text-3xl font-bold mb-2">
            Make your next visit easy to plan.
          </h2>
          <p className="text-xs md:text-sm text-[#fff1eb] max-w-lg">
            Compare the clinic doctors and listed fees, then choose an appointment time.
          </p>
        </div>
        <button
          onClick={() => onNavigate('Appointments')}
          className="px-6 py-3 rounded-full bg-white hover:bg-[#fff9f6] text-[#a84724] font-bold text-sm shadow-md transition-all cursor-pointer shrink-0"
        >
          Book an appointment
        </button>
      </section>
    </div>
  );
};
