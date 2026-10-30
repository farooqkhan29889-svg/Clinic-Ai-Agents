import { PatientAccount, DoctorUser, DoctorSession, BookingStatus, Medication, Prescription, MedicalHistoryItem } from '../types/clinic';
import { DOCTORS_SEED } from '../data/clinicData';
import { PATIENT_PROFILES, getOrCreatePatientProfile } from '../data/patientPortalData';
import { getStoredBookings, saveStoredBookings, normalizePhone } from './storage';

const STORAGE_KEYS = {
  PATIENT_ACCOUNTS: 'citycare_patient_accounts',
  PATIENT_SESSION: 'citycare_active_patient_session',
  DOCTOR_SESSION: 'citycare_active_doctor_session',
  DOCTOR_STATUSES: 'citycare_doctor_statuses',
  CUSTOM_PATIENT_PROFILES: 'citycare_custom_patient_profiles',
  BIOMETRIC_PREFS: 'citycare_patient_biometrics',
};

// Seed Patient Accounts
const DEFAULT_PATIENT_ACCOUNTS: PatientAccount[] = [
  {
    phone: '9876543210',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@example.com',
    pin: '1234',
    dob: '1989-05-14',
    gender: 'Male',
    bloodGroup: 'B+',
    createdAt: '2025-01-15T10:00:00Z',
    lastLogin: '2026-10-29T09:30:00Z',
    biometricsEnabled: true,
    biometricType: 'faceId',
    lastBiometricLogin: '2026-10-29T09:30:00Z',
  },
  {
    phone: '9123456780',
    name: 'Pooja Verma',
    email: 'pooja.verma@example.com',
    pin: '1234',
    dob: '1994-11-28',
    gender: 'Female',
    bloodGroup: 'O+',
    createdAt: '2025-04-10T12:00:00Z',
    lastLogin: '2026-10-28T14:15:00Z',
    biometricsEnabled: false,
    biometricType: 'fingerprint',
  },
  {
    phone: '9811223344',
    name: 'Amit Sen',
    email: 'amit.sen@example.com',
    pin: '1234',
    dob: '1982-03-21',
    gender: 'Male',
    bloodGroup: 'A+',
    createdAt: '2025-06-20T16:30:00Z',
    lastLogin: '2026-10-25T11:00:00Z',
    biometricsEnabled: false,
    biometricType: 'both',
  },
];

// Seed Doctor Accounts with verified credentials
export const DOCTOR_ACCOUNTS: DoctorUser[] = [
  {
    id: 1,
    name: 'Dr. Misbah Ambar',
    spec: 'BHUMS (Homeopathic Medicine & Chronic Care)',
    email: 'misbah@citycare.com',
    phone: '+91 98765 43201',
    licenseNumber: 'MP-HOM-2018-492',
    cabinNumber: 'Cabin 101 · Ground Floor',
    status: 'On Duty',
    password: 'citycare1123',
  },
  {
    id: 2,
    name: 'Dr. Farooq',
    spec: 'MBBS (General Physician & Primary Care)',
    email: 'farooq@citycare.com',
    phone: '+91 98765 43202',
    licenseNumber: 'MP-MC-2015-881',
    cabinNumber: 'Cabin 102 · First Floor',
    status: 'On Duty',
    password: 'citycare2123',
  },
  {
    id: 3,
    name: 'Dr. Arshad',
    spec: 'Haddi Specialist (Orthopedics & Joint Care)',
    email: 'arshad@citycare.com',
    phone: '+91 98765 43203',
    licenseNumber: 'MP-ORTH-2013-104',
    cabinNumber: 'Cabin 103 · Ground Floor (Ortho Wing)',
    status: 'On Duty',
    password: 'citycare3123',
  },
];

// ================= PATIENT AUTHENTICATION =================

export function getPatientAccounts(): PatientAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PATIENT_ACCOUNTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  // Initialize with defaults
  try {
    localStorage.setItem(STORAGE_KEYS.PATIENT_ACCOUNTS, JSON.stringify(DEFAULT_PATIENT_ACCOUNTS));
  } catch {}
  return DEFAULT_PATIENT_ACCOUNTS;
}

export function savePatientAccounts(accounts: PatientAccount[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PATIENT_ACCOUNTS, JSON.stringify(accounts));
  } catch {}
}

export function getActivePatientSession(): PatientAccount | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PATIENT_SESSION);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function setActivePatientSession(account: PatientAccount | null): void {
  try {
    if (account) {
      localStorage.setItem(STORAGE_KEYS.PATIENT_SESSION, JSON.stringify(account));
    } else {
      localStorage.removeItem(STORAGE_KEYS.PATIENT_SESSION);
    }
  } catch {}
}

export function loginPatient(
  identifier: string,
  pin: string,
): { success: boolean; account?: PatientAccount; error?: string } {
  const accounts = getPatientAccounts();
  const trimmed = identifier.trim().toLowerCase();
  const cleanPhone = identifier.replace(/\D/g, '').slice(-10);

  const account = accounts.find((a) => {
    const aClean = a.phone.replace(/\D/g, '').slice(-10);
    return (
      (cleanPhone.length === 10 && aClean === cleanPhone) ||
      a.email.toLowerCase() === trimmed
    );
  });

  if (!account) {
    return {
      success: false,
      error: 'No patient record found with this phone number or email. Please register first or try demo credentials.',
    };
  }

  // Check PIN (accept stored pin or standard demo pin '1234' or 'patient123')
  const isValidPin =
    pin.trim() === account.pin ||
    pin.trim() === '1234' ||
    pin.trim() === 'patient123';

  if (!isValidPin) {
    return {
      success: false,
      error: 'Incorrect passcode/PIN. For demo testing, you can use PIN: 1234',
    };
  }

  account.lastLogin = new Date().toISOString();
  savePatientAccounts(accounts);
  setActivePatientSession(account);

  return { success: true, account };
}

export function registerPatient(params: {
  name: string;
  phone: string;
  email: string;
  pin: string;
  dob?: string;
  gender?: string;
  bloodGroup?: string;
}): { success: boolean; account?: PatientAccount; error?: string } {
  try {
    const validPhone = normalizePhone(params.phone);
    const accounts = getPatientAccounts();

    // Check if phone already registered
    const existing = accounts.find(
      (a) => a.phone.replace(/\D/g, '').slice(-10) === validPhone,
    );
    if (existing) {
      return {
        success: false,
        error: 'A patient account with this phone number already exists. Please log in instead.',
      };
    }

    if (!params.pin || params.pin.trim().length < 4) {
      return {
        success: false,
        error: 'Passcode/PIN must be at least 4 digits.',
      };
    }

    const newAccount: PatientAccount = {
      phone: validPhone,
      name: params.name.trim() || 'Valued Patient',
      email: (params.email || '').trim().toLowerCase() || `${validPhone}@patient.citycare.in`,
      pin: params.pin.trim(),
      dob: params.dob || '1995-01-01',
      gender: params.gender || 'Not specified',
      bloodGroup: params.bloodGroup || 'O+',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    accounts.push(newAccount);
    savePatientAccounts(accounts);
    setActivePatientSession(newAccount);

    // Initialize or prime profile
    getOrCreatePatientProfile(validPhone, newAccount.name);

    return { success: true, account: newAccount };
  } catch (err: any) {
    return { success: false, error: err.message || 'Registration failed' };
  }
}

export function sendSimulatedOtp(phone: string): { code: string; message: string } {
  const code = '482910';
  const clean = phone.replace(/\D/g, '').slice(-10);
  return {
    code,
    message: `A 6-digit one-time passcode has been sent to +91 ${clean || 'registered number'}. For instant testing, use: ${code}`,
  };
}

export function verifyOtpAndLogin(
  phone: string,
  otpCode: string,
): { success: boolean; account?: PatientAccount; error?: string } {
  if (otpCode.trim() !== '482910' && otpCode.trim() !== '123456') {
    return { success: false, error: 'Invalid verification code. Please check SMS or use 482910' };
  }

  const accounts = getPatientAccounts();
  const clean = phone.replace(/\D/g, '').slice(-10);
  let account = accounts.find((a) => a.phone.replace(/\D/g, '').slice(-10) === clean);

  if (!account) {
    // Auto-create basic patient account on successful OTP
    account = {
      phone: clean || '9876543210',
      name: 'Verified Patient',
      email: `${clean}@citycare.in`,
      pin: '1234',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    accounts.push(account);
    savePatientAccounts(accounts);
  } else {
    account.lastLogin = new Date().toISOString();
    savePatientAccounts(accounts);
  }

  setActivePatientSession(account);
  return { success: true, account };
}

// ================= BIOMETRIC AUTHENTICATION =================

export interface BiometricPreference {
  phone: string;
  enabled: boolean;
  type: 'faceId' | 'fingerprint' | 'both';
  enrolledAt: string;
  lastUsed?: string;
  deviceName?: string;
}

export function getAllBiometricPrefs(): Record<string, BiometricPreference> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BIOMETRIC_PREFS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    '9876543210': {
      phone: '9876543210',
      enabled: true,
      type: 'faceId',
      enrolledAt: '2025-01-15T10:00:00Z',
      lastUsed: '2026-10-29T09:30:00Z',
      deviceName: 'CityCare Secure Enclave (FaceID)',
    },
  };
}

export function saveAllBiometricPrefs(prefs: Record<string, BiometricPreference>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BIOMETRIC_PREFS, JSON.stringify(prefs));
  } catch {}
}

export function getBiometricSettings(phone: string): BiometricPreference {
  const clean = phone.replace(/\D/g, '').slice(-10);
  const all = getAllBiometricPrefs();
  if (all[clean]) {
    return all[clean];
  }
  // Check in accounts
  const accounts = getPatientAccounts();
  const acc = accounts.find((a) => a.phone.replace(/\D/g, '').slice(-10) === clean);
  const enabled = acc?.biometricsEnabled ?? false;
  const type = acc?.biometricType ?? 'faceId';
  return {
    phone: clean,
    enabled,
    type,
    enrolledAt: new Date().toISOString(),
    lastUsed: acc?.lastBiometricLogin,
    deviceName: type === 'faceId' ? 'FaceID Sensor' : 'TouchID / Fingerprint Sensor',
  };
}

export function setBiometricSettings(
  phone: string,
  enabled: boolean,
  type: 'faceId' | 'fingerprint' | 'both' = 'faceId',
): BiometricPreference {
  const clean = phone.replace(/\D/g, '').slice(-10);
  const all = getAllBiometricPrefs();
  const current = all[clean] || {
    phone: clean,
    enrolledAt: new Date().toISOString(),
  };

  const updated: BiometricPreference = {
    ...current,
    phone: clean,
    enabled,
    type,
    enrolledAt: current.enrolledAt || new Date().toISOString(),
    deviceName:
      type === 'faceId'
        ? 'FaceID Sensor (Camera / IR)'
        : type === 'fingerprint'
          ? 'TouchID / Fingerprint Sensor'
          : 'Biometric Enclave (FaceID + TouchID)',
  };

  all[clean] = updated;
  saveAllBiometricPrefs(all);

  // Sync with Patient Accounts
  const accounts = getPatientAccounts();
  const acc = accounts.find((a) => a.phone.replace(/\D/g, '').slice(-10) === clean);
  if (acc) {
    acc.biometricsEnabled = enabled;
    acc.biometricType = type;
    savePatientAccounts(accounts);
  }

  // Also sync active session if currently logged in
  const activeSession = getActivePatientSession();
  if (activeSession && activeSession.phone.replace(/\D/g, '').slice(-10) === clean) {
    activeSession.biometricsEnabled = enabled;
    activeSession.biometricType = type;
    setActivePatientSession(activeSession);
  }

  return updated;
}

export function getPrimaryBiometricAccount(): PatientAccount | null {
  const accounts = getPatientAccounts();
  const allPrefs = getAllBiometricPrefs();

  // Find an account that has biometrics explicitly enabled in prefs or account
  for (const acc of accounts) {
    const clean = acc.phone.replace(/\D/g, '').slice(-10);
    const pref = allPrefs[clean];
    if ((pref && pref.enabled) || acc.biometricsEnabled) {
      return acc;
    }
  }

  return accounts[0] || null;
}

export function loginWithBiometrics(
  phone: string,
): { success: boolean; account?: PatientAccount; error?: string } {
  const clean = phone.replace(/\D/g, '').slice(-10);
  const accounts = getPatientAccounts();
  const account = accounts.find((a) => a.phone.replace(/\D/g, '').slice(-10) === clean);

  if (!account) {
    return {
      success: false,
      error: 'No patient record found for biometric authentication.',
    };
  }

  const now = new Date().toISOString();
  account.lastLogin = now;
  account.lastBiometricLogin = now;
  savePatientAccounts(accounts);
  setActivePatientSession(account);

  // Update prefs last used
  const allPrefs = getAllBiometricPrefs();
  if (allPrefs[clean]) {
    allPrefs[clean].lastUsed = now;
    saveAllBiometricPrefs(allPrefs);
  }

  return { success: true, account };
}

// ================= DOCTOR AUTHENTICATION =================

export function getStoredDoctorStatuses(): Record<number, 'On Duty' | 'In Consultation' | 'Off Duty'> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DOCTOR_STATUSES);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { 1: 'On Duty', 2: 'On Duty', 3: 'On Duty' };
}

export function setStoredDoctorStatus(
  doctorId: number,
  status: 'On Duty' | 'In Consultation' | 'Off Duty',
): void {
  try {
    const curr = getStoredDoctorStatuses();
    curr[doctorId] = status;
    localStorage.setItem(STORAGE_KEYS.DOCTOR_STATUSES, JSON.stringify(curr));
  } catch {}
}

export function getActiveDoctorSession(): DoctorSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DOCTOR_SESSION);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function setActiveDoctorSession(session: DoctorSession | null): void {
  try {
    if (session) {
      localStorage.setItem(STORAGE_KEYS.DOCTOR_SESSION, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEYS.DOCTOR_SESSION);
    }
  } catch {}
}

export function loginDoctor(
  doctorIdentifier: string | number,
  inputPasswordOrPin: string,
): { success: boolean; doctor?: DoctorUser; session?: DoctorSession; error?: string } {
  const trimmedInput = inputPasswordOrPin.trim();
  let doctor: DoctorUser | undefined;

  if (typeof doctorIdentifier === 'number') {
    doctor = DOCTOR_ACCOUNTS.find((d) => d.id === doctorIdentifier);
  } else {
    const idNum = Number(doctorIdentifier);
    if (!isNaN(idNum) && idNum > 0) {
      doctor = DOCTOR_ACCOUNTS.find((d) => d.id === idNum);
    } else {
      const email = doctorIdentifier.trim().toLowerCase();
      doctor = DOCTOR_ACCOUNTS.find((d) => d.email.toLowerCase() === email);
    }
  }

  if (!doctor) {
    return {
      success: false,
      error: 'Doctor ID or clinic email not recognized. Please select a doctor from the directory.',
    };
  }

  // Verify doctor password / PIN:
  // Accepts doctor specific password ('citycare1123'), doctor PIN ('1234'), or master doctor PIN ('0000')
  const validPassword = doctor.password || `citycare${doctor.id}123`;
  const isMatch =
    trimmedInput === validPassword ||
    trimmedInput === '1234' ||
    trimmedInput === 'doctor123' ||
    trimmedInput === '0000';

  if (!isMatch) {
    return {
      success: false,
      error: `Invalid doctor password. Prototype password for ${doctor.name} is "${validPassword}" or quick PIN: 1234.`,
    };
  }

  // Create session
  const session: DoctorSession = {
    doctorId: doctor.id,
    doctorName: doctor.name,
    email: doctor.email,
    loginTime: new Date().toISOString(),
    cabinNumber: doctor.cabinNumber,
  };

  setActiveDoctorSession(session);
  return { success: true, doctor, session };
}

// ================= CLINICAL INTERACTION (DOCTOR <-> PATIENT) =================

// Doctor updates booking status and optionally logs clinical consultation notes
export function updateBookingByDoctor(params: {
  bookingId: string;
  doctorId: number;
  newStatus: BookingStatus;
  clinicalNotes?: string;
  diagnosis?: string;
  cancellationReason?: string;
}): { success: boolean; booking?: any; error?: string } {
  try {
    const bookings = getStoredBookings();
    const idx = bookings.findIndex(
      (b) => b.booking_id.toUpperCase() === params.bookingId.toUpperCase(),
    );

    if (idx === -1) {
      return { success: false, error: `Booking ${params.bookingId} not found.` };
    }

    const booking = bookings[idx];
    if (booking.doctor_id !== params.doctorId) {
      return {
        success: false,
        error: 'Authorization error: You are only permitted to update appointments assigned to you.',
      };
    }

    booking.status = params.newStatus;
    if (params.clinicalNotes) {
      booking.clinical_notes = params.clinicalNotes;
    }
    if (params.diagnosis) {
      booking.diagnosis = params.diagnosis;
    }
    if (params.cancellationReason) {
      booking.cancellation_reason = params.cancellationReason;
    }

    bookings[idx] = booking;
    saveStoredBookings(bookings);

    // If marked Completed and has clinical notes/diagnosis, also synchronize into Patient Profile Medical History
    if (params.newStatus === 'Completed' && (params.diagnosis || params.clinicalNotes)) {
      syncAppointmentToPatientHistory(booking);
    }

    return { success: true, booking };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update booking' };
  }
}

// Doctor issues e-Prescription directly to the patient
export function issuePrescriptionFromDoctor(params: {
  bookingId: string;
  doctorId: number;
  patientPhone: string;
  medication: {
    name: string;
    form?: any;
    dosage: string;
    frequency: string;
    duration: string;
    timing: string;
    instructions: string;
    precautions?: string;
  };
  doctorNotes?: string;
}): { success: boolean; prescription?: Prescription; error?: string } {
  try {
    const doc = DOCTOR_ACCOUNTS.find((d) => d.id === params.doctorId) || DOCTORS_SEED.find((d) => d.id === params.doctorId);
    if (!doc) return { success: false, error: 'Doctor not found' };

    const cleanPhone = params.patientPhone.replace(/\D/g, '').slice(-10);
    const profile = getOrCreatePatientProfile(cleanPhone);

    const newPrescription: Prescription = {
      id: `RX-DOC-${Date.now().toString().slice(-6)}`,
      prescriptionNumber: `CC-RX-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      doctorName: doc.name,
      doctorSpec: doc.spec,
      active: true,
      status: 'Active',
      refillsRemaining: 1,
      indication: 'Prescribed during clinic consultation',
      pharmacy: {
        name: 'CityCare In-House Pharmacy',
        phone: '+91 87704 65561',
        address: 'Ground Floor, CityCare Medical Complex',
      },
      doctorNotes: params.doctorNotes || 'Take medications exactly as directed with adequate water.',
      medications: [
        {
          name: params.medication.name,
          form: params.medication.form || 'Tablet',
          dosage: params.medication.dosage,
          frequency: params.medication.frequency,
          duration: params.medication.duration,
          timing: params.medication.timing,
          route: 'Oral',
          purpose: 'Prescribed treatment regimen',
          scheduleTimes: ['09:00 AM', '09:00 PM'],
          schedule: { morning: true, afternoon: false, evening: false, night: true },
          instructions: params.medication.instructions,
          precautions: params.medication.precautions || 'Consult doctor if symptoms persist.',
        },
      ],
    };

    // Prepend to patient profile's prescriptions
    if (!profile.prescriptions) profile.prescriptions = [];
    profile.prescriptions.unshift(newPrescription);

    // Also update booking record with medication summary
    const bookings = getStoredBookings();
    const bIdx = bookings.findIndex((b) => b.booking_id === params.bookingId);
    if (bIdx !== -1) {
      if (!bookings[bIdx].prescribed_medications) {
        bookings[bIdx].prescribed_medications = [];
      }
      bookings[bIdx].prescribed_medications?.push(
        `${params.medication.name} (${params.medication.dosage})`,
      );
      saveStoredBookings(bookings);
    }

    return { success: true, prescription: newPrescription };
  } catch (err: any) {
    return { success: false, error: err.message || 'Prescription creation failed' };
  }
}

function syncAppointmentToPatientHistory(booking: any): void {
  try {
    const cleanPhone = booking.phone.replace(/\D/g, '').slice(-10);
    const profile = getOrCreatePatientProfile(cleanPhone);

    const historyItem: MedicalHistoryItem = {
      id: `MH-VISIT-${booking.booking_id}`,
      date: booking.appt_date,
      doctorName: booking.doctor_name,
      doctorSpec: booking.doctor_spec || 'Consulting Physician',
      diagnosis: booking.diagnosis || 'Outpatient Clinical Consultation',
      visitType: 'Consultation',
      notes: booking.clinical_notes || `Consultation concluded for reason: ${booking.reason || 'General wellness'}.`,
      vitals: {
        bloodPressure: '120/80 mmHg',
        heartRate: '74 bpm',
        temperature: '98.6°F',
      },
    };

    // Prepend to medical history if not already present
    const exists = profile.medicalHistory.some((m) => m.id === historyItem.id);
    if (!exists) {
      profile.medicalHistory.unshift(historyItem);
    }
  } catch {
    // ignore
  }
}
