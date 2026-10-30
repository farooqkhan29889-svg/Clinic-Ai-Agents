import { LabTest, LabOrder } from '../types/clinic';

export const DIAGNOSTIC_TESTS: LabTest[] = [
  {
    id: 'test-cbc',
    code: 'CBC-101',
    name: 'Complete Blood Count (CBC) with ESR',
    category: 'Hematology',
    price: 28,
    originalPrice: 38,
    turnaroundTime: '4 Hours',
    fastingRequired: false,
    sampleType: 'EDTA Whole Blood (2 ml)',
    popular: true,
    description: 'Measures red blood cells, white blood cells, hemoglobin, hematocrit, and platelets to detect anemia, infections, leukemia, and immune disorders.',
    parametersCount: 22,
    clinicalSignificance: 'Fundamental health screening tool for fatigue, unexplained fever, bleeding tendencies, and chronic infection.',
    parameters: [
      { name: 'Hemoglobin (Hb)', standardRange: '12.0 - 15.5', unit: 'g/dL', description: 'Oxygen carrying protein in blood' },
      { name: 'Total WBC Count', standardRange: '4,000 - 11,000', unit: '/cu.mm', description: 'Immune response white blood cells' },
      { name: 'RBC Count', standardRange: '3.8 - 5.2', unit: 'mil/cu.mm', description: 'Red blood cell count' },
      { name: 'Platelet Count', standardRange: '150,000 - 450,000', unit: '/cu.mm', description: 'Blood clotting cells' },
      { name: 'Hematocrit (PCV)', standardRange: '36.0 - 46.0', unit: '%', description: 'Percentage of blood volume composed of red blood cells' },
      { name: 'ESR (Erythrocyte Sed Rate)', standardRange: '0 - 20', unit: 'mm/hr', description: 'Marker of systemic inflammation' },
    ],
  },
  {
    id: 'test-lipid',
    code: 'LIP-204',
    name: 'Comprehensive Lipid Profile',
    category: 'Cardiology',
    price: 36,
    originalPrice: 50,
    turnaroundTime: '6 Hours',
    fastingRequired: true,
    fastingDuration: '10-12 Hours overnight fasting required',
    sampleType: 'Venous Blood / Serum (3 ml)',
    popular: true,
    description: 'Accurately quantifies Total Cholesterol, LDL (bad cholesterol), HDL (good cholesterol), Triglycerides, and VLDL to estimate cardiovascular stroke and coronary heart risk.',
    parametersCount: 7,
    clinicalSignificance: 'Essential for evaluating atherosclerosis, heart attack risk, stroke likelihood, and monitoring statin therapy.',
    parameters: [
      { name: 'Total Cholesterol', standardRange: '< 200', unit: 'mg/dL', description: 'Total serum cholesterol' },
      { name: 'HDL (Good) Cholesterol', standardRange: '> 50', unit: 'mg/dL', description: 'Protective cardiovascular cholesterol' },
      { name: 'LDL (Bad) Cholesterol', standardRange: '< 100', unit: 'mg/dL', description: 'Atherogenic plaque-forming lipoprotein' },
      { name: 'Triglycerides', standardRange: '< 150', unit: 'mg/dL', description: 'Blood fats from caloric intake' },
      { name: 'Chol / HDL Ratio', standardRange: '< 4.5', unit: 'Ratio', description: 'Prognostic cardiac risk ratio' },
    ],
  },
  {
    id: 'test-hba1c',
    code: 'DIA-302',
    name: 'HbA1c & Fasting Plasma Glucose Combo',
    category: 'Diabetes',
    price: 32,
    originalPrice: 45,
    turnaroundTime: 'Same Day',
    fastingRequired: true,
    fastingDuration: '8-10 Hours overnight fasting required',
    sampleType: 'Fluoride Plasma & Whole Blood (3 ml)',
    popular: true,
    description: 'Gold-standard glycated hemoglobin test reflecting 3-month average blood sugar levels, plus immediate fasting glucose to identify diabetes or prediabetes.',
    parametersCount: 4,
    clinicalSignificance: 'Definitive test for diagnosis of Type 2 diabetes mellitus, metabolic syndrome, and tracking long-term glycemic control.',
    parameters: [
      { name: 'HbA1c (Glycated Hb)', standardRange: '< 5.7', unit: '%', description: 'Average glycemic control over past 90 days' },
      { name: 'Estimated Avg Glucose (eAG)', standardRange: '< 117', unit: 'mg/dL', description: 'Equivalent 3-month daily average glucose' },
      { name: 'Fasting Blood Glucose', standardRange: '70 - 99', unit: 'mg/dL', description: 'Current baseline glucose upon waking' },
    ],
  },
  {
    id: 'test-thyroid',
    code: 'THY-401',
    name: 'Ultra-Sensitive Thyroid Panel (TSH, FT3, FT4)',
    category: 'Hormones',
    price: 42,
    originalPrice: 60,
    turnaroundTime: 'Same Day',
    fastingRequired: false,
    sampleType: 'Serum Clot Activator (3 ml)',
    popular: true,
    description: 'Comprehensive hormonal assessment of thyroid metabolism: Thyroid Stimulating Hormone (TSH), Free Triiodothyronine (FT3), and Free Thyroxine (FT4).',
    parametersCount: 3,
    clinicalSignificance: 'Detects hypothyroidism (sluggish metabolism, weight gain, depression) or hyperthyroidism (anxiety, palpitations, unexplained weight loss).',
    parameters: [
      { name: 'TSH (3rd Gen)', standardRange: '0.45 - 4.50', unit: 'uIU/mL', description: 'Pituitary regulatory hormone' },
      { name: 'Free T4 (Thyroxine)', standardRange: '0.82 - 1.77', unit: 'ng/dL', description: 'Active metabolic thyroid hormone' },
      { name: 'Free T3', standardRange: '2.0 - 4.4', unit: 'pg/mL', description: 'Fast-acting thyroid hormone' },
    ],
  },
  {
    id: 'test-vitamins',
    code: 'VIT-505',
    name: 'Vitamin D3 (25-Hydroxy) & B12 Vitality Duo',
    category: 'Biochemistry',
    price: 49,
    originalPrice: 75,
    turnaroundTime: '24 Hours',
    fastingRequired: false,
    sampleType: 'Serum Clot Activator (4 ml)',
    popular: true,
    description: 'Crucial duo screen for bone mineral density, neuromuscular health, cellular energy synthesis, and immune resistance.',
    parametersCount: 2,
    clinicalSignificance: 'Over 65% of adults suffer from hidden Vitamin D/B12 deficiency causing chronic body aches, brain fog, and bone weakness.',
    parameters: [
      { name: 'Vitamin D3 (25-OH)', standardRange: '30.0 - 100.0', unit: 'ng/mL', description: 'Bone and immune support vitamin' },
      { name: 'Vitamin B12 (Cobalamin)', standardRange: '211 - 946', unit: 'pg/mL', description: 'Nerve sheath & RBC formation vitamin' },
    ],
  },
  {
    id: 'test-lft',
    code: 'LFT-601',
    name: 'Liver Function Test (LFT) Complete Profile',
    category: 'Biochemistry',
    price: 34,
    originalPrice: 48,
    turnaroundTime: '6 Hours',
    fastingRequired: true,
    fastingDuration: '8-10 Hours fasting recommended',
    sampleType: 'Serum (3 ml)',
    popular: false,
    description: 'Measures bilirubin, SGOT (AST), SGPT (ALT), alkaline phosphatase, and total proteins to evaluate liver filtration, injury, and detoxification capacity.',
    parametersCount: 11,
    clinicalSignificance: 'Vital for monitoring fatty liver disease, medication hepatotoxicity, alcohol impact, and gallbladder/bile duct health.',
    parameters: [
      { name: 'SGPT / ALT', standardRange: '< 45', unit: 'U/L', description: 'Key liver cell enzyme' },
      { name: 'SGOT / AST', standardRange: '< 40', unit: 'U/L', description: 'Liver and muscle enzyme' },
      { name: 'Total Bilirubin', standardRange: '0.2 - 1.2', unit: 'mg/dL', description: 'Bile pigment breakdown product' },
      { name: 'Alkaline Phosphatase (ALP)', standardRange: '44 - 147', unit: 'U/L', description: 'Biliary tree and bone enzyme' },
      { name: 'Serum Albumin', standardRange: '3.5 - 5.2', unit: 'g/dL', description: 'Major hepatic synthesized protein' },
    ],
  },
  {
    id: 'test-kft',
    code: 'KFT-701',
    name: 'Renal Function / Kidney Panel (KFT + eGFR)',
    category: 'Biochemistry',
    price: 32,
    originalPrice: 45,
    turnaroundTime: '6 Hours',
    fastingRequired: false,
    sampleType: 'Serum (3 ml) & Spot Urine',
    popular: false,
    description: 'Evaluates kidney filtration rate, serum creatinine, blood urea nitrogen (BUN), uric acid, and serum electrolytes.',
    parametersCount: 8,
    clinicalSignificance: 'Critical for hypertensive and diabetic patients to spot early diabetic nephropathy or chronic kidney disease (CKD).',
    parameters: [
      { name: 'Serum Creatinine', standardRange: '0.6 - 1.2', unit: 'mg/dL', description: 'Muscle waste filtered by kidneys' },
      { name: 'Blood Urea Nitrogen (BUN)', standardRange: '7 - 20', unit: 'mg/dL', description: 'Protein metabolism waste' },
      { name: 'eGFR (Filtration Rate)', standardRange: '> 90', unit: 'mL/min/1.73m2', description: 'Calculated functional kidney capacity' },
      { name: 'Serum Uric Acid', standardRange: '3.5 - 7.2', unit: 'mg/dL', description: 'Gout and purine metabolism indicator' },
    ],
  },
  {
    id: 'test-crp',
    code: 'CRP-801',
    name: 'High-Sensitivity C-Reactive Protein (hs-CRP)',
    category: 'Cardiology',
    price: 30,
    originalPrice: 40,
    turnaroundTime: 'Same Day',
    fastingRequired: false,
    sampleType: 'Serum (2 ml)',
    popular: false,
    description: 'Ultra-precise biomarker for low-grade microvascular vascular inflammation and hidden plaque instability in coronary arteries.',
    parametersCount: 1,
    clinicalSignificance: 'Indicates vascular inflammation even in patients with normal cholesterol, aiding predictive coronary risk staging.',
    parameters: [
      { name: 'hs-CRP', standardRange: '< 1.0 (Low Risk)', unit: 'mg/L', description: 'Cardiac arterial inflammation indicator' },
    ],
  },
  {
    id: 'test-ecg',
    code: 'ECG-901',
    name: '12-Lead Resting Digital ECG with Physician Readout',
    category: 'Imaging & ECG',
    price: 35,
    originalPrice: 50,
    turnaroundTime: 'Immediate (15 Mins)',
    fastingRequired: false,
    sampleType: 'Non-invasive Skin Electrodes (Clinic Walk-in)',
    popular: true,
    description: 'High-resolution 12-channel electrocardiogram recording electrical depolarization of cardiac atria and ventricles, interpreted by a cardiologist.',
    parametersCount: 6,
    clinicalSignificance: 'Screening for arrhythmias, heart blocks, left ventricular hypertrophy (LVH), and ischemic changes.',
    parameters: [
      { name: 'Heart Rhythm', standardRange: 'Normal Sinus Rhythm', unit: 'Rate: 60-100 bpm', description: 'Cardiac electrical pace' },
      { name: 'PR Interval', standardRange: '120 - 200', unit: 'ms', description: 'Atrioventricular conduction time' },
      { name: 'QRS Duration', standardRange: '80 - 120', unit: 'ms', description: 'Ventricular depolarization time' },
      { name: 'QTc Interval', standardRange: '< 450', unit: 'ms', description: 'Ventricular repolarization duration' },
    ],
  },
  {
    id: 'test-fullbody',
    code: 'PKG-001',
    name: 'Executive Master Health Package (64 Comprehensive Tests)',
    category: 'Preventive Panels',
    price: 119,
    originalPrice: 199,
    turnaroundTime: '24 Hours',
    fastingRequired: true,
    fastingDuration: '10-12 Hours fasting required',
    sampleType: 'Blood & Urine Specimen (Home Collection available)',
    popular: true,
    description: 'CityCare Clinic\'s gold-standard annual preventive checkup: CBC (22), Lipid (7), Liver (11), Kidney (8), Thyroid (3), HbA1c (3), Vitamin D & B12 (2), Iron panel, and Urine Routine.',
    parametersCount: 64,
    clinicalSignificance: 'Complete 360-degree bodily health audit recommended once annually for proactive wellness and early disease detection.',
    parameters: [
      { name: 'CBC Hemogram Complete', standardRange: 'Within Normal Limits', unit: '22 tests', description: 'Full hematologic screen' },
      { name: 'Lipid Cardiovascular Profile', standardRange: 'Optimal', unit: '7 tests', description: 'Cardiovascular fat evaluation' },
      { name: 'Liver & Renal Profiles', standardRange: 'Normal', unit: '19 tests', description: 'Vital organ filtration screen' },
      { name: 'Glycemic & Thyroid Hormones', standardRange: 'Euthyroid / Euglycemic', unit: '6 tests', description: 'Endocrine and metabolic balance' },
      { name: 'Vitamins D3 & B12', standardRange: 'Adequate', unit: '2 tests', description: 'Vitality micronutrient screen' },
    ],
  },
];

const STORAGE_LAB_ORDERS_KEY = 'citycare_lab_orders_v1';

export const INITIAL_SEED_LAB_ORDERS: LabOrder[] = [
  {
    id: 'ORD-9102',
    bookingCode: 'CCL-9102-LAB',
    patientName: 'Sarah Jenkins',
    patientPhone: '9876543210',
    patientEmail: 'sarah.j@example.com',
    patientGender: 'Female',
    patientAge: 38,
    tests: [DIAGNOSTIC_TESTS[0], DIAGNOSTIC_TESTS[1]], // CBC and Lipid
    collectionType: 'Clinic Walk-in Lab',
    address: 'CityCare Central Lab, Suite 2B',
    date: '2026-10-24',
    timeSlot: '08:30 AM',
    totalAmount: 64,
    paymentStatus: 'Paid Online',
    status: 'Results Ready',
    createdAt: '2026-10-24T07:45:00Z',
    phlebotomistName: 'Nurse David Vance, CPT',
    reportReadyDate: '2026-10-24T14:30:00Z',
    barcode: '884019284102',
    reportDetails: [
      {
        testId: 'test-cbc',
        testName: 'Complete Blood Count (CBC) with ESR',
        category: 'Hematology',
        pathologistNotes: 'Erythrocyte indices within standard clinical thresholds. No morphological abnormalities detected in peripheral blood smear. Platelet count adequate.',
        verifiedBy: 'Dr. Amanda Chen, MD (Pathologist)',
        labDirector: 'Prof. Marcus Vance, FRCPath',
        parameters: [
          { name: 'Hemoglobin (Hb)', value: '13.8', unit: 'g/dL', referenceRange: '12.0 - 15.5', minNormal: 12.0, maxNormal: 15.5, status: 'Normal' },
          { name: 'Total WBC Count', value: '6,400', unit: '/cu.mm', referenceRange: '4,000 - 11,000', minNormal: 4000, maxNormal: 11000, status: 'Normal' },
          { name: 'RBC Count', value: '4.5', unit: 'mil/cu.mm', referenceRange: '3.8 - 5.2', minNormal: 3.8, maxNormal: 5.2, status: 'Normal' },
          { name: 'Platelet Count', value: '265,000', unit: '/cu.mm', referenceRange: '150,000 - 450,000', minNormal: 150000, maxNormal: 450000, status: 'Normal' },
          { name: 'Hematocrit (PCV)', value: '41.2', unit: '%', referenceRange: '36.0 - 46.0', minNormal: 36.0, maxNormal: 46.0, status: 'Normal' },
          { name: 'ESR (Erythrocyte Sed Rate)', value: '12', unit: 'mm/hr', referenceRange: '0 - 20', minNormal: 0, maxNormal: 20, status: 'Normal' },
        ],
      },
      {
        testId: 'test-lipid',
        testName: 'Comprehensive Lipid Profile',
        category: 'Cardiology',
        pathologistNotes: 'Total cholesterol is slightly borderline high (210 mg/dL). Triglycerides and HDL cholesterol are in healthy ranges. Lifestyle dietary reduction of saturated fats and periodic aerobic exercise recommended.',
        verifiedBy: 'Dr. Amanda Chen, MD (Pathologist)',
        labDirector: 'Prof. Marcus Vance, FRCPath',
        parameters: [
          { name: 'Total Cholesterol', value: '210', unit: 'mg/dL', referenceRange: '< 200', minNormal: 120, maxNormal: 200, status: 'Borderline' },
          { name: 'HDL (Good) Cholesterol', value: '54', unit: 'mg/dL', referenceRange: '> 50', minNormal: 50, maxNormal: 90, status: 'Normal' },
          { name: 'LDL (Bad) Cholesterol', value: '124', unit: 'mg/dL', referenceRange: '< 100', minNormal: 60, maxNormal: 100, status: 'Borderline' },
          { name: 'Triglycerides', value: '138', unit: 'mg/dL', referenceRange: '< 150', minNormal: 50, maxNormal: 150, status: 'Normal' },
          { name: 'Chol / HDL Ratio', value: '3.8', unit: 'Ratio', referenceRange: '< 4.5', minNormal: 2.0, maxNormal: 4.5, status: 'Normal' },
        ],
      },
    ],
  },
  {
    id: 'ORD-9420',
    bookingCode: 'CCL-9420-LAB',
    patientName: 'Sarah Jenkins',
    patientPhone: '9876543210',
    patientEmail: 'sarah.j@example.com',
    patientGender: 'Female',
    patientAge: 38,
    tests: [DIAGNOSTIC_TESTS[3]], // Thyroid Panel
    collectionType: 'Home Sample Collection',
    address: '742 Evergreen Terrace, Apt 4B',
    date: '2026-10-28',
    timeSlot: '07:30 AM',
    totalAmount: 42,
    paymentStatus: 'Paid Online',
    status: 'In Processing',
    createdAt: '2026-10-27T16:20:00Z',
    phlebotomistName: 'Phlebotomist Marcus Ray',
    barcode: '884019289420',
  },
];

export function getStoredLabOrders(): LabOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_LAB_ORDERS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_LAB_ORDERS_KEY, JSON.stringify(INITIAL_SEED_LAB_ORDERS));
      return INITIAL_SEED_LAB_ORDERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_SEED_LAB_ORDERS;
  } catch (e) {
    console.error('Error reading lab orders from localStorage', e);
    return INITIAL_SEED_LAB_ORDERS;
  }
}

export function saveLabOrder(newOrder: LabOrder): void {
  try {
    const orders = getStoredLabOrders();
    const updated = [newOrder, ...orders.filter((o) => o.id !== newOrder.id)];
    localStorage.setItem(STORAGE_LAB_ORDERS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving lab order', e);
  }
}

export function updateLabOrderStatus(
  orderId: string,
  newStatus: LabOrder['status']
): LabOrder | null {
  try {
    const orders = getStoredLabOrders();
    const target = orders.find((o) => o.id === orderId);
    if (!target) return null;

    target.status = newStatus;
    if (newStatus === 'Results Ready' && !target.reportDetails) {
      // Auto-generate report details if needed
      target.reportDetails = target.tests.map((t) => ({
        testId: t.id,
        testName: t.name,
        category: t.category,
        pathologistNotes: 'Investigation performed on calibrated automated analyzer with dual control verification. Results correlate with clinical parameters.',
        verifiedBy: 'Dr. Amanda Chen, MD (Pathologist)',
        labDirector: 'Prof. Marcus Vance, FRCPath',
        parameters: t.parameters.map((p) => {
          let sampleVal = 'Normal';
          let status: 'Normal' | 'Borderline' | 'Elevated' | 'Low' = 'Normal';
          if (p.name.includes('Cholesterol')) {
            sampleVal = '184';
          } else if (p.name.includes('TSH')) {
            sampleVal = '2.18';
          } else if (p.name.includes('Glucose')) {
            sampleVal = '88';
          } else if (p.name.includes('Hemoglobin')) {
            sampleVal = '13.4';
          } else if (p.name.includes('Vitamin D3')) {
            sampleVal = '38.2';
          } else {
            sampleVal = p.standardRange.split('-')[0].trim() || 'Normal';
          }
          return {
            name: p.name,
            value: sampleVal,
            unit: p.unit,
            referenceRange: p.standardRange,
            status,
          };
        }),
      }));
    }

    localStorage.setItem(STORAGE_LAB_ORDERS_KEY, JSON.stringify(orders));
    return target;
  } catch (e) {
    console.error('Error updating lab order status', e);
    return null;
  }
}
