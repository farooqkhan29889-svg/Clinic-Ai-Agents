import { ClinicInfo, Doctor, Booking } from '../types/clinic';

export const CLINIC: ClinicInfo = {
  name: 'CityCare Clinic',
  phone: '+91 87704 65561',
  address: 'Shop No. 4, near Saeed Colony, Housing Board, Karond, Bhopal',
  hours: 'Mon - Sat: 9:00 AM - 8:00 PM',
  sunday: 'Closed',
};

export const DOCTORS_SEED: Doctor[] = [
  {
    id: 1,
    name: 'Dr. Misbah Ambar',
    spec: 'BHUMS',
    exp: 6,
    fee: 300,
    color: '#cd5f37',
    about: 'Clinic consultation, general homeopathy, chronic care and wellness.',
    slots: ['09:30', '10:15', '11:00', '12:30', '14:30', '16:00', '17:30'],
    is_active: 1,
    password: 'citycare1123',
  },
  {
    id: 2,
    name: 'Dr. Farooq',
    spec: 'MBBS',
    exp: 8,
    fee: 500,
    color: '#8b3f25',
    about: 'Clinic consultation, primary care, internal medicine and preventive health.',
    slots: ['10:00', '11:30', '15:00', '17:30'],
    is_active: 1,
    password: 'citycare2123',
  },
  {
    id: 3,
    name: 'Dr. Arshad',
    spec: 'Haddi Specialist',
    exp: 10,
    fee: 400,
    color: '#b56a48',
    about: 'Bone, joint & musculoskeletal consultation, sports trauma and arthritis care.',
    slots: ['09:00', '10:30', '13:30', '15:30', '18:00'],
    is_active: 1,
    password: 'citycare3123',
  },
];

// Helper to get formatted dates
const getRelativeDate = (daysFromNow: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
};

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 1,
    booking_id: 'CC-10842',
    doctor_id: 1,
    doctor_name: 'Dr. Misbah Ambar',
    doctor_spec: 'BHUMS',
    appt_date: getRelativeDate(0),
    appt_time: '10:15',
    patient_name: 'Rahul Sharma',
    phone: '9876543210',
    email: 'rahul.sharma@example.com',
    reason: 'Seasonal allergy follow-up and prescription review',
    status: 'Confirmed',
    remind_24h: 1,
    remind_2h: 0,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 2,
    booking_id: 'CC-10955',
    doctor_id: 2,
    doctor_name: 'Dr. Farooq',
    doctor_spec: 'MBBS',
    appt_date: getRelativeDate(0),
    appt_time: '11:30',
    patient_name: 'Pooja Verma',
    phone: '9123456780',
    email: 'pooja.verma@example.com',
    reason: 'Mild fever and blood pressure checkup',
    status: 'Confirmed',
    remind_24h: 1,
    remind_2h: 1,
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 3,
    booking_id: 'CC-10319',
    doctor_id: 3,
    doctor_name: 'Dr. Arshad',
    doctor_spec: 'Haddi Specialist',
    appt_date: getRelativeDate(1),
    appt_time: '10:30',
    patient_name: 'Mohammad Tariq',
    phone: '8765432109',
    email: '',
    reason: 'Knee joint pain after morning jogging',
    status: 'Confirmed',
    remind_24h: 0,
    remind_2h: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: 4,
    booking_id: 'CC-10118',
    doctor_id: 1,
    doctor_name: 'Dr. Misbah Ambar',
    doctor_spec: 'BHUMS',
    appt_date: getRelativeDate(-1),
    appt_time: '09:30',
    patient_name: 'Anjali Gupta',
    phone: '9988776655',
    email: 'anjali.g@example.com',
    reason: 'Skin rash consultation',
    status: 'Completed',
    remind_24h: 1,
    remind_2h: 1,
    created_at: new Date(Date.now() - 259200000).toISOString(),
  },
];

export const CLINIC_FAQS = [
  {
    question: 'How do I book an appointment?',
    answer:
      'Open the Appointments page, choose your preferred clinic doctor, select an upcoming date and sample time, enter your name and 10-digit mobile number, and submit. You will receive an instant booking reference.',
  },
  {
    question: 'Are the displayed appointment times live?',
    answer:
      'The displayed time slots are sample schedule data for this prototype. When booked, the app dynamically locks the slot so no two patients can claim the same doctor/time combination.',
  },
  {
    question: 'How do I change or cancel a booking?',
    answer:
      'You can use the CityCare AI Assistant with your booking reference and mobile number (select "Manage a booking"), or call the clinic desk directly at +91 87704 65561.',
  },
  {
    question: 'Does the clinic assistant provide medical advice or prescriptions?',
    answer:
      'No. The assistant helps with clinic information, appointment scheduling, doctor fees, and cancellation support. For medical diagnosis, please consult our doctors in person. In case of an emergency, contact local emergency services immediately.',
  },
  {
    question: 'What are the clinic consultation fees?',
    answer:
      'All consultation fees are transparently listed upfront: Dr. Misbah Ambar (BHUMS) is ₹300, Dr. Farooq (MBBS) is ₹500, and Dr. Arshad (Haddi Specialist) is ₹400.',
  },
  {
    question: 'Where is the clinic located and what are the working hours?',
    answer:
      'CityCare Clinic is located at Shop No. 4, near Saeed Colony, Housing Board, Karond, Bhopal. We are open Monday to Saturday from 9:00 AM to 8:00 PM. We are closed on Sundays.',
  },
];
