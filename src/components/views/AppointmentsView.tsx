import React, { useState, useEffect } from 'react';
import { NavTab, Booking } from '../../types/clinic';
import { DOCTORS_SEED } from '../../data/clinicData';
import {
  bookAppointment,
  formatDayLabel,
  getFreeSlots,
  getUpcomingDays,
  SlotTakenError,
} from '../../utils/storage';
import QRCode from 'qrcode';
import {
  User,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  QrCode,
  Download,
} from 'lucide-react';

interface AppointmentsViewProps {
  initialDoctorId?: number;
  onNavigate: (tab: NavTab) => void;
}

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({
  initialDoctorId,
  onNavigate,
}) => {
  const doctors = DOCTORS_SEED;
  const dayOptions = getUpcomingDays(14);

  const [selectedDoctorId, setSelectedDoctorId] = useState<number>(
    initialDoctorId || doctors[0]?.id || 1,
  );
  const [selectedDate, setSelectedDate] = useState<string>(dayOptions[0].iso);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [patientName, setPatientName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    if (confirmedBooking) {
      const payload = JSON.stringify({
        app: 'CityCareClinic',
        action: 'PATIENT_CHECK_IN',
        bookingId: confirmedBooking.booking_id,
        patientName: confirmedBooking.patient_name,
        phone: confirmedBooking.phone,
        doctorId: confirmedBooking.doctor_id,
        doctorName: confirmedBooking.doctor_name,
        date: confirmedBooking.appt_date,
        time: confirmedBooking.appt_time,
        token: `T-${confirmedBooking.booking_id.replace(/\D/g, '').slice(-4) || '102'}`,
      });
      QRCode.toDataURL(payload, {
        width: 260,
        margin: 2,
        color: { dark: '#176541', light: '#ffffff' },
      })
        .then(setQrCodeUrl)
        .catch(console.error);
    } else {
      setQrCodeUrl('');
    }
  }, [confirmedBooking]);

  useEffect(() => {
    if (initialDoctorId) {
      setSelectedDoctorId(initialDoctorId);
    }
  }, [initialDoctorId]);

  useEffect(() => {
    const slots = getFreeSlots(selectedDoctorId, selectedDate);
    setAvailableSlots(slots);
    if (slots.length > 0) {
      setSelectedTime(slots[0]);
    } else {
      setSelectedTime('');
    }
    setErrorMsg(null);
  }, [selectedDoctorId, selectedDate]);

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId) || doctors[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedTime) {
      setErrorMsg('Please select an available time slot.');
      return;
    }

    try {
      const newBooking = bookAppointment({
        doctorId: selectedDoctorId,
        apptDate: selectedDate,
        apptTime: selectedTime,
        patientName,
        phone,
        email,
        reason,
      });

      setConfirmedBooking(newBooking);
    } catch (err: any) {
      if (err instanceof SlotTakenError) {
        setErrorMsg('That time was just booked. Please select another sample time.');
        setAvailableSlots(getFreeSlots(selectedDoctorId, selectedDate));
      } else {
        setErrorMsg(err.message || 'Error saving appointment. Please check your inputs.');
      }
    }
  };

  const copyBookingId = () => {
    if (confirmedBooking) {
      navigator.clipboard.writeText(confirmedBooking.booking_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setConfirmedBooking(null);
    setPatientName('');
    setPhone('');
    setEmail('');
    setReason('');
    const slots = getFreeSlots(selectedDoctorId, selectedDate);
    setAvailableSlots(slots);
    if (slots.length > 0) setSelectedTime(slots[0]);
  };

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <section className="relative overflow-hidden p-6 md:p-8 rounded-3xl bg-gradient-to-r from-[#cd5f37] via-[#a84724] to-[#481e0b] text-white shadow-[0_18px_38px_rgba(72,30,11,0.18)]">
        <div className="relative z-10">
          <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#f9ddd1] mb-1">
            APPOINTMENTS
          </div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-white mb-2">
            Make an appointment
          </h1>
          <p className="text-xs md:text-sm text-[#fff1eb] max-w-xl leading-relaxed mb-4">
            Choose a doctor, select a date and time, then save your booking reference.
          </p>

          <div className="flex flex-wrap gap-2">
            <span className="inline-block px-3 py-1 rounded-full border border-white/30 text-white text-[11px] font-medium bg-white/10 backdrop-blur-xs">
              Consultation fees listed
            </span>
            <span className="inline-block px-3 py-1 rounded-full border border-white/30 text-white text-[11px] font-medium bg-white/10 backdrop-blur-xs">
              Sample availability
            </span>
          </div>
        </div>

        <div className="absolute -top-16 -right-16 w-60 h-60 rounded-full border border-white/20 shadow-[0_0_0_24px_rgba(255,255,255,0.05)] pointer-events-none" />
      </section>

      {/* Info Notice */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] flex items-center gap-3 text-xs text-[#786b65] dark:text-[#a89991] transition-colors">
        <AlertCircle className="w-4 h-4 text-[#c85d38] dark:text-[#f38360] shrink-0" />
        <span>
          Appointment times shown are sample schedule data for this prototype. Your selected slot
          will be reserved instantly.
        </span>
      </div>

      {/* Confirmation Card if Booked */}
      {confirmedBooking ? (
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-[0_12px_36px_rgba(72,30,11,0.08)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.4)] max-w-2xl mx-auto transition-colors">
          <div className="w-14 h-14 rounded-full bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="font-heading text-2xl font-bold text-center text-[#481e0b] dark:text-[#f7eee9] mb-1">
            Appointment Confirmed!
          </h2>
          <p className="text-center text-xs text-[#786b65] dark:text-[#a89991] mb-6">
            Appointment saved with {confirmedBooking.doctor_name} for{' '}
            {formatDayLabel(confirmedBooking.appt_date)} at {confirmedBooking.appt_time}.
          </p>

          <div className="p-5 rounded-2xl bg-[#fdfaf8] dark:bg-[#251d19] border border-[#f0e8e3] dark:border-[#3d2e26] mb-6 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0e8e3] dark:border-[#382b24]">
              <span className="text-xs text-[#786b65] dark:text-[#a89991] font-semibold">
                Booking Reference
              </span>
              <div className="flex items-center gap-2">
                <code className="text-base font-bold text-[#c85d38] dark:text-[#f38360] bg-white dark:bg-[#1e1714] px-2.5 py-1 rounded-md border border-[#dcc9bf] dark:border-[#42332a]">
                  {confirmedBooking.booking_id}
                </code>
                <button
                  onClick={copyBookingId}
                  className="p-1.5 rounded-lg border border-[#dcc9bf] dark:border-[#42332a] bg-white dark:bg-[#1e1714] hover:bg-[#f7f3f0] dark:hover:bg-[#2c201a] text-[#56473f] dark:text-[#e8dcd5] transition-colors cursor-pointer"
                  title="Copy Reference"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-[#176541] dark:text-[#34d399]" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[#786b65] dark:text-[#a89991] block">Doctor</span>
                <strong className="text-[#481e0b] dark:text-[#f7eee9]">
                  {confirmedBooking.doctor_name}
                </strong>
                <span className="text-[11px] text-[#786b65] dark:text-[#a89991] block">
                  {confirmedBooking.doctor_spec}
                </span>
              </div>
              <div>
                <span className="text-[#786b65] dark:text-[#a89991] block">Date & Time</span>
                <strong className="text-[#481e0b] dark:text-[#f7eee9]">
                  {formatDayLabel(confirmedBooking.appt_date)}
                </strong>
                <span className="text-[11px] text-[#a84724] dark:text-[#f38360] font-bold block">
                  {confirmedBooking.appt_time}
                </span>
              </div>
              <div>
                <span className="text-[#786b65] dark:text-[#a89991] block">Patient Name</span>
                <strong className="text-[#481e0b] dark:text-[#f7eee9]">
                  {confirmedBooking.patient_name}
                </strong>
              </div>
              <div>
                <span className="text-[#786b65] dark:text-[#a89991] block">Mobile Number</span>
                <strong className="text-[#481e0b] dark:text-[#f7eee9]">
                  {confirmedBooking.phone}
                </strong>
              </div>
            </div>

            {confirmedBooking.reason && (
              <div className="pt-2 border-t border-[#f0e8e3] dark:border-[#382b24] text-xs">
                <span className="text-[#786b65] dark:text-[#a89991] block">Reason for visit:</span>
                <span className="text-[#481e0b] dark:text-[#f7eee9] italic">
                  {confirmedBooking.reason}
                </span>
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-[#edf7f0] dark:bg-[#1a2d22] border border-[#cfe1d5] dark:border-[#2b4434] text-xs text-[#176541] dark:text-[#34d399] flex items-center gap-2.5 mb-6">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              Confirmation SMS & WhatsApp dispatched to <strong>{confirmedBooking.phone}</strong>.
              Keep your reference for any queries.
            </span>
          </div>

          {/* Contactless Check-In QR Pass */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#fcf7f4] via-[#f8ede7] to-[#eedbd0] dark:from-[#241a16] dark:via-[#1e1512] dark:to-[#17100d] border border-[#e5d3c8] dark:border-[#3d2e26] mb-6 flex flex-col sm:flex-row items-center gap-5">
            <div className="p-2.5 bg-white rounded-2xl border-2 border-[#176541]/30 shadow-md shrink-0">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt={`Arrival check-in QR code for ${confirmedBooking.booking_id}`}
                  className="w-36 h-36 object-contain"
                />
              ) : (
                <div className="w-36 h-36 flex items-center justify-center text-xs text-[#786b65]">
                  Generating QR code...
                </div>
              )}
            </div>

            <div className="space-y-2 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#176541] text-white text-[10px] font-bold uppercase tracking-wider">
                <QrCode className="w-3 h-3" />
                <span>Contactless Check-In QR Pass</span>
              </div>
              <h4 className="font-heading font-bold text-base text-[#481e0b] dark:text-[#f7eee9]">
                Scan & Check In at Clinic Kiosk
              </h4>
              <p className="text-xs text-[#685a53] dark:text-[#c4b5ae] leading-relaxed">
                Save or screenshot this QR pass. When you arrive at CityCare reception, scan it at the kiosk to check in in 5 seconds and receive your queue token.
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (!qrCodeUrl) return;
                    const a = document.createElement('a');
                    a.href = qrCodeUrl;
                    a.download = `CityCare-Pass-${confirmedBooking.booking_id}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-white dark:bg-[#251d19] border border-[#dcc9bf] dark:border-[#42332a] hover:border-[#176541] text-xs font-bold text-[#176541] dark:text-[#34d399] transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save QR Pass (PNG)</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('Patient portal')}
                  className="px-3.5 py-1.5 rounded-full bg-[#176541] hover:bg-[#124d32] text-xs font-bold text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <span>Open in Patient Portal</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleReset}
              className="flex-1 py-2.5 px-4 rounded-full bg-[#c85d38] hover:bg-[#a84724] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer text-center"
            >
              Book another appointment
            </button>
            <button
              onClick={() => onNavigate('Assistant')}
              className="flex-1 py-2.5 px-4 rounded-full border border-[#dcc9bf] dark:border-[#42332a] bg-white dark:bg-[#251d19] hover:bg-[#f7f3f0] dark:hover:bg-[#2c201a] text-[#481e0b] dark:text-[#e8dcd5] text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Ask Clinic Assistant</span>
            </button>
          </div>
        </div>
      ) : (
        /* Booking Form */
        <form
          onSubmit={handleSubmit}
          className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-[0_8px_28px_rgba(72,30,11,0.06)] dark:shadow-[0_8px_28px_rgba(0,0,0,0.3)] space-y-6 max-w-3xl mx-auto transition-colors"
        >
          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Doctor & Date Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#481e0b] dark:text-[#f7eee9] mb-1.5">
                Doctor
              </label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#d9c9c2] dark:border-[#42332a] bg-white dark:bg-[#251d19] text-sm text-[#481e0b] dark:text-[#f7eee9] focus:outline-none focus:ring-2 focus:ring-[#c85d38]/30 focus:border-[#c85d38]"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id} className="dark:bg-[#251d19]">
                    {d.name} · {d.spec} · ₹{d.fee}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-[#786b65] dark:text-[#a89991]">
                {selectedDoctor.spec} · Consultation fee: ₹{selectedDoctor.fee}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#481e0b] dark:text-[#f7eee9] mb-1.5">
                Appointment date
              </label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#d9c9c2] dark:border-[#42332a] bg-white dark:bg-[#251d19] text-sm text-[#481e0b] dark:text-[#f7eee9] focus:outline-none focus:ring-2 focus:ring-[#c85d38]/30 focus:border-[#c85d38]"
              >
                {dayOptions.map((opt) => (
                  <option key={opt.iso} value={opt.iso} className="dark:bg-[#251d19]">
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-[#786b65] dark:text-[#a89991]">
                Mon - Sat schedules available (Sundays closed)
              </p>
            </div>
          </div>

          {/* Time Slot Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#481e0b] dark:text-[#f7eee9] mb-1.5">
              Available sample time
            </label>

            {availableSlots.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs">
                No sample times are available on this date. Please choose another upcoming date.
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {availableSlots.map((slot) => {
                  const isSelected = selectedTime === slot;
                  return (
                    <button
                      type="button"
                      key={slot}
                      onClick={() => setSelectedTime(slot)}
                      className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#c85d38] border-[#c85d38] text-white shadow-xs font-bold'
                          : 'bg-[#f7f3f0] dark:bg-[#251d19] border-[#dcc9bf] dark:border-[#3d2e26] text-[#481e0b] dark:text-[#e8dcd5] hover:border-[#c85d38]'
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Patient Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#481e0b] dark:text-[#f7eee9] mb-1.5">
                Patient name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength={60}
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-[#d9c9c2] dark:border-[#42332a] bg-white dark:bg-[#251d19] text-sm text-[#481e0b] dark:text-[#f7eee9] focus:outline-none focus:ring-2 focus:ring-[#c85d38]/30 focus:border-[#c85d38]"
                />
                <User className="w-4 h-4 text-[#786b65] dark:text-[#a89991] absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#481e0b] dark:text-[#f7eee9] mb-1.5">
                10-digit mobile number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  maxLength={15}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-[#d9c9c2] dark:border-[#42332a] bg-white dark:bg-[#251d19] text-sm text-[#481e0b] dark:text-[#f7eee9] focus:outline-none focus:ring-2 focus:ring-[#c85d38]/30 focus:border-[#c85d38]"
                />
                <Phone className="w-4 h-4 text-[#786b65] dark:text-[#a89991] absolute left-3 top-3" />
              </div>
            </div>
          </div>

          {/* Email (Optional) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#481e0b] dark:text-[#f7eee9] mb-1.5">
              Email (optional)
            </label>
            <div className="relative">
              <input
                type="email"
                maxLength={120}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-[#d9c9c2] dark:border-[#42332a] bg-white dark:bg-[#251d19] text-sm text-[#481e0b] dark:text-[#f7eee9] focus:outline-none focus:ring-2 focus:ring-[#c85d38]/30 focus:border-[#c85d38]"
              />
              <Mail className="w-4 h-4 text-[#786b65] dark:text-[#a89991] absolute left-3 top-3" />
            </div>
          </div>

          {/* Reason for visit (Optional) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#481e0b] dark:text-[#f7eee9] mb-1.5">
              Reason for visit (optional)
            </label>
            <textarea
              rows={3}
              maxLength={300}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Brief description of symptoms, follow-up, or general checkup"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#d9c9c2] dark:border-[#42332a] bg-white dark:bg-[#251d19] text-sm text-[#481e0b] dark:text-[#f7eee9] focus:outline-none focus:ring-2 focus:ring-[#c85d38]/30 focus:border-[#c85d38]"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={availableSlots.length === 0}
            className={`w-full py-3.5 px-6 rounded-full text-white font-bold text-sm shadow-[0_8px_18px_rgba(168,71,36,0.25)] transition-all cursor-pointer ${
              availableSlots.length === 0
                ? 'bg-gray-300 dark:bg-gray-800 cursor-not-allowed opacity-60'
                : 'bg-[#c85d38] hover:bg-[#a84724]'
            }`}
          >
            Confirm appointment
          </button>
        </form>
      )}
    </div>
  );
};
