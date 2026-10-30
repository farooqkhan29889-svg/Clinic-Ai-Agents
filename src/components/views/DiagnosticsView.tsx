import React, { useState, useEffect } from 'react';
import { NavTab, LabTest, LabOrder, LabReportDetail } from '../../types/clinic';
import { DIAGNOSTIC_TESTS, getStoredLabOrders, saveLabOrder, updateLabOrderStatus } from '../../data/diagnosticData';
import { getActivePatientSession } from '../../utils/authStorage';
import {
  FlaskConical,
  Search,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  FileText,
  Printer,
  Download,
  AlertCircle,
  Truck,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  X,
  Plus,
  Trash2,
  Activity,
  Heart,
  Droplet,
  Dna,
  Stethoscope,
  Info,
  Check,
  BarChart2,
  QrCode,
  Share2,
} from 'lucide-react';

interface DiagnosticsViewProps {
  onNavigate: (tab: NavTab, doctorId?: number) => void;
}

export const DiagnosticsView: React.FC<DiagnosticsViewProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'my-orders'>('catalog');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Cart / Selected tests for booking
  const [cartTests, setCartTests] = useState<LabTest[]>([]);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);
  const [selectedTestDetail, setSelectedTestDetail] = useState<LabTest | null>(null);

  // Booking Form State
  const [collectionType, setCollectionType] = useState<'Home Sample Collection' | 'Clinic Walk-in Lab'>('Home Sample Collection');
  const [patientName, setPatientName] = useState<string>('');
  const [patientPhone, setPatientPhone] = useState<string>('');
  const [patientEmail, setPatientEmail] = useState<string>('');
  const [patientGender, setPatientGender] = useState<string>('Female');
  const [patientAge, setPatientAge] = useState<number>(38);
  const [collectionAddress, setCollectionAddress] = useState<string>('');
  const [preferredDate, setPreferredDate] = useState<string>('2026-10-30');
  const [preferredSlot, setPreferredSlot] = useState<string>('08:00 AM');
  const [paymentMethod, setPaymentMethod] = useState<'Paid Online' | 'Pay at Collection'>('Paid Online');
  const [bookingSuccessOrder, setBookingSuccessOrder] = useState<LabOrder | null>(null);

  // Orders State & Tracker
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [activeReportOrder, setActiveReportOrder] = useState<LabOrder | null>(null);

  // Load orders and auto-fill if patient is logged in
  useEffect(() => {
    const orders = getStoredLabOrders();
    setLabOrders(orders);

    const session = getActivePatientSession();
    if (session) {
      setPatientName(session.name);
      setPatientPhone(session.phone);
      setPatientEmail(session.email || '');
      if (session.gender) setPatientGender(session.gender);
    }
  }, []);

  const refreshOrders = () => {
    setLabOrders(getStoredLabOrders());
  };

  const categories = [
    'All',
    'Hematology',
    'Cardiology',
    'Diabetes',
    'Biochemistry',
    'Hormones',
    'Preventive Panels',
    'Imaging & ECG',
  ];

  const filteredTests = DIAGNOSTIC_TESTS.filter((test) => {
    const matchesCategory = selectedCategory === 'All' || test.category === selectedCategory;
    const matchesQuery =
      test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.clinicalSignificance.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const handleToggleCart = (test: LabTest) => {
    if (cartTests.some((t) => t.id === test.id)) {
      setCartTests(cartTests.filter((t) => t.id !== test.id));
    } else {
      setCartTests([...cartTests, test]);
    }
  };

  const handleOpenBooking = (singleTest?: LabTest) => {
    if (singleTest) {
      if (!cartTests.some((t) => t.id === singleTest.id)) {
        setCartTests([...cartTests, singleTest]);
      }
    }
    setIsBookingModalOpen(true);
  };

  const cartTotal = cartTests.reduce((sum, t) => sum + t.price, 0);

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartTests.length === 0) return;
    if (!patientName.trim() || !patientPhone.trim()) return;

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newOrder: LabOrder = {
      id: `ORD-${randomSuffix}`,
      bookingCode: `CCL-${randomSuffix}-LAB`,
      patientName: patientName.trim(),
      patientPhone: patientPhone.trim(),
      patientEmail: patientEmail.trim(),
      patientGender,
      patientAge: Number(patientAge) || 35,
      tests: [...cartTests],
      collectionType,
      address: collectionType === 'Home Sample Collection' ? collectionAddress || 'Patient Residence' : 'CityCare Central Diagnostic Suite 2B',
      date: preferredDate,
      timeSlot: preferredSlot,
      totalAmount: cartTotal,
      paymentStatus: paymentMethod,
      status: 'Order Confirmed',
      createdAt: new Date().toISOString(),
      phlebotomistName: collectionType === 'Home Sample Collection' ? 'Phlebotomist Marcus Ray (Assigned)' : 'Central Laboratory Triage Desk',
      barcode: `884019${randomSuffix}`,
    };

    saveLabOrder(newOrder);
    refreshOrders();
    setBookingSuccessOrder(newOrder);
    setCartTests([]);
    setIsBookingModalOpen(false);
    setActiveTab('my-orders');
  };

  const handleAdvanceOrderStatus = (orderId: string, currentStatus: LabOrder['status']) => {
    const sequence: LabOrder['status'][] = [
      'Order Confirmed',
      'Sample Collected',
      'In Processing',
      'Results Ready',
    ];
    const currentIndex = sequence.indexOf(currentStatus);
    if (currentIndex >= 0 && currentIndex < sequence.length - 1) {
      const nextStatus = sequence[currentIndex + 1];
      const updated = updateLabOrderStatus(orderId, nextStatus);
      if (updated) {
        refreshOrders();
        if (activeReportOrder?.id === orderId) {
          setActiveReportOrder(updated);
        }
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Banner */}
      <section className="relative overflow-hidden p-6 md:p-8 rounded-3xl bg-gradient-to-r from-[#176541] via-[#1f7e52] to-[#0e442b] text-white shadow-[0_18px_38px_rgba(23,101,65,0.22)]">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-bold uppercase tracking-wider text-[#a7f3d0] mb-3">
            <FlaskConical className="w-3.5 h-3.5 text-[#34d399]" />
            NABL Accredited & Automated Clinical Diagnostics
          </div>
          <h1 className="font-heading text-2xl md:text-4xl font-bold tracking-tight text-white mb-2">
            Pathology & Diagnostic Laboratory
          </h1>
          <p className="text-xs md:text-sm text-[#d1fae5] leading-relaxed max-w-2xl mb-5">
            Book precise diagnostic lab tests with free home sample collection by certified phlebotomists, or visit our central clinic laboratory. Instant digital reports with clinical reference ranges.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'catalog'
                  ? 'bg-white text-[#176541] shadow-md shadow-black/10'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              Explore Diagnostic Tests ({DIAGNOSTIC_TESTS.length})
            </button>

            <button
              onClick={() => setActiveTab('my-orders')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'my-orders'
                  ? 'bg-white text-[#176541] shadow-md shadow-black/10'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              Track Sample & Lab Reports ({labOrders.length})
            </button>

            {cartTests.length > 0 && (
              <button
                onClick={() => handleOpenBooking()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#c85d38] hover:bg-[#a84724] text-white shadow-lg shadow-[#c85d38]/30 transition-all flex items-center gap-2 cursor-pointer animate-pulse"
              >
                <span>Checkout ({cartTests.length} tests · ${cartTotal})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full border border-white/10 shadow-[0_0_0_24px_rgba(255,255,255,0.03)] pointer-events-none" />
        <div className="absolute bottom-2 right-8 hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/20 backdrop-blur-md text-[11px] text-emerald-200 border border-emerald-500/20">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Cold Chain Sample Transport & ISO Certified</span>
        </div>
      </section>

      {/* Main Content Area */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {/* Search & Filter Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search test name, code (e.g. CBC, HbA1c, Lipid, Thyroid, LFT)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#f8faf8] dark:bg-[#281e19] border border-[#d5e5db] dark:border-[#4a3429] text-xs md:text-sm text-[#30221d] dark:text-[#f4eae5] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#176541]"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#176541] text-white shadow-xs'
                      : 'bg-[#edf7f0] dark:bg-[#281e19] text-[#176541] dark:text-[#a7f3d0] hover:bg-[#dceee2] dark:hover:bg-[#322520]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Test Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTests.map((test) => {
              const isSelected = cartTests.some((t) => t.id === test.id);

              return (
                <div
                  key={test.id}
                  className={`rounded-2xl bg-white dark:bg-[#1e1714] border transition-all duration-200 p-5 flex flex-col justify-between hover:shadow-md ${
                    isSelected
                      ? 'border-[#176541] ring-2 ring-[#176541]/20 shadow-xs'
                      : 'border-[#d5e5db] dark:border-[#382b24] hover:border-[#176541]/50'
                  }`}
                >
                  <div>
                    {/* Badge header */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] border border-[#cfe1d5] dark:border-[#2b4434]">
                        {test.code} · {test.category}
                      </span>
                      {test.popular && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                          Most Booked
                        </span>
                      )}
                    </div>

                    <h3 className="font-heading text-base font-bold text-[#30221d] dark:text-[#f7eee9] mb-1.5 line-clamp-1">
                      {test.name}
                    </h3>
                    <p className="text-xs text-[#64554d] dark:text-[#a89991] line-clamp-2 leading-relaxed mb-3">
                      {test.description}
                    </p>

                    {/* Meta Specs */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-[#f8faf8] dark:bg-[#281e19] text-[11px] mb-4">
                      <div>
                        <span className="text-gray-400 dark:text-gray-500 block text-[9px] uppercase font-bold">Parameters</span>
                        <span className="font-semibold text-[#176541] dark:text-[#34d399]">{test.parametersCount} Tests Included</span>
                      </div>
                      <div>
                        <span className="text-gray-400 dark:text-gray-500 block text-[9px] uppercase font-bold">Report Time</span>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{test.turnaroundTime}</span>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-gray-200 dark:border-gray-800 flex items-center gap-1 text-[10px] text-gray-600 dark:text-gray-400">
                        <Clock className="w-3 h-3 text-[#c85d38]" />
                        <span>{test.fastingRequired ? (test.fastingDuration || 'Fasting Required') : 'No Fasting Required'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing and Action buttons */}
                  <div className="pt-3 border-t border-[#edf4ef] dark:border-[#2e211b] flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-bold text-[#176541] dark:text-[#34d399]">${test.price}</span>
                        {test.originalPrice && (
                          <span className="text-xs text-gray-400 line-through">${test.originalPrice}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-500">Free Home Pickup</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedTestDetail(test)}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#64554d] dark:text-[#a89991] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                        title="View details"
                      >
                        Details
                      </button>

                      <button
                        onClick={() => handleToggleCart(test)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-200'
                            : 'bg-[#176541] hover:bg-[#125133] text-white shadow-xs'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Test</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Floating Cart bar if items selected */}
          {cartTests.length > 0 && (
            <div className="sticky bottom-4 z-20 p-4 rounded-2xl bg-[#30221d] text-white shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#176541] flex items-center justify-center font-bold text-white text-sm">
                  {cartTests.length}
                </div>
                <div>
                  <div className="text-sm font-bold">
                    {cartTests.length} {cartTests.length === 1 ? 'Test' : 'Tests'} Selected for Booking
                  </div>
                  <div className="text-xs text-gray-300">
                    Total: <span className="font-bold text-[#34d399]">${cartTotal}</span> (Includes free sample collection)
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCartTests([])}
                  className="px-3 py-1.5 rounded-xl text-xs text-gray-300 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  Clear Selection
                </button>
                <button
                  onClick={() => handleOpenBooking()}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#c85d38] hover:bg-[#a84724] text-white shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <span>Proceed to Book Slot</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Orders and Tracker Tab */}
      {activeTab === 'my-orders' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-lg font-bold text-[#30221d] dark:text-[#f7eee9]">
                Live Diagnostic Orders & Reports
              </h2>
              <p className="text-xs text-[#64554d] dark:text-[#a89991]">
                Real-time tracking of phlebotomy dispatch, cold-chain transport, automated analysis, and signed pathology reports.
              </p>
            </div>

            <button
              onClick={() => setActiveTab('catalog')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#176541] text-white hover:bg-[#125133] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Book New Lab Test
            </button>
          </div>

          {/* Success Banner if just booked */}
          {bookingSuccessOrder && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-start justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold">Booking Confirmed! Order #{bookingSuccessOrder.bookingCode}</h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                    Your appointment for {bookingSuccessOrder.collectionType} on {bookingSuccessOrder.date} at {bookingSuccessOrder.timeSlot} has been registered.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBookingSuccessOrder(null)}
                className="text-xs text-emerald-600 hover:text-emerald-800 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Orders List */}
          {labOrders.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24]">
              <FlaskConical className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <h3 className="font-bold text-[#30221d] dark:text-[#f7eee9]">No Lab Orders Placed Yet</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4 mt-1">
                Explore our catalog of routine and specialized pathology tests to book your first diagnostic panel.
              </p>
              <button
                onClick={() => setActiveTab('catalog')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#176541] text-white hover:bg-[#125133] cursor-pointer"
              >
                Browse Diagnostic Tests
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {labOrders.map((order) => {
                const isCompleted = order.status === 'Results Ready';
                const statusSteps: LabOrder['status'][] = [
                  'Order Confirmed',
                  'Sample Collected',
                  'In Processing',
                  'Results Ready',
                ];
                const currentStepIdx = statusSteps.indexOf(order.status);

                return (
                  <div
                    key={order.id}
                    className="p-5 md:p-6 rounded-2xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-xs hover:border-[#176541]/40 transition-colors"
                  >
                    {/* Top Row: Order Details */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[#edf4ef] dark:border-[#2e211b]">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-bold text-sm text-[#176541] dark:text-[#34d399]">
                            {order.bookingCode}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                            {order.collectionType}
                          </span>
                          <span className="text-xs text-gray-400">· {new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="text-xs text-[#64554d] dark:text-[#a89991]">
                          Patient: <strong className="text-[#30221d] dark:text-[#f7eee9]">{order.patientName}</strong> ({order.patientGender}, {order.patientAge}y) · Tel: {order.patientPhone}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Status advance simulator for testing */}
                        {!isCompleted && (
                          <button
                            onClick={() => handleAdvanceOrderStatus(order.id, order.status)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
                            title="Simulate progression to next stage"
                          >
                            Advance Status ⚡
                          </button>
                        )}

                        {isCompleted && (
                          <button
                            onClick={() => setActiveReportOrder(order)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#176541] hover:bg-[#125133] text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View Medical Lab Report</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Tracker Bar */}
                    <div className="py-4">
                      <div className="relative flex items-center justify-between max-w-2xl mx-auto">
                        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-200 dark:bg-gray-800 -z-0" />
                        <div
                          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#176541] transition-all duration-500 -z-0"
                          style={{
                            width: `${(Math.max(0, currentStepIdx) / (statusSteps.length - 1)) * 100}%`,
                          }}
                        />

                        {statusSteps.map((step, idx) => {
                          const isDone = currentStepIdx >= idx;
                          const isCurrent = currentStepIdx === idx;

                          return (
                            <div key={step} className="relative z-10 flex flex-col items-center">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                  isDone
                                    ? 'bg-[#176541] text-white ring-4 ring-[#edf7f0] dark:ring-[#1a2d22]'
                                    : 'bg-gray-200 dark:bg-gray-800 text-gray-500'
                                }`}
                              >
                                {isDone ? <Check className="w-4 h-4" /> : idx + 1}
                              </div>
                              <span
                                className={`text-[10px] mt-1.5 whitespace-nowrap text-center ${
                                  isCurrent
                                    ? 'font-bold text-[#176541] dark:text-[#34d399]'
                                    : 'text-gray-500'
                                }`}
                              >
                                {step}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Tests in this order */}
                    <div className="pt-3 border-t border-[#edf4ef] dark:border-[#2e211b] flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">Tests:</span>
                        {order.tests.map((t) => (
                          <span
                            key={t.id}
                            className="px-2.5 py-1 rounded-lg bg-[#f8faf8] dark:bg-[#281e19] text-[#176541] dark:text-[#34d399] font-medium border border-[#d5e5db] dark:border-[#4a3429]"
                          >
                            {t.name}
                          </span>
                        ))}
                      </div>

                      <div className="text-gray-500">
                        Phlebotomist: <strong className="text-gray-700 dark:text-gray-300">{order.phlebotomistName}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Test Detail Drawer Modal */}
      {selectedTestDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-[#1e1714] rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399]">
                  {selectedTestDetail.code} · {selectedTestDetail.category}
                </span>
                <h3 className="font-heading text-xl font-bold text-[#30221d] dark:text-[#f7eee9] mt-1">
                  {selectedTestDetail.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTestDetail(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
              {selectedTestDetail.description}
            </p>

            <div className="p-3.5 rounded-2xl bg-[#edf7f0] dark:bg-[#1a2d22] border border-[#cfe1d5] dark:border-[#2b4434] text-xs text-[#176541] dark:text-[#34d399] mb-5">
              <strong className="block font-bold mb-0.5">Clinical Significance:</strong>
              {selectedTestDetail.clinicalSignificance}
            </div>

            {/* Test Parameters Breakdown */}
            <div className="mb-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                Included Parameters ({selectedTestDetail.parameters.length})
              </h4>
              <div className="divide-y divide-gray-100 dark:divide-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                {selectedTestDetail.parameters.map((param, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between text-xs bg-white dark:bg-[#281e19]">
                    <div>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{param.name}</span>
                      {param.description && (
                        <span className="text-[10px] text-gray-400 block">{param.description}</span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-gray-600 dark:text-gray-400">{param.standardRange}</span>
                      <span className="text-[10px] text-gray-400 ml-1">{param.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
              <div>
                <span className="text-lg font-bold text-[#176541] dark:text-[#34d399]">${selectedTestDetail.price}</span>
                <span className="text-xs text-gray-400 ml-1">all inclusive</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedTestDetail(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleToggleCart(selectedTestDetail);
                    setSelectedTestDetail(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#176541] hover:bg-[#125133] text-white shadow-xs cursor-pointer"
                >
                  {cartTests.some((t) => t.id === selectedTestDetail.id) ? 'Remove Test' : 'Add to Booking'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Checkout Modal */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white dark:bg-[#1e1714] rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-gray-800 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800 mb-4">
              <div>
                <h3 className="font-heading text-lg font-bold text-[#30221d] dark:text-[#f7eee9]">
                  Book Diagnostic Lab Test
                </h3>
                <p className="text-xs text-gray-500">
                  Select sample collection preference and appointment slot.
                </p>
              </div>
              <button
                onClick={() => setIsBookingModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitBooking} className="space-y-4">
              {/* Selected Tests List */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Selected Tests ({cartTests.length})
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {cartTests.map((t) => (
                    <div
                      key={t.id}
                      className="p-2 rounded-xl bg-gray-50 dark:bg-[#281e19] flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{t.name}</span>
                        <span className="text-[10px] text-gray-400 ml-2">({t.turnaroundTime})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#176541] dark:text-[#34d399]">${t.price}</span>
                        <button
                          type="button"
                          onClick={() => setCartTests(cartTests.filter((item) => item.id !== t.id))}
                          className="text-gray-400 hover:text-rose-500 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample Collection Type */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Collection Preference
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCollectionType('Home Sample Collection')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      collectionType === 'Home Sample Collection'
                        ? 'border-[#176541] bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] ring-2 ring-[#176541]/20'
                        : 'border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold mb-0.5">
                      <Truck className="w-4 h-4 text-[#176541] dark:text-[#34d399]" />
                      Home Collection
                    </div>
                    <p className="text-[10px] text-gray-500">Phlebotomist visits your doorstep ($0 Free)</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCollectionType('Clinic Walk-in Lab')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      collectionType === 'Clinic Walk-in Lab'
                        ? 'border-[#176541] bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] ring-2 ring-[#176541]/20'
                        : 'border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold mb-0.5">
                      <FlaskConical className="w-4 h-4 text-[#176541] dark:text-[#34d399]" />
                      Clinic Walk-in
                    </div>
                    <p className="text-[10px] text-gray-500">Central Diagnostic Lab Suite 2B</p>
                  </button>
                </div>
              </div>

              {/* Address if home collection */}
              {collectionType === 'Home Sample Collection' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Home Address for Phlebotomist Dispatch *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 742 Evergreen Terrace, Apt 4B, Springfield"
                    value={collectionAddress}
                    onChange={(e) => setCollectionAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#281e19] border border-gray-200 dark:border-gray-700 text-xs focus:ring-2 focus:ring-[#176541] outline-none"
                  />
                </div>
              )}

              {/* Patient Demographics */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Patient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Full name"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#281e19] border border-gray-200 dark:border-gray-700 text-xs focus:ring-2 focus:ring-[#176541] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Mobile Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Phone number"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#281e19] border border-gray-200 dark:border-gray-700 text-xs focus:ring-2 focus:ring-[#176541] outline-none"
                  />
                </div>
              </div>

              {/* Date & Time Slot */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#281e19] border border-gray-200 dark:border-gray-700 text-xs focus:ring-2 focus:ring-[#176541] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Time Slot
                  </label>
                  <select
                    value={preferredSlot}
                    onChange={(e) => setPreferredSlot(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#281e19] border border-gray-200 dark:border-gray-700 text-xs focus:ring-2 focus:ring-[#176541] outline-none"
                  >
                    <option value="07:00 AM">07:00 AM (Fasting Ideal)</option>
                    <option value="07:30 AM">07:30 AM</option>
                    <option value="08:00 AM">08:00 AM</option>
                    <option value="08:30 AM">08:30 AM</option>
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                  </select>
                </div>
              </div>

              {/* Payment Option */}
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#281e19] border border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-gray-800 dark:text-gray-200">Total Payable:</span>
                  <span className="text-gray-500 ml-1.5">(Includes sample collection & digital report)</span>
                </div>
                <span className="text-base font-bold text-[#176541] dark:text-[#34d399]">${cartTotal}</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#176541] hover:bg-[#125133] text-white shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Lab Booking</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Medical Lab Report Viewer Modal */}
      {activeReportOrder && activeReportOrder.reportDetails && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="w-full max-w-3xl bg-white text-gray-900 rounded-3xl shadow-2xl p-6 sm:p-8 my-auto border border-gray-200 print:p-0 print:border-none print:shadow-none">
            {/* Header: Official Clinic Letterhead */}
            <div className="flex items-start justify-between border-b-2 border-[#176541] pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#176541] text-white flex items-center justify-center font-bold">
                    <FlaskConical className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-heading text-lg font-bold text-[#176541]">
                      CITYCARE DIAGNOSTIC & PATHOLOGY CENTRAL
                    </h2>
                    <p className="text-[10px] text-gray-500">
                      NABL Accredited Laboratory · License #CLIA-09412-PATH · 124 Medical Square, Suite 2B
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-mono text-xs font-bold text-gray-800">
                  REF: {activeReportOrder.bookingCode}
                </div>
                <div className="text-[10px] text-gray-500">
                  Barcode: {activeReportOrder.barcode || '884019284102'}
                </div>
                <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 inline-block mt-1">
                  OFFICIAL VERIFIED
                </div>
              </div>
            </div>

            {/* Patient Demographics Box */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-gray-50 text-xs border border-gray-200 mb-5">
              <div>
                <span className="text-[9px] uppercase font-bold text-gray-400 block">Patient Name</span>
                <span className="font-bold text-gray-900">{activeReportOrder.patientName}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-gray-400 block">Age / Gender</span>
                <span className="font-semibold text-gray-800">{activeReportOrder.patientAge || 38} Yrs / {activeReportOrder.patientGender || 'Female'}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-gray-400 block">Sample Collected</span>
                <span className="font-semibold text-gray-800">{activeReportOrder.date}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-gray-400 block">Report Released</span>
                <span className="font-semibold text-gray-800">{new Date().toLocaleDateString()}</span>
              </div>
            </div>

            {/* Detailed Parameters List */}
            <div className="space-y-6 mb-6">
              {activeReportOrder.reportDetails.map((detail, idx) => (
                <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-[#edf7f0] px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                    <h4 className="font-heading text-sm font-bold text-[#176541]">
                      {detail.testName} ({detail.category})
                    </h4>
                    <span className="text-[10px] text-gray-600 font-medium">Automated Chemiluminescence / Flow Cytometry</span>
                  </div>

                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-[10px] text-gray-500 uppercase">
                        <th className="px-4 py-2">Investigation Test</th>
                        <th className="px-4 py-2">Observed Value</th>
                        <th className="px-4 py-2">Reference Interval</th>
                        <th className="px-4 py-2 text-right">Interpretation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {detail.parameters.map((p, pIdx) => {
                        const isAbnormal = p.status !== 'Normal';
                        return (
                          <tr key={pIdx} className={isAbnormal ? 'bg-amber-50/60' : ''}>
                            <td className="px-4 py-2.5 font-medium text-gray-800">{p.name}</td>
                            <td className="px-4 py-2.5 font-bold font-mono">
                              <span className={isAbnormal ? 'text-amber-700' : 'text-gray-900'}>
                                {p.value} {p.unit}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-gray-600 font-mono text-[11px]">
                              {p.referenceRange} {p.unit}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  p.status === 'Normal'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : p.status === 'Borderline'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {detail.pathologistNotes && (
                    <div className="p-3 bg-gray-50 border-t border-gray-100 text-[11px] text-gray-600">
                      <strong className="text-gray-800">Pathologist Comments: </strong>
                      {detail.pathologistNotes}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Signature & Verification Block */}
            <div className="flex items-end justify-between border-t border-gray-200 pt-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-300">
                  <QrCode className="w-9 h-9 text-gray-700" />
                </div>
                <div className="text-[10px] text-gray-500 leading-tight">
                  Scan to verify authentic digital signature
                  <br />
                  Cryptographically signed record #SHA-256
                </div>
              </div>

              <div className="text-right">
                <div className="font-heading font-bold text-xs text-gray-900">Dr. Amanda Chen, MD</div>
                <div className="text-[10px] text-gray-500">Chief Clinical Pathologist & Laboratory Director</div>
                <div className="text-[9px] text-[#176541] font-semibold mt-0.5">CityCare Central Diagnostics</div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200 print:hidden">
              <button
                onClick={() => setActiveReportOrder(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#176541] hover:bg-[#125133] text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
