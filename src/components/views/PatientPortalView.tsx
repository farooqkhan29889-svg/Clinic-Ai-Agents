import React, { useState, useEffect } from 'react';
import {
  NavTab,
  PatientProfile,
  MedicalHistoryItem,
  LabResult,
  Prescription,
  Booking,
  PatientAccount,
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
  getActivePatientSession,
  setActivePatientSession,
  loginPatient,
  registerPatient,
  sendSimulatedOtp,
  verifyOtpAndLogin,
  getBiometricSettings,
  setBiometricSettings,
  loginWithBiometrics,
  BiometricPreference,
} from '../../utils/authStorage';
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
  TrendingUp,
  Eye,
  EyeOff,
  Lock,
  Mail,
  KeyRound,
  UserPlus,
  LogIn,
  ArrowRight,
  Video,
  ScanFace,
  Fingerprint,
  SlidersHorizontal,
  QrCode,
} from 'lucide-react';
import { FeedbackSection } from '../FeedbackSection';
import { LabTrendsChart } from '../LabTrendsChart';
import { PrescriptionList } from '../PrescriptionList';
import { generateHealthSummaryPDF, generateSingleLabReportPDF } from '../../utils/pdfGenerator';
import { BiometricModal } from '../BiometricModal';
import { BiometricSettingsModal } from '../BiometricSettingsModal';
import { CheckInQRModal } from '../CheckInQRModal';
import { AppointmentQRCard } from '../AppointmentQRCard';
import { HealthOverviewWidget } from '../HealthOverviewWidget';

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
  // Active session and profile
  const [activeSession, setActiveSession] = useState<PatientAccount | null>(() => {
    return getActivePatientSession();
  });
  const [activeProfile, setActiveProfile] = useState<PatientProfile | null>(() => {
    const session = getActivePatientSession();
    if (session) {
      return getOrCreatePatientProfile(session.phone, session.name);
    }
    return null;
  });

  // Auth navigation & form states
  const [authTab, setAuthTab] = useState<'login' | 'register' | 'demo'>('login');
  const [loginIdentifier, setLoginIdentifier] = useState<string>('9876543210');
  const [loginPin, setLoginPin] = useState<string>('1234');
  const [showPin, setShowPin] = useState<boolean>(false);

  // New patient registration state
  const [regName, setRegName] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regDob, setRegDob] = useState<string>('1995-06-15');
  const [regGender, setRegGender] = useState<string>('Male');
  const [regBloodGroup, setRegBloodGroup] = useState<string>('B+');
  const [regPin, setRegPin] = useState<string>('1234');

  // OTP Modal states
  const [isOtpModalOpen, setIsOtpModalOpen] = useState<boolean>(false);
  const [otpPhone, setOtpPhone] = useState<string>('9876543210');
  const [otpCode, setOtpCode] = useState<string>('482910');
  const [otpNotice, setOtpNotice] = useState<string | null>(null);

  const [activeSection, setActiveSection] = useState<
    'overview' | 'upcoming' | 'history' | 'labs' | 'trends' | 'prescriptions' | 'feedback'
  >('overview');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [isDownloadingSummary, setIsDownloadingSummary] = useState<boolean>(false);
  const [labFilter, setLabFilter] = useState<string>('All');

  // Upcoming appointments & Reminders
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [now, setNow] = useState<Date>(new Date());
  const [remindedBookingIds, setRemindedBookingIds] = useState<Set<string>>(new Set());
  const [selectedQrBooking, setSelectedQrBooking] = useState<Booking | null>(null);
  const [checkedInBookingIds, setCheckedInBookingIds] = useState<Set<string>>(new Set());
  const [notificationStatus, setNotificationStatus] = useState<{
    type: 'success' | 'warning' | 'info';
    message: string;
  } | null>(null);

  // Biometric Authentication States
  const [showBiometricSettings, setShowBiometricSettings] = useState<boolean>(false);
  const [isBiometricScanning, setIsBiometricScanning] = useState<boolean>(false);
  const [biometricScanTargetPhone, setBiometricScanTargetPhone] = useState<string>('9876543210');
  const [biometricScanMode, setBiometricScanMode] = useState<'login' | 'enroll' | 'test'>('login');
  const [biometricStatus, setBiometricStatus] = useState<BiometricPreference | null>(() => {
    const session = getActivePatientSession();
    if (session) {
      return getBiometricSettings(session.phone);
    }
    return null;
  });

  // Sync biometric status whenever activeSession changes
  useEffect(() => {
    if (activeSession) {
      setBiometricStatus(getBiometricSettings(activeSession.phone));
    } else {
      setBiometricStatus(null);
    }
  }, [activeSession]);

  const handleBiometricLoginTrigger = (targetPhone?: string) => {
    const rawTarget = targetPhone || loginIdentifier || '9876543210';
    const target = rawTarget.replace(/\D/g, '').slice(-10) || '9876543210';
    setBiometricScanTargetPhone(target);
    setBiometricScanMode('login');
    setErrorMsg(null);
    setIsBiometricScanning(true);
  };

  const handleBiometricLoginSuccess = () => {
    setIsBiometricScanning(false);
    const target = biometricScanTargetPhone || loginIdentifier || '9876543210';
    const res = loginWithBiometrics(target);
    if (res.success && res.account) {
      setActiveSession(res.account);
      const profile = getOrCreatePatientProfile(res.account.phone, res.account.name);
      setActiveProfile(profile);
      setBiometricStatus(getBiometricSettings(res.account.phone));
      setNotificationStatus({
        type: 'success',
        message: `Biometric passkey verified! Welcome back, ${res.account.name}.`,
      });
      setTimeout(() => setNotificationStatus(null), 4000);
    } else {
      setErrorMsg(res.error || 'Biometric authentication failed. Please sign in with your PIN.');
    }
  };

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
    const res = loginPatient(loginIdentifier, loginPin);
    if (res.success && res.account) {
      setActiveSession(res.account);
      const profile = getOrCreatePatientProfile(res.account.phone, res.account.name);
      setActiveProfile(profile);
      setNotificationStatus({
        type: 'success',
        message: `Welcome back, ${res.account.name}! Patient records decrypted and loaded.`,
      });
      setTimeout(() => setNotificationStatus(null), 4000);
    } else {
      setErrorMsg(res.error || 'Invalid credentials.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const res = registerPatient({
      name: regName,
      phone: regPhone,
      email: regEmail,
      pin: regPin,
      dob: regDob,
      gender: regGender,
      bloodGroup: regBloodGroup,
    });
    if (res.success && res.account) {
      setActiveSession(res.account);
      const profile = getOrCreatePatientProfile(res.account.phone, res.account.name);
      setActiveProfile(profile);
      setNotificationStatus({
        type: 'success',
        message: `Registration successful! Welcome to CityCare Clinic, ${res.account.name}.`,
      });
      setTimeout(() => setNotificationStatus(null), 4000);
    } else {
      setErrorMsg(res.error || 'Registration failed.');
    }
  };

  const handleQuickSelect = (phone: string, pin = '1234') => {
    setErrorMsg(null);
    const res = loginPatient(phone, pin);
    if (res.success && res.account) {
      setActiveSession(res.account);
      const profile = getOrCreatePatientProfile(res.account.phone, res.account.name);
      setActiveProfile(profile);
      setNotificationStatus({
        type: 'success',
        message: `Signed in as ${res.account.name}.`,
      });
      setTimeout(() => setNotificationStatus(null), 3000);
    } else {
      const clean = phone.replace(/\D/g, '').slice(-10);
      const profile = getOrCreatePatientProfile(clean);
      setActiveProfile(profile);
    }
  };

  const handleOpenOtpModal = () => {
    const target = loginIdentifier || '9876543210';
    setOtpPhone(target);
    const sim = sendSimulatedOtp(target);
    setOtpCode('482910');
    setOtpNotice(sim.message);
    setIsOtpModalOpen(true);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const res = verifyOtpAndLogin(otpPhone, otpCode);
    if (res.success && res.account) {
      setActiveSession(res.account);
      const profile = getOrCreatePatientProfile(res.account.phone, res.account.name);
      setActiveProfile(profile);
      setIsOtpModalOpen(false);
      setNotificationStatus({
        type: 'success',
        message: `OTP verified! Logged in as ${res.account.name}.`,
      });
      setTimeout(() => setNotificationStatus(null), 4000);
    } else {
      setErrorMsg(res.error || 'Invalid OTP code.');
    }
  };

  const handleLogout = () => {
    setActivePatientSession(null);
    setActiveSession(null);
    setActiveProfile(null);
    setErrorMsg(null);
    setDownloadNotice(null);
    setNotificationStatus(null);
  };

  const handleDownloadHealthSummary = () => {
    if (!activeProfile) return;
    setIsDownloadingSummary(true);
    try {
      generateHealthSummaryPDF(activeProfile);
      setNotificationStatus({
        type: 'success',
        message: `Health Summary PDF for ${activeProfile.name} successfully generated and downloaded!`,
      });
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      setErrorMsg('Failed to generate Health Summary PDF. Please try again.');
    } finally {
      setIsDownloadingSummary(false);
    }
  };

  const handleDownloadLabPDF = (lab: LabResult) => {
    if (!activeProfile) return;
    try {
      generateSingleLabReportPDF(activeProfile, lab);
      setNotificationStatus({
        type: 'success',
        message: `Official Diagnostic Report for "${lab.testName}" (${lab.id}) downloaded successfully.`,
      });
    } catch (err: any) {
      console.error('Error generating lab PDF:', err);
      setErrorMsg('Failed to generate Lab Report PDF.');
    }
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

      {/* Patient Authentication Form if Not Logged In */}
      {!activeProfile ? (
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-[0_8px_28px_rgba(72,30,11,0.06)] dark:shadow-[0_8px_28px_rgba(0,0,0,0.3)] max-w-xl mx-auto space-y-6 transition-colors">
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 rounded-2xl bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] flex items-center justify-center mx-auto mb-2 shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="font-heading text-xl font-bold text-[#481e0b] dark:text-[#f7eee9]">
              Patient Health Portal
            </h2>
            <p className="text-xs text-[#786b65] dark:text-[#a89991]">
              Secure HIPAA-aligned access to your medical visits, lab reports, and prescriptions.
            </p>
          </div>

          {/* Segmented Auth Navigation Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-[#f5ede8] dark:bg-[#281e19] border border-[#e4d4cb] dark:border-[#3d2e26]">
            <button
              type="button"
              onClick={() => {
                setAuthTab('login');
                setErrorMsg(null);
              }}
              className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                authTab === 'login'
                  ? 'bg-white dark:bg-[#1e1714] text-[#a84724] dark:text-[#f38360] shadow-xs'
                  : 'text-[#786b65] dark:text-[#a89991] hover:text-[#481e0b]'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthTab('register');
                setErrorMsg(null);
              }}
              className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                authTab === 'register'
                  ? 'bg-white dark:bg-[#1e1714] text-[#a84724] dark:text-[#f38360] shadow-xs'
                  : 'text-[#786b65] dark:text-[#a89991] hover:text-[#481e0b]'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthTab('demo');
                setErrorMsg(null);
              }}
              className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                authTab === 'demo'
                  ? 'bg-white dark:bg-[#1e1714] text-[#176541] dark:text-[#34d399] shadow-xs'
                  : 'text-[#786b65] dark:text-[#a89991] hover:text-[#176541]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Quick Demo</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: PATIENT SIGN IN */}
          {authTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4 animate-in fade-in duration-150">
              {/* Fast Biometric Sign-in Banner (if enabled on device or for entered account) */}
              {(() => {
                const targetPhone = (loginIdentifier || '9876543210').replace(/\D/g, '').slice(-10);
                const bio = getBiometricSettings(targetPhone || '9876543210');
                if (bio.enabled) {
                  return (
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#edf7f0] to-[#e4f3e9] dark:from-[#1a2d22] dark:to-[#17251d] border border-[#cfe1d5] dark:border-[#2b4434] shadow-xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          <span className="text-xs font-bold text-[#176541] dark:text-[#34d399]">
                            {bio.type === 'fingerprint'
                              ? 'TouchID / Fingerprint Ready'
                              : bio.type === 'both'
                                ? 'Biometric Passkey Active'
                                : 'FaceID Ready'}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#176541] dark:text-[#34d399] font-semibold bg-white/80 dark:bg-black/30 px-2 py-0.5 rounded-md border border-[#cfe1d5] dark:border-[#2b4434]">
                          Instant Unlock
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleBiometricLoginTrigger(targetPhone)}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#176541] hover:bg-[#124d32] text-white font-bold text-xs shadow-[0_4px_14px_rgba(23,101,65,0.25)] transition-all cursor-pointer flex items-center justify-center gap-2 group"
                      >
                        {bio.type === 'fingerprint' ? (
                          <Fingerprint className="w-4 h-4 text-emerald-300 group-hover:scale-110 transition-transform" />
                        ) : (
                          <ScanFace className="w-4 h-4 text-emerald-300 group-hover:scale-110 transition-transform" />
                        )}
                        <span>
                          Fast Sign In with {bio.type === 'fingerprint' ? 'TouchID / Fingerprint' : 'FaceID'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-300 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  );
                }
                return null;
              })()}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#481e0b] dark:text-[#f7eee9] mb-1.5">
                  Mobile Number or Email
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="e.g. 9876543210 or rahul.sharma@example.com"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#d9c9c2] dark:border-[#42332a] bg-white dark:bg-[#251d19] text-sm text-[#481e0b] dark:text-[#f7eee9] focus:outline-none focus:ring-2 focus:ring-[#c85d38]/30 focus:border-[#c85d38]"
                  />
                  <User className="w-4 h-4 text-[#786b65] dark:text-[#a89991] absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#481e0b] dark:text-[#f7eee9]">
                    Security Passcode / PIN
                  </label>
                  <span className="text-[11px] text-[#786b65] dark:text-[#a89991]">
                    Default PIN: <strong className="text-[#a84724] dark:text-[#f38360]">1234</strong>
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    required
                    value={loginPin}
                    onChange={(e) => setLoginPin(e.target.value)}
                    placeholder="Enter 4-digit PIN (e.g. 1234)"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-[#d9c9c2] dark:border-[#42332a] bg-white dark:bg-[#251d19] text-sm text-[#481e0b] dark:text-[#f7eee9] focus:outline-none focus:ring-2 focus:ring-[#c85d38]/30 focus:border-[#c85d38]"
                  />
                  <Lock className="w-4 h-4 text-[#786b65] dark:text-[#a89991] absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-3 text-[#786b65] dark:text-[#a89991] hover:text-[#481e0b]"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-6 rounded-full bg-[#c85d38] hover:bg-[#a84724] text-white font-bold text-sm shadow-[0_8px_18px_rgba(168,71,36,0.25)] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to Patient Portal</span>
              </button>

              <div className="flex items-center justify-between text-xs pt-2">
                <button
                  type="button"
                  onClick={handleOpenOtpModal}
                  className="text-[#176541] dark:text-[#34d399] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Forgot PIN? / Login via SMS OTP</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAuthTab('register')}
                  className="text-[#a84724] dark:text-[#f38360] font-semibold hover:underline cursor-pointer"
                >
                  New Patient? Register
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: NEW PATIENT REGISTRATION */}
          {authTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5 animate-in fade-in duration-150">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#481e0b] dark:text-[#f7eee9] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Anjali Gupta"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#d9c9c2] dark:border-[#42332a] bg-white dark:bg-[#251d19] text-xs text-[#481e0b] dark:text-[#f7eee9] focus:outline-none focus:ring-2 focus:ring-[#c85d38]/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#481e0b] dark:text-[#f7eee9] mb-1">
                    10-Digit Mobile Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="98XXXXXXXX"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#d9c9c2] dark:border-[#42332a] bg-white dark:bg-[#251d19] text-xs text-[#481e0b] dark:text-[#f7eee9] focus:outline-none focus:ring-2 focus:ring-[#c85d38]/30"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#481e0b] dark:text-[#f7eee9] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="anjali@example.com"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#d9c9c2] dark:border-[#42332a] bg-white dark:bg-[#251d19] text-xs text-[#481e0b] dark:text-[#f7eee9] focus:outline-none focus:ring-2 focus:ring-[#c85d38]/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#481e0b] dark:text-[#f7eee9] mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={regDob}
                    onChange={(e) => setRegDob(e.target.value)}
                    className="w-full px-2 py-2 rounded-lg border border-[#d9c9c2] dark:border-[#42332a] bg-white dark:bg-[#251d19] text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#481e0b] dark:text-[#f7eee9] mb-1">
                    Gender
                  </label>
                  <select
                    value={regGender}
                    onChange={(e) => setRegGender(e.target.value)}
                    className="w-full px-2 py-2 rounded-lg border border-[#d9c9c2] dark:border-[#42332a] bg-white dark:bg-[#251d19] text-xs"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#481e0b] dark:text-[#f7eee9] mb-1">
                    Blood Group
                  </label>
                  <select
                    value={regBloodGroup}
                    onChange={(e) => setRegBloodGroup(e.target.value)}
                    className="w-full px-2 py-2 rounded-lg border border-[#d9c9c2] dark:border-[#42332a] bg-white dark:bg-[#251d19] text-xs"
                  >
                    <option value="A+">A+</option>
                    <option value="B+">B+</option>
                    <option value="O+">O+</option>
                    <option value="AB+">AB+</option>
                    <option value="A-">A-</option>
                    <option value="B-">B-</option>
                    <option value="O-">O-</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#481e0b] dark:text-[#f7eee9] mb-1">
                  Create 4-Digit Security Passcode/PIN *
                </label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={regPin}
                  onChange={(e) => setRegPin(e.target.value)}
                  placeholder="e.g. 1234"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#d9c9c2] dark:border-[#42332a] bg-white dark:bg-[#251d19] text-xs text-[#481e0b] dark:text-[#f7eee9] focus:outline-none focus:ring-2 focus:ring-[#c85d38]/30"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-6 rounded-full bg-[#176541] hover:bg-[#124d32] text-white font-bold text-sm shadow-[0_8px_18px_rgba(23,101,65,0.25)] transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Patient Account & View Portal</span>
              </button>
            </form>
          )}

          {/* TAB 3: 1-CLICK DEMO PROFILES */}
          {authTab === 'demo' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <span className="text-[11px] font-bold text-[#786b65] dark:text-[#a89991] uppercase tracking-wider block">
                Instant One-Click Verified Records:
              </span>

              <div className="space-y-2">
                <div className="w-full p-3 rounded-2xl border border-[#dcc9bf] dark:border-[#42332a] bg-[#fdfaf8] dark:bg-[#251d19] hover:border-[#c85d38] text-left transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#c85d38] to-[#a84724] text-white font-bold text-xs flex items-center justify-center shrink-0">
                      RS
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-[#481e0b] dark:text-[#f7eee9]">
                          Rahul Sharma (35, Male · B+)
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                          <ScanFace className="w-2.5 h-2.5" /> FaceID Active
                        </span>
                      </div>
                      <div className="text-[11px] text-[#786b65] dark:text-[#a89991]">
                        Upcoming Visit with Dr. Misbah Ambar · Rhinitis & Homeopathy Rx
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleBiometricLoginTrigger('9876543210')}
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#edf7f0] text-[#176541] hover:bg-[#176541] hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                      title="1-Tap Sign-in with simulated FaceID"
                    >
                      <ScanFace className="w-3 h-3" />
                      <span>FaceID</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickSelect('9876543210', '1234')}
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-[#dcc9bf] dark:border-[#42332a] text-[#56473f] dark:text-[#e8dcd5] hover:bg-[#c85d38] hover:text-white hover:border-[#c85d38] transition-colors cursor-pointer"
                    >
                      PIN (1234)
                    </button>
                  </div>
                </div>

                <div className="w-full p-3 rounded-2xl border border-[#dcc9bf] dark:border-[#42332a] bg-[#fdfaf8] dark:bg-[#251d19] hover:border-[#c85d38] text-left transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#176541] to-[#124d32] text-white font-bold text-xs flex items-center justify-center shrink-0">
                      PV
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-[#481e0b] dark:text-[#f7eee9]">
                          Pooja Verma (31, Female · O+)
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#f3ede8] dark:bg-[#2d221c] text-[#786b65] dark:text-[#a89991]">
                          Biometrics Disabled
                        </span>
                      </div>
                      <div className="text-[11px] text-[#786b65] dark:text-[#a89991]">
                        Hypertension Monitoring, Lab Trends & CoQ10 Prescription
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleQuickSelect('9123456780', '1234')}
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#edf7f0] text-[#176541] hover:bg-[#176541] hover:text-white transition-colors cursor-pointer"
                    >
                      Login (1234)
                    </button>
                  </div>
                </div>

                <div className="w-full p-3 rounded-2xl border border-[#dcc9bf] dark:border-[#42332a] bg-[#fdfaf8] dark:bg-[#251d19] hover:border-[#c85d38] text-left transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#234c91] to-[#17253b] text-white font-bold text-xs flex items-center justify-center shrink-0">
                      AS
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-[#481e0b] dark:text-[#f7eee9]">
                          Amit Sen (43, Male · A+)
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#f3ede8] dark:bg-[#2d221c] text-[#786b65] dark:text-[#a89991]">
                          Biometrics Disabled
                        </span>
                      </div>
                      <div className="text-[11px] text-[#786b65] dark:text-[#a89991]">
                        Routine Health Baseline & Orthopedic Consultation Records
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleQuickSelect('9811223344', '1234')}
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#edf7f0] text-[#176541] hover:bg-[#176541] hover:text-white transition-colors cursor-pointer"
                    >
                      Login (1234)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
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

                  {/* Immediate Visual Indicator for Biometric Status */}
                  {biometricStatus?.enabled ? (
                    <button
                      type="button"
                      onClick={() => setShowBiometricSettings(true)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] shadow-2xs hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all cursor-pointer group"
                      title="Biometric Protection is ACTIVE on this device. Click to configure FaceID/TouchID settings."
                    >
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      {biometricStatus.type === 'fingerprint' ? (
                        <Fingerprint className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <ScanFace className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      )}
                      <span>
                        {biometricStatus.type === 'fingerprint'
                          ? 'TouchID Active'
                          : biometricStatus.type === 'both'
                            ? 'FaceID + TouchID Active'
                            : 'FaceID Active'}
                      </span>
                      <span className="text-[9px] text-emerald-700/70 dark:text-emerald-400/70 font-normal group-hover:underline">
                        · Settings
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowBiometricSettings(true)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#fdf2ec] dark:bg-[#281c16] border border-[#f2d0c2] dark:border-[#4d291a] text-[#a84724] dark:text-[#f38360] font-bold text-[10px] hover:bg-[#fae6dc] dark:hover:bg-[#34211a] transition-all cursor-pointer group"
                      title="Biometric Authentication is currently disabled. Click to enable FaceID or TouchID."
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-[#c85d38]" />
                      <span>Biometrics Disabled</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-[#c85d38] text-white font-bold text-[9px] uppercase tracking-wider group-hover:scale-105 transition-transform">
                        Enable
                      </span>
                    </button>
                  )}
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

            <div className="flex items-center gap-2 self-end md:self-center shrink-0 flex-wrap justify-end">
              <button
                onClick={handleDownloadHealthSummary}
                disabled={isDownloadingSummary}
                className="px-4 py-2 rounded-full bg-[#176541] hover:bg-[#124d32] text-white text-xs font-bold shadow-[0_4px_14px_rgba(23,101,65,0.28)] transition-all cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-75"
                title="Download Comprehensive Health Summary PDF (History, Labs & Prescriptions)"
              >
                {isDownloadingSummary ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>{isDownloadingSummary ? 'Generating PDF...' : 'Download Health Summary'}</span>
              </button>

              <button
                onClick={() => onNavigate('Diagnostics')}
                className="px-3.5 py-2 rounded-full border border-[#cfe1d5] dark:border-[#2b4434] bg-[#edf7f0] dark:bg-[#1a2d22] hover:bg-[#dceee2] dark:hover:bg-[#233c2e] text-[#176541] dark:text-[#34d399] text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>Book Lab Tests</span>
              </button>

              <button
                onClick={() => onNavigate('Telehealth')}
                className="px-3.5 py-2 rounded-full border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900 text-sky-700 dark:text-sky-300 text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Virtual Visit</span>
              </button>

              <button
                onClick={() => onNavigate('Appointments')}
                className="px-4 py-2 rounded-full bg-[#c85d38] hover:bg-[#a84724] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Book Appointment</span>
              </button>

              <button
                onClick={() => setShowBiometricSettings(true)}
                className="px-3.5 py-2 rounded-full border border-[#dcc9bf] dark:border-[#42332a] bg-white dark:bg-[#251d19] hover:bg-[#fff5f0] dark:hover:bg-[#2e211b] hover:border-[#c85d38] text-[#56473f] dark:text-[#e8dcd5] text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                title="Configure FaceID and Fingerprint biometric authentication"
              >
                {biometricStatus?.enabled ? (
                  biometricStatus.type === 'fingerprint' ? (
                    <Fingerprint className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <ScanFace className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  )
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-[#c85d38]" />
                )}
                <span>Biometric Settings</span>
              </button>

              <button
                onClick={handleLogout}
                className="px-3.5 py-2 rounded-full border border-[#dcc9bf] dark:border-[#42332a] bg-white dark:bg-[#251d19] hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 text-[#786b65] dark:text-[#a89991] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                title="Sign out of patient portal"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Sub-navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-[#d5e5db] dark:border-[#382b24] pb-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveSection('overview')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSection === 'overview'
                  ? 'bg-[#176541] text-white shadow-xs'
                  : 'bg-white dark:bg-[#1e1714] text-[#56473f] dark:text-[#e8dcd5] border border-[#dcc9bf] dark:border-[#3d2e26] hover:border-[#176541]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>Health Overview (AI)</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </button>

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
              onClick={() => setActiveSection('trends')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSection === 'trends'
                  ? 'bg-[#c85d38] text-white shadow-xs'
                  : 'bg-white dark:bg-[#1e1714] text-[#56473f] dark:text-[#e8dcd5] border border-[#dcc9bf] dark:border-[#3d2e26] hover:border-[#c85d38]'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span>Health & Lab Trends</span>
              <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-center text-[10px] leading-4 font-bold">
                {activeProfile.healthTrends?.length || 0}
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

          {/* Section: AI PERSONAL HEALTH ASSISTANT HEALTH OVERVIEW WIDGET */}
          {activeSection === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <HealthOverviewWidget
                profile={activeProfile}
                onNavigate={onNavigate}
                onAskAI={() => onNavigate('Assistant')}
              />
            </div>
          )}

          {/* Section 0: UPCOMING APPOINTMENTS & LIVE COUNTDOWN TIMER */}
          {activeSection === 'upcoming' && (
            <div className="space-y-6">
              {/* Comprehensive Health Summary Download Card */}
              <div className="p-5 md:p-6 rounded-3xl bg-gradient-to-br from-[#fcf7f4] via-[#f7eee9] to-[#eeddd4] dark:from-[#241a16] dark:via-[#1e1512] dark:to-[#17100d] border border-[#e5d3c8] dark:border-[#3d2e26] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#176541] text-white flex items-center justify-center shrink-0 shadow-md">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-heading font-bold text-base md:text-lg text-[#481e0b] dark:text-[#f7eee9]">
                        Comprehensive Patient Health Summary (PDF)
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] border border-[#cfe1d5] dark:border-[#2b4434]">
                        Official EHR Export
                      </span>
                    </div>
                    <p className="text-xs text-[#685a53] dark:text-[#c4b5ae] max-w-xl leading-relaxed">
                      Download a printable, verified PDF summary report consolidating your medical history ({activeProfile.medicalHistory.length} visits), recent diagnostic lab results ({activeProfile.labResults.length} tests), and active medication prescriptions ({activeProfile.prescriptions.length} items).
                    </p>
                    <div className="flex items-center gap-4 text-[11px] text-[#786b65] dark:text-[#a89991] pt-0.5 flex-wrap">
                      <span className="flex items-center gap-1 font-medium">
                        <Check className="w-3.5 h-3.5 text-[#176541]" /> Complete Consultation Notes
                      </span>
                      <span className="flex items-center gap-1 font-medium">
                        <Check className="w-3.5 h-3.5 text-[#176541]" /> Clinical Lab Values & Ranges
                      </span>
                      <span className="flex items-center gap-1 font-medium">
                        <Check className="w-3.5 h-3.5 text-[#176541]" /> Active Rx Schedules & Dosage
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadHealthSummary}
                  disabled={isDownloadingSummary}
                  className="px-5 py-3 rounded-full bg-[#176541] hover:bg-[#124d32] text-white text-xs font-bold shadow-[0_6px_18px_rgba(23,101,65,0.28)] transition-all cursor-pointer flex items-center gap-2 shrink-0 self-stretch md:self-center justify-center disabled:opacity-75"
                >
                  {isDownloadingSummary ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>{isDownloadingSummary ? 'Generating PDF Report...' : 'Download Health Summary (PDF)'}</span>
                </button>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-heading font-bold text-lg text-[#481e0b] dark:text-[#f7eee9]">
                    Upcoming Appointments & Live Countdown
                  </h3>
                  <p className="text-xs text-[#786b65] dark:text-[#a89991]">
                    Track your upcoming consultations with real-time countdowns and browser reminders.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {upcomingBookings.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedQrBooking(upcomingBookings[0])}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#176541] bg-[#edf7f0] dark:bg-[#1a2d22] hover:bg-[#dceee2] dark:hover:bg-[#233c2e] text-[#176541] dark:text-[#34d399] text-xs font-bold shadow-2xs transition-all cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Check-In QR Pass</span>
                    </button>
                  )}
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
                            <div className="flex items-center gap-2 flex-wrap">
                              {checkedInBookingIds.has(b.booking_id) ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] flex items-center gap-1 border border-emerald-300 dark:border-emerald-800">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                  Checked In · Kiosk Confirmed
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full bg-[#e0f3e8] dark:bg-[#1a2d22] text-[#16633b] dark:text-[#34d399] font-bold text-[10px]">
                                  Confirmed Consultation
                                </span>
                              )}
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

                          {/* Action Buttons: Check-In QR Pass & Remind Me */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setSelectedQrBooking(b)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-[#176541] hover:bg-[#124d32] text-white shadow-[0_4px_14px_rgba(23,101,65,0.25)] transition-all cursor-pointer"
                              title="Generate and view fast-track Check-In QR Code for clinic arrival"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              <span>{checkedInBookingIds.has(b.booking_id) ? 'View QR Pass' : 'Check-In QR Pass'}</span>
                            </button>

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
                                  <span>Remind Me</span>
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

                        {/* INLINE CONTACTLESS ARRIVAL QR CARD */}
                        <AppointmentQRCard
                          booking={b}
                          isCheckedIn={checkedInBookingIds.has(b.booking_id)}
                          onCheckIn={(bookingId) => {
                            setCheckedInBookingIds((prev) => new Set([...prev, bookingId]));
                            setNotificationStatus({
                              type: 'success',
                              message: `Fast-track arrival verified! You are officially checked in for appointment ${bookingId}.`,
                            });
                            setTimeout(() => setNotificationStatus(null), 5000);
                          }}
                          onOpenModal={(booking) => setSelectedQrBooking(booking)}
                        />

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

                        {/* Arrival Fast-Track QR Callout */}
                        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#edf7f0] to-[#f4fbf6] dark:from-[#1a2d22] dark:to-[#16231b] border border-[#cfe1d5] dark:border-[#2b4434] flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-2.5 text-xs text-[#2a5038] dark:text-[#a3d6b3]">
                            <div className="w-8 h-8 rounded-xl bg-[#176541] text-white flex items-center justify-center shrink-0 shadow-2xs">
                              <QrCode className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-[#176541] dark:text-[#34d399]">
                                Fast-Track Reception Check-In
                              </div>
                              <p className="text-[11px] text-[#557864] dark:text-[#9fc7ad]">
                                Scan this appointment's QR code at the clinic kiosk to skip the reception line.
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedQrBooking(b)}
                            className="px-3.5 py-1.5 rounded-full bg-[#176541] hover:bg-[#124d32] text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <span>Open QR Pass</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-heading font-bold text-lg text-[#481e0b] dark:text-[#f7eee9]">
                    Clinical Consultations & Visit Timeline
                  </h3>
                  <span className="text-xs text-[#786b65] dark:text-[#a89991]">
                    {activeProfile.medicalHistory.length} visit record(s) on file
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadHealthSummary}
                  disabled={isDownloadingSummary}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#176541] hover:bg-[#124d32] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-75"
                  title="Download complete medical history and summary report"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Health Summary (PDF)</span>
                </button>
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

                {/* Filter Pills & Download CTA */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={handleDownloadHealthSummary}
                    disabled={isDownloadingSummary}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#176541] hover:bg-[#124d32] text-white shadow-xs transition-colors cursor-pointer mr-1 disabled:opacity-75"
                    title="Download complete consolidated Health Summary report"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Summary PDF</span>
                  </button>

                  <button
                    onClick={() => setActiveSection('trends')}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] border border-[#cfe1d5] dark:border-[#2b4434] hover:bg-[#dceee2] dark:hover:bg-[#233c2e] transition-colors cursor-pointer mr-1"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>View Trends Chart</span>
                  </button>

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
                            type="button"
                            onClick={() => handleDownloadLabPDF(lr)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#dcc9bf] dark:border-[#42332a] bg-white dark:bg-[#251d19] hover:bg-[#edf7f0] hover:border-[#176541] hover:text-[#176541] text-xs font-semibold text-[#56473f] dark:text-[#e8dcd5] transition-colors cursor-pointer shrink-0"
                            title={`Download official PDF report for ${lr.testName}`}
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
 
          {/* Section: Historical Health & Lab Trends Chart */}
          {activeSection === 'trends' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-heading font-bold text-lg text-[#481e0b] dark:text-[#f7eee9]">
                    Longitudinal Vitals & Lab Trends Visualizer
                  </h3>
                  <p className="text-xs text-[#786b65] dark:text-[#a89991]">
                    Interactive Recharts trend lines tracking blood pressure, cholesterol panels, glucose, and heart rate over time.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveSection('labs')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#dcc9bf] dark:border-[#42332a] bg-white dark:bg-[#251d19] hover:bg-[#edf7f0] text-xs font-semibold text-[#56473f] dark:text-[#e8dcd5] transition-colors cursor-pointer"
                  >
                    <FlaskConical className="w-3.5 h-3.5 text-[#176541] dark:text-[#34d399]" />
                    <span>View Pathology Slips</span>
                  </button>
                </div>
              </div>

              <LabTrendsChart
                initialData={activeProfile.healthTrends || []}
                patientName={activeProfile.name}
              />
            </div>
          )}

          {/* Section 3: Dedicated Active and Past Prescriptions Management */}
          {activeSection === 'prescriptions' && (
            <PrescriptionList
              prescriptions={activeProfile.prescriptions}
              patientProfile={activeProfile}
              onNavigateAppointments={() => onNavigate('Appointments')}
            />
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

      {/* OTP Verification Modal */}
      {isOtpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0e8e3] dark:border-[#33251e]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-[#481e0b] dark:text-[#f7eee9]">
                    One-Time Passcode (OTP)
                  </h3>
                  <p className="text-xs text-[#786b65] dark:text-[#a89991]">
                    Instant passwordless patient sign in
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOtpModalOpen(false)}
                className="text-[#786b65] hover:text-[#481e0b] p-1 rounded-full hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            {otpNotice && (
              <div className="p-3 rounded-xl bg-[#edf7f0] dark:bg-[#1a2d22] border border-[#cfe1d5] dark:border-[#2b4434] text-xs text-[#176541] dark:text-[#34d399]">
                {otpNotice}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#481e0b] dark:text-[#f7eee9] mb-1">
                  Registered Mobile Phone
                </label>
                <input
                  type="tel"
                  required
                  value={otpPhone}
                  onChange={(e) => setOtpPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9c9c2] dark:border-[#42332a] bg-white dark:bg-[#251d19] text-xs text-[#481e0b] dark:text-[#f7eee9]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#481e0b] dark:text-[#f7eee9]">
                    6-Digit Verification Code
                  </label>
                  <span className="text-[11px] text-[#176541] dark:text-[#34d399] font-bold">
                    Demo Code: 482910
                  </span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9c9c2] dark:border-[#42332a] bg-[#fdfaf8] dark:bg-[#251d19] text-center font-mono font-bold text-lg tracking-widest text-[#481e0b] dark:text-[#f7eee9] focus:outline-none focus:ring-2 focus:ring-[#176541]/30"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOtpModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-[#dcc9bf] dark:border-[#42332a] text-xs font-semibold text-[#786b65]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#176541] hover:bg-[#124d32] text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Verify & Sign In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Biometric Settings Modal */}
      {activeProfile && (
        <BiometricSettingsModal
          isOpen={showBiometricSettings}
          phone={activeProfile.phone}
          patientName={activeProfile.name}
          onClose={() => setShowBiometricSettings(false)}
          onUpdate={(updated) => {
            setBiometricStatus(updated);
            setNotificationStatus({
              type: 'success',
              message: updated.enabled
                ? `Biometric authentication (${updated.type === 'faceId' ? 'FaceID' : updated.type === 'fingerprint' ? 'TouchID' : 'FaceID + TouchID'}) is now ACTIVE for ${activeProfile.name}!`
                : `Biometric authentication has been disabled for ${activeProfile.name}.`,
            });
            setTimeout(() => setNotificationStatus(null), 4000);
          }}
        />
      )}

      {/* Biometric Scanning Simulation Modal (for Login or Testing) */}
      <BiometricModal
        isOpen={isBiometricScanning}
        mode={biometricScanMode}
        biometricType={
          biometricScanMode === 'login'
            ? getBiometricSettings(biometricScanTargetPhone).type
            : biometricStatus?.type || 'faceId'
        }
        patientName={
          biometricScanMode === 'login'
            ? getOrCreatePatientProfile(biometricScanTargetPhone).name
            : activeProfile?.name || 'Patient'
        }
        onSuccess={handleBiometricLoginSuccess}
        onCancel={() => setIsBiometricScanning(false)}
      />

      {/* Check-In QR Pass Modal for Streamlined Clinic Arrival */}
      <CheckInQRModal
        isOpen={!!selectedQrBooking}
        booking={selectedQrBooking}
        onClose={() => setSelectedQrBooking(null)}
        onCheckInSuccess={(bookingId) => {
          setCheckedInBookingIds((prev) => new Set([...prev, bookingId]));
          setNotificationStatus({
            type: 'success',
            message: `Fast-track arrival verified! You are officially checked in for appointment ${bookingId}. Please proceed to the clinic waiting lounge.`,
          });
          setTimeout(() => setNotificationStatus(null), 5000);
        }}
      />
    </div>
  );
};
