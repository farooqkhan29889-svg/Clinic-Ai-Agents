import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  CheckCircle2,
  Download,
  Printer,
  Sparkles,
  Maximize2,
  Smartphone,
  Check,
} from 'lucide-react';
import { Booking } from '../types/clinic';
import { formatDayLabel } from '../utils/storage';

interface AppointmentQRCardProps {
  booking: Booking;
  isCheckedIn: boolean;
  onCheckIn: (bookingId: string) => void;
  onOpenModal: (booking: Booking) => void;
}

export const AppointmentQRCard: React.FC<AppointmentQRCardProps> = ({
  booking,
  isCheckedIn,
  onCheckIn,
  onOpenModal,
}) => {
  const [qrUrl, setQrUrl] = useState<string>('');
  const queueToken = `T-${booking.booking_id.replace(/\D/g, '').slice(-4) || '102'}`;

  useEffect(() => {
    const payload = JSON.stringify({
      app: 'CityCareClinic',
      action: 'PATIENT_CHECK_IN',
      bookingId: booking.booking_id,
      patientName: booking.patient_name,
      phone: booking.phone,
      doctorId: booking.doctor_id,
      doctorName: booking.doctor_name,
      date: booking.appt_date,
      time: booking.appt_time,
      token: queueToken,
      generatedAt: new Date().toISOString(),
    });

    QRCode.toDataURL(payload, {
      width: 280,
      margin: 2,
      color: {
        dark: '#176541',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then(setQrUrl)
      .catch(console.error);
  }, [booking.booking_id, queueToken]);

  const handleSimulateScan = () => {
    // Play check-in chime
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch {}

    onCheckIn(booking.booking_id);
  };

  const handleDownload = () => {
    if (!qrUrl) return;
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `CityCare-QR-${booking.booking_id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-br from-[#fcf7f4] via-[#f7eee9] to-[#eeddd4] dark:from-[#241a16] dark:via-[#1e1512] dark:to-[#17100d] border border-[#e5d3c8] dark:border-[#3d2e26] shadow-xs flex flex-col md:flex-row items-center gap-6">
      {/* Visual QR Code Display Container */}
      <div className="relative group shrink-0">
        <div className="p-3 bg-white rounded-2xl border-2 border-[#176541]/30 shadow-md">
          {qrUrl ? (
            <img
              src={qrUrl}
              alt={`Check-in QR code for ${booking.booking_id}`}
              className="w-40 h-40 md:w-44 md:h-44 object-contain"
            />
          ) : (
            <div className="w-40 h-40 flex items-center justify-center text-xs text-[#786b65]">
              Loading QR...
            </div>
          )}
        </div>

        {/* Hover/Tap to Enlarge Indicator */}
        <button
          type="button"
          onClick={() => onOpenModal(booking)}
          className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5 cursor-pointer backdrop-blur-[1px]"
          title="Click to view full boarding pass"
        >
          <Maximize2 className="w-4 h-4" />
          <span>Full Boarding Pass</span>
        </button>
      </div>

      {/* QR Code Details & Instructions */}
      <div className="space-y-2.5 flex-1 text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#176541] text-white text-[10px] font-bold uppercase tracking-wider">
            <QrCode className="w-3 h-3" />
            <span>Kiosk Check-In QR</span>
          </div>

          <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-full bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] border border-[#cfe1d5] dark:border-[#2b4434]">
            Queue Token #{queueToken}
          </span>

          {isCheckedIn && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] border border-emerald-300 dark:border-emerald-800">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              Arrival Confirmed
            </span>
          )}
        </div>

        <h4 className="font-heading font-bold text-base md:text-lg text-[#481e0b] dark:text-[#f7eee9]">
          Fast-Track Contactless Arrival Pass
        </h4>

        <p className="text-xs text-[#685a53] dark:text-[#c4b5ae] leading-relaxed max-w-xl">
          Point this QR code at the reception kiosk scanner or reception tablet when you arrive. It automatically checks you in, alerts <strong>{booking.doctor_name}</strong>'s cabin, and reserves your place in the waiting lounge.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1.5">
          <button
            type="button"
            onClick={handleSimulateScan}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 ${
              isCheckedIn
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-[#176541] hover:bg-[#124d32] text-white shadow-[0_4px_12px_rgba(23,101,65,0.25)]'
            }`}
          >
            {isCheckedIn ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Re-Verify Kiosk Scan</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                <span>Simulate Kiosk Check-In (Test)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onOpenModal(booking)}
            className="px-3.5 py-2 rounded-full border border-[#dcc9bf] dark:border-[#42332a] bg-white dark:bg-[#251d19] hover:bg-[#fff5f0] text-[#56473f] dark:text-[#e8dcd5] text-xs font-bold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Maximize2 className="w-3.5 h-3.5 text-[#c85d38]" />
            <span>Full Boarding Pass</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="px-3.5 py-2 rounded-full border border-[#dcc9bf] dark:border-[#42332a] bg-white dark:bg-[#251d19] hover:bg-[#fff5f0] text-[#56473f] dark:text-[#e8dcd5] text-xs font-bold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
            title="Download QR code PNG image"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save QR Image</span>
          </button>
        </div>
      </div>
    </div>
  );
};
