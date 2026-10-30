import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  Activity,
  Heart,
  Footprints,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
  CheckCircle2,
  ArrowRight,
  Plus,
  X,
} from 'lucide-react';
import { NavTab, PatientProfile } from '../types/clinic';

interface DailyHealthMetric {
  date: string;
  dayLabel: string;
  restingHeartRate: number;
  peakHeartRate: number;
  steps: number;
  activeMinutes: number;
  hrv: number;
  sleepHours: number;
}

interface HealthOverviewWidgetProps {
  profile: PatientProfile;
  onNavigate?: (tab: NavTab) => void;
  onAskAI?: (prompt: string) => void;
}

function generatePatientHealthMetrics(patientPhone: string): DailyHealthMetric[] {
  const isPooja = patientPhone.includes('91234');
  const baseRHR = isPooja ? 76 : 68;
  const baseSteps = isPooja ? 7200 : 8500;
  const results: DailyHealthMetric[] = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const variance = Math.sin(i * 0.45) * 3 + (Math.cos(i * 0.2) * 2);
    const stepVariance = Math.cos(i * 0.35) * 1400 + Math.sin(i * 0.8) * 800;

    const rhr = Math.round(baseRHR + variance);
    const peak = Math.round(rhr + 46 + (i % 4 === 0 ? 12 : 0));
    const steps = Math.max(3500, Math.round(baseSteps + stepVariance));
    const activeMins = Math.round((steps / 1000) * 5 + 4);
    const hrv = Math.round(52 + Math.sin(i * 0.5) * 7);
    const sleep = Number((7.2 + Math.cos(i * 0.4) * 0.8).toFixed(1));

    results.push({
      date: dateStr,
      dayLabel,
      restingHeartRate: rhr,
      peakHeartRate: peak,
      steps,
      activeMinutes: activeMins,
      hrv,
      sleepHours: sleep,
    });
  }

  return results;
}

export const HealthOverviewWidget: React.FC<HealthOverviewWidgetProps> = ({
  profile,
  onNavigate,
  onAskAI,
}) => {
  const [timeframe, setTimeframe] = useState<'7d' | '14d' | '30d'>('7d');
  const [metricView, setMetricView] = useState<'heartRate' | 'steps' | 'combined'>('heartRate');
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [customLogs, setCustomLogs] = useState<Record<string, Partial<DailyHealthMetric>>>({});

  const [inputRHR, setInputRHR] = useState<string>('68');
  const [inputSteps, setInputSteps] = useState<string>('8500');
  const [logSuccessNotice, setLogSuccessNotice] = useState<boolean>(false);

  const allMetrics = useMemo(() => {
    const raw = generatePatientHealthMetrics(profile.phone);
    return raw.map((item) => {
      if (customLogs[item.date]) {
        return { ...item, ...customLogs[item.date] };
      }
      return item;
    });
  }, [profile.phone, customLogs]);

  const displayMetrics = useMemo(() => {
    const sliceCount = timeframe === '7d' ? 7 : timeframe === '14d' ? 14 : 30;
    return allMetrics.slice(-sliceCount);
  }, [allMetrics, timeframe]);

  const latestMetric = displayMetrics[displayMetrics.length - 1] || displayMetrics[0];
  const avgRHR = Math.round(
    displayMetrics.reduce((acc, curr) => acc + curr.restingHeartRate, 0) / displayMetrics.length,
  );
  const avgSteps = Math.round(
    displayMetrics.reduce((acc, curr) => acc + curr.steps, 0) / displayMetrics.length,
  );

  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault();
    const todayStr = new Date().toISOString().split('T')[0];
    const parsedRHR = parseInt(inputRHR, 10) || 68;
    const parsedSteps = parseInt(inputSteps, 10) || 8500;

    setCustomLogs((prev) => ({
      ...prev,
      [todayStr]: {
        restingHeartRate: parsedRHR,
        steps: parsedSteps,
        peakHeartRate: parsedRHR + 48,
        activeMinutes: Math.round((parsedSteps / 1000) * 5),
      },
    }));

    setLogSuccessNotice(true);
    setTimeout(() => {
      setLogSuccessNotice(false);
      setShowLogModal(false);
    }, 1000);
  };

  const handleAskAIAssistant = () => {
    const prompt = `Analyze my recent vitals: Resting Heart Rate is ${latestMetric.restingHeartRate} bpm (7-day avg: ${avgRHR} bpm), peak pulse is ${latestMetric.peakHeartRate} bpm, and daily activity is ${avgSteps.toLocaleString()} steps. What personalized wellness tips do you recommend?`;
    if (onAskAI) {
      onAskAI(prompt);
    } else if (onNavigate) {
      onNavigate('Assistant');
    }
  };

  return (
    <div className="rounded-3xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-xs overflow-hidden transition-colors">
      {/* Widget Header */}
      <div className="p-5 md:p-6 bg-gradient-to-r from-[#fbf5f2] via-[#f7eee9] to-[#edf7f0] dark:from-[#251b16] dark:via-[#1e1714] dark:to-[#17251d] border-b border-[#ebdcd3] dark:border-[#33251e] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#176541] text-white text-[10px] font-bold uppercase tracking-wider shadow-2xs">
              <Sparkles className="w-3 h-3 text-emerald-300" />
              <span>AI Health Assistant · Health Overview</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[10px] font-bold">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              Cardio Rhythm Stable
            </span>
          </div>

          <h3 className="font-heading text-lg md:text-xl font-bold text-[#481e0b] dark:text-[#f7eee9]">
            Biometric Vitals & Activity Trends
          </h3>
          <p className="text-xs text-[#786b65] dark:text-[#a89991]">
            AI health assistant monitoring resting pulse, active heart rate zones, and movement patterns for <strong>{profile.name}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-center shrink-0 flex-wrap justify-end">
          <button
            type="button"
            onClick={() => setShowLogModal(true)}
            className="px-3.5 py-1.5 rounded-full border border-[#dcc9bf] dark:border-[#42332a] bg-white dark:bg-[#251d19] hover:bg-[#fff5f0] text-[#56473f] dark:text-[#e8dcd5] text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-[#176541] dark:text-[#34d399]" />
            <span>Log Today's Vitals</span>
          </button>

          <button
            type="button"
            onClick={handleAskAIAssistant}
            className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#c85d38] to-[#a84724] hover:from-[#a84724] hover:to-[#8c3516] text-white text-xs font-bold shadow-[0_4px_14px_rgba(200,93,56,0.25)] transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask AI Assistant</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Metric Stat Cards Grid */}
      <div className="p-5 md:p-6 grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#fdfaf8] dark:bg-[#251d19] border border-[#f0e8e3] dark:border-[#382b24] shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#786b65] dark:text-[#a89991]">
              Resting Heart Rate
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Heart className="w-4 h-4 animate-pulse text-rose-500" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading font-black text-2xl sm:text-3xl text-[#481e0b] dark:text-[#f7eee9]">
              {latestMetric.restingHeartRate}
            </span>
            <span className="text-xs font-semibold text-[#786b65] dark:text-[#a89991]">bpm</span>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#f0e8e3] dark:border-[#33251e]">
            <span className="text-[#176541] dark:text-[#34d399] font-bold flex items-center gap-0.5">
              <TrendingDown className="w-3 h-3" />
              -3 bpm (Optimal)
            </span>
            <span className="text-[#786b65] dark:text-[#a89991]">Avg: {avgRHR} bpm</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#fdfaf8] dark:bg-[#251d19] border border-[#f0e8e3] dark:border-[#382b24] shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#786b65] dark:text-[#a89991]">
              Peak Active Pulse
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Activity className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading font-black text-2xl sm:text-3xl text-[#481e0b] dark:text-[#f7eee9]">
              {latestMetric.peakHeartRate}
            </span>
            <span className="text-xs font-semibold text-[#786b65] dark:text-[#a89991]">bpm</span>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#f0e8e3] dark:border-[#33251e]">
            <span className="text-amber-700 dark:text-amber-400 font-bold">Aerobic Zone</span>
            <span className="text-[#786b65] dark:text-[#a89991]">Max Safe: 155 bpm</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#fdfaf8] dark:bg-[#251d19] border border-[#f0e8e3] dark:border-[#382b24] shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#786b65] dark:text-[#a89991]">
              Daily Movement
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#176541] dark:text-[#34d399] flex items-center justify-center">
              <Footprints className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading font-black text-2xl sm:text-3xl text-[#481e0b] dark:text-[#f7eee9]">
              {latestMetric.steps.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-[#786b65] dark:text-[#a89991]">steps</span>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#f0e8e3] dark:border-[#33251e]">
            <span className="text-[#176541] dark:text-[#34d399] font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              +12% this week
            </span>
            <span className="text-[#786b65] dark:text-[#a89991]">
              {Math.round((latestMetric.steps / 10000) * 100)}% goal
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#fdfaf8] dark:bg-[#251d19] border border-[#f0e8e3] dark:border-[#382b24] shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#786b65] dark:text-[#a89991]">
              HRV Recovery
            </span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Zap className="w-4 h-4 text-sky-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading font-black text-2xl sm:text-3xl text-[#481e0b] dark:text-[#f7eee9]">
              {latestMetric.hrv}
            </span>
            <span className="text-xs font-semibold text-[#786b65] dark:text-[#a89991]">ms</span>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#f0e8e3] dark:border-[#33251e]">
            <span className="text-sky-700 dark:text-sky-300 font-bold">High Resilience</span>
            <span className="text-[#786b65] dark:text-[#a89991]">Sleep: {latestMetric.sleepHours}h</span>
          </div>
        </div>
      </div>

      {/* Interactive Chart Container */}
      <div className="px-5 md:px-6 pb-6 space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-[#f0e8e3] dark:border-[#33251e]">
          <div className="flex items-center gap-1.5 bg-[#fdfaf8] dark:bg-[#251d19] border border-[#dcc9bf] dark:border-[#42332a] p-1 rounded-full">
            <button
              type="button"
              onClick={() => setMetricView('heartRate')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                metricView === 'heartRate'
                  ? 'bg-[#176541] text-white shadow-2xs'
                  : 'text-[#786b65] dark:text-[#a89991] hover:text-[#176541]'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Heart Rate (bpm)</span>
            </button>

            <button
              type="button"
              onClick={() => setMetricView('steps')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                metricView === 'steps'
                  ? 'bg-[#c85d38] text-white shadow-2xs'
                  : 'text-[#786b65] dark:text-[#a89991] hover:text-[#c85d38]'
              }`}
            >
              <Footprints className="w-3.5 h-3.5" />
              <span>Daily Activity</span>
            </button>

            <button
              type="button"
              onClick={() => setMetricView('combined')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                metricView === 'combined'
                  ? 'bg-[#234c91] text-white shadow-2xs'
                  : 'text-[#786b65] dark:text-[#a89991] hover:text-[#234c91]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Cardio-Activity Index</span>
            </button>
          </div>

          <div className="flex items-center gap-1 bg-[#fdfaf8] dark:bg-[#251d19] border border-[#dcc9bf] dark:border-[#42332a] p-1 rounded-full self-end sm:self-center">
            {(['7d', '14d', '30d'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  timeframe === t
                    ? 'bg-white dark:bg-[#1e1714] text-[#481e0b] dark:text-[#f7eee9] shadow-2xs border border-[#dcc9bf] dark:border-[#42332a]'
                    : 'text-[#786b65] dark:text-[#a89991]'
                }`}
              >
                {t === '7d' ? '7 Days' : t === '14d' ? '14 Days' : '30 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Chart View */}
        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {metricView === 'heartRate' ? (
              <AreaChart data={displayMetrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="rhrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#176541" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#176541" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="peakGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c85d38" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#c85d38" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="dayLabel" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#786b65' }} />
                <YAxis domain={[50, 150]} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#786b65' }} unit=" bpm" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #dcc9bf',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                    fontSize: '12px',
                  }}
                  formatter={(val: any, name: any) => [
                    `${val} bpm`,
                    name === 'restingHeartRate' ? 'Resting Heart Rate' : 'Peak Active Pulse',
                  ]}
                />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }} />
                <ReferenceLine y={60} stroke="#176541" strokeDasharray="3 3" label={{ value: 'Normal (60)', fill: '#176541', fontSize: 10 }} />
                <ReferenceLine y={100} stroke="#c85d38" strokeDasharray="3 3" label={{ value: 'Normal (100)', fill: '#c85d38', fontSize: 10 }} />
                <Area type="monotone" dataKey="restingHeartRate" name="Resting Heart Rate" stroke="#176541" strokeWidth={2.5} fill="url(#rhrGrad)" />
                <Area type="monotone" dataKey="peakHeartRate" name="Peak Active Pulse" stroke="#c85d38" strokeWidth={2} fill="url(#peakGrad)" />
              </AreaChart>
            ) : metricView === 'steps' ? (
              <BarChart data={displayMetrics} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="dayLabel" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#786b65' }} />
                <YAxis domain={[0, 14000]} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#786b65' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #dcc9bf',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`${Number(val).toLocaleString()} steps`, 'Daily Movement']}
                />
                <ReferenceLine y={10000} stroke="#176541" strokeDasharray="4 4" label={{ value: '10k Step Goal', fill: '#176541', fontSize: 10 }} />
                <Bar dataKey="steps" name="Daily Steps" fill="#c85d38" radius={[6, 6, 0, 0]} barSize={18} />
              </BarChart>
            ) : (
              <LineChart data={displayMetrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="dayLabel" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#786b65' }} />
                <YAxis yAxisId="left" domain={[50, 140]} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#176541' }} unit=" bpm" />
                <YAxis yAxisId="right" orientation="right" domain={[2000, 14000]} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#c85d38' }} unit=" stp" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #dcc9bf',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                    fontSize: '12px',
                  }}
                />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }} />
                <Line yAxisId="left" type="monotone" dataKey="restingHeartRate" name="Resting HR (bpm)" stroke="#176541" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="steps" name="Activity Steps" stroke="#c85d38" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* AI Health Assistant Insights Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#edf7f0] to-[#f5fbf7] dark:from-[#1a2d22] dark:to-[#16231b] border border-[#cfe1d5] dark:border-[#2b4434] space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#176541] text-white flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              </div>
              <span className="font-bold text-xs text-[#176541] dark:text-[#34d399]">
                AI Assistant Clinical Assessment
              </span>
            </div>
            <span className="text-[10px] text-[#567a63] dark:text-[#9bc2a7] font-semibold">
              Personalized for {profile.name}
            </span>
          </div>

          <p className="text-xs text-[#2a4d36] dark:text-[#c4e4d0] leading-relaxed">
            Your resting heart rate is averaging <strong>{avgRHR} bpm</strong> (healthy clinical range: 60-100 bpm) with a daily movement average of <strong>{avgSteps.toLocaleString()} steps</strong>. Cardiovascular recovery has improved following your regular medication schedule and active recovery walks.
          </p>

          <div className="flex items-center gap-4 text-[11px] text-[#3e684d] dark:text-[#a0cbb0] pt-1 flex-wrap">
            <span className="flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#176541] dark:text-[#34d399]" /> Normal Cardiac Rhythm
            </span>
            <span className="flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#176541] dark:text-[#34d399]" /> Daily Target: 85% Achieved
            </span>
            <span className="flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#176541] dark:text-[#34d399]" /> Optimal HRV Resilience ({latestMetric.hrv} ms)
            </span>
          </div>
        </div>
      </div>

      {/* Log Today's Vitals Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-[#1a1412] border border-[#dcc9bf] dark:border-[#382b24] shadow-2xl p-6 text-left space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0e8e3] dark:border-[#33251e]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] flex items-center justify-center">
                  <Heart className="w-4 h-4 text-[#176541] dark:text-[#34d399]" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-base text-[#481e0b] dark:text-[#f7eee9]">
                    Log Vitals & Steps
                  </h4>
                  <p className="text-[11px] text-[#786b65] dark:text-[#a89991]">
                    Update today's personal sensor readings
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="p-1 rounded-full text-[#786b65] hover:text-[#481e0b] dark:text-[#a89991]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {logSuccessNotice && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Reading updated! Charts and AI insights refreshed.</span>
              </div>
            )}

            <form onSubmit={handleSaveLog} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#481e0b] dark:text-[#f7eee9] mb-1">
                  Resting Heart Rate (bpm)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="40"
                    max="180"
                    required
                    value={inputRHR}
                    onChange={(e) => setInputRHR(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#d9c9c2] dark:border-[#42332a] bg-[#fdfaf8] dark:bg-[#251d19] text-xs font-bold text-[#481e0b] dark:text-[#f7eee9]"
                  />
                  <Heart className="w-4 h-4 text-rose-500 absolute right-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#481e0b] dark:text-[#f7eee9] mb-1">
                  Today's Activity (Steps)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="500"
                    max="50000"
                    required
                    value={inputSteps}
                    onChange={(e) => setInputSteps(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#d9c9c2] dark:border-[#42332a] bg-[#fdfaf8] dark:bg-[#251d19] text-xs font-bold text-[#481e0b] dark:text-[#f7eee9]"
                  />
                  <Footprints className="w-4 h-4 text-[#176541] absolute right-3 top-2.5" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 rounded-full border border-[#dcc9bf] dark:border-[#42332a] text-xs font-semibold text-[#786b65]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#176541] hover:bg-[#124d32] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Update Vitals
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
