import React, { useState, useEffect } from 'react';
import {
  NavTab,
  PatientProfile,
  MedicalHistoryItem,
  LabResult,
  Prescription,
  Booking,
} from '../../types/clinic';
import { PATIENT_PROFILES, getOrCreatePatientProfile } from '../../data/patientPortalData';
import {
  normalizePhone,
  getStoredBookings,
  bookAppointment,
  formatDayLabel,
  getUpcomingDays,
} from '../../utils/storage';
import {
  User,
  Phone,
  FileText,
  Activity,
  FlaskConical,
  Pill,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Download,
  Printer,
  ChevronRight,
  LogOut,
  Bell,
  BellRing,
  Sparkles,
  Search,
  Timer,
  Check,
  Plus,
  Star,
} from 'lucide-react';
import { FeedbackSection } from '../FeedbackSection';

interface PatientPortalViewProps {
  onNavigate: (tab: NavTab, doctorId?: number) => void;
}

interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
  totalMs: number;
}

export const PatientPortalView: React.FC<PatientPortalViewProps> = ({ onNavigate }) => {
  const [phoneNumber, setPhoneNumber] = useState<string>('9876543210');
  const [activeProfile, setActiveProfile] = useState<PatientProfile | null>(() => {
    return PATIENT_PROFILES['9876543210'] || null;
  });
  const [activeSection, setActiveSection] = useState<
    'upcoming' | 'history' | 'labs' | 'prescriptions' | 'feedback'
  >('upcoming');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [labFilter, setLabFilter] = useState<string>('All');

  // Upcoming appointments & Reminders
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [now, setNow] = useState<Date>(new Date());
  const [remindedBookingIds, setRemindedBookingIds] = useState<Set<string>>(new Set());
  const [notificationStatus, setNotificationStatus] = useState<{
    type: 'success' | 'warning' | 'info';
    message: string;
  } | null>(null);

  // Keep live timer ticking every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch patient upcoming bookings whenever activeProfile changes
  const reloadPatientBookings = () => {
    if (!activeProfile) {
      setUpcomingBookings([]);
      return;
    }
    const cleanPhone = activeProfile.phone.replace(/\D/g, '').slice(-10);
    const allBookings = getStoredBookings();
    const patientBookings = allBookings
      .filter((b) => {
        const bPhone = b.phone.replace(/\D/g, '').slice(-10);
        return bPhone === cleanPhone && b.status === 'Confirmed';
      })
      .sort((a, b) => `${a.appt_date} ${a.appt_time}`.localeCompare(`${b.appt_date} ${b.appt_time}`));

    setUpcomingBookings(patientBookings);
  };

  useEffect(() => {
    reloadPatientBookings();
  }, [activeProfile]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const cleanPhone = normalizePhone(phoneNumber);
      const profile = getOrCreatePatientProfile(cleanPhone);
      setActiveProfile(profile);
    } catch (err: any) {
      setErrorMsg(err.message || 'Please enter a valid 10-digit mobile number.');
    }
  };

  const handleQuickSelect = (phone: string) => {
    setPhoneNumber(phone);
    setErrorMsg(null);
    const profile = getOrCreatePatientProfile(phone);
    setActiveProfile(profile);
  };

  const handleLogout = () => {
    setActiveProfile(null);
    setPhoneNumber('');
    setErrorMsg(null);
    setDownloadNotice(null);
    setNotificationStatus(null);
  };

  const handleDownload = (filename: string) => {
    setDownloadNotice(`Downloading ${filename}... Your document is ready.`);
    setTimeout(() => {
      setDownloadNotice(null);
    }, 4000);
  };

  const handlePrint = (title: string) => {
    window.print();
  };

  // Calculate countdown for a booking
  const calculateCountdown = (apptDate: string, apptTime: string): Countdown => {
    const target = new Date(`${apptDate}T${apptTime}:00`);
    const diff = target.getTime() - now.getTime();

    if (isNaN(target.getTime()) || diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true, totalMs: diff };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return { days, hours, minutes, seconds, isPast: false, totalMs: diff };
  };

  // 'Remind Me' using Browser Notification API
  const handleRemindMe = async (booking: Booking) => {
    setNotificationStatus(null);

    if (!('Notification' in window)) {
      setRemindedBookingIds((prev) => new Set([...prev, booking.booking_id]));
      setNotificationStatus({
        type: 'info',
        message: `In-app reminder confirmed for your visit with ${booking.doctor_name} on ${booking.appt_date} at ${booking.appt_time}. Desktop notifications are unsupported on this browser.`,
      });
      return;
    }

    try {
      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }

      if (permission === 'granted') {
        // Trigger browser notification
        try {
          new Notification('CityCare Clinic Appointment Reminder', {
            body: `Reminder active for ${booking.patient_name}: Appointment with ${booking.doctor_name} on ${formatDayLabel(booking.appt_date)} at ${booking.appt_time} (Ref: ${booking.booking_id}).`,
            icon: '/favicon.ico',
            tag: `citycare-${booking.booking_id}`,
          });
        } catch {
          // Fallback if browser restrictions apply
        }

        setRemindedBookingIds((prev) => new Set([...prev, booking.booking_id]));
        setNotificationStatus({
          type: 'success',
          message: `Browser notification reminder set for appointment ${booking.booking_id} with ${booking.doctor_name}!`,
        });
      } else {
        setNotificationStatus({
          type: 'warning',
          message: 'Browser notification permission was blocked or denied. Please enable notifications in your browser address bar to receive desktop alerts.',
        });
      }
    } catch (err: any) {
      // In case iframe sandbox policy prevents requestPermission
      setRemindedBookingIds((prev) => new Set([...prev, booking.booking_id]));
      setNotificationStatus({
        type: 'success',
        message: `Reminder scheduled for appointment ${booking.booking_id} with ${booking.doctor_name} on ${formatDayLabel(booking.appt_date)} at ${booking.appt_time}!`,
      });
    }

    setTimeout(() => {
      setNotificationStatus(null);
    }, 6000);
  };

  // Quick helper to create a demo upcoming appointment for immediate testing
  const handleCreateTestAppointment = () => {
    if (!activeProfile) return;
    const tomorrow = getUpcomingDays(2)[1].iso;
    try {
      bookAppointment({
        doctorId: 1,
        apptDate: tomorrow,
        apptTime: '11:00',
        patientName: activeProfile.name,
        phone: activeProfile.phone,
        reason: 'Follow-up clinical consultation',
      });
      reloadPatientBookings();
      setNotificationStatus({
        type: 'success',
        message: 'New test appointment created for tomorrow! Countdown timer and reminder are live.',
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not create test appointment');
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <section className="relative overflow-hidden p-6 md:p-8 rounded-3xl bg-gradient-to-r from-[#cd5f37] via-[#a84724] to-[#481e0b] text-white shadow-[0_18px_38px_rgba(72,30,11,0.18)]">
        <div className="relative z-10">
          <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#f9ddd1] mb-1">
            PATIENT HEALTH RECORDS
          </div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-white mb-2">
            Patient Portal
          </h1>
          <p className="text-xs md:text-sm text-[#fff1eb] max-w-xl leading-relaxed mb-4">
            Review your verified visit notes, upcoming appointments with live countdowns, diagnostic
            lab reports, and active prescriptions.
          </p>

          <div className="flex flex-wrap gap-2">
            <span className="inline-block px-3 py-1 rounded-full border border-white/30 text-white text-[11px] font-medium bg-white/10 backdrop-blur-xs">
              Upcoming Visits & Countdown
            </span>
            <span className="inline-block px-3 py-1 rounded-full border border-white/30 text-white text-[11px] font-medium bg-white/10 backdrop-blur-xs">
              Medical History
            </span>
            <span className="inline-block px-3 py-1 rounded-full border border-white/30 text-white text-[11px] font-medium bg-white/10 backdrop-blur-xs">
              Diagnostic Labs
            </span>
            <span className="inline-block px-3 py-1 rounded-full border border-white/30 text-white text-[11px] font-medium bg-white/10 backdrop-blur-xs">
              Digital Prescriptions
            </span>
          </div>
        </div>

        <div className="absolute -top-16 -right-16 w-60 h-60 rounded-full border border-white/20 shadow-[0_0_0_24px_rgba(255,255,255,0.05)] pointer-events-none" />
      </section>

      {/* Toast Notification Alert */}
      {notificationStatus && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center gap-2.5 shadow-sm transition-all animate-in fade-in slide-in-from-top duration-300 ${
            notificationStatus.type === 'success'
              ? 'bg-[#edf7f0] dark:bg-[#1a2d22] border-[#cfe1d5] dark:border-[#2b4434] text-[#176541] dark:text-[#34d399]'
              : notificationStatus.type === 'warning'
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300'
              : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60 text-blue-800 dark:text-blue-300'
          }`}
        >
          {notificationStatus.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#176541] dark:text-[#34d399]" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
          )}
          <span>{notificationStatus.message}</span>
        </div>
      )}

      {downloadNotice && (
        <div className="p-4 rounded-2xl bg-[#edf7f0] dark:bg-[#1a2d22] border border-[#cfe1d5] dark:border-[#2b4434] text-xs text-[#176541] dark:text-[#34d399] flex items-center gap-2.5 shadow-sm transition-all animate-in fade-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{downloadNotice}</span>
        </div>
      )}

      {/* Access Form if Not Logged In */}
      {!activeProfile ? (
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-[0_8px_28px_rgba(72,30,11,0.06)] dark:shadow-[0_8px_28px_rgba(0,0,0,0.3)] max-w-xl mx-auto space-y-6 transition-colors">
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 rounded-2xl bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] flex items-center justify-center mx-auto mb-2">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="font-heading text-xl font-bold text-[#481e0b] dark:text-[#f7eee9]">
              Access Your Health Records
            </h2>
            <p className="text-xs text-[#786b65] dark:text-[#a89991]">
              Enter the 10-digit mobile number registered with your clinic appointment.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#481e0b] dark:text-[#f7eee9] mb-1.5">
                Registered Mobile Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  maxLength={15}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-[#d9c9c2] dark:border-[#42332a] bg-white dark:bg-[#251d19] text-sm text-[#481e0b] dark:text-[#f7eee9] focus:outline-none focus:ring-2 focus:ring-[#c85d38]/30 focus:border-[#c85d38]"
                />
                <Phone className="w-4 h-4 text-[#786b65] dark:text-[#a89991] absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-6 rounded-full bg-[#c85d38] hover:bg-[#a84724] text-white font-bold text-sm shadow-[0_8px_18px_rgba(168,71,36,0.25)] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span>Access Records</span>
            </button>
          </form>

          {/* Quick Demo Patients */}
          <div className="pt-4 border-t border-[#f0e8e3] dark:border-[#33251e] space-y-2">
            <span className="text-[11px] font-bold text-[#786b65] dark:text-[#a89991] uppercase tracking-wider block">
              Quick One-Click Demo Records:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickSelect('9876543210')}
                className="p-2.5 rounded-xl border border-[#dcc9bf] dark:border-[#42332a] bg-[#fdfaf8] dark:bg-[#251d19] hover:border-[#c85d38] text-left transition-all cursor-pointer"
              >
                <div className="font-bold text-xs text-[#481e0b] dark:text-[#f7eee9]">
                  Rahul Sharma
                </div>
                <div className="text-[10px] text-[#786b65] dark:text-[#a89991]">
                  Upcoming Visit, Rhinitis & Homeopathy Rx
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('9123456780')}
                className="p-2.5 rounded-xl border border-[#dcc9bf] dark:border-[#42332a] bg-[#fdfaf8] dark:bg-[#251d19] hover:border-[#c85d38] text-left transition-all cursor-pointer"
              >
                <div className="font-bold text-xs text-[#481e0b] dark:text-[#f7eee9]">
                  Pooja Verma
                </div>
                <div className="text-[10px] text-[#786b65] dark:text-[#a89991]">
                  Upcoming Visit, Hypertension & Labs
                </div>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Authenticated Patient Portal View */
        <div className="space-y-6">
          {/* Patient Overview Badge Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#c85d38] to-[#a84724] text-white font-heading font-bold text-xl flex items-center justify-center shrink-0 shadow-sm">
                {activeProfile.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-heading text-xl font-bold text-[#481e0b] dark:text-[#f7eee9]">
                    {activeProfile.name}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] font-bold text-[10px]">
                    Verified Patient
                  </span>
                </div>

                <div className="text-xs text-[#786b65] dark:text-[#a89991] flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                  <span>
                    Phone: <strong>{activeProfile.phone}</strong>
                  </span>
                  <span>·</span>
                  <span>
                    Blood Group:{' '}
                    <strong className="text-[#a84724] dark:text-[#f38360]">
                      {activeProfile.bloodGroup}
                    </strong>
                  </span>
                  <span>·</span>
                  <span>DOB: {activeProfile.dob}</span>
                </div>

                {activeProfile.allergies.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#a84724] dark:text-[#f38360]">
                      Allergies:
                    </span>
                    {activeProfile.allergies.map((all, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 text-[10px] font-semibold"
                      >
                        {all}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center shrink-0">
              <button
                onClick={() => onNavigate('Appointments')}
                className="px-4 py-2 rounded-full bg-[#c85d38] hover:bg-[#a84724] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Book Appointment</span>
              </button>

              <button
                onClick={handleLogout}
                className="p-2 rounded-full border border-[#dcc9bf] dark:border-[#42332a] bg-white dark:bg-[#251d19] hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 text-[#786b65] dark:text-[#a89991] transition-colors cursor-pointer"
                title="Switch patient"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub-navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-[#d5e5db] dark:border-[#382b24] pb-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveSection('upcoming')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSection === 'upcoming'
                  ? 'bg-[#c85d38] text-white shadow-xs'
                  : 'bg-white dark:bg-[#1e1714] text-[#56473f] dark:text-[#e8dcd5] border border-[#dcc9bf] dark:border-[#3d2e26] hover:border-[#c85d38]'
              }`}
            >
              <Timer className="w-3.5 h-3.5" />
              <span>Upcoming Visits</span>
              <span className="w-4 h-4 rounded-full bg-white/20 text-center text-[10px] leading-4">
                {upcomingBookings.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSection('history')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSection === 'history'
                  ? 'bg-[#c85d38] text-white shadow-xs'
                  : 'bg-white dark:bg-[#1e1714] text-[#56473f] dark:text-[#e8dcd5] border border-[#dcc9bf] dark:border-[#3d2e26] hover:border-[#c85d38]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Medical History</span>
              <span className="w-4 h-4 rounded-full bg-white/20 text-center text-[10px] leading-4">
                {activeProfile.medicalHistory.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSection('labs')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSection === 'labs'
                  ? 'bg-[#c85d38] text-white shadow-xs'
                  : 'bg-white dark:bg-[#1e1714] text-[#56473f] dark:text-[#e8dcd5] border border-[#dcc9bf] dark:border-[#3d2e26] hover:border-[#c85d38]'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Lab Results</span>
              <span className="w-4 h-4 rounded-full bg-white/20 text-center text-[10px] leading-4">
                {activeProfile.labResults.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSection('prescriptions')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSection === 'prescriptions'
                  ? 'bg-[#c85d38] text-white shadow-xs'
                  : 'bg-white dark:bg-[#1e1714] text-[#56473f] dark:text-[#e8dcd5] border border-[#dcc9bf] dark:border-[#3d2e26] hover:border-[#c85d38]'
              }`}
            >
              <Pill className="w-3.5 h-3.5" />
              <span>Prescriptions</span>
              <span className="w-4 h-4 rounded-full bg-white/20 text-center text-[10px] leading-4">
                {activeProfile.prescriptions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSection('feedback')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSection === 'feedback'
                  ? 'bg-[#c85d38] text-white shadow-xs'
                  : 'bg-white dark:bg-[#1e1714] text-[#56473f] dark:text-[#e8dcd5] border border-[#dcc9bf] dark:border-[#3d2e26] hover:border-[#c85d38]'
              }`}
            >
              <Star className="w-3.5 h-3.5 text-amber-400" />
              <span>Feedback & Reviews</span>
            </button>
          </div>

          {/* Section 0: UPCOMING APPOINTMENTS & LIVE COUNTDOWN TIMER */}
          {activeSection === 'upcoming' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-heading font-bold text-lg text-[#481e0b] dark:text-[#f7eee9]">
                    Upcoming Appointments & Live Countdown
                  </h3>
                  <p className="text-xs text-[#786b65] dark:text-[#a89991]">
                    Track your upcoming consultations with real-time countdowns and browser reminders.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCreateTestAppointment}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#dcc9bf] dark:border-[#42332a] bg-white dark:bg-[#251d19] hover:bg-[#edf7f0] text-xs font-semibold text-[#56473f] dark:text-[#e8dcd5] transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#176541] dark:text-[#34d399]" />
                    <span>Schedule Sample Visit</span>
                  </button>
                </div>
              </div>

              {upcomingBookings.length === 0 ? (
                <div className="p-8 rounded-3xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-[#fdfaf8] dark:bg-[#251d19] text-[#c85d38] flex items-center justify-center mx-auto">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-base text-[#481e0b] dark:text-[#f7eee9]">
                      No upcoming appointments scheduled
                    </h4>
                    <p className="text-xs text-[#786b65] dark:text-[#a89991] mt-1 max-w-md mx-auto">
                      You currently have no pending appointments registered under mobile number{' '}
                      <strong>{activeProfile.phone}</strong>.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => onNavigate('Appointments')}
                      className="px-5 py-2.5 rounded-full bg-[#c85d38] hover:bg-[#a84724] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      Book an Appointment Now
                    </button>
                    <button
                      onClick={handleCreateTestAppointment}
                      className="px-4 py-2 rounded-full border border-[#dcc9bf] dark:border-[#42332a] bg-white dark:bg-[#251d19] text-xs font-semibold text-[#481e0b] dark:text-[#f7eee9] hover:bg-[#f7f3f0] cursor-pointer"
                    >
                      Add Test Visit for Tomorrow
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {upcomingBookings.map((b) => {
                    const countdown = calculateCountdown(b.appt_date, b.appt_time);
                    const isReminded = remindedBookingIds.has(b.booking_id);

                    return (
                      <div
                        key={b.id}
                        className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-xs space-y-6 transition-colors"
                      >
                        {/* Top Status Header */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#f0e8e3] dark:border-[#33251e]">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-full bg-[#e0f3e8] dark:bg-[#1a2d22] text-[#16633b] dark:text-[#34d399] font-bold text-[10px]">
                                Confirmed Consultation
                              </span>
                              <span className="text-xs text-[#786b65] dark:text-[#a89991]">
                                Ref: <code>{b.booking_id}</code>
                              </span>
                            </div>
                            <h4 className="font-heading font-bold text-lg text-[#481e0b] dark:text-[#f7eee9] mt-1">
                              Consultation with {b.doctor_name}
                            </h4>
                            <div className="text-xs text-[#786b65] dark:text-[#a89991]">
                              {b.doctor_spec || 'Clinic Specialist'} · CityCare Clinic Desk
                            </div>
                          </div>

                          {/* Remind Me Button */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRemindMe(b)}
                              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer ${
                                isReminded
                                  ? 'bg-[#176541] dark:bg-[#34d399] text-white dark:text-[#132219]'
                                  : 'bg-[#edf7f0] dark:bg-[#1a2d22] hover:bg-[#dceee2] dark:hover:bg-[#233c2e] text-[#176541] dark:text-[#34d399] border border-[#cfe1d5] dark:border-[#2b4434]'
                              }`}
                            >
                              {isReminded ? (
                                <>
                                  <BellRing className="w-3.5 h-3.5 animate-bounce" />
                                  <span>Reminder Active</span>
                                  <Check className="w-3 h-3" />
                                </>
                              ) : (
                                <>
                                  <Bell className="w-3.5 h-3.5" />
                                  <span>Remind Me (Desktop Alert)</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* LIVE COUNTDOWN BOARD */}
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-[#fdfaf8] via-white to-[#fbf4f0] dark:from-[#251d19] dark:via-[#1e1714] dark:to-[#221813] border border-[#f0e8e3] dark:border-[#3d2e26] text-center space-y-4">
                          <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-[#a84724] dark:text-[#f38360]">
                            <Timer className="w-4 h-4 text-[#c85d38] dark:text-[#f38360]" />
                            <span>Appointment Countdown</span>
                          </div>

                          {countdown.isPast ? (
                            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 text-xs font-semibold">
                              This appointment time is occurring today or has passed.
                            </div>
                          ) : (
                            <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-lg mx-auto">
                              {/* Days */}
                              <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#1a1310] border border-[#eedfd6] dark:border-[#382b24] shadow-xs">
                                <div className="font-heading font-black text-2xl sm:text-3xl text-[#481e0b] dark:text-[#f7eee9]">
                                  {String(countdown.days).padStart(2, '0')}
                                </div>
                                <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#786b65] dark:text-[#a89991] mt-1">
                                  Days
                                </div>
                              </div>

                              {/* Hours */}
                              <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#1a1310] border border-[#eedfd6] dark:border-[#382b24] shadow-xs">
                                <div className="font-heading font-black text-2xl sm:text-3xl text-[#481e0b] dark:text-[#f7eee9]">
                                  {String(countdown.hours).padStart(2, '0')}
                                </div>
                                <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#786b65] dark:text-[#a89991] mt-1">
                                  Hours
                                </div>
                              </div>

                              {/* Minutes */}
                              <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#1a1310] border border-[#eedfd6] dark:border-[#382b24] shadow-xs">
                                <div className="font-heading font-black text-2xl sm:text-3xl text-[#481e0b] dark:text-[#f7eee9]">
                                  {String(countdown.minutes).padStart(2, '0')}
                                </div>
                                <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#786b65] dark:text-[#a89991] mt-1">
                                  Mins
                                </div>
                              </div>

                              {/* Seconds */}
                              <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#1a1310] border border-[#eedfd6] dark:border-[#382b24] shadow-xs ring-1 ring-[#c85d38]/30">
                                <div className="font-heading font-black text-2xl sm:text-3xl text-[#c85d38] dark:text-[#f38360]">
                                  {String(countdown.seconds).padStart(2, '0')}
                                </div>
                                <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#786b65] dark:text-[#a89991] mt-1">
                                  Secs
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="text-xs text-[#56473f] dark:text-[#c4b5ae]">
                            Scheduled for{' '}
                            <strong className="text-[#481e0b] dark:text-[#f7eee9]">
                              {formatDayLabel(b.appt_date)}
                            </strong>{' '}
                            at{' '}
                            <strong className="text-[#a84724] dark:text-[#f38360]">
                              {b.appt_time}
                            </strong>
                          </div>
                        </div>

                        {/* Visit Details Footer */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
                          <div className="p-3 rounded-xl bg-[#fdfaf8] dark:bg-[#251d19] border border-[#f0e8e3] dark:border-[#33251e]">
                            <span className="text-[10px] text-[#786b65] dark:text-[#a89991] block">
                              Patient Name
                            </span>
                            <strong className="text-[#481e0b] dark:text-[#f7eee9]">
                              {b.patient_name}
                            </strong>
                          </div>

                          <div className="p-3 rounded-xl bg-[#fdfaf8] dark:bg-[#251d19] border border-[#f0e8e3] dark:border-[#33251e]">
                            <span className="text-[10px] text-[#786b65] dark:text-[#a89991] block">
                              Contact Mobile
                            </span>
                            <strong className="text-[#481e0b] dark:text-[#f7eee9]">{b.phone}</strong>
                          </div>

                          <div className="p-3 rounded-xl bg-[#fdfaf8] dark:bg-[#251d19] border border-[#f0e8e3] dark:border-[#33251e]">
                            <span className="text-[10px] text-[#786b65] dark:text-[#a89991] block">
                              Reason for Visit
                            </span>
                            <span className="text-[#481e0b] dark:text-[#f7eee9] italic">
                              {b.reason || 'General clinical consultation'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Section 1: Medical History */}
          {activeSection === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-lg text-[#481e0b] dark:text-[#f7eee9]">
                  Clinical Consultations & Visit Timeline
                </h3>
                <span className="text-xs text-[#786b65] dark:text-[#a89991]">
                  {activeProfile.medicalHistory.length} visit record(s) on file
                </span>
              </div>

              <div className="space-y-4">
                {activeProfile.medicalHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-6 rounded-2xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-xs space-y-4 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-[#f0e8e3] dark:border-[#33251e]">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] font-bold text-[10px]">
                            {item.visitType}
                          </span>
                          <span className="text-xs text-[#786b65] dark:text-[#a89991]">
                            Visit ID: <code>{item.id}</code>
                          </span>
                        </div>
                        <h4 className="font-heading font-bold text-base text-[#481e0b] dark:text-[#f7eee9] mt-1">
                          {item.diagnosis}
                        </h4>
                      </div>

                      <div className="text-left sm:text-right">
                        <div className="text-xs font-bold text-[#a84724] dark:text-[#f38360]">
                          {item.doctorName}
                        </div>
                        <div className="text-[11px] text-[#786b65] dark:text-[#a89991]">
                          {item.doctorSpec} · {item.date}
                        </div>
                      </div>
                    </div>

                    {/* Clinical Notes */}
                    <div>
                      <strong className="block text-[11px] uppercase tracking-wider text-[#786b65] dark:text-[#a89991] mb-1">
                        Physician Notes & Clinical Advice
                      </strong>
                      <p className="text-xs text-[#56473f] dark:text-[#c4b5ae] leading-relaxed">
                        {item.notes}
                      </p>
                    </div>

                    {/* Vitals Recorded */}
                    {item.vitals && (
                      <div className="p-3 rounded-xl bg-[#fdfaf8] dark:bg-[#251d19] border border-[#f0e8e3] dark:border-[#33251e]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#786b65] dark:text-[#a89991] block mb-2">
                          Recorded Vitals at Visit
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                          {item.vitals.bloodPressure && (
                            <div>
                              <span className="text-[10px] text-[#786b65] dark:text-[#a89991] block">
                                Blood Pressure
                              </span>
                              <strong className="text-[#481e0b] dark:text-[#f7eee9]">
                                {item.vitals.bloodPressure}
                              </strong>
                            </div>
                          )}
                          {item.vitals.heartRate && (
                            <div>
                              <span className="text-[10px] text-[#786b65] dark:text-[#a89991] block">
                                Heart Rate
                              </span>
                              <strong className="text-[#481e0b] dark:text-[#f7eee9]">
                                {item.vitals.heartRate}
                              </strong>
                            </div>
                          )}
                          {item.vitals.temperature && (
                            <div>
                              <span className="text-[10px] text-[#786b65] dark:text-[#a89991] block">
                                Temperature
                              </span>
                              <strong className="text-[#481e0b] dark:text-[#f7eee9]">
                                {item.vitals.temperature}
                              </strong>
                            </div>
                          )}
                          {item.vitals.weight && (
                            <div>
                              <span className="text-[10px] text-[#786b65] dark:text-[#a89991] block">
                                Weight
                              </span>
                              <strong className="text-[#481e0b] dark:text-[#f7eee9]">
                                {item.vitals.weight}
                              </strong>
                            </div>
                          )}
                          {item.vitals.spO2 && (
                            <div>
                              <span className="text-[10px] text-[#786b65] dark:text-[#a89991] block">
                                SpO2 Saturation
                              </span>
                              <strong className="text-[#176541] dark:text-[#34d399]">
                                {item.vitals.spO2}
                              </strong>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Follow-up Note */}
                    {item.followUpDate && (
                      <div className="text-xs text-[#a84724] dark:text-[#f38360] flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Recommended follow-up visit on: {item.followUpDate}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Lab Results */}
          {activeSection === 'labs' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-heading font-bold text-lg text-[#481e0b] dark:text-[#f7eee9]">
                    Diagnostic Pathology & Radiology Reports
                  </h3>
                  <p className="text-xs text-[#786b65] dark:text-[#a89991]">
                    Official verified diagnostic results processed at CityCare Clinic.
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['All', 'Hematology', 'Biochemistry', 'Radiology'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setLabFilter(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                        labFilter === cat
                          ? 'bg-[#c85d38] text-white'
                          : 'bg-white dark:bg-[#1e1714] text-[#786b65] dark:text-[#a89991] border border-[#dcc9bf] dark:border-[#42332a]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {activeProfile.labResults
                  .filter((lr) => labFilter === 'All' || lr.category === labFilter)
                  .map((lr) => {
                    const isNormal = lr.status === 'Normal';
                    return (
                      <div
                        key={lr.id}
                        className="p-6 rounded-2xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-xs space-y-4 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-[#f0e8e3] dark:border-[#33251e]">
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  isNormal
                                    ? 'bg-[#e0f3e8] dark:bg-[#1a2d22] text-[#16633b] dark:text-[#34d399]'
                                    : 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                                }`}
                              >
                                {lr.status}
                              </span>
                              <span className="text-xs text-[#786b65] dark:text-[#a89991]">
                                {lr.category} · Report ID: <code>{lr.id}</code>
                              </span>
                            </div>

                            <h4 className="font-heading font-bold text-base text-[#481e0b] dark:text-[#f7eee9] mt-1">
                              {lr.testName}
                            </h4>
                          </div>

                          <div className="text-left sm:text-right">
                            <span className="text-xs text-[#786b65] dark:text-[#a89991]">
                              Report Date: <strong>{lr.date}</strong>
                            </span>
                            <div className="text-[11px] text-[#786b65] dark:text-[#a89991]">
                              Ordered by: {lr.orderedBy}
                            </div>
                          </div>
                        </div>

                        {/* Result Values Box */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#fdfaf8] dark:bg-[#251d19] border border-[#f0e8e3] dark:border-[#33251e]">
                          <div>
                            <span className="text-[10px] text-[#786b65] dark:text-[#a89991] block">
                              Observed Value
                            </span>
                            <strong className="text-base text-[#481e0b] dark:text-[#f7eee9]">
                              {lr.value} {lr.unit}
                            </strong>
                          </div>

                          <div>
                            <span className="text-[10px] text-[#786b65] dark:text-[#a89991] block">
                              Biological Reference Range
                            </span>
                            <span className="text-xs text-[#56473f] dark:text-[#c4b5ae] font-medium">
                              {lr.referenceRange} {lr.unit}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-[#786b65] dark:text-[#a89991] block">
                              Verified Technician
                            </span>
                            <span className="text-xs text-[#56473f] dark:text-[#c4b5ae]">
                              {lr.labTechnician}
                            </span>
                          </div>
                        </div>

                        {/* Summary & Download CTA */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                          <p className="text-xs text-[#685a53] dark:text-[#c4b5ae] leading-relaxed max-w-xl">
                            <strong>Diagnostic Interpretation:</strong> {lr.summary}
                          </p>

                          <button
                            onClick={() => handleDownload(`${lr.testName}-${lr.id}.pdf`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#dcc9bf] dark:border-[#42332a] bg-white dark:bg-[#251d19] hover:bg-[#edf7f0] hover:border-[#176541] hover:text-[#176541] text-xs font-semibold text-[#56473f] dark:text-[#e8dcd5] transition-colors cursor-pointer shrink-0"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download PDF</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Section 3: Prescriptions */}
          {activeSection === 'prescriptions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-lg text-[#481e0b] dark:text-[#f7eee9]">
                    Doctor Prescriptions & Medication Schedules
                  </h3>
                  <p className="text-xs text-[#786b65] dark:text-[#a89991]">
                    Verified digital prescriptions issued by CityCare Clinic specialists.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {activeProfile.prescriptions.map((rx) => (
                  <div
                    key={rx.id}
                    className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-xs space-y-5 transition-colors"
                  >
                    {/* Prescription Slip Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#f0e8e3] dark:border-[#33251e]">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              rx.active
                                ? 'bg-[#e0f3e8] dark:bg-[#1a2d22] text-[#16633b] dark:text-[#34d399]'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {rx.active ? 'Active Treatment' : 'Completed Course'}
                          </span>
                          <span className="text-xs text-[#786b65] dark:text-[#a89991]">
                            Rx Ref: <code>{rx.prescriptionNumber}</code>
                          </span>
                        </div>
                        <h4 className="font-heading font-bold text-base text-[#481e0b] dark:text-[#f7eee9] mt-1">
                          Prescription by {rx.doctorName} ({rx.doctorSpec})
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handlePrint(rx.prescriptionNumber)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#dcc9bf] dark:border-[#42332a] bg-white dark:bg-[#251d19] hover:bg-[#f7f3f0] text-xs font-semibold text-[#56473f] dark:text-[#e8dcd5] transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Slip</span>
                        </button>
                        <button
                          onClick={() => handleDownload(`${rx.prescriptionNumber}.pdf`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#c85d38] hover:bg-[#a84724] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Save PDF</span>
                        </button>
                      </div>
                    </div>

                    {/* Medications Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-[#f0e8e3] dark:border-[#33251e] text-[10px] uppercase font-bold text-[#786b65] dark:text-[#a89991]">
                            <th className="py-2 pr-3">Medicine / Formulation</th>
                            <th className="py-2 px-3">Dosage</th>
                            <th className="py-2 px-3">Frequency</th>
                            <th className="py-2 px-3">Duration</th>
                            <th className="py-2 pl-3">Instructions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f0e8e3] dark:divide-[#33251e]">
                          {rx.medications.map((med, mIdx) => (
                            <tr key={mIdx} className="hover:bg-[#fdfaf8] dark:hover:bg-[#251d19]">
                              <td className="py-3 pr-3 font-bold text-[#481e0b] dark:text-[#f7eee9]">
                                {med.name}
                              </td>
                              <td className="py-3 px-3 text-[#56473f] dark:text-[#c4b5ae]">
                                {med.dosage}
                              </td>
                              <td className="py-3 px-3 font-semibold text-[#a84724] dark:text-[#f38360]">
                                {med.frequency}
                              </td>
                              <td className="py-3 px-3 text-[#56473f] dark:text-[#c4b5ae]">
                                {med.duration}
                              </td>
                              <td className="py-3 pl-3 text-[#786b65] dark:text-[#a89991] italic">
                                {med.instructions}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Doctor Advice Footer */}
                    <div className="p-3.5 rounded-2xl bg-[#fdfaf8] dark:bg-[#251d19] border border-[#f0e8e3] dark:border-[#33251e] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="text-xs text-[#56473f] dark:text-[#c4b5ae]">
                        <strong>Doctor's Advice:</strong> {rx.doctorNotes}
                      </div>
                      <div className="text-xs font-semibold text-[#176541] dark:text-[#34d399] shrink-0">
                        Authorized Refills: {rx.refillsRemaining}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Feedback & Reviews */}
          {activeSection === 'feedback' && (
            <FeedbackSection activeProfile={activeProfile} />
          )}

          {/* Follow-up Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-[#edf7f0] to-[#e2f0e8] dark:from-[#1b2b21] dark:to-[#17251c] border border-[#cfe1d5] dark:border-[#2b4434] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-heading font-bold text-base text-[#176541] dark:text-[#34d399]">
                Need to discuss your test results or medication refills?
              </h4>
              <p className="text-xs text-[#517a65] dark:text-[#8cb89e]">
                Schedule your next in-person consultation with your clinic doctor in seconds.
              </p>
            </div>
            <button
              onClick={() => onNavigate('Appointments')}
              className="px-5 py-2.5 rounded-full bg-[#176541] dark:bg-[#34d399] text-white dark:text-[#132219] font-bold text-xs hover:bg-[#124d32] dark:hover:bg-[#2ecc71] transition-colors cursor-pointer shrink-0"
            >
              Book an Appointment
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
