import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { HealthTrendPoint } from '../types/clinic';
import {
  Activity,
  Heart,
  Droplet,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  Plus,
  Sparkles,
  Calendar,
  Info,
} from 'lucide-react';

interface LabTrendsChartProps {
  initialData: HealthTrendPoint[];
  patientName: string;
}

type MetricCategory = 'bp' | 'cholesterol' | 'glucose' | 'heartRate';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  metric: MetricCategory;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, metric }) => {
  if (active && payload && payload.length) {
    const dataPoint: HealthTrendPoint = payload[0].payload;
    return (
      <div className="bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#3d2e26] p-3.5 rounded-xl shadow-lg text-xs space-y-1.5 z-50">
        <div className="flex items-center justify-between gap-3 border-b border-[#f0e8e3] dark:border-[#33251e] pb-1">
          <span className="font-bold text-[#481e0b] dark:text-[#f7eee9] flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#c85d38]" />
            {label}
          </span>
          {dataPoint.recordedBy && (
            <span className="text-[10px] text-[#786b65] dark:text-[#a89991]">
              {dataPoint.recordedBy}
            </span>
          )}
        </div>

        <div className="space-y-1 pt-1">
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="font-medium text-[#56473f] dark:text-[#c4b5ae]">{entry.name}:</span>
              </span>
              <strong className="font-bold text-[#481e0b] dark:text-[#f7eee9]">
                {entry.value}{' '}
                {metric === 'bp'
                  ? 'mmHg'
                  : metric === 'cholesterol' || metric === 'glucose'
                  ? 'mg/dL'
                  : entry.dataKey === 'spO2'
                  ? '%'
                  : 'bpm'}
              </strong>
            </div>
          ))}
        </div>

        {dataPoint.notes && (
          <div className="pt-1.5 border-t border-[#f0e8e3] dark:border-[#33251e] text-[11px] text-[#786b65] dark:text-[#a89991] italic max-w-[220px]">
            "{dataPoint.notes}"
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const LabTrendsChart: React.FC<LabTrendsChartProps> = ({ initialData, patientName }) => {
  const [data, setData] = useState<HealthTrendPoint[]>(initialData);
  const [metric, setMetric] = useState<MetricCategory>('bp');
  const [timeRange, setTimeRange] = useState<'all' | '6m' | '3m'>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form state for adding new reading
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formSystolic, setFormSystolic] = useState<number>(120);
  const [formDiastolic, setFormDiastolic] = useState<number>(80);
  const [formHeartRate, setFormHeartRate] = useState<number>(72);
  const [formTotalChol, setFormTotalChol] = useState<number>(180);
  const [formGlucose, setFormGlucose] = useState<number>(90);
  const [formNotes, setFormNotes] = useState<string>('Home self-check reading');

  // Filter data based on time range
  const filteredData = React.useMemo(() => {
    if (timeRange === 'all') return data;
    const now = new Date();
    const monthsBack = timeRange === '6m' ? 6 : 3;
    const cutoff = new Date();
    cutoff.setMonth(now.getMonth() - monthsBack);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    return data.filter((d) => d.date >= cutoffStr);
  }, [data, timeRange]);

  const latestPoint = filteredData[filteredData.length - 1] || data[data.length - 1];
  const firstPoint = filteredData[0] || data[0];

  // Calculate trends for cards
  const bpSystolicDiff = latestPoint && firstPoint ? latestPoint.systolic - firstPoint.systolic : 0;
  const cholDiff =
    latestPoint && firstPoint ? latestPoint.totalCholesterol - firstPoint.totalCholesterol : 0;
  const glucoseDiff =
    latestPoint && firstPoint ? latestPoint.fastingGlucose - firstPoint.fastingGlucose : 0;
  const hrDiff = latestPoint && firstPoint ? latestPoint.heartRate - firstPoint.heartRate : 0;

  const handleAddReading = (e: React.FormEvent) => {
    e.preventDefault();
    const newPoint: HealthTrendPoint = {
      id: `HT-USER-${Date.now()}`,
      date: formDate,
      systolic: Number(formSystolic),
      diastolic: Number(formDiastolic),
      heartRate: Number(formHeartRate),
      totalCholesterol: Number(formTotalChol),
      ldl: Math.round(Number(formTotalChol) * 0.58),
      hdl: 52,
      triglycerides: 140,
      fastingGlucose: Number(formGlucose),
      spO2: 99,
      recordedBy: 'Patient Self-Entry',
      notes: formNotes || 'Self-recorded vital reading',
    };

    const updated = [...data, newPoint].sort((a, b) => a.date.localeCompare(b.date));
    setData(updated);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Overview & Quick Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Blood Pressure Summary */}
        <div
          onClick={() => setMetric('bp')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            metric === 'bp'
              ? 'bg-[#fdfaf8] dark:bg-[#251d19] border-[#c85d38] shadow-xs'
              : 'bg-white dark:bg-[#1e1714] border-[#d5e5db] dark:border-[#382b24] hover:border-[#c85d38]/50'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-[#786b65] dark:text-[#a89991]">
            <span className="font-semibold">Blood Pressure</span>
            <Activity className="w-4 h-4 text-[#c85d38]" />
          </div>
          <div className="font-heading font-black text-xl text-[#481e0b] dark:text-[#f7eee9] mt-2">
            {latestPoint?.systolic}/{latestPoint?.diastolic}{' '}
            <span className="text-xs font-normal text-[#786b65] dark:text-[#a89991]">mmHg</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium mt-1">
            {bpSystolicDiff <= 0 ? (
              <span className="text-[#176541] dark:text-[#34d399] flex items-center">
                <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                {Math.abs(bpSystolicDiff)} mmHg (Improved)
              </span>
            ) : (
              <span className="text-[#c85d38] flex items-center">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" />+{bpSystolicDiff} mmHg
              </span>
            )}
          </div>
        </div>

        {/* Total Cholesterol */}
        <div
          onClick={() => setMetric('cholesterol')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            metric === 'cholesterol'
              ? 'bg-[#fdfaf8] dark:bg-[#251d19] border-[#c85d38] shadow-xs'
              : 'bg-white dark:bg-[#1e1714] border-[#d5e5db] dark:border-[#382b24] hover:border-[#c85d38]/50'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-[#786b65] dark:text-[#a89991]">
            <span className="font-semibold">Total Cholesterol</span>
            <Droplet className="w-4 h-4 text-[#e67e22]" />
          </div>
          <div className="font-heading font-black text-xl text-[#481e0b] dark:text-[#f7eee9] mt-2">
            {latestPoint?.totalCholesterol}{' '}
            <span className="text-xs font-normal text-[#786b65] dark:text-[#a89991]">mg/dL</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium mt-1">
            {cholDiff <= 0 ? (
              <span className="text-[#176541] dark:text-[#34d399] flex items-center">
                <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                {Math.abs(cholDiff)} mg/dL (Healthier)
              </span>
            ) : (
              <span className="text-amber-600 flex items-center">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" />+{cholDiff} mg/dL
              </span>
            )}
          </div>
        </div>

        {/* Fasting Glucose */}
        <div
          onClick={() => setMetric('glucose')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            metric === 'glucose'
              ? 'bg-[#fdfaf8] dark:bg-[#251d19] border-[#c85d38] shadow-xs'
              : 'bg-white dark:bg-[#1e1714] border-[#d5e5db] dark:border-[#382b24] hover:border-[#c85d38]/50'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-[#786b65] dark:text-[#a89991]">
            <span className="font-semibold">Fasting Sugar</span>
            <Sparkles className="w-4 h-4 text-[#176541] dark:text-[#34d399]" />
          </div>
          <div className="font-heading font-black text-xl text-[#481e0b] dark:text-[#f7eee9] mt-2">
            {latestPoint?.fastingGlucose}{' '}
            <span className="text-xs font-normal text-[#786b65] dark:text-[#a89991]">mg/dL</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium mt-1">
            <span className="text-[#176541] dark:text-[#34d399] flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 mr-0.5" />
              Normal (70-99)
            </span>
          </div>
        </div>

        {/* Heart Rate */}
        <div
          onClick={() => setMetric('heartRate')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            metric === 'heartRate'
              ? 'bg-[#fdfaf8] dark:bg-[#251d19] border-[#c85d38] shadow-xs'
              : 'bg-white dark:bg-[#1e1714] border-[#d5e5db] dark:border-[#382b24] hover:border-[#c85d38]/50'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-[#786b65] dark:text-[#a89991]">
            <span className="font-semibold">Resting Pulse</span>
            <Heart className="w-4 h-4 text-rose-500" />
          </div>
          <div className="font-heading font-black text-xl text-[#481e0b] dark:text-[#f7eee9] mt-2">
            {latestPoint?.heartRate}{' '}
            <span className="text-xs font-normal text-[#786b65] dark:text-[#a89991]">bpm</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium mt-1 text-[#786b65] dark:text-[#a89991]">
            <span>SpO2: {latestPoint?.spO2 || 99}%</span>
          </div>
        </div>
      </div>

      {/* Main Chart Card */}
      <div className="p-5 md:p-6 rounded-3xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-xs space-y-6">
        {/* Controls: Metric Tabs + Time Range + Add Entry Button */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-[#f0e8e3] dark:border-[#33251e]">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-heading font-bold text-base text-[#481e0b] dark:text-[#f7eee9]">
                {metric === 'bp' && 'Blood Pressure Trend (Systolic vs Diastolic)'}
                {metric === 'cholesterol' && 'Lipid Profile & Cholesterol Trends'}
                {metric === 'glucose' && 'Fasting Blood Glucose Longitudinal Trend'}
                {metric === 'heartRate' && 'Resting Pulse Rate & Oxygen Saturation'}
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] text-[10px] font-bold">
                {filteredData.length} checkpoints
              </span>
            </div>
            <p className="text-xs text-[#786b65] dark:text-[#a89991] mt-0.5">
              Historical outpatient diagnostic metrics plotted over time for {patientName}.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Metric Selector Buttons */}
            <div className="inline-flex rounded-xl p-1 bg-[#f7f3f0] dark:bg-[#251d19] border border-[#eedfd6] dark:border-[#3d2e26]">
              <button
                onClick={() => setMetric('bp')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  metric === 'bp'
                    ? 'bg-white dark:bg-[#1a1310] text-[#c85d38] shadow-xs'
                    : 'text-[#786b65] dark:text-[#a89991]'
                }`}
              >
                BP
              </button>
              <button
                onClick={() => setMetric('cholesterol')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  metric === 'cholesterol'
                    ? 'bg-white dark:bg-[#1a1310] text-[#c85d38] shadow-xs'
                    : 'text-[#786b65] dark:text-[#a89991]'
                }`}
              >
                Lipids
              </button>
              <button
                onClick={() => setMetric('glucose')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  metric === 'glucose'
                    ? 'bg-white dark:bg-[#1a1310] text-[#c85d38] shadow-xs'
                    : 'text-[#786b65] dark:text-[#a89991]'
                }`}
              >
                Glucose
              </button>
              <button
                onClick={() => setMetric('heartRate')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  metric === 'heartRate'
                    ? 'bg-white dark:bg-[#1a1310] text-[#c85d38] shadow-xs'
                    : 'text-[#786b65] dark:text-[#a89991]'
                }`}
              >
                Pulse
              </button>
            </div>

            {/* Time range pills */}
            <div className="inline-flex rounded-xl p-1 bg-[#f7f3f0] dark:bg-[#251d19] border border-[#eedfd6] dark:border-[#3d2e26]">
              <button
                onClick={() => setTimeRange('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  timeRange === 'all'
                    ? 'bg-white dark:bg-[#1a1310] text-[#481e0b] dark:text-[#f7eee9] shadow-xs'
                    : 'text-[#786b65] dark:text-[#a89991]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTimeRange('6m')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  timeRange === '6m'
                    ? 'bg-white dark:bg-[#1a1310] text-[#481e0b] dark:text-[#f7eee9] shadow-xs'
                    : 'text-[#786b65] dark:text-[#a89991]'
                }`}
              >
                6M
              </button>
              <button
                onClick={() => setTimeRange('3m')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  timeRange === '3m'
                    ? 'bg-white dark:bg-[#1a1310] text-[#481e0b] dark:text-[#f7eee9] shadow-xs'
                    : 'text-[#786b65] dark:text-[#a89991]'
                }`}
              >
                3M
              </button>
            </div>

            {/* Add Reading Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#c85d38] hover:bg-[#a84724] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Reading</span>
            </button>
          </div>
        </div>

        {/* Recharts Canvas */}
        <div className="w-full h-[320px] sm:h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={filteredData}
              margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e6ded9" opacity={0.6} />
              <XAxis
                dataKey="date"
                stroke="#8c7e77"
                fontSize={11}
                tickLine={false}
                tickFormatter={(str) => {
                  try {
                    const parts = str.split('-');
                    return `${parts[1]}/${parts[2]}`;
                  } catch {
                    return str;
                  }
                }}
              />
              <YAxis
                stroke="#8c7e77"
                fontSize={11}
                tickLine={false}
                domain={
                  metric === 'bp'
                    ? [60, 160]
                    : metric === 'cholesterol'
                    ? [80, 240]
                    : metric === 'glucose'
                    ? [60, 140]
                    : [50, 110]
                }
              />
              <Tooltip content={<CustomTooltip metric={metric} />} />
              <Legend
                wrapperStyle={{
                  paddingTop: '16px',
                  fontSize: '12px',
                }}
              />

              {/* Metric 1: Blood Pressure */}
              {metric === 'bp' && (
                <>
                  <ReferenceLine
                    y={120}
                    label={{
                      value: 'Normal Systolic (<120)',
                      position: 'insideTopRight',
                      fill: '#176541',
                      fontSize: 10,
                    }}
                    stroke="#176541"
                    strokeDasharray="4 4"
                    strokeOpacity={0.6}
                  />
                  <ReferenceLine
                    y={80}
                    label={{
                      value: 'Normal Diastolic (<80)',
                      position: 'insideBottomRight',
                      fill: '#176541',
                      fontSize: 10,
                    }}
                    stroke="#176541"
                    strokeDasharray="4 4"
                    strokeOpacity={0.6}
                  />
                  <Line
                    type="monotone"
                    dataKey="systolic"
                    name="Systolic (mmHg)"
                    stroke="#c85d38"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#c85d38', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, stroke: '#c85d38', strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="diastolic"
                    name="Diastolic (mmHg)"
                    stroke="#176541"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#176541', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, stroke: '#176541', strokeWidth: 2 }}
                  />
                </>
              )}

              {/* Metric 2: Cholesterol */}
              {metric === 'cholesterol' && (
                <>
                  <ReferenceLine
                    y={200}
                    label={{
                      value: 'Desirable Limit (<200)',
                      position: 'insideTopRight',
                      fill: '#c85d38',
                      fontSize: 10,
                    }}
                    stroke="#c85d38"
                    strokeDasharray="4 4"
                    strokeOpacity={0.6}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalCholesterol"
                    name="Total Cholesterol"
                    stroke="#c85d38"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#c85d38' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="ldl"
                    name="LDL (Bad) Chol"
                    stroke="#e67e22"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#e67e22' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="hdl"
                    name="HDL (Good) Chol"
                    stroke="#176541"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#176541' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="triglycerides"
                    name="Triglycerides"
                    stroke="#3b82f6"
                    strokeWidth={1.8}
                    strokeDasharray="3 3"
                    dot={{ r: 3, fill: '#3b82f6' }}
                  />
                </>
              )}

              {/* Metric 3: Fasting Glucose */}
              {metric === 'glucose' && (
                <>
                  <ReferenceLine
                    y={100}
                    label={{
                      value: 'Prediabetes Threshold (100)',
                      position: 'insideTopRight',
                      fill: '#c85d38',
                      fontSize: 10,
                    }}
                    stroke="#c85d38"
                    strokeDasharray="4 4"
                    strokeOpacity={0.6}
                  />
                  <ReferenceLine
                    y={70}
                    label={{
                      value: 'Lower Normal (70)',
                      position: 'insideBottomRight',
                      fill: '#176541',
                      fontSize: 10,
                    }}
                    stroke="#176541"
                    strokeDasharray="4 4"
                    strokeOpacity={0.6}
                  />
                  <Line
                    type="monotone"
                    dataKey="fastingGlucose"
                    name="Fasting Glucose (mg/dL)"
                    stroke="#176541"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#176541', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                  />
                </>
              )}

              {/* Metric 4: Heart Rate */}
              {metric === 'heartRate' && (
                <>
                  <ReferenceLine
                    y={100}
                    label={{
                      value: 'Tachycardia Threshold (>100)',
                      position: 'insideTopRight',
                      fill: '#ef4444',
                      fontSize: 10,
                    }}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    strokeOpacity={0.5}
                  />
                  <Line
                    type="monotone"
                    dataKey="heartRate"
                    name="Heart Rate (bpm)"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#f43f5e', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Clinical Interpretation & Guidelines Note */}
        <div className="p-3.5 rounded-2xl bg-[#fdfaf8] dark:bg-[#251d19] border border-[#f0e8e3] dark:border-[#3d2e26] flex items-start gap-3 text-xs">
          <Info className="w-4 h-4 text-[#c85d38] shrink-0 mt-0.5" />
          <div className="text-[#56473f] dark:text-[#c4b5ae] space-y-0.5">
            <strong className="text-[#481e0b] dark:text-[#f7eee9] block font-semibold">
              Clinical Note & Target Guidelines:
            </strong>
            {metric === 'bp' && (
              <p>
                Standard target blood pressure is &lt;120/80 mmHg. Maintain low-sodium nutrition and regular cardio. If seated readings consistently exceed 140/90 mmHg, consult Dr. Farooq at CityCare Clinic.
              </p>
            )}
            {metric === 'cholesterol' && (
              <p>
                Desirable total cholesterol is &lt;200 mg/dL. HDL (&gt;50 mg/dL) acts protectively for cardiovascular health. Avoid trans fats and perform re-check tests semi-annually.
              </p>
            )}
            {metric === 'glucose' && (
              <p>
                Normal fasting venous blood glucose falls between 70 to 99 mg/dL. Fasting 100-125 mg/dL indicates impaired fasting glucose; 126+ mg/dL requires HbA1c diagnostic testing.
              </p>
            )}
            {metric === 'heartRate' && (
              <p>
                Normal adult resting heart rate ranges from 60 to 100 beats per minute. Consistent resting pulse in the 60-80 bpm range correlates with good aerobic conditioning.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Log Reading Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0e8e3] dark:border-[#33251e]">
              <div>
                <h4 className="font-heading font-bold text-lg text-[#481e0b] dark:text-[#f7eee9]">
                  Log New Health Reading
                </h4>
                <p className="text-xs text-[#786b65] dark:text-[#a89991]">
                  Add your home monitor or verified lab test record
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-[#f7f3f0] dark:bg-[#251d19] text-[#786b65] dark:text-[#a89991] hover:text-[#481e0b] flex items-center justify-center cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddReading} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#481e0b] dark:text-[#f7eee9] mb-1">
                  Reading Date
                </label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#dcc9bf] dark:border-[#42332a] bg-white dark:bg-[#251d19] text-[#481e0b] dark:text-[#f7eee9] focus:outline-none focus:ring-2 focus:ring-[#c85d38]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#481e0b] dark:text-[#f7eee9] mb-1">
                    Systolic (mmHg)
                  </label>
                  <input
                    type="number"
                    min="70"
                    max="220"
                    value={formSystolic}
                    onChange={(e) => setFormSystolic(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#dcc9bf] dark:border-[#42332a] bg-white dark:bg-[#251d19] text-[#481e0b] dark:text-[#f7eee9] focus:outline-none focus:ring-2 focus:ring-[#c85d38]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#481e0b] dark:text-[#f7eee9] mb-1">
                    Diastolic (mmHg)
                  </label>
                  <input
                    type="number"
                    min="40"
                    max="140"
                    value={formDiastolic}
                    onChange={(e) => setFormDiastolic(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#dcc9bf] dark:border-[#42332a] bg-white dark:bg-[#251d19] text-[#481e0b] dark:text-[#f7eee9] focus:outline-none focus:ring-2 focus:ring-[#c85d38]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[#481e0b] dark:text-[#f7eee9] mb-1">
                    Pulse (bpm)
                  </label>
                  <input
                    type="number"
                    min="40"
                    max="180"
                    value={formHeartRate}
                    onChange={(e) => setFormHeartRate(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#dcc9bf] dark:border-[#42332a] bg-white dark:bg-[#251d19] text-[#481e0b] dark:text-[#f7eee9] focus:outline-none focus:ring-2 focus:ring-[#c85d38]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#481e0b] dark:text-[#f7eee9] mb-1">
                    Chol (mg/dL)
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="350"
                    value={formTotalChol}
                    onChange={(e) => setFormTotalChol(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#dcc9bf] dark:border-[#42332a] bg-white dark:bg-[#251d19] text-[#481e0b] dark:text-[#f7eee9] focus:outline-none focus:ring-2 focus:ring-[#c85d38]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#481e0b] dark:text-[#f7eee9] mb-1">
                    Sugar (mg/dL)
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="300"
                    value={formGlucose}
                    onChange={(e) => setFormGlucose(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#dcc9bf] dark:border-[#42332a] bg-white dark:bg-[#251d19] text-[#481e0b] dark:text-[#f7eee9] focus:outline-none focus:ring-2 focus:ring-[#c85d38]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#481e0b] dark:text-[#f7eee9] mb-1">
                  Notes / Context
                </label>
                <input
                  type="text"
                  placeholder="e.g. Measured at morning fasting"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#dcc9bf] dark:border-[#42332a] bg-white dark:bg-[#251d19] text-[#481e0b] dark:text-[#f7eee9] focus:outline-none focus:ring-2 focus:ring-[#c85d38]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-full border border-[#dcc9bf] dark:border-[#42332a] text-[#786b65] dark:text-[#a89991] hover:bg-[#f7f3f0] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#c85d38] hover:bg-[#a84724] text-white font-bold transition-all shadow-xs cursor-pointer"
                >
                  Save to Trends
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
