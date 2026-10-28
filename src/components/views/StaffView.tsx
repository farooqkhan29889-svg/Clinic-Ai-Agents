import React, { useState, useEffect } from 'react';
import { Doctor, Booking, BookingStatus, NavTab } from '../../types/clinic';
import { DOCTORS_SEED } from '../../data/clinicData';
import {
  getStoredBookings,
  getDoctorById,
  updateBookingStatus,
  processDueReminders,
  verifyDoctorPassword,
  formatDayLabel,
  getUpcomingDays,
} from '../../utils/storage';
import {
  Lock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Bell,
  LogOut,
  Filter,
  Eye,
} from 'lucide-react';

interface StaffViewProps {
  onNavigate: (tab: NavTab) => void;
}

export const StaffView: React.FC<StaffViewProps> = ({ onNavigate }) => {
  const doctors = DOCTORS_SEED;
  const [selectedDocId, setSelectedDocId] = useState<number>(doctors[0]?.id || 1);
  const [password, setPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [loggedInDoctor, setLoggedInDoctor] = useState<Doctor | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reminderReport, setReminderReport] = useState<string | null>(null);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

  const upcoming = getUpcomingDays(14);
  const todayIso = new Date().toISOString().split('T')[0];

  const reloadBookings = () => {
    setBookings(getStoredBookings());
  };

  useEffect(() => {
    reloadBookings();
  }, [loggedInDoctor]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (verifyDoctorPassword(selectedDocId, password)) {
      const doc = getDoctorById(selectedDocId);
      if (doc) {
        setLoggedInDoctor(doc);
        setPassword('');
      }
    } else {
      setAuthError('The doctor or password did not match.');
    }
  };

  const handleLogout = () => {
    setLoggedInDoctor(null);
    setPassword('');
    setAuthError(null);
    setReminderReport(null);
  };

  const handleStatusChange = (bookingId: string, newStatus: BookingStatus) => {
    try {
      updateBookingStatus(bookingId, newStatus, loggedInDoctor?.id);
      reloadBookings();
    } catch (err: any) {
      alert(err.message || 'Could not update status');
    }
  };

  const handleProcessReminders = () => {
    const report = processDueReminders();
    setReminderReport(report.message);
    reloadBookings();
    setTimeout(() => {
      setReminderReport(null);
    }, 6000);
  };

  // If NOT logged in, show Staff Access login form
  if (!loggedInDoctor) {
    const currentDoc = doctors.find((d) => d.id === selectedDocId) || doctors[0];
    const demoPasswordHint = currentDoc.password || `citycare${currentDoc.id}123`;

    return (
      <div className="space-y-8 max-w-xl mx-auto">
        <section className="relative overflow-hidden p-6 md:p-8 rounded-3xl bg-gradient-to-r from-[#cd5f37] via-[#a84724] to-[#481e0b] text-white shadow-[0_18px_38px_rgba(72,30,11,0.18)]">
          <div className="relative z-10">
            <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#f9ddd1] mb-1">
              STAFF ACCESS
            </div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-white mb-2">
              Doctor panel
            </h1>
            <p className="text-xs md:text-sm text-[#fff1eb] leading-relaxed">
              Sign in to review appointments assigned to you.
            </p>
          </div>
        </section>

        <form
          onSubmit={handleLogin}
          className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-[0_8px_28px_rgba(72,30,11,0.06)] dark:shadow-[0_8px_28px_rgba(0,0,0,0.3)] space-y-5 transition-colors"
        >
          {authError && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#481e0b] dark:text-[#f7eee9] mb-1.5">
              Doctor
            </label>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#d9c9c2] dark:border-[#42332a] bg-white dark:bg-[#251d19] text-sm text-[#481e0b] dark:text-[#f7eee9] focus:outline-none focus:ring-2 focus:ring-[#c85d38]/30 focus:border-[#c85d38]"
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id} className="dark:bg-[#251d19]">
                  {d.name} ({d.spec})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#481e0b] dark:text-[#f7eee9] mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter doctor password"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-[#d9c9c2] dark:border-[#42332a] bg-white dark:bg-[#251d19] text-[#481e0b] dark:text-[#f7eee9] text-sm focus:outline-none focus:ring-2 focus:ring-[#c85d38]/30 focus:border-[#c85d38]"
              />
              <Lock className="w-4 h-4 text-[#786b65] dark:text-[#a89991] absolute left-3 top-3" />
            </div>
            <div className="mt-2 text-[11px] text-[#786b65] dark:text-[#a89991] bg-[#fdfaf8] dark:bg-[#251d19] p-2.5 rounded-md border border-[#eee4df] dark:border-[#3d2e26]">
              Prototype password for <strong>{currentDoc.name}</strong>:{' '}
              <code className="bg-white dark:bg-[#1e1714] px-1.5 py-0.5 rounded border border-[#dcc9bf] dark:border-[#42332a] text-[#c85d38] dark:text-[#f38360] font-bold">
                {demoPasswordHint}
              </code>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-6 rounded-full bg-[#c85d38] hover:bg-[#a84724] text-white font-bold text-sm shadow-[0_8px_18px_rgba(168,71,36,0.25)] transition-all cursor-pointer"
          >
            Log in
          </button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={handleProcessReminders}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#176541] dark:text-[#34d399] hover:underline cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Simulate / Send due reminders</span>
          </button>
          {reminderReport && (
            <div className="mt-3 p-3 rounded-xl bg-[#edf7f0] dark:bg-[#1a2d22] border border-[#cfe1d5] dark:border-[#2b4434] text-xs text-[#176541] dark:text-[#34d399]">
              {reminderReport}
            </div>
          )}
        </div>
      </div>
    );
  }

  // LOGGED IN DASHBOARD
  const doctorBookings = bookings.filter((b) => b.doctor_id === loggedInDoctor.id);

  const countToday = doctorBookings.filter(
    (b) => b.appt_date === todayIso && b.status !== 'Cancelled',
  ).length;
  const countConfirmed = doctorBookings.filter((b) => b.status === 'Confirmed').length;
  const countCompleted = doctorBookings.filter((b) => b.status === 'Completed').length;

  const filteredBookings = doctorBookings.filter((b) => {
    if (statusFilter && b.status !== statusFilter) return false;
    if (dateFilter && b.appt_date !== dateFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Doctor Header Banner */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#a84724] dark:text-[#f38360]">
            CLINIC DOCTOR PORTAL
          </div>
          <h1 className="font-heading text-2xl font-bold text-[#481e0b] dark:text-[#f7eee9]">
            Welcome, {loggedInDoctor.name}
          </h1>
          <p className="text-xs text-[#786b65] dark:text-[#a89991]">
            {loggedInDoctor.spec} ·{' '}
            {new Date().toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleProcessReminders}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#cfe1d5] dark:border-[#2b4434] bg-[#edf7f0] dark:bg-[#1a2d22] hover:bg-[#dceee2] dark:hover:bg-[#233c2e] text-[#176541] dark:text-[#34d399] text-xs font-semibold transition-colors cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Send reminders</span>
          </button>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#dcc9bf] dark:border-[#42332a] bg-white dark:bg-[#251d19] hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 text-[#786b65] dark:text-[#a89991] text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log out</span>
          </button>
        </div>
      </div>

      {reminderReport && (
        <div className="p-4 rounded-2xl bg-[#edf7f0] dark:bg-[#1a2d22] border border-[#cfe1d5] dark:border-[#2b4434] text-xs text-[#176541] dark:text-[#34d399] flex items-center gap-2">
          <Bell className="w-4 h-4 shrink-0 text-[#176541] dark:text-[#34d399]" />
          <span>{reminderReport}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-xs transition-colors">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#786b65] dark:text-[#a89991] mb-1">
            Appointments Today
          </div>
          <div className="font-heading text-3xl font-bold text-[#481e0b] dark:text-[#f7eee9]">
            {countToday}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-xs transition-colors">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#786b65] dark:text-[#a89991] mb-1">
            Confirmed Total
          </div>
          <div className="font-heading text-3xl font-bold text-[#176541] dark:text-[#34d399]">
            {countConfirmed}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-xs transition-colors">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#786b65] dark:text-[#a89991] mb-1">
            Completed Visits
          </div>
          <div className="font-heading text-3xl font-bold text-[#234c91] dark:text-[#60a5fa]">
            {countCompleted}
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-xs flex flex-col sm:flex-row gap-3 items-center transition-colors">
        <div className="flex items-center gap-2 text-xs font-bold text-[#481e0b] dark:text-[#f7eee9] shrink-0">
          <Filter className="w-4 h-4 text-[#a84724] dark:text-[#f38360]" />
          <span>Filter visits:</span>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-[#d9c9c2] dark:border-[#42332a] text-xs bg-white dark:bg-[#251d19] text-[#481e0b] dark:text-[#f7eee9] focus:outline-none focus:ring-2 focus:ring-[#c85d38]/20"
        >
          <option value="" className="dark:bg-[#251d19]">
            All statuses
          </option>
          <option value="Confirmed" className="dark:bg-[#251d19]">
            Confirmed
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
          className="px-3 py-1.5 rounded-lg border border-[#d9c9c2] dark:border-[#42332a] text-xs bg-white dark:bg-[#251d19] text-[#481e0b] dark:text-[#f7eee9] focus:outline-none focus:ring-2 focus:ring-[#c85d38]/20"
        >
          <option value="" className="dark:bg-[#251d19]">
            Any date
          </option>
          {upcoming.map((u) => (
            <option key={u.iso} value={u.iso} className="dark:bg-[#251d19]">
              {u.label}
            </option>
          ))}
        </select>

        <div className="ml-auto text-xs text-[#786b65] dark:text-[#a89991]">
          Showing <strong>{filteredBookings.length}</strong> of{' '}
          <strong>{doctorBookings.length}</strong> appointments
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-3">
        {filteredBookings.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] text-center text-xs text-[#786b65] dark:text-[#a89991]">
            No appointments match these filters.
          </div>
        ) : (
          filteredBookings.map((b) => {
            const isExpanded = expandedBookingId === b.booking_id;
            let statusPill = 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
            if (b.status === 'Confirmed')
              statusPill =
                'bg-[#e0f3e8] dark:bg-[#1a2d22] text-[#16633b] dark:text-[#34d399] font-bold';
            if (b.status === 'Completed')
              statusPill =
                'bg-[#e7eefb] dark:bg-[#17253b] text-[#234c91] dark:text-[#60a5fa] font-bold';
            if (b.status === 'Cancelled')
              statusPill =
                'bg-[#f0edea] dark:bg-[#2c201a] text-[#68615c] dark:text-[#998780] line-through';

            return (
              <div
                key={b.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-xs hover:border-[#c85d38] dark:hover:border-[#e0734d] transition-colors"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <strong className="text-sm font-bold text-[#481e0b] dark:text-[#f7eee9]">
                        {b.patient_name}
                      </strong>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] ${statusPill}`}>
                        {b.status}
                      </span>
                    </div>

                    <div className="text-xs text-[#786b65] dark:text-[#a89991] flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-semibold text-[#a84724] dark:text-[#f38360]">
                        {formatDayLabel(b.appt_date)} at {b.appt_time}
                      </span>
                      <span>·</span>
                      <code>Ref: {b.booking_id}</code>
                      <span>·</span>
                      <span>Phone: {b.phone}</span>
                      {b.email && <span>· Email: {b.email}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() =>
                        setExpandedBookingId(isExpanded ? null : b.booking_id)
                      }
                      className="px-3 py-1.5 rounded-full border border-[#dcc9bf] dark:border-[#42332a] bg-white dark:bg-[#251d19] hover:bg-[#f7f3f0] dark:hover:bg-[#2c201a] text-xs font-semibold text-[#481e0b] dark:text-[#e8dcd5] cursor-pointer flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isExpanded ? 'Hide details' : 'Details & Actions'}</span>
                    </button>
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-[#f0e8e3] dark:border-[#33251e] text-xs space-y-3 bg-[#fdfaf8] dark:bg-[#251d19] p-4 rounded-xl transition-colors">
                    <div>
                      <strong className="text-[#481e0b] dark:text-[#f7eee9]">
                        Reason for Visit:
                      </strong>
                      <p className="text-[#786b65] dark:text-[#c4b5ae] mt-0.5 italic">
                        {b.reason || 'No specific symptoms entered by patient'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-[#f0e8e3] dark:border-[#33251e] flex-wrap">
                      <span className="font-bold text-[#481e0b] dark:text-[#f7eee9] mr-2">
                        Update Status:
                      </span>

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
    </div>
  );
};
