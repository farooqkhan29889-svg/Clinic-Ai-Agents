import React, { useState } from 'react';
import { DOCTORS_SEED } from '../data/clinicData';
import {
  Activity,
  Check,
  X,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Calendar,
} from 'lucide-react';

interface SymptomTriageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDoctor: (doctorId: number) => void;
}

interface SymptomCategory {
  label: string;
  symptoms: string[];
  recommendedDoctorId: number;
  reason: string;
}

const SYMPTOM_DATA: SymptomCategory[] = [
  {
    label: 'Bone, Joint & Musculoskeletal',
    symptoms: [
      'Joint or Knee Pain',
      'Backache / Spine Stiffness',
      'Sports Sprain or Fracture Check',
      'Arthritis / Bone Weakness',
    ],
    recommendedDoctorId: 3, // Dr. Arshad (Haddi Specialist)
    reason:
      'Recommended with Dr. Arshad (Haddi Specialist / Orthopedic Care) specializing in bone, joint trauma, and arthritis recovery.',
  },
  {
    label: 'General Medicine & Acute Health',
    symptoms: [
      'Fever, Chills or Flu Symptoms',
      'High Blood Pressure / Hypertension',
      'Chest Congestion or Persistent Cough',
      'Abdominal Pain or Digestion Issues',
    ],
    recommendedDoctorId: 2, // Dr. Farooq (MBBS)
    reason:
      'Recommended with Dr. Farooq (MBBS Primary Care) for diagnostic evaluation, internal medicine, and acute symptom management.',
  },
  {
    label: 'Homeopathy, Chronic Care & Skin',
    symptoms: [
      'Chronic Allergies / Sinusitis',
      'Skin Rash, Eczema or Dermatitis',
      'Stress, Insomnia or Fatigue',
      'Long-term Wellness & Follow-up',
    ],
    recommendedDoctorId: 1, // Dr. Misbah Ambar (BHUMS)
    reason:
      'Recommended with Dr. Misbah Ambar (BHUMS) specializing in holistic constitutional homeopathy, skin conditions, and chronic wellness.',
  },
];

export const SymptomTriageModal: React.FC<SymptomTriageModalProps> = ({
  isOpen,
  onClose,
  onSelectDoctor,
}) => {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  if (!isOpen) return null;

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom],
    );
  };

  const doctorScores: Record<number, number> = { 1: 0, 2: 0, 3: 0 };

  selectedSymptoms.forEach((s) => {
    for (const cat of SYMPTOM_DATA) {
      if (cat.symptoms.includes(s)) {
        doctorScores[cat.recommendedDoctorId] = (doctorScores[cat.recommendedDoctorId] || 0) + 1;
      }
    }
  });

  let bestDocId = 2; // default Dr. Farooq
  let maxScore = 0;
  Object.entries(doctorScores).forEach(([idStr, score]) => {
    if (score > maxScore) {
      maxScore = score;
      bestDocId = Number(idStr);
    }
  });

  const bestDoctor = DOCTORS_SEED.find((d) => d.id === bestDocId) || DOCTORS_SEED[1];
  const matchedCategory = SYMPTOM_DATA.find((c) => c.recommendedDoctorId === bestDocId);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1e1714] rounded-3xl border border-[#d5e5db] dark:border-[#382b24] shadow-[0_24px_64px_rgba(0,0,0,0.3)] max-w-xl w-full max-h-[90vh] overflow-y-auto flex flex-col transition-colors">
        {/* Header */}
        <div className="p-6 border-b border-[#f0e8e3] dark:border-[#382b24] flex items-center justify-between bg-[#fdfaf8] dark:bg-[#251d19] rounded-t-3xl">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#c85d38] to-[#a84724] text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-[#481e0b] dark:text-[#f7eee9]">
                Smart Symptom Triage & Specialist Matcher
              </h3>
              <p className="text-xs text-[#786b65] dark:text-[#a89991]">
                Select what you are experiencing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#f0e8e3] dark:hover:bg-[#342721] text-[#786b65] dark:text-[#a89991] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="text-xs text-[#685a53] dark:text-[#c4b5ae] leading-relaxed">
            Choose your symptoms below to get matched with the most relevant CityCare clinic
            specialist:
          </div>

          <div className="space-y-4">
            {SYMPTOM_DATA.map((cat, idx) => (
              <div key={idx} className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#a84724] dark:text-[#f38360]">
                  {cat.label}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {cat.symptoms.map((symptom) => {
                    const isSelected = selectedSymptoms.includes(symptom);
                    return (
                      <button
                        key={symptom}
                        type="button"
                        onClick={() => toggleSymptom(symptom)}
                        className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-[#edf7f0] dark:bg-[#1a2d22] border-[#176541] dark:border-[#34d399] text-[#176541] dark:text-[#34d399] shadow-2xs font-semibold'
                            : 'bg-[#fdfaf8] dark:bg-[#251d19] border-[#e2d5ce] dark:border-[#3d2e27] text-[#56473f] dark:text-[#e8dcd5] hover:border-[#c85d38] dark:hover:border-[#e0734d]'
                        }`}
                      >
                        <span>{symptom}</span>
                        {isSelected && (
                          <Check className="w-4 h-4 text-[#176541] dark:text-[#34d399] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Recommendation Box */}
          {selectedSymptoms.length > 0 && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#fdfaf8] to-[#edf7f0] dark:from-[#251d19] dark:to-[#1b2b21] border border-[#cfe1d5] dark:border-[#2d4737] space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#176541] dark:text-[#34d399]">
                <Activity className="w-4 h-4 text-[#176541] dark:text-[#34d399]" />
                <span>Recommended Specialist Match</span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-heading font-bold text-lg text-[#481e0b] dark:text-[#f7eee9]">
                    {bestDoctor.name}
                  </h4>
                  <div className="text-xs font-semibold text-[#176541] dark:text-[#34d399]">
                    {bestDoctor.spec}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-[#a84724] dark:text-[#f38360]">
                    ₹{bestDoctor.fee}
                  </span>
                  <div className="text-[10px] text-[#786b65] dark:text-[#a89991]">
                    consultation
                  </div>
                </div>
              </div>

              <p className="text-xs text-[#56473f] dark:text-[#c4b5ae] leading-relaxed">
                {matchedCategory?.reason || bestDoctor.about}
              </p>

              <button
                type="button"
                onClick={() => {
                  onSelectDoctor(bestDoctor.id);
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-full bg-[#c85d38] hover:bg-[#a84724] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Book Appointment with {bestDoctor.name}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="p-3 rounded-xl bg-amber-50 dark:bg-[#2d2215] border border-amber-200 dark:border-amber-800/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              This triage matching is for informational routing at CityCare Clinic. For acute trauma
              or emergency symptoms, please call an emergency helpline immediately.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
