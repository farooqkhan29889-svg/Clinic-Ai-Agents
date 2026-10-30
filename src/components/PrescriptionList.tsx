import React, { useState, useMemo } from 'react';
import {
  Pill,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Printer,
  Search,
  Building2,
  Phone,
  FileText,
  ChevronDown,
  ChevronUp,
  X,
  Info,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  Send,
  Sparkles,
  Copy,
  Check,
  ShieldAlert,
  Download,
} from 'lucide-react';
import { Prescription, Medication, PatientProfile } from '../types/clinic';
import { generateSinglePrescriptionPDF } from '../utils/pdfGenerator';

interface PrescriptionListProps {
  prescriptions: Prescription[];
  patientProfile: PatientProfile;
  onNavigateAppointments?: () => void;
}

type TabType = 'all' | 'active' | 'past';

export const PrescriptionList: React.FC<PrescriptionListProps> = ({
  prescriptions: initialPrescriptions,
  patientProfile,
  onNavigateAppointments,
}) => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(initialPrescriptions);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [formFilter, setFormFilter] = useState<string>('all');
  const [expandedRxId, setExpandedRxId] = useState<string | null>(null);

  // Modals state
  const [selectedRxForSlip, setSelectedRxForSlip] = useState<Prescription | null>(null);
  const [selectedRxForRefill, setSelectedRxForRefill] = useState<Prescription | null>(null);
  const [selectedMedForGuide, setSelectedMedForGuide] = useState<{
    med: Medication;
    doctorName: string;
    rxNumber: string;
  } | null>(null);

  // Refill request state
  const [refillPharmacy, setRefillPharmacy] = useState('CityCare In-House Pharmacy (Floor 1)');
  const [refillDeliveryMethod, setRefillDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [refillNotes, setRefillNotes] = useState('');
  const [refillSuccessMsg, setRefillSuccessMsg] = useState<string | null>(null);
  const [isSubmittingRefill, setIsSubmittingRefill] = useState(false);

  // Copied state
  const [copiedRxId, setCopiedRxId] = useState<string | null>(null);

  // Sync state if props change
  React.useEffect(() => {
    setPrescriptions(initialPrescriptions);
  }, [initialPrescriptions]);

  // Counts
  const counts = useMemo(() => {
    const active = prescriptions.filter((rx) => rx.active || rx.status === 'Active').length;
    const past = prescriptions.filter((rx) => !rx.active || rx.status === 'Completed' || rx.status === 'Discontinued').length;
    const totalRefills = prescriptions
      .filter((rx) => rx.active)
      .reduce((sum, rx) => sum + (rx.refillsRemaining || 0), 0);
    return { all: prescriptions.length, active, past, totalRefills };
  }, [prescriptions]);

  // Filtered list
  const filteredPrescriptions = useMemo(() => {
    return prescriptions.filter((rx) => {
      // Tab filter
      const isActive = rx.active || rx.status === 'Active';
      if (activeTab === 'active' && !isActive) return false;
      if (activeTab === 'past' && isActive) return false;

      // Form filter
      if (formFilter !== 'all') {
        const hasForm = rx.medications.some(
          (m) => (m.form || '').toLowerCase() === formFilter.toLowerCase()
        );
        if (!hasForm) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesRxNumber = rx.prescriptionNumber.toLowerCase().includes(q);
        const matchesDoctor = rx.doctorName.toLowerCase().includes(q);
        const matchesIndication = (rx.indication || '').toLowerCase().includes(q);
        const matchesMed = rx.medications.some(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            m.dosage.toLowerCase().includes(q) ||
            m.frequency.toLowerCase().includes(q) ||
            (m.purpose || '').toLowerCase().includes(q) ||
            (m.instructions || '').toLowerCase().includes(q)
        );
        if (!matchesRxNumber && !matchesDoctor && !matchesIndication && !matchesMed) {
          return false;
        }
      }

      return true;
    });
  }, [prescriptions, activeTab, searchQuery, formFilter]);

  const handleCopyRx = (rxNumber: string) => {
    navigator.clipboard.writeText(rxNumber);
    setCopiedRxId(rxNumber);
    setTimeout(() => setCopiedRxId(null), 2000);
  };

  const handlePrintSlip = () => {
    window.print();
  };

  const handleSubmitRefill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRxForRefill) return;

    setIsSubmittingRefill(true);
    setTimeout(() => {
      // Decrement refill count in local state
      setPrescriptions((prev) =>
        prev.map((rx) => {
          if (rx.id === selectedRxForRefill.id) {
            return {
              ...rx,
              refillsRemaining: Math.max(0, rx.refillsRemaining - 1),
            };
          }
          return rx;
        })
      );

      setIsSubmittingRefill(false);
      const reqId = `RFL-${Math.floor(1000 + Math.random() * 9000)}`;
      setRefillSuccessMsg(
        `Refill request #${reqId} submitted successfully for ${selectedRxForRefill.prescriptionNumber}! Our clinical pharmacy team will review and prepare it at ${refillPharmacy}.`
      );
      setSelectedRxForRefill(null);
      setRefillNotes('');

      // Auto dismiss success toast after 7s
      setTimeout(() => setRefillSuccessMsg(null), 7000);
    }, 700);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {refillSuccessMsg && (
        <div className="p-4 rounded-2xl bg-[#edf7f0] dark:bg-[#152a1d] border border-[#176541]/30 dark:border-[#34d399]/40 text-[#176541] dark:text-[#34d399] text-xs shadow-md flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block">Refill Request Confirmed</strong>
              <span>{refillSuccessMsg}</span>
            </div>
          </div>
          <button
            onClick={() => setRefillSuccessMsg(null)}
            className="text-[#176541] dark:text-[#34d399] hover:opacity-75 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Quick Stats Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-heading font-bold text-xl text-[#481e0b] dark:text-[#f7eee9]">
              Prescriptions & Medication Schedules
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] text-[11px] font-bold">
              Verified Rx
            </span>
          </div>
          <p className="text-xs text-[#786b65] dark:text-[#a89991] mt-1">
            Access active daily medication regimens, dosage instructions, frequency tables, and past treatment histories.
          </p>
        </div>

        {/* Stats strip */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <div className="px-3.5 py-2 rounded-2xl bg-[#fdfaf8] dark:bg-[#251d19] border border-[#f0e8e3] dark:border-[#382b24]">
            <span className="text-[10px] uppercase font-bold text-[#786b65] dark:text-[#a89991] block">
              Active Regimens
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <strong className="text-sm font-bold text-[#176541] dark:text-[#34d399]">
                {counts.active} Active
              </strong>
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-[#fdfaf8] dark:bg-[#251d19] border border-[#f0e8e3] dark:border-[#382b24]">
            <span className="text-[10px] uppercase font-bold text-[#786b65] dark:text-[#a89991] block">
              Completed / Past
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#786b65] dark:text-[#a89991]" />
              <strong className="text-sm font-bold text-[#481e0b] dark:text-[#f7eee9]">
                {counts.past} Archived
              </strong>
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-[#fdfaf8] dark:bg-[#251d19] border border-[#f0e8e3] dark:border-[#382b24]">
            <span className="text-[10px] uppercase font-bold text-[#786b65] dark:text-[#a89991] block">
              Authorized Refills
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <RotateCcw className="w-3.5 h-3.5 text-[#c85d38] dark:text-[#f38360]" />
              <strong className="text-sm font-bold text-[#c85d38] dark:text-[#f38360]">
                {counts.totalRefills} Available
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Segmented Tab Controls & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Active vs Past Segmented Filter */}
        <div className="inline-flex p-1 bg-[#f4ebe6] dark:bg-[#261d19] rounded-2xl border border-[#e6ded8] dark:border-[#3d2f27] shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-white dark:bg-[#1a1310] text-[#481e0b] dark:text-[#f7eee9] shadow-xs'
                : 'text-[#786b65] dark:text-[#a89991] hover:text-[#481e0b] dark:hover:text-[#f7eee9]'
            }`}
          >
            <span>All Prescriptions</span>
            <span className="px-1.5 py-0.2 rounded-md bg-[#e6ded8] dark:bg-[#382b24] text-[10px]">
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'active'
                ? 'bg-[#176541] text-white shadow-xs'
                : 'text-[#786b65] dark:text-[#a89991] hover:text-[#176541] dark:hover:text-[#34d399]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Active Prescriptions</span>
            <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px]">
              {counts.active}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('past')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'past'
                ? 'bg-white dark:bg-[#1a1310] text-[#481e0b] dark:text-[#f7eee9] shadow-xs'
                : 'text-[#786b65] dark:text-[#a89991] hover:text-[#481e0b] dark:hover:text-[#f7eee9]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Past / Completed</span>
            <span className="px-1.5 py-0.2 rounded-md bg-[#e6ded8] dark:bg-[#382b24] text-[10px]">
              {counts.past}
            </span>
          </button>
        </div>

        {/* Search & Form Filter */}
        <div className="flex items-center gap-2 flex-1 sm:max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#786b65] dark:text-[#a89991]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search medicine, dosage, frequency, or doctor..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] text-xs text-[#481e0b] dark:text-[#f7eee9] placeholder-[#786b65] dark:placeholder-[#8d7e77] focus:outline-hidden focus:border-[#176541]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#786b65] hover:text-[#481e0b] dark:hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={formFilter}
            onChange={(e) => setFormFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] text-xs text-[#481e0b] dark:text-[#f7eee9] focus:outline-hidden cursor-pointer shrink-0"
          >
            <option value="all">All Forms</option>
            <option value="tablet">Tablets</option>
            <option value="capsule">Capsules</option>
            <option value="drops">Drops</option>
            <option value="pills">Pills / Globules</option>
            <option value="nasal spray">Nasal Spray</option>
          </select>
        </div>
      </div>

      {/* Prescription Cards List */}
      {filteredPrescriptions.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] space-y-3">
          <Pill className="w-10 h-10 mx-auto text-[#786b65] dark:text-[#a89991] opacity-50" />
          <h4 className="font-heading font-bold text-base text-[#481e0b] dark:text-[#f7eee9]">
            No Prescriptions Found
          </h4>
          <p className="text-xs text-[#786b65] dark:text-[#a89991] max-w-sm mx-auto">
            {searchQuery
              ? `No records matching "${searchQuery}". Try searching by generic drug name, doctor, or condition.`
              : activeTab === 'active'
              ? 'You have no active prescriptions currently. Completed courses can be viewed in the "Past / Completed" tab.'
              : 'No past completed prescriptions recorded on file.'}
          </p>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFormFilter('all');
              }}
              className="px-4 py-1.5 rounded-full bg-[#f4ebe6] dark:bg-[#2e231e] text-xs font-semibold text-[#481e0b] dark:text-[#f7eee9] hover:bg-[#e6ded8] cursor-pointer"
            >
              Clear Search Filter
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredPrescriptions.map((rx) => {
            const isActive = rx.active || rx.status === 'Active';
            const isExpanded = expandedRxId === rx.id;

            return (
              <div
                key={rx.id}
                className={`rounded-3xl bg-white dark:bg-[#1e1714] border transition-all shadow-xs overflow-hidden ${
                  isActive
                    ? 'border-[#cfe1d5] dark:border-[#274032] hover:border-[#176541]'
                    : 'border-[#e6ded8] dark:border-[#382b24] hover:border-[#a89991]'
                }`}
              >
                {/* Prescription Card Header */}
                <div
                  className={`p-5 md:p-6 border-b transition-colors ${
                    isActive
                      ? 'bg-gradient-to-r from-[#f7fbf9] via-white to-transparent dark:from-[#16251d] dark:via-[#1e1714] border-[#eaf2ed] dark:border-[#2a3c30]'
                      : 'bg-gradient-to-r from-[#fbf8f6] via-white to-transparent dark:from-[#231b17] dark:via-[#1e1714] border-[#f0e8e3] dark:border-[#33251e]'
                  }`}
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e0f3e8] dark:bg-[#173121] text-[#16633b] dark:text-[#34d399] font-bold text-[11px]">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Active Treatment
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Completed Course
                          </span>
                        )}

                        <div className="inline-flex items-center gap-1 text-xs text-[#786b65] dark:text-[#a89991] font-mono">
                          <span>Rx No:</span>
                          <strong className="text-[#481e0b] dark:text-[#f7eee9]">
                            {rx.prescriptionNumber}
                          </strong>
                          <button
                            onClick={() => handleCopyRx(rx.prescriptionNumber)}
                            className="p-1 hover:text-[#176541] cursor-pointer"
                            title="Copy Rx Number"
                          >
                            {copiedRxId === rx.prescriptionNumber ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {rx.indication && (
                          <span className="text-xs text-[#56473f] dark:text-[#c4b5ae] border-l border-[#dcc9bf] dark:border-[#3d2e26] pl-2 hidden sm:inline">
                            Diagnosis: <strong>{rx.indication}</strong>
                          </span>
                        )}
                      </div>

                      <h4 className="font-heading font-bold text-lg text-[#481e0b] dark:text-[#f7eee9]">
                        Prescribed by {rx.doctorName}
                      </h4>
                      <p className="text-xs text-[#786b65] dark:text-[#a89991]">
                        {rx.doctorSpec} · Issued on {rx.date}
                        {rx.completedDate && ` · Completed on ${rx.completedDate}`}
                      </p>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-auto flex-wrap">
                      {isActive && rx.refillsRemaining > 0 && (
                        <button
                          onClick={() => setSelectedRxForRefill(rx)}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full bg-[#176541] hover:bg-[#124f33] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Request Refill ({rx.refillsRemaining})</span>
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedRxForSlip(rx)}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full border border-[#dcc9bf] dark:border-[#42332a] bg-white dark:bg-[#251d19] hover:bg-[#f7f3f0] dark:hover:bg-[#302520] text-xs font-semibold text-[#56473f] dark:text-[#e8dcd5] transition-colors cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Digital Rx Slip</span>
                      </button>

                      <button
                        onClick={() => setExpandedRxId(isExpanded ? null : rx.id)}
                        className="p-2 rounded-full border border-[#dcc9bf] dark:border-[#42332a] text-[#786b65] dark:text-[#a89991] hover:text-[#481e0b] dark:hover:text-white cursor-pointer"
                        title={isExpanded ? 'Collapse notes' : 'Expand full notes'}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Medications List */}
                <div className="p-5 md:p-6 space-y-4">
                  <div className="text-[11px] uppercase font-bold tracking-wider text-[#786b65] dark:text-[#a89991] flex items-center justify-between">
                    <span>Itemized Medications ({rx.medications.length})</span>
                    <span className="normal-case font-normal text-xs text-[#786b65] dark:text-[#a89991]">
                      Follow exact dosage & timing instructions
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {rx.medications.map((med, idx) => (
                      <div
                        key={idx}
                        className={`p-4 md:p-5 rounded-2xl border transition-all ${
                          isActive
                            ? 'bg-[#fdfaf8] dark:bg-[#231b17] border-[#f0e8e3] dark:border-[#382b24]'
                            : 'bg-[#faf7f5] dark:bg-[#1e1714] border-[#eae0d9] dark:border-[#33251e] opacity-90'
                        }`}
                      >
                        {/* Drug Name & Badges */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#eedfd6] dark:border-[#382b24]">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <div className="w-8 h-8 rounded-xl bg-[#c85d38]/10 text-[#c85d38] dark:text-[#f38360] flex items-center justify-center font-bold">
                              <Pill className="w-4 h-4" />
                            </div>
                            <div>
                              <h5 className="font-heading font-bold text-base text-[#481e0b] dark:text-[#f7eee9]">
                                {med.name}
                              </h5>
                              {med.purpose && (
                                <span className="text-xs text-[#786b65] dark:text-[#a89991]">
                                  Target: {med.purpose}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {med.form && (
                              <span className="px-2.5 py-0.5 rounded-md bg-white dark:bg-[#2e231e] border border-[#dcc9bf] dark:border-[#42332a] text-[10px] font-bold text-[#56473f] dark:text-[#c4b5ae]">
                                {med.form}
                              </span>
                            )}
                            {med.route && (
                              <span className="px-2.5 py-0.5 rounded-md bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] text-[10px] font-bold">
                                {med.route}
                              </span>
                            )}
                            <button
                              onClick={() =>
                                setSelectedMedForGuide({
                                  med,
                                  doctorName: rx.doctorName,
                                  rxNumber: rx.prescriptionNumber,
                                })
                              }
                              className="text-[11px] font-semibold text-[#176541] dark:text-[#34d399] hover:underline cursor-pointer flex items-center gap-1"
                            >
                              <Info className="w-3.5 h-3.5" />
                              <span>Guide</span>
                            </button>
                          </div>
                        </div>

                        {/* Dosage & Frequency Highlight Boxes */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                          {/* Dosage */}
                          <div className="p-3 rounded-xl bg-white dark:bg-[#1a1310] border border-[#eedfd6] dark:border-[#33251e]">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#786b65] dark:text-[#a89991]">
                              <Pill className="w-3.5 h-3.5 text-[#c85d38]" />
                              <span>Dosage</span>
                            </div>
                            <div className="mt-1 font-heading font-bold text-sm sm:text-base text-[#481e0b] dark:text-[#f7eee9]">
                              {med.dosage}
                            </div>
                            <span className="text-[11px] text-[#786b65] dark:text-[#a89991] block mt-0.5">
                              {med.duration} course
                            </span>
                          </div>

                          {/* Frequency */}
                          <div className="p-3 rounded-xl bg-white dark:bg-[#1a1310] border border-[#eedfd6] dark:border-[#33251e]">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#786b65] dark:text-[#a89991]">
                              <Clock className="w-3.5 h-3.5 text-[#176541] dark:text-[#34d399]" />
                              <span>Frequency</span>
                            </div>
                            <div className="mt-1 font-heading font-bold text-sm sm:text-base text-[#176541] dark:text-[#34d399]">
                              {med.frequency}
                            </div>
                            <span className="text-[11px] text-[#786b65] dark:text-[#a89991] block mt-0.5">
                              {med.timing || 'As directed'}
                            </span>
                          </div>

                          {/* Daily Schedule Slots */}
                          <div className="p-3 rounded-xl bg-white dark:bg-[#1a1310] border border-[#eedfd6] dark:border-[#33251e]">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#786b65] dark:text-[#a89991]">
                              <Calendar className="w-3.5 h-3.5 text-[#a84724]" />
                              <span>Daily Schedule Slots</span>
                            </div>
                            <div className="grid grid-cols-4 gap-1 mt-1.5 text-center">
                              {/* Morning */}
                              <div
                                className={`py-1 px-1 rounded-md text-[10px] font-bold flex flex-col items-center gap-0.5 ${
                                  med.schedule?.morning
                                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'
                                    : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600'
                                }`}
                                title="Morning Dose"
                              >
                                <Sunrise className="w-3 h-3" />
                                <span>Morn</span>
                              </div>

                              {/* Afternoon */}
                              <div
                                className={`py-1 px-1 rounded-md text-[10px] font-bold flex flex-col items-center gap-0.5 ${
                                  med.schedule?.afternoon
                                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'
                                    : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600'
                                }`}
                                title="Afternoon Dose"
                              >
                                <Sun className="w-3 h-3" />
                                <span>Noon</span>
                              </div>

                              {/* Evening */}
                              <div
                                className={`py-1 px-1 rounded-md text-[10px] font-bold flex flex-col items-center gap-0.5 ${
                                  med.schedule?.evening
                                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'
                                    : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600'
                                }`}
                                title="Evening Dose"
                              >
                                <Sunset className="w-3 h-3" />
                                <span>Eve</span>
                              </div>

                              {/* Night */}
                              <div
                                className={`py-1 px-1 rounded-md text-[10px] font-bold flex flex-col items-center gap-0.5 ${
                                  med.schedule?.night
                                    ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300'
                                    : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600'
                                }`}
                                title="Night Dose"
                              >
                                <Moon className="w-3 h-3" />
                                <span>Night</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Intake Instructions & Cautionary Notes */}
                        <div className="mt-3 pt-3 border-t border-[#eedfd6] dark:border-[#382b24] space-y-1.5 text-xs">
                          <div className="flex items-start gap-2 text-[#56473f] dark:text-[#c4b5ae]">
                            <strong className="text-[#481e0b] dark:text-[#f7eee9] shrink-0 font-semibold">
                              Instructions:
                            </strong>
                            <span>{med.instructions}</span>
                          </div>

                          {med.precautions && (
                            <div className="flex items-start gap-2 text-amber-800 dark:text-amber-300 text-[11px]">
                              <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              <span>{med.precautions}</span>
                            </div>
                          )}

                          {med.scheduleTimes && med.scheduleTimes.length > 0 && (
                            <div className="flex items-center gap-1.5 pt-1 text-[11px] text-[#786b65] dark:text-[#a89991]">
                              <span>Recommended times:</span>
                              {med.scheduleTimes.map((t, ti) => (
                                <span
                                  key={ti}
                                  className="px-2 py-0.5 rounded-md bg-white dark:bg-[#1a1310] border border-[#eedfd6] dark:border-[#382b24] font-mono text-[10px]"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Doctor's Advice & Pharmacy Details Footer */}
                  <div className="pt-2 border-t border-[#f0e8e3] dark:border-[#33251e] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1 max-w-2xl">
                      <div className="text-[#56473f] dark:text-[#c4b5ae]">
                        <strong className="text-[#481e0b] dark:text-[#f7eee9]">
                          Physician's Clinical Advice:
                        </strong>{' '}
                        {rx.doctorNotes}
                      </div>

                      {rx.pharmacy && (
                        <div className="flex items-center gap-2 text-[11px] text-[#786b65] dark:text-[#a89991]">
                          <Building2 className="w-3 h-3 text-[#176541] dark:text-[#34d399]" />
                          <span>Dispensed via {rx.pharmacy.name}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5" />
                            {rx.pharmacy.phone}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-[10px] text-[#786b65] dark:text-[#a89991] block uppercase font-bold">
                          Refills Authorized
                        </span>
                        <strong
                          className={`text-sm ${
                            rx.refillsRemaining > 0
                              ? 'text-[#176541] dark:text-[#34d399]'
                              : 'text-[#786b65] dark:text-[#a89991]'
                          }`}
                        >
                          {rx.refillsRemaining} remaining
                        </strong>
                      </div>

                      {onNavigateAppointments && (
                        <button
                          onClick={onNavigateAppointments}
                          className="px-3 py-1.5 rounded-full border border-[#dcc9bf] dark:border-[#42332a] text-[11px] font-semibold text-[#56473f] dark:text-[#e8dcd5] hover:bg-[#f7f3f0] dark:hover:bg-[#251d19] cursor-pointer"
                        >
                          Book Follow-up
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Digital Prescription Slip & Print View */}
      {selectedRxForSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-[#1e1714] rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#d5e5db] dark:border-[#382b24] max-h-[90vh] overflow-y-auto">
            {/* Header with actions */}
            <div className="flex items-center justify-between pb-4 border-b border-[#f0e8e3] dark:border-[#33251e]">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#176541] dark:text-[#34d399]" />
                <h4 className="font-heading font-bold text-lg text-[#481e0b] dark:text-[#f7eee9]">
                  Official Digital Prescription Slip
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintSlip}
                  className="px-3 py-1.5 rounded-full bg-[#176541] hover:bg-[#124f33] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  onClick={() => setSelectedRxForSlip(null)}
                  className="p-1.5 rounded-full text-[#786b65] hover:text-[#481e0b] dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Prescription Body */}
            <div className="p-6 rounded-2xl bg-[#fdfcfb] dark:bg-[#171210] border border-[#e6ded8] dark:border-[#382b24] space-y-5 text-left text-xs font-sans">
              {/* Clinic Branding Header */}
              <div className="text-center pb-4 border-b-2 border-[#176541] dark:border-[#34d399]">
                <h3 className="font-heading font-bold text-xl text-[#176541] dark:text-[#34d399] tracking-wide">
                  CITYCARE MULTI-SPECIALTY CLINIC & LABS
                </h3>
                <p className="text-[11px] text-[#786b65] dark:text-[#a89991]">
                  Approved Outpatient Healthcare Center · Reg. No: CC-MED-2024-9844
                </p>
                <p className="text-[11px] text-[#786b65] dark:text-[#a89991]">
                  Main Clinic Complex, Sector 4, City Center · Phone: +91 98765 43210 · Emergency: 108
                </p>
              </div>

              {/* Doctor & Patient Metadata Row */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-[#eedfd6] dark:border-[#33251e]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#786b65] dark:text-[#a89991] block">
                    Prescribing Consultant
                  </span>
                  <strong className="text-sm font-heading font-bold text-[#481e0b] dark:text-[#f7eee9] block">
                    {selectedRxForSlip.doctorName}
                  </strong>
                  <span className="text-[11px] text-[#786b65] dark:text-[#a89991]">
                    {selectedRxForSlip.doctorSpec}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-[#786b65] dark:text-[#a89991] block">
                    Prescription Reference
                  </span>
                  <strong className="text-sm font-mono font-bold text-[#176541] dark:text-[#34d399] block">
                    {selectedRxForSlip.prescriptionNumber}
                  </strong>
                  <span className="text-[11px] text-[#786b65] dark:text-[#a89991]">
                    Date: {selectedRxForSlip.date}
                  </span>
                </div>
              </div>

              {/* Patient Demographics */}
              <div className="p-3 rounded-xl bg-white dark:bg-[#1f1714] border border-[#eedfd6] dark:border-[#382b24] grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div>
                  <span className="text-[#786b65] dark:text-[#a89991] block">Patient Name:</span>
                  <strong className="text-[#481e0b] dark:text-[#f7eee9]">
                    {patientProfile.name}
                  </strong>
                </div>
                <div>
                  <span className="text-[#786b65] dark:text-[#a89991] block">Age / Gender:</span>
                  <strong className="text-[#481e0b] dark:text-[#f7eee9]">
                    {patientProfile.gender} ({patientProfile.dob})
                  </strong>
                </div>
                <div>
                  <span className="text-[#786b65] dark:text-[#a89991] block">Blood Group:</span>
                  <strong className="text-[#c85d38] dark:text-[#f38360]">
                    {patientProfile.bloodGroup}
                  </strong>
                </div>
                <div>
                  <span className="text-[#786b65] dark:text-[#a89991] block">Allergies:</span>
                  <strong className="text-amber-700 dark:text-amber-400">
                    {patientProfile.allergies.join(', ') || 'None noted'}
                  </strong>
                </div>
              </div>

              {/* Diagnosis / Indication */}
              {selectedRxForSlip.indication && (
                <div className="text-xs">
                  <span className="text-[#786b65] dark:text-[#a89991] font-semibold">
                    Clinical Diagnosis / Indication:{' '}
                  </span>
                  <strong className="text-[#481e0b] dark:text-[#f7eee9]">
                    {selectedRxForSlip.indication}
                  </strong>
                </div>
              )}

              {/* Rx Medications Table */}
              <div className="space-y-2">
                <div className="flex items-center gap-1 font-heading font-black text-xl text-[#176541] dark:text-[#34d399]">
                  <span>℞</span>
                  <span className="text-xs font-bold font-sans text-[#786b65] dark:text-[#a89991] uppercase tracking-wider ml-1">
                    Medication Schedule
                  </span>
                </div>

                <div className="overflow-x-auto border border-[#eedfd6] dark:border-[#382b24] rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#f4ebe6] dark:bg-[#261d19] text-[#786b65] dark:text-[#a89991] uppercase text-[10px] font-bold">
                      <tr>
                        <th className="p-2.5">#</th>
                        <th className="p-2.5">Medication & Form</th>
                        <th className="p-2.5">Dosage</th>
                        <th className="p-2.5">Frequency</th>
                        <th className="p-2.5">Course</th>
                        <th className="p-2.5">Instructions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eedfd6] dark:divide-[#382b24]">
                      {selectedRxForSlip.medications.map((m, idx) => (
                        <tr key={idx} className="hover:bg-white/40 dark:hover:bg-white/5">
                          <td className="p-2.5 font-bold text-[#786b65]">{idx + 1}</td>
                          <td className="p-2.5 font-bold text-[#481e0b] dark:text-[#f7eee9]">
                            {m.name}
                            {m.form && (
                              <span className="block text-[10px] font-normal text-[#786b65] dark:text-[#a89991]">
                                {m.form} ({m.route || 'Oral'})
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 font-semibold text-[#c85d38] dark:text-[#f38360]">
                            {m.dosage}
                          </td>
                          <td className="p-2.5 font-medium text-[#176541] dark:text-[#34d399]">
                            {m.frequency}
                          </td>
                          <td className="p-2.5 text-[#56473f] dark:text-[#c4b5ae]">
                            {m.duration}
                          </td>
                          <td className="p-2.5 text-[#56473f] dark:text-[#c4b5ae] italic">
                            {m.instructions}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Doctor Signoff & Stamp Footer */}
              <div className="pt-4 border-t border-[#eedfd6] dark:border-[#382b24] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="text-[11px] text-[#786b65] dark:text-[#a89991] space-y-1">
                  <p>
                    <strong>Physician Advice:</strong> {selectedRxForSlip.doctorNotes}
                  </p>
                  <p>
                    <strong>Authorized Refills:</strong>{' '}
                    {selectedRxForSlip.refillsRemaining} remaining
                  </p>
                  <p className="text-[10px]">
                    Valid across certified pharmacies in India. Digital signature verified with CityCare HMS.
                  </p>
                </div>

                <div className="text-center shrink-0 border border-dashed border-[#176541]/40 rounded-xl p-3 bg-white dark:bg-[#1f1714]">
                  <div className="font-heading font-serif italic text-sm text-[#176541] dark:text-[#34d399] tracking-wider font-bold">
                    {selectedRxForSlip.doctorName}
                  </div>
                  <div className="text-[9px] uppercase tracking-wider text-[#786b65] dark:text-[#a89991] mt-0.5">
                    Digitally Signed · {selectedRxForSlip.date}
                  </div>
                  <div className="text-[9px] font-mono text-[#176541] dark:text-[#34d399]">
                    Reg. #CC-{selectedRxForSlip.prescriptionNumber.slice(-4)}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => generateSinglePrescriptionPDF(patientProfile, selectedRxForSlip)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#176541] hover:bg-[#124d32] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                title="Download this prescription slip as a PDF"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Rx PDF Slip</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRxForSlip(null)}
                className="px-5 py-2 rounded-full border border-[#dcc9bf] dark:border-[#42332a] text-xs font-semibold text-[#56473f] dark:text-[#e8dcd5] hover:bg-[#f7f3f0] dark:hover:bg-[#251d19] cursor-pointer"
              >
                Close Slip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Refill Request Dialog */}
      {selectedRxForRefill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1e1714] rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-[#d5e5db] dark:border-[#382b24]">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0e8e3] dark:border-[#33251e]">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-[#176541] dark:text-[#34d399]" />
                <h4 className="font-heading font-bold text-lg text-[#481e0b] dark:text-[#f7eee9]">
                  Request Medication Refill
                </h4>
              </div>
              <button
                onClick={() => setSelectedRxForRefill(null)}
                className="text-[#786b65] hover:text-[#481e0b] dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRefill} className="space-y-4 text-xs">
              {/* Rx Summary */}
              <div className="p-3.5 rounded-2xl bg-[#fdfaf8] dark:bg-[#251d19] border border-[#f0e8e3] dark:border-[#382b24] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#786b65] dark:text-[#a89991]">Prescription:</span>
                  <strong className="text-[#481e0b] dark:text-[#f7eee9] font-mono">
                    {selectedRxForRefill.prescriptionNumber}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#786b65] dark:text-[#a89991]">Doctor:</span>
                  <strong className="text-[#481e0b] dark:text-[#f7eee9]">
                    {selectedRxForRefill.doctorName}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#786b65] dark:text-[#a89991]">Authorized Refills:</span>
                  <span className="font-bold text-[#176541] dark:text-[#34d399]">
                    {selectedRxForRefill.refillsRemaining} remaining
                  </span>
                </div>
                <div className="pt-2 border-t border-[#eedfd6] dark:border-[#382b24]">
                  <span className="text-[10px] uppercase font-bold text-[#786b65] dark:text-[#a89991] block mb-1">
                    Medications to be Refilled:
                  </span>
                  <ul className="space-y-1">
                    {selectedRxForRefill.medications.map((m, i) => (
                      <li key={i} className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-[#481e0b] dark:text-[#f7eee9]">
                          {m.name}
                        </span>
                        <span className="text-[#786b65] dark:text-[#a89991]">
                          {m.dosage} · {m.frequency}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Preferred Fulfillment Mode */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#481e0b] dark:text-[#f7eee9] block">
                  Fulfillment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRefillDeliveryMethod('pickup')}
                    className={`p-2.5 rounded-xl border text-left font-semibold transition-all cursor-pointer ${
                      refillDeliveryMethod === 'pickup'
                        ? 'border-[#176541] bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399]'
                        : 'border-[#dcc9bf] dark:border-[#3d2e26] bg-white dark:bg-[#251d19] text-[#56473f] dark:text-[#c4b5ae]'
                    }`}
                  >
                    <span>Clinic Counter Pickup</span>
                    <span className="block text-[10px] font-normal opacity-75">
                      Ready in 2 hours
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRefillDeliveryMethod('delivery')}
                    className={`p-2.5 rounded-xl border text-left font-semibold transition-all cursor-pointer ${
                      refillDeliveryMethod === 'delivery'
                        ? 'border-[#176541] bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399]'
                        : 'border-[#dcc9bf] dark:border-[#3d2e26] bg-white dark:bg-[#251d19] text-[#56473f] dark:text-[#c4b5ae]'
                    }`}
                  >
                    <span>Home Delivery</span>
                    <span className="block text-[10px] font-normal opacity-75">
                      Dispatched same day
                    </span>
                  </button>
                </div>
              </div>

              {/* Pharmacy Selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#481e0b] dark:text-[#f7eee9] block">
                  Select Dispensing Pharmacy
                </label>
                <select
                  value={refillPharmacy}
                  onChange={(e) => setRefillPharmacy(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-[#251d19] border border-[#dcc9bf] dark:border-[#3d2e26] text-xs text-[#481e0b] dark:text-[#f7eee9] focus:outline-hidden focus:border-[#176541]"
                >
                  <option value="CityCare In-House Pharmacy (Floor 1)">
                    CityCare In-House Pharmacy (Floor 1, CityCare Medical Complex)
                  </option>
                  <option value="Apollo Health Pharmacy (Sector 4)">
                    Apollo Health Pharmacy (Sector 4, Link Road)
                  </option>
                  <option value="MedPlus Express Pharmacy (City Center)">
                    MedPlus Express Pharmacy (City Center)
                  </option>
                </select>
              </div>

              {/* Pharmacist Notes */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#481e0b] dark:text-[#f7eee9] block">
                  Special Notes for Pharmacist (Optional)
                </label>
                <textarea
                  value={refillNotes}
                  onChange={(e) => setRefillNotes(e.target.value)}
                  placeholder="e.g. Please dispense generic brand if available, or call upon pickup..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-[#251d19] border border-[#dcc9bf] dark:border-[#3d2e26] text-xs text-[#481e0b] dark:text-[#f7eee9] placeholder-[#786b65] dark:placeholder-[#8d7e77] focus:outline-hidden focus:border-[#176541]"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRxForRefill(null)}
                  className="px-4 py-2 rounded-full border border-[#dcc9bf] dark:border-[#42332a] text-xs font-semibold text-[#56473f] dark:text-[#e8dcd5] hover:bg-[#f7f3f0] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRefill}
                  className="px-5 py-2 rounded-full bg-[#176541] hover:bg-[#124f33] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingRefill ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Confirm Refill Order</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Medication Guide & Precautions */}
      {selectedMedForGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1e1714] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#d5e5db] dark:border-[#382b24]">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0e8e3] dark:border-[#33251e]">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-[#176541] dark:text-[#34d399]" />
                <h4 className="font-heading font-bold text-base text-[#481e0b] dark:text-[#f7eee9]">
                  Medication Guide
                </h4>
              </div>
              <button
                onClick={() => setSelectedMedForGuide(null)}
                className="text-[#786b65] hover:text-[#481e0b] dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <h5 className="font-heading font-bold text-base text-[#481e0b] dark:text-[#f7eee9]">
                  {selectedMedForGuide.med.name}
                </h5>
                <span className="text-[11px] text-[#786b65] dark:text-[#a89991]">
                  From Rx #{selectedMedForGuide.rxNumber} · Prescribed by {selectedMedForGuide.doctorName}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#fdfaf8] dark:bg-[#251d19] border border-[#f0e8e3] dark:border-[#382b24] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#786b65] dark:text-[#a89991]">Prescribed Dosage:</span>
                  <strong className="text-[#481e0b] dark:text-[#f7eee9]">
                    {selectedMedForGuide.med.dosage}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#786b65] dark:text-[#a89991]">Dosing Frequency:</span>
                  <strong className="text-[#176541] dark:text-[#34d399]">
                    {selectedMedForGuide.med.frequency}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#786b65] dark:text-[#a89991]">Total Duration:</span>
                  <span className="text-[#56473f] dark:text-[#c4b5ae]">
                    {selectedMedForGuide.med.duration}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <strong className="text-[#481e0b] dark:text-[#f7eee9] block">
                  Intake Instructions:
                </strong>
                <p className="text-[#56473f] dark:text-[#c4b5ae] leading-relaxed">
                  {selectedMedForGuide.med.instructions}
                </p>
              </div>

              {selectedMedForGuide.med.precautions && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-300 space-y-1">
                  <strong className="block flex items-center gap-1 font-bold">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    Safety Precautions & Warnings:
                  </strong>
                  <p className="text-[11px] leading-relaxed">
                    {selectedMedForGuide.med.precautions}
                  </p>
                </div>
              )}

              <div className="p-3 rounded-xl bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] space-y-1">
                <strong className="block font-bold">Missed Dose Advice:</strong>
                <p className="text-[11px] leading-relaxed">
                  Take the missed dose as soon as you remember. If it is almost time for your next scheduled dose, skip the missed dose and resume your regular schedule. Never take a double dose to compensate.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedMedForGuide(null)}
                className="px-4 py-2 rounded-full bg-[#176541] text-white text-xs font-semibold cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
