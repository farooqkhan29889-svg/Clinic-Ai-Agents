export interface Doctor {
  id: number;
  name: string;
  spec: string;
  exp?: number | null;
  fee: number;
  color: string;
  about: string;
  slots: string[];
  is_active: number;
  password?: string;
}

export type BookingStatus = 'Confirmed' | 'Completed' | 'Cancelled';

export interface Booking {
  id: number;
  booking_id: string;
  doctor_id: number;
  doctor_name: string;
  doctor_spec?: string;
  appt_date: string; // YYYY-MM-DD
  appt_time: string; // e.g. "10:15"
  patient_name: string;
  phone: string;
  email?: string;
  reason?: string;
  status: BookingStatus;
  remind_24h: number;
  remind_2h: number;
  created_at: string;
}

export interface ClinicInfo {
  name: string;
  phone: string;
  address: string;
  hours: string;
  sunday: string;
}

export interface ChatAction {
  t: string; // Display text
  m: string; // Action message or payload
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  actions?: ChatAction[];
  timestamp: string;
}

// Patient Portal Records
export interface Vitals {
  bloodPressure?: string;
  heartRate?: string;
  temperature?: string;
  weight?: string;
  spO2?: string;
}

export interface MedicalHistoryItem {
  id: string;
  date: string;
  doctorName: string;
  doctorSpec: string;
  diagnosis: string;
  visitType: 'Consultation' | 'Follow-up' | 'Routine Checkup' | 'Specialist Evaluation';
  notes: string;
  vitals?: Vitals;
  followUpDate?: string;
}

export interface LabResult {
  id: string;
  testName: string;
  category: 'Hematology' | 'Biochemistry' | 'Radiology' | 'Pathology';
  date: string;
  orderedBy: string;
  status: 'Normal' | 'Attention' | 'Pending';
  value: string;
  referenceRange: string;
  unit: string;
  summary: string;
  labTechnician: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface Prescription {
  id: string;
  prescriptionNumber: string;
  date: string;
  doctorName: string;
  doctorSpec: string;
  medications: Medication[];
  doctorNotes: string;
  active: boolean;
  refillsRemaining: number;
}

export interface PatientProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  dob: string;
  gender: string;
  bloodGroup: string;
  allergies: string[];
  medicalHistory: MedicalHistoryItem[];
  labResults: LabResult[];
  prescriptions: Prescription[];
}

export interface PatientFeedback {
  id: string;
  patientName: string;
  patientPhone: string;
  targetType: 'doctor' | 'service';
  targetName: string;
  doctorId?: number;
  rating: number; // 1 to 5
  comment: string;
  date: string;
  tags: string[];
  helpfulCount: number;
  isVerified: boolean;
}

export type NavTab =
  | 'Home'
  | 'Our doctors'
  | 'Services'
  | 'Appointments'
  | 'Patient portal'
  | 'Contact'
  | 'Assistant'
  | 'Staff';
