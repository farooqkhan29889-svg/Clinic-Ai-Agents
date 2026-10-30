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

export type BookingStatus = 'Confirmed' | 'In-Consultation' | 'Completed' | 'Cancelled';

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
  clinical_notes?: string;
  diagnosis?: string;
  cancellation_reason?: string;
  prescribed_medications?: string[];
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
  form?: 'Tablet' | 'Capsule' | 'Syrup' | 'Drops' | 'Inhaler' | 'Injection' | 'Ointment' | 'Pills' | 'Nasal Spray';
  route?: string;
  timing?: string;
  purpose?: string;
  scheduleTimes?: string[];
  schedule?: {
    morning?: boolean;
    afternoon?: boolean;
    evening?: boolean;
    night?: boolean;
  };
  sideEffectsWarning?: string;
  precautions?: string;
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
  status?: 'Active' | 'Completed' | 'Discontinued';
  startDate?: string;
  endDate?: string;
  completedDate?: string;
  indication?: string;
  pharmacy?: {
    name: string;
    phone: string;
    address: string;
  };
  discontinuationReason?: string;
}

export interface HealthTrendPoint {
  id: string;
  date: string;
  systolic: number;
  diastolic: number;
  heartRate: number;
  totalCholesterol: number;
  ldl: number;
  hdl: number;
  triglycerides: number;
  fastingGlucose: number;
  spO2?: number;
  weight?: number;
  notes?: string;
  recordedBy?: string;
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
  healthTrends?: HealthTrendPoint[];
  biometricsEnabled?: boolean;
  biometricType?: 'faceId' | 'fingerprint' | 'both';
  lastBiometricLogin?: string;
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

export interface PatientAccount {
  phone: string;
  name: string;
  email: string;
  pin: string;
  dob?: string;
  gender?: string;
  bloodGroup?: string;
  createdAt: string;
  lastLogin?: string;
  biometricsEnabled?: boolean;
  biometricType?: 'faceId' | 'fingerprint' | 'both';
  lastBiometricLogin?: string;
}

export interface DoctorUser {
  id: number;
  name: string;
  spec: string;
  email: string;
  phone: string;
  licenseNumber: string;
  cabinNumber: string;
  status: 'On Duty' | 'In Consultation' | 'Off Duty';
  password?: string;
}

export interface DoctorSession {
  doctorId: number;
  doctorName: string;
  email: string;
  loginTime: string;
  cabinNumber: string;
}

export interface LabTestParameter {
  name: string;
  standardRange: string;
  unit: string;
  description?: string;
}

export interface LabTest {
  id: string;
  code: string;
  name: string;
  category: 'Hematology' | 'Biochemistry' | 'Diabetes' | 'Cardiology' | 'Hormones' | 'Preventive Panels' | 'Imaging & ECG';
  price: number;
  originalPrice?: number;
  turnaroundTime: string;
  fastingRequired: boolean;
  fastingDuration?: string;
  sampleType: string;
  description: string;
  parametersCount: number;
  parameters: LabTestParameter[];
  popular?: boolean;
  clinicalSignificance: string;
}

export interface LabReportParameterResult {
  name: string;
  value: number | string;
  unit: string;
  referenceRange: string;
  minNormal?: number;
  maxNormal?: number;
  status: 'Normal' | 'Borderline' | 'Elevated' | 'Low' | 'Critical';
}

export interface LabReportDetail {
  testId: string;
  testName: string;
  category: string;
  parameters: LabReportParameterResult[];
  pathologistNotes: string;
  verifiedBy: string;
  labDirector: string;
}

export interface LabOrder {
  id: string;
  bookingCode: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  patientGender?: string;
  patientAge?: number;
  tests: LabTest[];
  collectionType: 'Home Sample Collection' | 'Clinic Walk-in Lab';
  address?: string;
  date: string;
  timeSlot: string;
  totalAmount: number;
  paymentStatus: 'Paid Online' | 'Pay at Collection';
  status: 'Order Confirmed' | 'Sample Collected' | 'In Processing' | 'Results Ready' | 'Cancelled';
  createdAt: string;
  phlebotomistName?: string;
  reportReadyDate?: string;
  reportDetails?: LabReportDetail[];
  barcode?: string;
}

export interface TelehealthSession {
  id: string;
  patientName: string;
  doctorName: string;
  doctorSpec: string;
  scheduledTime: string;
  status: 'Waiting' | 'Connected' | 'Completed';
  meetingUrl: string;
  vitals?: Vitals;
}

export type NavTab =
  | 'Home'
  | 'Our doctors'
  | 'Services'
  | 'Diagnostics'
  | 'Appointments'
  | 'Patient portal'
  | 'Doctor portal'
  | 'Telehealth'
  | 'Contact'
  | 'Assistant'
  | 'Staff';

