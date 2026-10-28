import { Booking, Doctor, BookingStatus } from '../types/clinic';
import { DOCTORS_SEED, INITIAL_BOOKINGS } from '../data/clinicData';

const STORAGE_KEYS = {
  BOOKINGS: 'citycare_bookings',
  DOCTORS: 'citycare_doctors',
  CHAT_MESSAGES: 'citycare_chat_messages',
};

export class BookingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BookingError';
  }
}

export class SlotTakenError extends BookingError {
  constructor(message = 'That time was just booked. Please select another sample time.') {
    super(message);
    this.name = 'SlotTakenError';
  }
}

// Phone normalization matching database.py
export function normalizePhone(raw: string): string {
  let digits = (raw || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  if (!/^[6-9]\d{9}$/.test(digits)) {
    throw new BookingError('Enter a valid 10-digit mobile number (e.g. 9876543210)');
  }
  return digits;
}

// Name validation matching database.py
export function validateName(raw: string): string {
  const name = (raw || '').trim();
  if (name.length < 3 || !/^[\w .'-]{3,}$/u.test(name)) {
    throw new BookingError("Enter the patient's full name (at least 3 characters)");
  }
  return name;
}

// Email validation
export function validateEmail(raw: string): string {
  const email = (raw || '').trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    throw new BookingError('Enter a valid email address');
  }
  return email;
}

// Date validation
export function validateDate(raw: string): string {
  const val = (raw || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) {
    throw new BookingError('Pick a valid date (YYYY-MM-DD)');
  }
  const chosen = new Date(val + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (chosen < today) {
    throw new BookingError('That date is in the past — please pick an upcoming day');
  }
  return val;
}

// Upcoming days generator (14 days)
export interface DayOption {
  iso: string;
  label: string;
  short: string;
}

export function getUpcomingDays(count = 14): DayOption[] {
  const options: DayOption[] = [];
  const today = new Date();
  for (let i = 0; i <= count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    const isToday = i === 0;
    const isTomorrow = i === 1;
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const monthName = d.toLocaleDateString('en-US', { month: 'short' });
    const dateNum = d.getDate();

    let prefix = '';
    if (isToday) prefix = 'Today · ';
    else if (isTomorrow) prefix = 'Tomorrow · ';

    options.push({
      iso,
      label: `${prefix}${dayName}, ${dateNum} ${monthName}`,
      short: `${dayName} ${dateNum}/${d.getMonth() + 1}`,
    });
  }
  return options;
}

export function formatDayLabel(isoDate: string): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = d.toDateString() === today.toDateString();
  const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
  const monthName = d.toLocaleDateString('en-US', { month: 'short' });
  const prefix = isToday ? 'Today · ' : '';
  return `${prefix}${dayName}, ${d.getDate()} ${monthName}`;
}

// LocalStorage helpers
export function getStoredDoctors(): Doctor[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DOCTORS);
    if (data) return JSON.parse(data);
  } catch {
    // fallback
  }
  return DOCTORS_SEED;
}

export function getDoctorById(id: number): Doctor | undefined {
  return getStoredDoctors().find((d) => d.id === id);
}

export function getStoredBookings(): Booking[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    if (data) return JSON.parse(data);
  } catch {
    // fallback
  }
  // Initialize with seed data
  try {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(INITIAL_BOOKINGS));
  } catch {
    // ignore
  }
  return INITIAL_BOOKINGS;
}

export function saveStoredBookings(bookings: Booking[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  } catch {
    // ignore
  }
}

// Generate unique booking reference e.g. "CC-48201"
export function generateBookingId(): string {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `CC-${num}`;
}

// Get free slots for a doctor on a specific date
export function getFreeSlots(doctorId: number, dateIso: string): string[] {
  const doctor = getDoctorById(doctorId);
  if (!doctor) return [];
  const bookings = getStoredBookings();
  const takenTimes = new Set(
    bookings
      .filter(
        (b) =>
          b.doctor_id === doctorId &&
          b.appt_date === dateIso &&
          b.status !== 'Cancelled',
      )
      .map((b) => b.appt_time),
  );

  return doctor.slots.filter((time) => !takenTimes.has(time));
}

// Book appointment
export function bookAppointment(params: {
  doctorId: number;
  apptDate: string;
  apptTime: string;
  patientName: string;
  phone: string;
  email?: string;
  reason?: string;
}): Booking {
  const doctor = getDoctorById(params.doctorId);
  if (!doctor) throw new BookingError('Selected doctor does not exist');

  const validName = validateName(params.patientName);
  const validPhone = normalizePhone(params.phone);
  const validEmail = validateEmail(params.email || '');
  const validDate = validateDate(params.apptDate);
  const time = (params.apptTime || '').trim();

  if (!time) {
    throw new BookingError('Please pick an appointment time');
  }

  // Check slot availability
  const availableSlots = getFreeSlots(params.doctorId, validDate);
  if (!availableSlots.includes(time)) {
    throw new SlotTakenError();
  }

  const bookings = getStoredBookings();
  const newBooking: Booking = {
    id: Date.now(),
    booking_id: generateBookingId(),
    doctor_id: doctor.id,
    doctor_name: doctor.name,
    doctor_spec: doctor.spec,
    appt_date: validDate,
    appt_time: time,
    patient_name: validName,
    phone: validPhone,
    email: validEmail,
    reason: (params.reason || '').trim(),
    status: 'Confirmed',
    remind_24h: 0,
    remind_2h: 0,
    created_at: new Date().toISOString(),
  };

  bookings.unshift(newBooking);
  saveStoredBookings(bookings);
  return newBooking;
}

// Find booking by ID and phone
export function findBookingByIdAndPhone(
  bookingIdRaw: string,
  phoneRaw: string,
): Booking | null {
  const cleanId = (bookingIdRaw || '').toUpperCase().replace(/[\s-]/g, '');
  const cleanPhone = (phoneRaw || '').replace(/\D/g, '');

  const bookings = getStoredBookings();
  for (const b of bookings) {
    const candidateId = b.booking_id.toUpperCase().replace(/[\s-]/g, '');
    const candidatePhone = b.phone.replace(/\D/g, '');
    if (candidateId === cleanId && candidatePhone.endsWith(cleanPhone.slice(-10))) {
      return b;
    }
  }
  return null;
}

// Update booking status
export function updateBookingStatus(
  bookingId: string,
  newStatus: BookingStatus,
  ownerDoctorId?: number,
): Booking {
  const bookings = getStoredBookings();
  const index = bookings.findIndex(
    (b) => b.booking_id.toUpperCase() === bookingId.toUpperCase(),
  );

  if (index === -1) {
    throw new BookingError(`Booking ${bookingId} not found`);
  }

  const booking = bookings[index];
  if (ownerDoctorId && booking.doctor_id !== ownerDoctorId) {
    throw new BookingError('Unauthorized: Doctor not assigned to this booking');
  }

  booking.status = newStatus;
  bookings[index] = booking;
  saveStoredBookings(bookings);
  return booking;
}

// Process due reminders simulation
export function processDueReminders(): {
  sent24h: number;
  sent2h: number;
  message: string;
} {
  const bookings = getStoredBookings();
  const now = new Date();
  let count24 = 0;
  let count2 = 0;

  for (const b of bookings) {
    if (b.status !== 'Confirmed') continue;
    const apptDateTime = new Date(`${b.appt_date}T${b.appt_time}:00`);
    const diffHours = (apptDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours <= 24 && diffHours > 2 && !b.remind_24h) {
      b.remind_24h = 1;
      count24++;
    }
    if (diffHours <= 2 && diffHours > 0 && !b.remind_2h) {
      b.remind_2h = 1;
      count2++;
    }
  }

  saveStoredBookings(bookings);
  const total = count24 + count2;
  const message =
    total > 0
      ? `Processed reminders: Sent ${count24} 24-hour reminder(s) and ${count2} 2-hour reminder(s) via WhatsApp & SMS.`
      : 'All confirmed appointments are currently up to date. No pending reminders due right now.';

  return { sent24h: count24, sent2h: count2, message };
}

// Check doctor demo password
export function verifyDoctorPassword(doctorId: number, inputPass: string): boolean {
  const doc = getDoctorById(doctorId);
  if (!doc) return false;
  const expected = doc.password || `citycare${doctorId}123`;
  return inputPass.trim() === expected;
}
