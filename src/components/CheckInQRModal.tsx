import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  CheckCircle2,
  X,
  Download,
  Printer,
  Calendar,
  Clock,
  MapPin,
  User,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Booking } from '../types/clinic';
import { formatDayLabel } from '../utils/storage';

interface CheckInQRModalProps {
  isOpen: boolean;
  booking: Booking | null;
  onClose: () => void;
  onCheckInSuccess?: (bookingId: string) => void;
}

export const CheckInQRModal: React.FC<CheckInQRModalProps> = ({
  isOpen,
  booking,
  onClose,
  onCheckInSuccess,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isCheckInSimulated, setIsCheckInSimulated] = useState<boolean>(false);
  const [queueToken, setQueueToken] = useState<string>('');

  useEffect(() => {
    if (!isOpen || !booking) {
      setIsCheckInSimulated(false);
      setQrDataUrl('');
      return;
    }

    // Generate queue token (e.g. T-4821)
    const token = `T-${booking.booking_id.replace(/\D/g, '').slice(-4) || '102'}`;
    setQueueToken(token);

    // Create check-in payload for QR code
    const checkInPayload = JSON.stringify({
      app: 'CityCareClinic',
      action: 'PATIENT_CHECK_IN',
      bookingId: booking.booking_id,
      patientName: booking.patient_name,
      patientPhone: booking.phone,
      doctorId: booking.doctor_id,
      doctorName: booking.doctor_name,
      date: booking.appt_date,
      time: bFormattedTime(booking.appt_time),
      token,
      generatedAt: new Date().toISOString(),
    });

    // Render crisp, high-resolution QR code
    QRCode.toDataURL(checkInPayload, {
      width: 320,
      margin: 2,
      color: {
        dark: '#176541', // CityCare clinic dark green for high contrast readability
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url: string) => {
        setQrDataUrl(url);
      })
      .catch((err: any) => {
        console.error('Error generating QR code:', err);
      });
  }, [isOpen, booking]);

  if (!isOpen || !booking) return null;

  function bFormattedTime(t: string): string {
    if (!t) return '10:00 AM';
    const [hStr, mStr] = t.split(':');
    const h = parseInt(hStr, 10);
    const m = mStr || '00';
    if (isNaN(h)) return t;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:${m} ${ampm}`;
  }

  // Handle simulating kiosk scanning at clinic reception
  const handleSimulateKioskScan = () => {
    setIsCheckInSimulated(true);
    // Play check-in chime
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15); // G5
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch {}

    if (onCheckInSuccess) {
      onCheckInSuccess(booking.booking_id);
    }
  };

  // Download QR code ticket as PNG image
  const handleDownloadQrTicket = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `CityCare-CheckIn-QR-${booking.booking_id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Print boarding ticket
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#1a1412] border border-[#dcc9bf] dark:border-[#382b24] shadow-2xl overflow-hidden text-left flex flex-col max-h-[92vh]">
        {/* Top Header Card */}
        <div className="p-5 md:p-6 bg-gradient-to-r from-[#176541] to-[#124d32] text-white flex items-start justify-between relative overflow-hidden">
          <div className="relative z-10 space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs border border-white/20">
              <QrCode className="w-3 h-3" />
              <span>Contactless Clinic Arrival</span>
            </div>
            <h3 className="font-heading text-lg md:text-xl font-bold text-white">
              Appointment Check-In Pass
            </h3>
            <p className="text-xs text-[#d5eedf]">
              Show this QR code at CityCare reception kiosk for instant 5-second check-in
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer relative z-10"
            aria-label="Close Check-in Pass"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Decorative Background Circles */}
          <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />
        </div>

        {/* Scrollable Pass Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Simulated Arrival Success Banner (if kiosk scan simulated) */}
          {isCheckInSimulated && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-start gap-3 animate-in zoom-in-95 duration-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm">You are Checked In!</div>
                <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300/90 mt-0.5">
                  Arrival confirmed at front desk. Dr. {booking.doctor_name}'s cabin has been notified. Please relax in <strong>Waiting Lounge A</strong> (Token #{queueToken}).
                </p>
              </div>
            </div>
          )}

          {/* Boarding Pass Ticket Card */}
          <div className="rounded-2xl border border-[#d9c9c2] dark:border-[#3d2e26] bg-[#fdfaf8] dark:bg-[#221814] p-5 shadow-xs relative">
            {/* Queue Token & Reference Badge */}
            <div className="flex items-center justify-between pb-3.5 border-b border-[#ebdcd3] dark:border-[#382b24]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#786b65] dark:text-[#a89991] block">
                  Queue Token
                </span>
                <span className="font-mono font-extrabold text-xl text-[#176541] dark:text-[#34d399]">
                  {queueToken}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#786b65] dark:text-[#a89991] block">
                  Booking ID
                </span>
                <span className="font-mono font-bold text-xs text-[#481e0b] dark:text-[#f7eee9]">
                  {booking.booking_id}
                </span>
              </div>
            </div>

            {/* QR Code Container with Centered Alignment */}
            <div className="my-5 text-center flex flex-col items-center justify-center">
              <div className="p-3 bg-white rounded-2xl border-2 border-[#176541]/30 shadow-md inline-block">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`Check-in QR code for appointment ${booking.booking_id}`}
                    className="w-48 h-48 md:w-52 md:h-52 object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-xs text-[#786b65]">
                    Generating QR code...
                  </div>
                )}
              </div>
              <p className="text-[11px] text-[#786b65] dark:text-[#a89991] mt-2.5 font-medium">
                Kiosk Scanner Auto-Recognizes Code • Valid Today & Tomorrow
              </p>
            </div>

            {/* Perforated Divider Line */}
            <div className="relative py-2 my-1">
              <div className="border-t-2 border-dashed border-[#d9c9c2] dark:border-[#42332a]" />
              <div className="absolute -left-7 top-0.5 w-4 h-4 rounded-full bg-white dark:bg-[#1a1412] border-r border-[#d9c9c2] dark:border-[#42332a]" />
              <div className="absolute -right-7 top-0.5 w-4 h-4 rounded-full bg-white dark:bg-[#1a1412] border-l border-[#d9c9c2] dark:border-[#42332a]" />
            </div>

            {/* Appointment Details Grid */}
            <div className="space-y-3 pt-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#786b65] dark:text-[#a89991] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#c85d38]" />
                  Patient
                </span>
                <span className="font-bold text-[#481e0b] dark:text-[#f7eee9]">
                  {booking.patient_name}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#786b65] dark:text-[#a89991] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#176541]" />
                  Physician
                </span>
                <span className="font-bold text-[#481e0b] dark:text-[#f7eee9]">
                  {booking.doctor_name}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#786b65] dark:text-[#a89991] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#c85d38]" />
                  Date
                </span>
                <span className="font-bold text-[#481e0b] dark:text-[#f7eee9]">
                  {formatDayLabel(booking.appt_date)} ({booking.appt_date})
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#786b65] dark:text-[#a89991] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#176541]" />
                  Time Slot
                </span>
                <span className="font-bold text-[#176541] dark:text-[#34d399]">
                  {bFormattedTime(booking.appt_time)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#786b65] dark:text-[#a89991] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#c85d38]" />
                  Location
                </span>
                <span className="font-semibold text-[#481e0b] dark:text-[#f7eee9]">
                  CityCare Main Clinic · Ground Floor
                </span>
              </div>
            </div>
          </div>

          {/* Simple How-to-use Instructions (Written clearly for non-technical users) */}
          <div className="p-3.5 rounded-2xl bg-[#edf7f0] dark:bg-[#1a2d22] border border-[#cfe1d5] dark:border-[#2b4434] text-xs space-y-2">
            <div className="font-bold text-[#176541] dark:text-[#34d399] flex items-center gap-1.5">
              <Info className="w-4 h-4" />
              <span>How to use this Check-In QR Pass:</span>
            </div>
            <ol className="list-decimal list-inside text-[#3c5445] dark:text-[#c2dfcc] space-y-1 text-[11px] leading-relaxed">
              <li>Save or screenshot this QR code on your phone before arriving.</li>
              <li>When you walk in, point your phone screen at the front reception kiosk scanner.</li>
              <li>Your arrival is instantly checked in without waiting in the manual line!</li>
            </ol>
          </div>

          {/* Simulate Arrival Check-In Button for Testing */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleSimulateKioskScan}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#176541] to-[#124d32] hover:from-[#124d32] hover:to-[#0d3824] text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 group"
            >
              <Sparkles className="w-4 h-4 text-emerald-300 group-hover:rotate-12 transition-transform" />
              <span>{isCheckInSimulated ? 'Re-Verify Check-In Scan' : 'Simulate Kiosk Check-In Now (Test)'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 border-t border-[#ebdcd3] dark:border-[#382b24] bg-[#fdfaf8] dark:bg-[#1e1512] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadQrTicket}
              className="px-3.5 py-2 rounded-full border border-[#dcc9bf] dark:border-[#42332a] bg-white dark:bg-[#251d19] hover:bg-[#fff5f0] text-[#56473f] dark:text-[#e8dcd5] text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
              title="Download QR code image to your phone gallery"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save QR Image</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-full border border-[#dcc9bf] dark:border-[#42332a] bg-white dark:bg-[#251d19] hover:bg-[#fff5f0] text-[#56473f] dark:text-[#e8dcd5] text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
              title="Print check-in pass receipt"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Pass</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#c85d38] hover:bg-[#a84724] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
