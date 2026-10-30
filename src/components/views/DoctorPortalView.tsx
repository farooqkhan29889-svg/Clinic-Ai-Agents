import React, { useState, useEffect } from 'react';
import {
  Booking,
  BookingStatus,
  NavTab,
  DoctorUser,
  DoctorSession,
  PatientProfile,
  Medication,
} from '../../types/clinic';
import { DOCTORS_SEED } from '../../data/clinicData';
import {
  getStoredBookings,
  formatDayLabel,
  getUpcomingDays,
  processDueReminders,
} from '../../utils/storage';
import {
  DOCTOR_ACCOUNTS,
  getActiveDoctorSession,
  setActiveDoctorSession,
  loginDoctor,
  getStoredDoctorStatuses,
  setStoredDoctorStatus,
  updateBookingByDoctor,
  issuePrescriptionFromDoctor,
} from '../../utils/authStorage';
import { getOrCreatePatientProfile } from '../../data/patientPortalData';
import {
  Lock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Bell,
  LogOut,
  Filter,
  Search,
  Eye,
  EyeOff,
  Stethoscope,
  ShieldCheck,
  Calendar,
  Clock,
  User,
  FileText,
  Pill,
  Plus,
  Check,
  Send,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  ChevronRight,
  ClipboardList,
  AlertTriangle,
  FlaskConical,
  Video,
} from 'lucide-react';

interface DoctorPortalViewProps {
  onNavigate: (tab: NavTab, doctorId?: number) => void;
}

export const DoctorPortalView: React.FC<DoctorPortalViewProps> = ({ onNavigate }) => {
  // Doctor Auth state
  const [activeSession, setActiveSession] = useState<DoctorSession | null>(() => {
    return getActiveDoctorSession();
  });
  const [currentDoctor, setCurrentDoctor] = useState<DoctorUser | null>(() => {
    const session = getActiveDoctorSession();
    if (session) {
      return DOCTOR_ACCOUNTS.find((d) => d.id === session.doctorId) || DOCTOR_ACCOUNTS[0];
    }
    return null;
  });

  // Login form state
  const [selectedDocId, setSelectedDocId] = useState<number>(DOCTOR_ACCOUNTS[0].id);
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Dashboard appointments state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

  // Status & duty state
  const [dutyStatus, setDutyStatus] = useState<'On Duty' | 'In Consultation' | 'Off Duty'>('On Duty');
  const [notificationMsg, setNotificationMsg] = useState<{
    type: 'success' | 'info' | 'error';
    text: string;
  } | null>(null);

  // Clinical Consultation Modal / Drawer state
  const [activeConsultationBooking, setActiveConsultationBooking] = useState<Booking | null>(null);
  const [consultDiagnosis, setConsultDiagnosis] = useState<string>('');
  const [consultNotes, setConsultNotes] = useState<string>('');

  // Prescription Drawer state
  const [activeRxBooking, setActiveRxBooking] = useState<Booking | null>(null);
  const [rxMedName, setRxMedName] = useState<string>('');
  const [rxDosage, setRxDosage] = useState<string>('1 Tablet');
  const [rxFrequency, setRxFrequency] = useState<string>('Twice daily (BD)');
  const [rxDuration, setRxDuration] = useState<string>('5 days');
  const [rxTiming, setRxTiming] = useState<string>('After meals');
  const [rxInstructions, setRxInstructions] = useState<string>('');

  // Patient File Preview state
  const [viewingPatientProfile, setViewingPatientProfile] = useState<PatientProfile | null>(null);

  const upcomingDays = getUpcomingDays(14);
  const todayIso = new Date().toISOString().split('T')[0];

  const reloadBookings = () => {
    setBookings(getStoredBookings());
  };

  useEffect(() => {
    reloadBookings();
  }, [activeSession]);

  useEffect(() => {
    if (currentDoctor) {
      const statuses = getStoredDoctorStatuses();
      setDutyStatus(statuses[currentDoctor.id] || 'On Duty');
    }
  }, [currentDoctor]);

  // Handle Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const result = loginDoctor(selectedDocId, password);
    if (result.success && result.doctor && result.session) {
      setActiveSession(result.session);
      setCurrentDoctor(result.doctor);
      setPassword('');
      setNotificationMsg({
        type: 'success',
        text: `Doctor session verified. Welcome, ${result.doctor.name}!`,
      });
      setTimeout(() => setNotificationMsg(null), 4000);
    } else {
      setAuthError(result.error || 'Authentication failed. Please verify credentials.');
    }
  };

  // Quick 1-Click Login for Demo Doctors
  const handleQuickDoctorLogin = (docId: number) => {
    setSelectedDocId(docId);
    setAuthError(null);
    const result = loginDoctor(docId, '1234');
    if (result.success && result.doctor && result.session) {
      setActiveSession(result.session);
      setCurrentDoctor(result.doctor);
      setPassword('');
      setNotificationMsg({
        type: 'success',
        text: `Logged in as ${result.doctor.name} (${result.doctor.spec})`,
      });
      setTimeout(() => setNotificationMsg(null), 4000);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    setActiveDoctorSession(null);
    setActiveSession(null);
    setCurrentDoctor(null);
    setPassword('');
    setAuthError(null);
    setActiveConsultationBooking(null);
    setActiveRxBooking(null);
    setViewingPatientProfile(null);
  };

  // Update Doctor Duty Status
  const handleDutyChange = (status: 'On Duty' | 'In Consultation' | 'Off Duty') => {
    if (!currentDoctor) return;
    setDutyStatus(status);
    setStoredDoctorStatus(currentDoctor.id, status);
    setNotificationMsg({
      type: 'info',
      text: `Clinical status updated to "${status}". Patients and clinic desk can see this status.`,
    });
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  // Update Booking Status
  const handleStatusChange = (bookingId: string, newStatus: BookingStatus) => {
    if (!currentDoctor) return;
    const res = updateBookingByDoctor({
      bookingId,
      doctorId: currentDoctor.id,
      newStatus,
    });

    if (res.success) {
      reloadBookings();
      setNotificationMsg({
        type: 'success',
        text: `Appointment ${bookingId} updated to "${newStatus}".`,
      });
      setTimeout(() => setNotificationMsg(null), 3000);
    } else {
      setNotificationMsg({
        type: 'error',
        text: res.error || 'Could not update status',
      });
      setTimeout(() => setNotificationMsg(null), 4000);
    }
  };

  // Open Clinical Consultation modal
  const handleOpenConsultation = (b: Booking) => {
    setActiveConsultationBooking(b);
    setConsultDiagnosis(b.diagnosis || '');
    setConsultNotes(b.clinical_notes || '');
  };

  // Save Clinical Consultation & Mark Completed
  const handleSaveConsultation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDoctor || !activeConsultationBooking) return;

    const res = updateBookingByDoctor({
      bookingId: activeConsultationBooking.booking_id,
      doctorId: currentDoctor.id,
      newStatus: 'Completed',
      clinicalNotes: consultNotes,
      diagnosis: consultDiagnosis,
    });

    if (res.success) {
      reloadBookings();
      setActiveConsultationBooking(null);
      setNotificationMsg({
        type: 'success',
        text: `Clinical consultation notes recorded for ${activeConsultationBooking.patient_name}. Saved to patient record.`,
      });
      setTimeout(() => setNotificationMsg(null), 4000);
    }
  };

  // Open e-Prescription modal
  const handleOpenRx = (b: Booking) => {
    setActiveRxBooking(b);
    setRxMedName('');
    setRxInstructions('Take after breakfast and dinner with warm water.');
  };

  // Submit Prescription
  const handleIssueRx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDoctor || !activeRxBooking || !rxMedName.trim()) return;

    const res = issuePrescriptionFromDoctor({
      bookingId: activeRxBooking.booking_id,
      doctorId: currentDoctor.id,
      patientPhone: activeRxBooking.phone,
      medication: {
        name: rxMedName.trim(),
        dosage: rxDosage,
        frequency: rxFrequency,
        duration: rxDuration,
        timing: rxTiming,
        instructions: rxInstructions,
      },
      doctorNotes: `Prescribed by ${currentDoctor.name} for appointment ${activeRxBooking.booking_id}.`,
    });

    if (res.success) {
      reloadBookings();
      setActiveRxBooking(null);
      setNotificationMsg({
        type: 'success',
        text: `Prescription for "${rxMedName}" issued! Transferred to ${activeRxBooking.patient_name}'s Patient Portal.`,
      });
      setTimeout(() => setNotificationMsg(null), 4000);
    }
  };

  // Open Patient File
  const handleViewPatientFile = (phone: string, patientName: string) => {
    const profile = getOrCreatePatientProfile(phone, patientName);
    setViewingPatientProfile(profile);
  };

  // Simulate Instant Notification to Patient
  const handleSendPatientNotice = (b: Booking) => {
    setNotificationMsg({
      type: 'success',
      text: `SMS & App Notification sent to ${b.patient_name} (+91 ${b.phone}): "Dr. ${currentDoctor?.name} is ready for your consultation at ${currentDoctor?.cabinNumber}".`,
    });
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  // Trigger batch reminders
  const handleProcessReminders = () => {
    const report = processDueReminders();
    reloadBookings();
    setNotificationMsg({
      type: 'info',
      text: report.message,
    });
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  // ================= RENDER LOGIN SCREEN =================
  if (!activeSession || !currentDoctor) {
    const highlightedDoc = DOCTOR_ACCOUNTS.find((d) => d.id === selectedDocId) || DOCTOR_ACCOUNTS[0];

    return (
      <div className="space-y-8 max-w-2xl mx-auto py-2">
        {/* Doctor Security Banner */}
        <section className="relative overflow-hidden p-6 md:p-8 rounded-3xl bg-gradient-to-r from-[#176541] via-[#124d32] to-[#0c3120] text-white shadow-[0_18px_38px_rgba(23,101,65,0.22)]">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 text-[11px] font-bold tracking-wider text-[#a7f3d0] mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-[#34d399]" />
              <span>LICENSED MEDICAL PRACTITIONERS ONLY</span>
            </div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-white mb-2">
              Doctor Authentication & Clinical Portal
            </h1>
            <p className="text-xs md:text-sm text-[#d1fae5] leading-relaxed">
              Sign in with your verified practitioner credentials to view assigned patient appointments,
              write clinical consultation notes, and issue digital prescriptions.
            </p>
          </div>

          <div className="absolute -top-16 -right-16 w-60 h-60 rounded-full border border-white/15 pointer-events-none" />
        </section>

        {/* Doctor Login Form Card */}
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-[0_8px_28px_rgba(72,30,11,0.06)] dark:shadow-[0_8px_28px_rgba(0,0,0,0.3)] space-y-6 transition-colors">
          <div className="flex items-center gap-3 pb-3 border-b border-[#f0e8e3] dark:border-[#33251e]">
            <div className="w-10 h-10 rounded-xl bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] flex items-center justify-center shrink-0">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading text-base font-bold text-[#481e0b] dark:text-[#f7eee9]">
                Doctor Credential Sign In
              </h2>
              <p className="text-xs text-[#786b65] dark:text-[#a89991]">
                Select your profile from the clinic directory or authenticate via PIN
              </p>
            </div>
          </div>

          {authError && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#481e0b] dark:text-[#f7eee9] mb-1.5">
                Select Practicing Doctor
              </label>
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#d9c9c2] dark:border-[#42332a] bg-white dark:bg-[#251d19] text-sm text-[#481e0b] dark:text-[#f7eee9] focus:outline-none focus:ring-2 focus:ring-[#176541]/30 focus:border-[#176541]"
              >
                {DOCTOR_ACCOUNTS.map((d) => (
                  <option key={d.id} value={d.id} className="dark:bg-[#251d19]">
                    {d.name} — {d.spec} ({d.cabinNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#481e0b] dark:text-[#f7eee9]">
                  Doctor Passcode / PIN
                </label>
                <span className="text-[11px] text-[#786b65] dark:text-[#a89991]">
                  Demo PIN: <strong className="text-[#176541] dark:text-[#34d399]">1234</strong>
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter doctor security PIN (e.g. 1234)"
                  className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-[#d9c9c2] dark:border-[#42332a] bg-white dark:bg-[#251d19] text-sm text-[#481e0b] dark:text-[#f7eee9] focus:outline-none focus:ring-2 focus:ring-[#176541]/30 focus:border-[#176541]"
                />
                <Lock className="w-4 h-4 text-[#786b65] dark:text-[#a89991] absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[#786b65] dark:text-[#a89991] hover:text-[#481e0b]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="mt-2 text-[11px] text-[#786b65] dark:text-[#a89991] bg-[#fdfaf8] dark:bg-[#251d19] p-2.5 rounded-md border border-[#eee4df] dark:border-[#3d2e26]">
                Practitioner ID: <strong>{highlightedDoc.licenseNumber}</strong> · Clinic Cabin:{' '}
                <strong>{highlightedDoc.cabinNumber}</strong>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-6 rounded-full bg-[#176541] hover:bg-[#124d32] text-white font-bold text-sm shadow-[0_8px_18px_rgba(23,101,65,0.25)] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Stethoscope className="w-4 h-4" />
              <span>Authenticate Doctor & Open Appointments</span>
            </button>
          </form>

          {/* Quick One-Click Doctor Access for Evaluation */}
          <div className="pt-4 border-t border-[#f0e8e3] dark:border-[#33251e] space-y-3">
            <span className="text-[11px] font-bold text-[#786b65] dark:text-[#a89991] uppercase tracking-wider block">
              1-Click Verified Doctor Access:
            </span>
            <div className="grid grid-cols-1 gap-2.5">
              {DOCTOR_ACCOUNTS.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => handleQuickDoctorLogin(doc.id)}
                  className="p-3 rounded-2xl border border-[#dcc9bf] dark:border-[#42332a] bg-[#fdfaf8] dark:bg-[#251d19] hover:border-[#176541] dark:hover:border-[#34d399] hover:bg-[#edf7f0]/60 dark:hover:bg-[#1a2d22]/50 text-left transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] font-bold flex items-center justify-center text-xs group-hover:scale-105 transition-transform">
                      {doc.name.replace('Dr. ', '')[0]}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-[#481e0b] dark:text-[#f7eee9]">
                        {doc.name}
                      </div>
                      <div className="text-[11px] text-[#786b65] dark:text-[#a89991]">
                        {doc.spec} · {doc.cabinNumber}
                      </div>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-white dark:bg-[#1e1714] border border-[#dcc9bf] dark:border-[#42332a] text-[#176541] dark:text-[#34d399] group-hover:bg-[#176541] group-hover:text-white transition-colors">
                    Log in as Doctor
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================= LOGGED IN DOCTOR DASHBOARD =================
  const doctorBookings = bookings.filter((b) => b.doctor_id === currentDoctor.id);

  // Counts
  const countToday = doctorBookings.filter(
    (b) => b.appt_date === todayIso && b.status !== 'Cancelled',
  ).length;
  const countConfirmed = doctorBookings.filter((b) => b.status === 'Confirmed').length;
  const countInConsultation = doctorBookings.filter((b) => b.status === 'In-Consultation').length;
  const countCompleted = doctorBookings.filter((b) => b.status === 'Completed').length;
  const countCancelled = doctorBookings.filter((b) => b.status === 'Cancelled').length;

  // Filtered appointments
  const filteredBookings = doctorBookings.filter((b) => {
    if (statusFilter && b.status !== statusFilter) return false;
    if (dateFilter && b.appt_date !== dateFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = b.patient_name.toLowerCase().includes(q);
      const matchPhone = b.phone.includes(q);
      const matchId = b.booking_id.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchId) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {notificationMsg && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center gap-2.5 shadow-sm transition-all animate-in fade-in slide-in-from-top duration-300 ${
            notificationMsg.type === 'success'
              ? 'bg-[#edf7f0] dark:bg-[#1a2d22] border-[#cfe1d5] dark:border-[#2b4434] text-[#176541] dark:text-[#34d399]'
              : notificationMsg.type === 'error'
              ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300'
              : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60 text-blue-800 dark:text-blue-300'
          }`}
        >
          {notificationMsg.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0 text-[#176541] dark:text-[#34d399]" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{notificationMsg.text}</span>
        </div>
      )}

      {/* Doctor Header Banner & Duty Control */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 transition-colors">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#176541] to-[#124d32] text-white font-heading font-bold text-xl flex items-center justify-center shrink-0 shadow-sm">
            {currentDoctor.name.replace('Dr. ', '')[0]}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#176541] dark:text-[#34d399]">
                VERIFIED PRACTITIONER
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] font-bold text-[10px]">
                {currentDoctor.licenseNumber}
              </span>
            </div>

            <h1 className="font-heading text-xl sm:text-2xl font-bold text-[#481e0b] dark:text-[#f7eee9]">
              {currentDoctor.name}
            </h1>

            <div className="text-xs text-[#786b65] dark:text-[#a89991] flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
              <span>{currentDoctor.spec}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#176541] dark:text-[#34d399]" />
                {currentDoctor.cabinNumber}
              </span>
              <span>·</span>
              <span>Clinic Email: {currentDoctor.email}</span>
            </div>
          </div>
        </div>

        {/* Right Action Tools: Duty Status & Logout */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          {/* Duty Status Selector */}
          <div className="flex items-center gap-1 bg-[#fdfaf8] dark:bg-[#251d19] border border-[#dcc9bf] dark:border-[#42332a] p-1 rounded-full">
            <button
              onClick={() => handleDutyChange('On Duty')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                dutyStatus === 'On Duty'
                  ? 'bg-[#176541] text-white shadow-xs'
                  : 'text-[#786b65] dark:text-[#a89991] hover:text-[#176541]'
              }`}
            >
              ● On Duty
            </button>
            <button
              onClick={() => handleDutyChange('In Consultation')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                dutyStatus === 'In Consultation'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-[#786b65] dark:text-[#a89991] hover:text-amber-600'
              }`}
            >
              ● In Consultation
            </button>
            <button
              onClick={() => handleDutyChange('Off Duty')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                dutyStatus === 'Off Duty'
                  ? 'bg-gray-600 text-white shadow-xs'
                  : 'text-[#786b65] dark:text-[#a89991] hover:text-gray-600'
              }`}
            >
              ● Off Duty
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleProcessReminders}
              title="Process automated 24h & 2h appointment reminders"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#cfe1d5] dark:border-[#2b4434] bg-[#edf7f0] dark:bg-[#1a2d22] hover:bg-[#dceee2] text-[#176541] dark:text-[#34d399] text-xs font-semibold transition-colors cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Send Reminders</span>
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#dcc9bf] dark:border-[#42332a] bg-white dark:bg-[#251d19] hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 text-[#786b65] dark:text-[#a89991] text-xs font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#786b65] dark:text-[#a89991] mb-1">
            Today's Visits
          </div>
          <div className="font-heading text-2xl font-bold text-[#481e0b] dark:text-[#f7eee9]">
            {countToday}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#176541] dark:text-[#34d399] mb-1">
            Confirmed / Waiting
          </div>
          <div className="font-heading text-2xl font-bold text-[#176541] dark:text-[#34d399]">
            {countConfirmed}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
            In Consultation
          </div>
          <div className="font-heading text-2xl font-bold text-amber-600 dark:text-amber-400">
            {countInConsultation}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
            Completed Visits
          </div>
          <div className="font-heading text-2xl font-bold text-blue-600 dark:text-blue-400">
            {countCompleted}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-xs col-span-2 sm:col-span-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
            Cancelled
          </div>
          <div className="font-heading text-2xl font-bold text-gray-500">
            {countCancelled}
          </div>
        </div>
      </div>

      {/* Appointment Search & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between transition-colors">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient name, phone, or booking ID..."
            className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-[#d9c9c2] dark:border-[#42332a] text-xs bg-[#fdfaf8] dark:bg-[#251d19] text-[#481e0b] dark:text-[#f7eee9] focus:outline-none focus:ring-2 focus:ring-[#176541]/30 focus:border-[#176541]"
          />
          <Search className="w-4 h-4 text-[#786b65] dark:text-[#a89991] absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-[#786b65] dark:text-[#a89991]">
            <Filter className="w-3.5 h-3.5 text-[#176541] dark:text-[#34d399]" />
            <span>Filter:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-[#d9c9c2] dark:border-[#42332a] text-xs bg-white dark:bg-[#251d19] text-[#481e0b] dark:text-[#f7eee9] focus:outline-none focus:ring-2 focus:ring-[#176541]/20"
          >
            <option value="" className="dark:bg-[#251d19]">
              All Statuses
            </option>
            <option value="Confirmed" className="dark:bg-[#251d19]">
              Confirmed
            </option>
            <option value="In-Consultation" className="dark:bg-[#251d19]">
              In-Consultation
            </option>
            <option value="Completed" className="dark:bg-[#251d19]">
              Completed
            </option>
            <option value="Cancelled" className="dark:bg-[#251d19]">
              Cancelled
            </option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-[#d9c9c2] dark:border-[#42332a] text-xs bg-white dark:bg-[#251d19] text-[#481e0b] dark:text-[#f7eee9] focus:outline-none focus:ring-2 focus:ring-[#176541]/20"
          >
            <option value="" className="dark:bg-[#251d19]">
              All Scheduled Dates
            </option>
            {upcomingDays.map((u) => (
              <option key={u.iso} value={u.iso} className="dark:bg-[#251d19]">
                {u.label}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-[#786b65] dark:text-[#a89991] shrink-0 text-right">
          Showing <strong>{filteredBookings.length}</strong> appointments
        </div>
      </div>

      {/* Appointments List for This Doctor */}
      <div className="space-y-3">
        {filteredBookings.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] text-center text-xs text-[#786b65] dark:text-[#a89991] space-y-2">
            <ClipboardList className="w-8 h-8 text-[#786b65] mx-auto opacity-50" />
            <p className="font-semibold text-sm text-[#481e0b] dark:text-[#f7eee9]">
              No appointments found matching your filters.
            </p>
            <p>Try clearing filters or search query to see all appointments.</p>
          </div>
        ) : (
          filteredBookings.map((b) => {
            const isExpanded = expandedBookingId === b.booking_id;
            const isToday = b.appt_date === todayIso;

            let statusBadge = (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] border border-[#cfe1d5] dark:border-[#2b4434]">
                Confirmed
              </span>
            );

            if (b.status === 'In-Consultation') {
              statusBadge = (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 animate-pulse">
                  ● In Consultation
                </span>
              );
            } else if (b.status === 'Completed') {
              statusBadge = (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60">
                  ✓ Completed
                </span>
              );
            } else if (b.status === 'Cancelled') {
              statusBadge = (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 dark:bg-[#251d19] text-gray-500 line-through">
                  Cancelled
                </span>
              );
            }

            return (
              <div
                key={b.id}
                className={`p-5 rounded-2xl bg-white dark:bg-[#1e1714] border shadow-xs transition-all ${
                  isToday
                    ? 'border-[#cfe1d5] dark:border-[#2b4434] ring-1 ring-[#176541]/10'
                    : 'border-[#d5e5db] dark:border-[#382b24]'
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                      <strong className="text-sm md:text-base font-bold text-[#481e0b] dark:text-[#f7eee9]">
                        {b.patient_name}
                      </strong>
                      {statusBadge}
                      {isToday && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#c85d38] text-white">
                          TODAY
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-[#786b65] dark:text-[#a89991] flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-semibold text-[#176541] dark:text-[#34d399] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDayLabel(b.appt_date)} at {b.appt_time}
                      </span>
                      <span>·</span>
                      <code className="text-[#a84724] dark:text-[#f38360]">Ref: {b.booking_id}</code>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        +91 {b.phone}
                      </span>
                      {b.email && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {b.email}
                          </span>
                        </>
                      )}
                    </div>

                    {b.reason && (
                      <div className="mt-2 text-xs bg-[#fdfaf8] dark:bg-[#251d19] px-3 py-1.5 rounded-lg border border-[#eee4df] dark:border-[#382b24] text-[#64554d] dark:text-[#c4b5ae]">
                        <strong className="text-[#481e0b] dark:text-[#f7eee9]">Reason: </strong>
                        {b.reason}
                      </div>
                    )}
                  </div>

                  {/* Primary Doctor Action Controls */}
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {/* Status Quick Actions */}
                    {b.status === 'Confirmed' && (
                      <button
                        onClick={() => handleStatusChange(b.booking_id, 'In-Consultation')}
                        className="px-3 py-1.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>Start Consultation</span>
                      </button>
                    )}

                    {(b.status === 'Confirmed' || b.status === 'In-Consultation') && (
                      <button
                        onClick={() => handleOpenConsultation(b)}
                        className="px-3 py-1.5 rounded-full bg-[#176541] hover:bg-[#124d32] text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Complete & Add Notes</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenRx(b)}
                      className="px-3 py-1.5 rounded-full border border-[#cfe1d5] dark:border-[#2b4434] bg-[#edf7f0] dark:bg-[#1a2d22] hover:bg-[#dceee2] text-[#176541] dark:text-[#34d399] font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Pill className="w-3.5 h-3.5" />
                      <span>Issue Rx</span>
                    </button>

                    <button
                      onClick={() => handleViewPatientFile(b.phone, b.patient_name)}
                      className="px-3 py-1.5 rounded-full border border-[#dcc9bf] dark:border-[#42332a] bg-white dark:bg-[#251d19] hover:bg-[#f7f3f0] text-xs font-semibold text-[#481e0b] dark:text-[#e8dcd5] transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Patient File</span>
                    </button>

                    <button
                      onClick={() => onNavigate('Telehealth')}
                      className="px-3 py-1.5 rounded-full border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 text-sky-700 dark:text-sky-300 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                      title="Launch HD Teleconsultation"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Video Call</span>
                    </button>

                    <button
                      onClick={() => onNavigate('Diagnostics')}
                      className="px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                      title="Order pathology/diagnostic investigation"
                    >
                      <FlaskConical className="w-3.5 h-3.5" />
                      <span>Order Labs</span>
                    </button>

                    <button
                      onClick={() =>
                        setExpandedBookingId(isExpanded ? null : b.booking_id)
                      }
                      className="px-2.5 py-1.5 rounded-full border border-[#dcc9bf] dark:border-[#42332a] bg-[#fdfaf8] dark:bg-[#251d19] hover:bg-[#f2ece8] text-xs font-semibold text-[#786b65] dark:text-[#a89991] transition-colors cursor-pointer"
                    >
                      {isExpanded ? 'Hide' : 'More'}
                    </button>
                  </div>
                </div>

                {/* Expanded Details / Additional Actions Drawer */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-[#f0e8e3] dark:border-[#33251e] text-xs space-y-3 bg-[#fdfaf8] dark:bg-[#251d19] p-4 rounded-xl transition-colors">
                    {/* Clinical notes if recorded */}
                    {b.clinical_notes && (
                      <div className="p-3 rounded-lg bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24]">
                        <div className="font-bold text-[#176541] dark:text-[#34d399] mb-1 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          <span>Clinical Consultation Findings & Diagnosis:</span>
                        </div>
                        {b.diagnosis && (
                          <div className="font-semibold text-[#481e0b] dark:text-[#f7eee9] mb-0.5">
                            Diagnosis: {b.diagnosis}
                          </div>
                        )}
                        <p className="text-[#64554d] dark:text-[#c4b5ae] italic">
                          {b.clinical_notes}
                        </p>
                      </div>
                    )}

                    {/* Prescriptions summary if issued */}
                    {b.prescribed_medications && b.prescribed_medications.length > 0 && (
                      <div className="p-3 rounded-lg bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24]">
                        <div className="font-bold text-[#176541] dark:text-[#34d399] mb-1 flex items-center gap-1.5">
                          <Pill className="w-3.5 h-3.5" />
                          <span>Prescriptions Issued for this Visit:</span>
                        </div>
                        <ul className="list-disc list-inside text-[#64554d] dark:text-[#c4b5ae] space-y-0.5">
                          {b.prescribed_medications.map((m, i) => (
                            <li key={i}>{m}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2 border-t border-[#f0e8e3] dark:border-[#33251e] flex-wrap">
                      <span className="font-bold text-[#481e0b] dark:text-[#f7eee9] mr-2">
                        Doctor Controls:
                      </span>

                      <button
                        onClick={() => handleSendPatientNotice(b)}
                        className="px-3 py-1.5 rounded-full border border-[#cfe1d5] dark:border-[#2b4434] bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] hover:bg-[#dceee2] text-xs font-semibold cursor-pointer flex items-center gap-1"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send SMS "Doctor Ready"</span>
                      </button>

                      {b.status !== 'Completed' && (
                        <button
                          onClick={() => handleStatusChange(b.booking_id, 'Completed')}
                          className="px-3 py-1.5 rounded-full bg-[#176541] hover:bg-[#124d32] text-white font-bold cursor-pointer transition-colors flex items-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Mark Completed</span>
                        </button>
                      )}

                      {b.status !== 'Cancelled' && (
                        <button
                          onClick={() => handleStatusChange(b.booking_id, 'Cancelled')}
                          className="px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer transition-colors flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Mark Cancelled</span>
                        </button>
                      )}

                      {b.status !== 'Confirmed' && (
                        <button
                          onClick={() => handleStatusChange(b.booking_id, 'Confirmed')}
                          className="px-3 py-1.5 rounded-full bg-[#c85d38] hover:bg-[#a84724] text-white font-bold cursor-pointer transition-colors"
                        >
                          Restore to Confirmed
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ================= CLINICAL CONSULTATION MODAL ================= */}
      {activeConsultationBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0e8e3] dark:border-[#33251e]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] flex items-center justify-center">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-[#481e0b] dark:text-[#f7eee9]">
                    Record Clinical Consultation
                  </h3>
                  <p className="text-xs text-[#786b65] dark:text-[#a89991]">
                    Patient: {activeConsultationBooking.patient_name} (Ref:{' '}
                    {activeConsultationBooking.booking_id})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveConsultationBooking(null)}
                className="text-[#786b65] hover:text-[#481e0b] p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveConsultation} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#481e0b] dark:text-[#f7eee9] mb-1">
                  Primary Diagnosis / Assessment
                </label>
                <input
                  type="text"
                  required
                  value={consultDiagnosis}
                  onChange={(e) => setConsultDiagnosis(e.target.value)}
                  placeholder="e.g. Acute Rhinitis, Essential Hypertension, Lumbar Strain"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9c9c2] dark:border-[#42332a] bg-[#fdfaf8] dark:bg-[#251d19] text-xs text-[#481e0b] dark:text-[#f7eee9] focus:outline-none focus:ring-2 focus:ring-[#176541]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#481e0b] dark:text-[#f7eee9] mb-1">
                  Clinical Examination & Treatment Notes
                </label>
                <textarea
                  required
                  rows={4}
                  value={consultNotes}
                  onChange={(e) => setConsultNotes(e.target.value)}
                  placeholder="Record patient symptoms, vitals, physical examination findings, recommendations, and follow-up guidance..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9c9c2] dark:border-[#42332a] bg-[#fdfaf8] dark:bg-[#251d19] text-xs text-[#481e0b] dark:text-[#f7eee9] focus:outline-none focus:ring-2 focus:ring-[#176541]/30"
                />
                <p className="text-[11px] text-[#786b65] dark:text-[#a89991] mt-1">
                  These notes will automatically be synced to the patient's personal Medical History
                  in their Patient Portal.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#f0e8e3] dark:border-[#33251e]">
                <button
                  type="button"
                  onClick={() => setActiveConsultationBooking(null)}
                  className="px-4 py-2 rounded-full border border-[#dcc9bf] dark:border-[#42332a] text-xs font-semibold text-[#786b65] dark:text-[#a89991] hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#176541] hover:bg-[#124d32] text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Notes & Complete Appointment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ISSUE E-PRESCRIPTION MODAL ================= */}
      {activeRxBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0e8e3] dark:border-[#33251e]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] flex items-center justify-center">
                  <Pill className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-[#481e0b] dark:text-[#f7eee9]">
                    Issue Digital e-Prescription
                  </h3>
                  <p className="text-xs text-[#786b65] dark:text-[#a89991]">
                    Prescribing for {activeRxBooking.patient_name} (+91 {activeRxBooking.phone})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveRxBooking(null)}
                className="text-[#786b65] hover:text-[#481e0b] p-1 rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleIssueRx} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#481e0b] dark:text-[#f7eee9] mb-1">
                  Medication Name & Strength
                </label>
                <input
                  type="text"
                  required
                  value={rxMedName}
                  onChange={(e) => setRxMedName(e.target.value)}
                  placeholder="e.g. Amoxicillin 500mg, Montelukast 10mg, Arnica Montana 30C"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9c9c2] dark:border-[#42332a] bg-[#fdfaf8] dark:bg-[#251d19] text-xs text-[#481e0b] dark:text-[#f7eee9] focus:outline-none focus:ring-2 focus:ring-[#176541]/30"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-[#481e0b] dark:text-[#f7eee9] mb-1">
                    Dosage
                  </label>
                  <input
                    type="text"
                    value={rxDosage}
                    onChange={(e) => setRxDosage(e.target.value)}
                    placeholder="1 Tablet / 5ml"
                    className="w-full px-3 py-2 rounded-lg border border-[#d9c9c2] dark:border-[#42332a] bg-white dark:bg-[#251d19] text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#481e0b] dark:text-[#f7eee9] mb-1">
                    Frequency
                  </label>
                  <select
                    value={rxFrequency}
                    onChange={(e) => setRxFrequency(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-[#d9c9c2] dark:border-[#42332a] bg-white dark:bg-[#251d19] text-xs"
                  >
                    <option value="Once daily (OD)">Once daily (OD)</option>
                    <option value="Twice daily (BD)">Twice daily (BD)</option>
                    <option value="Three times daily (TDS)">Three times daily (TDS)</option>
                    <option value="As needed (PRN)">As needed (PRN)</option>
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[11px] font-bold text-[#481e0b] dark:text-[#f7eee9] mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={rxDuration}
                    onChange={(e) => setRxDuration(e.target.value)}
                    placeholder="5 days / 30 days"
                    className="w-full px-3 py-2 rounded-lg border border-[#d9c9c2] dark:border-[#42332a] bg-white dark:bg-[#251d19] text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#481e0b] dark:text-[#f7eee9] mb-1">
                  Timing & Patient Instructions
                </label>
                <input
                  type="text"
                  value={rxInstructions}
                  onChange={(e) => setRxInstructions(e.target.value)}
                  placeholder="e.g. Take with warm water after meals. Avoid cold drinks."
                  className="w-full px-3.5 py-2 rounded-lg border border-[#d9c9c2] dark:border-[#42332a] bg-white dark:bg-[#251d19] text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#f0e8e3] dark:border-[#33251e]">
                <button
                  type="button"
                  onClick={() => setActiveRxBooking(null)}
                  className="px-4 py-2 rounded-full border border-[#dcc9bf] dark:border-[#42332a] text-xs font-semibold text-[#786b65]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#176541] hover:bg-[#124d32] text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Pill className="w-3.5 h-3.5" />
                  <span>Issue e-Prescription to Patient Portal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= PATIENT FILE MODAL ================= */}
      {viewingPatientProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0e8e3] dark:border-[#33251e]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#c85d38] text-white font-bold flex items-center justify-center">
                  {viewingPatientProfile.name[0]}
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-[#481e0b] dark:text-[#f7eee9]">
                    {viewingPatientProfile.name} — Patient Clinical Chart
                  </h3>
                  <div className="text-xs text-[#786b65] dark:text-[#a89991]">
                    ID: {viewingPatientProfile.id} · Phone: {viewingPatientProfile.phone} · Blood Group:{' '}
                    <strong>{viewingPatientProfile.bloodGroup}</strong>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewingPatientProfile(null)}
                className="text-[#786b65] hover:text-[#481e0b] p-1.5 rounded-full hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            {/* Allergies Notice */}
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                <strong>Documented Allergies: </strong>
                {viewingPatientProfile.allergies.join(', ') || 'No known allergies reported'}
              </span>
            </div>

            {/* Medical History Section */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#481e0b] dark:text-[#f7eee9] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#176541] dark:text-[#34d399]" />
                <span>Past Medical Consultations ({viewingPatientProfile.medicalHistory.length})</span>
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {viewingPatientProfile.medicalHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-[#fdfaf8] dark:bg-[#251d19] border border-[#eee4df] dark:border-[#382b24] text-xs"
                  >
                    <div className="flex items-center justify-between font-bold text-[#481e0b] dark:text-[#f7eee9]">
                      <span>{item.diagnosis}</span>
                      <span className="text-[11px] text-[#786b65] dark:text-[#a89991]">
                        {item.date}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#176541] dark:text-[#34d399] mt-0.5">
                      Attended by {item.doctorName} ({item.doctorSpec})
                    </div>
                    <p className="text-[#64554d] dark:text-[#c4b5ae] mt-1 italic">
                      {item.notes}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Prescriptions Section */}
            <div className="space-y-2 pt-2 border-t border-[#f0e8e3] dark:border-[#33251e]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#481e0b] dark:text-[#f7eee9] flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5 text-[#176541] dark:text-[#34d399]" />
                <span>Active Prescriptions ({viewingPatientProfile.prescriptions.filter((p) => p.active).length})</span>
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {viewingPatientProfile.prescriptions.map((rx) => (
                  <div
                    key={rx.id}
                    className="p-3 rounded-xl bg-[#fdfaf8] dark:bg-[#251d19] border border-[#eee4df] dark:border-[#382b24] text-xs"
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-[#481e0b] dark:text-[#f7eee9]">
                        {rx.prescriptionNumber} — {rx.indication || 'Prescription'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] ${
                          rx.active ? 'bg-[#edf7f0] text-[#176541] font-bold' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {rx.active ? 'Active' : 'Completed'}
                      </span>
                    </div>
                    <div className="mt-1 space-y-1">
                      {rx.medications.map((m, idx) => (
                        <div key={idx} className="text-[#64554d] dark:text-[#c4b5ae]">
                          • <strong>{m.name}</strong> — {m.dosage} ({m.frequency}) · {m.instructions}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-right pt-2 border-t border-[#f0e8e3] dark:border-[#33251e]">
              <button
                onClick={() => setViewingPatientProfile(null)}
                className="px-4 py-2 rounded-full bg-[#176541] text-white text-xs font-bold"
              >
                Close Patient Chart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
