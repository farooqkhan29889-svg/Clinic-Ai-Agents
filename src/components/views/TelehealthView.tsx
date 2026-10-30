import React, { useState, useEffect } from 'react';
import { NavTab } from '../../types/clinic';
import { DOCTORS_SEED } from '../../data/clinicData';
import { getActivePatientSession } from '../../utils/authStorage';
import { getStoredBookings } from '../../utils/storage';
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  MessageSquare,
  FileText,
  Activity,
  Heart,
  ShieldCheck,
  User,
  Share2,
  Volume2,
  Settings,
  Sparkles,
  Stethoscope,
  Send,
  Pill,
  Clock,
  CheckCircle2,
} from 'lucide-react';

interface TelehealthViewProps {
  onNavigate: (tab: NavTab, doctorId?: number) => void;
}

export const TelehealthView: React.FC<TelehealthViewProps> = ({ onNavigate }) => {
  const [selectedDoctorId, setSelectedDoctorId] = useState<number>(DOCTORS_SEED[0].id);
  const [isInCall, setIsInCall] = useState<boolean>(false);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const [isVideoOn, setIsVideoOn] = useState<boolean>(true);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(true);
  const [chatMessages, setChatMessages] = useState<{ sender: 'doctor' | 'patient'; text: string; time: string }[]>([
    {
      sender: 'doctor',
      text: 'Hello! I am reviewing your recent health trend logs and vitals. How are you feeling today?',
      time: '10:02 AM',
    },
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');

  const patientSession = getActivePatientSession();
  const selectedDoctor = DOCTORS_SEED.find((d) => d.id === selectedDoctorId) || DOCTORS_SEED[0];

  useEffect(() => {
    let interval: any;
    if (isInCall) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [isInCall]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMsg = {
      sender: 'patient' as const,
      text: inputMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setInputMessage('');

    // Simulate doctor quick reply
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'doctor',
          text: 'Thank you for updating me. I have noted this in your clinical record and updated your treatment plan.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 1500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <section className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-[#204060] via-[#2d5884] to-[#162e46] text-white shadow-[0_18px_38px_rgba(32,64,96,0.22)]">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-bold uppercase tracking-wider text-sky-200 mb-3">
            <Video className="w-3.5 h-3.5 text-sky-300" />
            End-to-End Encrypted Telemedicine Suite
          </div>
          <h1 className="font-heading text-2xl md:text-4xl font-bold tracking-tight text-white mb-2">
            CityCare Virtual Clinic & Teleconsultation
          </h1>
          <p className="text-xs md:text-sm text-sky-100 leading-relaxed max-w-2xl">
            Secure, HD video appointments with CityCare specialists. Real-time vital telemetry, live e-prescriptions, and continuous medical record synchronization.
          </p>
        </div>
      </section>

      {!isInCall ? (
        /* Pre-Call Waiting Room & Device Check */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-5">
            {/* Camera Preview Simulation */}
            <div className="relative rounded-3xl overflow-hidden bg-gray-900 border border-gray-700 aspect-video flex items-center justify-center text-white shadow-xl">
              {isVideoOn ? (
                <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-20 h-20 rounded-full bg-[#176541]/30 border-2 border-[#34d399] flex items-center justify-center text-2xl font-bold text-[#34d399] mb-3">
                    {patientSession ? patientSession.name.charAt(0) : 'P'}
                  </div>
                  <h4 className="font-heading text-base font-bold text-white">
                    {patientSession ? patientSession.name : 'Patient Preview Feed'}
                  </h4>
                  <span className="text-xs text-emerald-400 flex items-center gap-1.5 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    HD Video & Audio Connected
                  </span>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <VideoOff className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-xs">Camera is switched off</p>
                </div>
              )}

              {/* Bottom Quick Controls */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                <button
                  onClick={() => setIsMicOn(!isMicOn)}
                  className={`p-2.5 rounded-full text-white cursor-pointer transition-colors ${
                    isMicOn ? 'bg-white/20 hover:bg-white/30' : 'bg-rose-600'
                  }`}
                  title={isMicOn ? 'Mute Mic' : 'Unmute Mic'}
                >
                  {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsVideoOn(!isVideoOn)}
                  className={`p-2.5 rounded-full text-white cursor-pointer transition-colors ${
                    isVideoOn ? 'bg-white/20 hover:bg-white/30' : 'bg-rose-600'
                  }`}
                  title={isVideoOn ? 'Turn Off Video' : 'Turn On Video'}
                >
                  {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Diagnostic Hardware Checklist */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#176541] dark:text-[#34d399]" />
                System & Bandwidth Readiness
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Microphone: Operational</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Camera: 1080p HD</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Latency: 18ms (Optimal)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Specialist Selection & Join Call */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-3xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-xs">
              <h3 className="font-heading text-lg font-bold text-[#30221d] dark:text-[#f7eee9] mb-1">
                Select Consulting Specialist
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Choose a duty physician to begin your virtual video appointment.
              </p>

              <div className="space-y-2.5 mb-5">
                {DOCTORS_SEED.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDoctorId(doc.id)}
                    className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      selectedDoctorId === doc.id
                        ? 'border-[#204060] bg-sky-50 dark:bg-sky-950/30 ring-2 ring-sky-500/20'
                        : 'border-[#d5e5db] dark:border-[#382b24] hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-800 dark:text-slate-200">
                        {doc.name.replace('Dr. ', '').charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-[#30221d] dark:text-[#f7eee9]">
                          {doc.name}
                        </div>
                        <div className="text-[11px] text-gray-500">{doc.spec}</div>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Online Now
                    </span>
                  </button>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => setIsInCall(true)}
                  className="w-full py-3 rounded-2xl text-sm font-bold bg-[#176541] hover:bg-[#125133] text-white shadow-lg shadow-[#176541]/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Video className="w-4 h-4" />
                  <span>Join Encrypted Virtual Room Now</span>
                </button>
                <p className="text-[10px] text-center text-gray-400 mt-2">
                  HIPAA-Compliant Encrypted Audio & Video Stream
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Active Video Call Interface */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Main Video Stage */}
          <div className="lg:col-span-8 flex flex-col justify-between rounded-3xl bg-gray-950 border border-gray-800 overflow-hidden shadow-2xl relative min-h-[500px]">
            {/* Top Bar inside Call */}
            <div className="p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent z-10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-heading font-bold text-white text-sm">
                  {selectedDoctor.name}
                </span>
                <span className="text-xs text-sky-300">({selectedDoctor.spec})</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-black/50 text-white font-mono text-xs border border-white/10">
                  {formatTimer(callDuration)}
                </span>
              </div>
            </div>

            {/* Doctor Primary Video Feed */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-white relative">
              <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-[#176541] to-[#204060] p-1 shadow-2xl mb-4">
                <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center text-3xl font-bold text-white">
                  {selectedDoctor.name.charAt(4)}
                </div>
              </div>
              <h3 className="font-heading text-lg font-bold text-white">{selectedDoctor.name}</h3>
              <p className="text-xs text-sky-200 mt-0.5">Speaking · Live Stethoscope Link Active</p>

              {/* Vitals HUD overlay */}
              <div className="absolute top-16 left-4 bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-left text-xs">
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                  Live Patient Telemetry
                </span>
                <div className="flex items-center gap-3 text-white">
                  <div>
                    <span className="text-[9px] text-gray-400 block">Pulse</span>
                    <strong className="text-emerald-400 font-mono">72 bpm</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-400 block">BP</span>
                    <strong className="text-white font-mono">118/78</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-400 block">SpO2</span>
                    <strong className="text-sky-400 font-mono">99%</strong>
                  </div>
                </div>
              </div>

              {/* Picture-in-picture Patient Self View */}
              <div className="absolute bottom-20 right-4 w-36 h-28 rounded-2xl bg-gray-800 border-2 border-white/20 shadow-xl overflow-hidden flex flex-col items-center justify-center text-center p-2">
                <div className="w-8 h-8 rounded-full bg-[#176541] text-white flex items-center justify-center text-xs font-bold mb-1">
                  You
                </div>
                <span className="text-[10px] text-gray-300 font-medium">Self View</span>
              </div>
            </div>

            {/* Call Control Toolbar */}
            <div className="p-4 bg-black/80 backdrop-blur-md flex items-center justify-center gap-3 z-10 border-t border-white/10">
              <button
                onClick={() => setIsMicOn(!isMicOn)}
                className={`p-3 rounded-full text-white cursor-pointer transition-colors ${
                  isMicOn ? 'bg-white/20 hover:bg-white/30' : 'bg-rose-600'
                }`}
                title={isMicOn ? 'Mute' : 'Unmute'}
              >
                {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setIsVideoOn(!isVideoOn)}
                className={`p-3 rounded-full text-white cursor-pointer transition-colors ${
                  isVideoOn ? 'bg-white/20 hover:bg-white/30' : 'bg-rose-600'
                }`}
                title={isVideoOn ? 'Turn Video Off' : 'Turn Video On'}
              >
                {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className={`p-3 rounded-full text-white cursor-pointer transition-colors ${
                  isChatOpen ? 'bg-sky-600' : 'bg-white/20 hover:bg-white/30'
                }`}
                title="Toggle Clinical Chat"
              >
                <MessageSquare className="w-5 h-5" />
              </button>

              <button
                onClick={() => setIsInCall(false)}
                className="px-5 py-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-600/40"
              >
                <PhoneOff className="w-5 h-5" />
                <span className="text-xs">End Call</span>
              </button>
            </div>
          </div>

          {/* Right Clinical Notes & In-Call Chat */}
          <div className="lg:col-span-4 flex flex-col justify-between rounded-3xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] p-5 shadow-xs h-[520px]">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 mb-3">
                <div className="flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-[#176541] dark:text-[#34d399]" />
                  <h4 className="font-heading text-sm font-bold text-[#30221d] dark:text-[#f7eee9]">
                    Consultation Clinical Chat
                  </h4>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                  Live Sync
                </span>
              </div>

              {/* Chat Messages Log */}
              <div className="space-y-3 overflow-y-auto max-h-[340px] pr-1 text-xs">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl ${
                      msg.sender === 'doctor'
                        ? 'bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] rounded-tl-none mr-4'
                        : 'bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 rounded-tr-none ml-4'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] opacity-75 mb-1">
                      <span className="font-bold">
                        {msg.sender === 'doctor' ? selectedDoctor.name : 'You'}
                      </span>
                      <span>{msg.time}</span>
                    </div>
                    <p className="leading-relaxed">{msg.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Input form */}
            <form onSubmit={handleSendMessage} className="pt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type symptoms or notes to physician..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#281e19] border border-gray-200 dark:border-gray-700 text-xs focus:ring-2 focus:ring-[#176541] outline-none"
                />
                <button
                  type="submit"
                  className="p-2 rounded-xl bg-[#176541] hover:bg-[#125133] text-white cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
