import { PatientFeedback } from '../types/clinic';

const STORAGE_KEY = 'citycare_feedback';

export const INITIAL_FEEDBACK: PatientFeedback[] = [
  {
    id: 'FB-101',
    patientName: 'Rahul Sharma',
    patientPhone: '9876543210',
    targetType: 'doctor',
    targetName: 'Dr. Misbah Ambar (BHUMS)',
    doctorId: 1,
    rating: 5,
    comment:
      'Dr. Misbah was exceptionally attentive to my seasonal allergy symptoms. The constitutional homeopathic drops cleared my nasal congestion within 4 days without any drowsy side effects.',
    date: '2026-10-20',
    tags: ['Attentive listener', 'Effective treatment', 'Gentle care'],
    helpfulCount: 7,
    isVerified: true,
  },
  {
    id: 'FB-102',
    patientName: 'Pooja Verma',
    patientPhone: '9123456780',
    targetType: 'doctor',
    targetName: 'Dr. Farooq (MBBS)',
    doctorId: 2,
    rating: 5,
    comment:
      'Dr. Farooq took ample time to explain my blood pressure readings and suggested clear dietary tweaks alongside medication. Highly skilled and reassuring physician.',
    date: '2026-10-26',
    tags: ['Detailed explanation', 'Accurate diagnosis', 'Punctual'],
    helpfulCount: 4,
    isVerified: true,
  },
  {
    id: 'FB-103',
    patientName: 'Mohammad Tariq',
    patientPhone: '8765432109',
    targetType: 'doctor',
    targetName: 'Dr. Arshad (Haddi Specialist)',
    doctorId: 3,
    rating: 5,
    comment:
      'Consulted Dr. Arshad for knee joint pain. He carefully checked the mobility, reviewed the digital X-ray on the spot, and prescribed an exercise plan that worked wonders.',
    date: '2026-10-15',
    tags: ['Bone specialist', 'Great diagnosis', 'Prompt relief'],
    helpfulCount: 6,
    isVerified: true,
  },
  {
    id: 'FB-104',
    patientName: 'Anjali Gupta',
    patientPhone: '9988776655',
    targetType: 'service',
    targetName: 'Appointment Booking & Reception Desk',
    rating: 5,
    comment:
      'The online booking system and WhatsApp confirmation made the clinic visit so smooth. Zero waiting queue upon arrival and clean sanitised consultation rooms.',
    date: '2026-10-12',
    tags: ['Quick booking', 'Clean clinic', 'Polite staff'],
    helpfulCount: 5,
    isVerified: true,
  },
];

export function getStoredFeedback(): PatientFeedback[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch {
    // fallback
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_FEEDBACK));
  } catch {
    // ignore
  }
  return INITIAL_FEEDBACK;
}

export function saveStoredFeedback(feedbackList: PatientFeedback[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(feedbackList));
  } catch {
    // ignore
  }
}

export function addFeedback(newFeedback: Omit<PatientFeedback, 'id' | 'date' | 'helpfulCount'>): PatientFeedback {
  const current = getStoredFeedback();
  const created: PatientFeedback = {
    ...newFeedback,
    id: `FB-${Math.floor(100 + Math.random() * 900)}`,
    date: new Date().toISOString().split('T')[0],
    helpfulCount: 0,
  };

  const updated = [created, ...current];
  saveStoredFeedback(updated);
  return created;
}

export function toggleHelpfulFeedback(feedbackId: string): PatientFeedback[] {
  const current = getStoredFeedback();
  const updated = current.map((fb) => {
    if (fb.id === feedbackId) {
      return { ...fb, helpfulCount: fb.helpfulCount + 1 };
    }
    return fb;
  });
  saveStoredFeedback(updated);
  return updated;
}
