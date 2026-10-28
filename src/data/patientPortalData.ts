import { PatientProfile } from '../types/clinic';

export const PATIENT_PROFILES: Record<string, PatientProfile> = {
  '9876543210': {
    id: 'P-10821',
    name: 'Rahul Sharma',
    phone: '9876543210',
    email: 'rahul.sharma@example.com',
    dob: '1989-05-14',
    gender: 'Male',
    bloodGroup: 'B+',
    allergies: ['Penicillin', 'Dust mites'],
    medicalHistory: [
      {
        id: 'MH-301',
        date: '2026-10-18',
        doctorName: 'Dr. Misbah Ambar',
        doctorSpec: 'BHUMS',
        diagnosis: 'Seasonal Allergic Rhinitis & Sinus Congestion',
        visitType: 'Consultation',
        notes:
          'Patient presented with sneezing, watery eyes, and morning sinus headache. Advised warm steam inhalation and constitutional homeopathic regimen. Follow-up scheduled in 2 weeks.',
        vitals: {
          bloodPressure: '120/80 mmHg',
          heartRate: '72 bpm',
          temperature: '98.6°F',
          weight: '71 kg',
          spO2: '99%',
        },
        followUpDate: '2026-11-01',
      },
      {
        id: 'MH-240',
        date: '2026-08-22',
        doctorName: 'Dr. Farooq',
        doctorSpec: 'MBBS',
        diagnosis: 'Acute Upper Respiratory Tract Infection',
        visitType: 'Consultation',
        notes:
          'Mild throat inflammation, clear lung fields, no wheeze. Prescribed 5-day symptomatic care and hydration therapy.',
        vitals: {
          bloodPressure: '122/82 mmHg',
          heartRate: '78 bpm',
          temperature: '99.4°F',
          weight: '72 kg',
          spO2: '98%',
        },
      },
      {
        id: 'MH-180',
        date: '2026-03-10',
        doctorName: 'Dr. Arshad',
        doctorSpec: 'Haddi Specialist',
        diagnosis: 'Right Ankle Lateral Ligament Sprain (Grade 1)',
        visitType: 'Specialist Evaluation',
        notes:
          'Occurred during evening badminton. No bony tenderness or fracture on clinical palpation. Crepe bandage support and cold compression advised.',
        vitals: {
          bloodPressure: '118/76 mmHg',
          heartRate: '70 bpm',
          temperature: '98.4°F',
          weight: '73 kg',
        },
      },
    ],
    labResults: [
      {
        id: 'LR-8901',
        testName: 'Complete Blood Count (CBC) with Differential',
        category: 'Hematology',
        date: '2026-10-19',
        orderedBy: 'Dr. Misbah Ambar',
        status: 'Normal',
        value: '14.2',
        referenceRange: '13.0 - 17.0',
        unit: 'g/dL (Hemoglobin)',
        summary: 'Normal red blood cell count and platelet indices. Mild eosinophilia (5.8%) noted consistent with seasonal allergy history.',
        labTechnician: 'CityCare Diagnostic Desk',
      },
      {
        id: 'LR-7420',
        testName: 'Serum Total IgE (Allergy Marker)',
        category: 'Biochemistry',
        date: '2026-10-19',
        orderedBy: 'Dr. Misbah Ambar',
        status: 'Attention',
        value: '240',
        referenceRange: '< 100',
        unit: 'IU/mL',
        summary: 'Elevated serum IgE indicating active allergic response to environmental allergens.',
        labTechnician: 'PathCare Lab Partner',
      },
      {
        id: 'LR-6102',
        testName: 'Digital X-Ray Right Ankle (AP & Lateral View)',
        category: 'Radiology',
        date: '2026-03-10',
        orderedBy: 'Dr. Arshad',
        status: 'Normal',
        value: 'No Fracture',
        referenceRange: 'Intact cortex & joint space',
        unit: 'Film',
        summary: 'Bony architecture is preserved. No cortical break or joint effusion detected. Soft tissue swelling over lateral malleolus.',
        labTechnician: 'Dr. R. Sharma (Consultant Radiologist)',
      },
    ],
    prescriptions: [
      {
        id: 'RX-9081',
        prescriptionNumber: 'CC-RX-2026-9081',
        date: '2026-10-18',
        doctorName: 'Dr. Misbah Ambar',
        doctorSpec: 'BHUMS',
        active: true,
        refillsRemaining: 1,
        doctorNotes: 'Take medicines 15 minutes before meals. Avoid strong coffee or mint during treatment.',
        medications: [
          {
            name: 'Allium Cepa 30C',
            dosage: '4 pills',
            frequency: 'Thrice daily',
            duration: '14 days',
            instructions: 'Sublingual, dissolve under tongue',
          },
          {
            name: 'Euphrasia Eye Drops',
            dosage: '2 drops',
            frequency: 'Twice daily',
            duration: '7 days',
            instructions: 'In each eye for redness or watering',
          },
          {
            name: 'Saline Nasal Mist',
            dosage: '1 puff per nostril',
            frequency: 'Morning & Night',
            duration: '21 days',
            instructions: 'Use warm distilled water spray to clear nasal passage',
          },
        ],
      },
      {
        id: 'RX-7731',
        prescriptionNumber: 'CC-RX-2026-7731',
        date: '2026-08-22',
        doctorName: 'Dr. Farooq',
        doctorSpec: 'MBBS',
        active: false,
        refillsRemaining: 0,
        doctorNotes: 'Completed course. Keep well hydrated.',
        medications: [
          {
            name: 'Paracetamol 650mg',
            dosage: '1 tablet',
            frequency: 'As needed for fever (max 3/day)',
            duration: '3 days',
            instructions: 'Take with food and plenty of water',
          },
          {
            name: 'Cetirizine 10mg',
            dosage: '1 tablet',
            frequency: 'Once daily at bedtime',
            duration: '5 days',
            instructions: 'May cause mild drowsiness',
          },
        ],
      },
    ],
  },

  '9123456780': {
    id: 'P-10944',
    name: 'Pooja Verma',
    phone: '9123456780',
    email: 'pooja.verma@example.com',
    dob: '1994-11-28',
    gender: 'Female',
    bloodGroup: 'O+',
    allergies: ['Sulfa drugs'],
    medicalHistory: [
      {
        id: 'MH-412',
        date: '2026-10-25',
        doctorName: 'Dr. Farooq',
        doctorSpec: 'MBBS',
        diagnosis: 'Mild Essential Hypertension & Work Stress',
        visitType: 'Consultation',
        notes:
          'Routine health check showed elevated seated BP 138/88 mmHg. Discussed DASH dietary modifications, lowering sodium intake, and 30-minute daily brisk walking.',
        vitals: {
          bloodPressure: '138/88 mmHg',
          heartRate: '82 bpm',
          temperature: '98.4°F',
          weight: '62 kg',
          spO2: '99%',
        },
      },
    ],
    labResults: [
      {
        id: 'LR-9110',
        testName: 'Lipid Profile & Serum Glucose Fasting',
        category: 'Biochemistry',
        date: '2026-10-26',
        orderedBy: 'Dr. Farooq',
        status: 'Normal',
        value: 'Fasting Sugar: 92',
        referenceRange: '70 - 100',
        unit: 'mg/dL',
        summary: 'Fasting blood glucose normal. Total cholesterol: 182 mg/dL (Normal < 200). HDL: 52 mg/dL. Triglycerides: 138 mg/dL.',
        labTechnician: 'CityCare Diagnostic Desk',
      },
    ],
    prescriptions: [
      {
        id: 'RX-9820',
        prescriptionNumber: 'CC-RX-2026-9820',
        date: '2026-10-25',
        doctorName: 'Dr. Farooq',
        doctorSpec: 'MBBS',
        active: true,
        refillsRemaining: 2,
        doctorNotes: 'Monitor home blood pressure weekly in the morning. Re-evaluate in 4 weeks.',
        medications: [
          {
            name: 'Coenzyme Q10 + Magnesium Complex',
            dosage: '1 capsule',
            frequency: 'Once daily after breakfast',
            duration: '30 days',
            instructions: 'Nutritional supplement for cardiovascular support',
          },
        ],
      },
    ],
  },
};

// Fallback profile generator for any other phone number
export function getOrCreatePatientProfile(phone: string, name?: string): PatientProfile {
  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  if (PATIENT_PROFILES[cleanPhone]) {
    return PATIENT_PROFILES[cleanPhone];
  }

  // Create demo record
  return {
    id: `P-${cleanPhone.slice(-4) || '1001'}`,
    name: name || 'CityCare Patient',
    phone: cleanPhone,
    email: '',
    dob: '1992-07-15',
    gender: 'Patient',
    bloodGroup: 'O+',
    allergies: ['None recorded'],
    medicalHistory: [
      {
        id: 'MH-NEW',
        date: new Date().toISOString().split('T')[0],
        doctorName: 'Dr. Farooq',
        doctorSpec: 'MBBS',
        diagnosis: 'General Health Assessment & Vitals Review',
        visitType: 'Consultation',
        notes: 'Initial clinical assessment recorded at CityCare Clinic. Vitals within standard healthy limits.',
        vitals: {
          bloodPressure: '120/80 mmHg',
          heartRate: '74 bpm',
          temperature: '98.6°F',
          weight: '68 kg',
          spO2: '99%',
        },
      },
    ],
    labResults: [
      {
        id: 'LR-NEW',
        testName: 'General Metabolic & Vitals Screening',
        category: 'Biochemistry',
        date: new Date().toISOString().split('T')[0],
        orderedBy: 'Dr. Farooq',
        status: 'Normal',
        value: 'Normal Range',
        referenceRange: 'Standard',
        unit: 'Index',
        summary: 'All baseline outpatient diagnostic indicators are within physiological limits.',
        labTechnician: 'CityCare Diagnostic Desk',
      },
    ],
    prescriptions: [
      {
        id: 'RX-NEW',
        prescriptionNumber: `CC-RX-2026-${cleanPhone.slice(-4)}`,
        date: new Date().toISOString().split('T')[0],
        doctorName: 'Dr. Farooq',
        doctorSpec: 'MBBS',
        active: true,
        refillsRemaining: 1,
        doctorNotes: 'Maintain regular hydration and scheduled clinic follow-up.',
        medications: [
          {
            name: 'Vitamin D3 & Calcium Supplement',
            dosage: '1 tablet',
            frequency: 'Once weekly',
            duration: '8 weeks',
            instructions: 'Take with milk or meal',
          },
        ],
      },
    ],
  };
}
