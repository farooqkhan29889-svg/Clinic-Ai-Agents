import React, { useEffect, useRef, useState } from 'react';
import { soundFX } from '../services/soundEffects';
import {
  Shield,
  Zap,
  Cpu,
  Radio,
  Flame,
  Activity,
  Crosshair,
  Satellite,
  Compass,
  AlertOctagon,
  RefreshCw,
  Sliders,
  CheckCircle2
} from 'lucide-react';

interface StarkHolographicHUDProps {
  isSpeaking: boolean;
  onExecuteVoiceCommand?: (command: string) => void;
}

export const StarkHolographicHUD: React.FC<StarkHolographicHUDProps> = ({
  isSpeaking,
  onExecuteVoiceCommand
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [armorModel, setArmorModel] = useState<'Mark 85' | 'Mark 50' | 'Hulkbuster' | 'Silver Centurion'>('Mark 85');
  const [arcPower, setArcPower] = useState(100);
  const [repulsorLevel, setRepulsorLevel] = useState(100);
  const [nanoIntegrity, setNanoIntegrity] = useState(99.4);
  const [activeProtocol, setActiveProtocol] = useState<string | null>(null);

  // Canvas radar & wireframe animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let angle = 0;
    let sweepAngle = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const radius = Math.min(cx, cy) - 15;

      // Outer HUD Ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(55, 230, 255, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Degree tick marks
      for (let i = 0; i < 36; i++) {
        const rad = (i * 10 * Math.PI) / 180;
        const tickLength = i % 9 === 0 ? 12 : 5;
        const x1 = cx + Math.cos(rad) * radius;
        const y1 = cy + Math.sin(rad) * radius;
        const x2 = cx + Math.cos(rad) * (radius - tickLength);
        const y2 = cy + Math.sin(rad) * (radius - tickLength);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = i % 9 === 0 ? '#37e6ff' : 'rgba(55, 230, 255, 0.4)';
        ctx.lineWidth = i % 9 === 0 ? 2 : 1;
        ctx.stroke();
      }

      // Rotating dashed tactical ring
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.75, angle, angle + Math.PI * 1.5);
      ctx.setLineDash([8, 6]);
      ctx.strokeStyle = '#37e6ff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);

      // Inner counter-rotating ring
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.5, -angle * 1.5, -angle * 1.5 + Math.PI * 1.2);
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(55, 230, 255, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);

      // Radar Sweep Line
      const sweepX = cx + Math.cos(sweepAngle) * radius;
      const sweepY = cy + Math.sin(sweepAngle) * radius;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(sweepX, sweepY);
      ctx.strokeStyle = 'rgba(55, 230, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Radar sweep gradient trail
      const sweepGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      sweepGrad.addColorStop(0, 'rgba(55, 230, 255, 0.25)');
      sweepGrad.addColorStop(1, 'rgba(55, 230, 255, 0)');
      ctx.beginPath();
      ctx.arc(cx, cy, radius, sweepAngle - 0.4, sweepAngle);
      ctx.lineTo(cx, cy);
      ctx.fillStyle = sweepGrad;
      ctx.fill();

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(cx - radius * 0.2, cy);
      ctx.lineTo(cx + radius * 0.2, cy);
      ctx.moveTo(cx, cy - radius * 0.2);
      ctx.lineTo(cx, cy + radius * 0.2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Center core pulse
      const coreR = 8 + (isSpeaking ? Math.sin(Date.now() / 100) * 4 : Math.sin(Date.now() / 400) * 2);
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(3, coreR), 0, Math.PI * 2);
      ctx.fillStyle = isSpeaking ? '#ffffff' : '#37e6ff';
      ctx.shadowColor = '#37e6ff';
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();

      angle += 0.015;
      sweepAngle += 0.035;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isSpeaking]);

  // Protocol Trigger Action
  const triggerProtocol = (name: string, command: string) => {
    soundFX.playRepulsorArm();
    setActiveProtocol(name);
    setTimeout(() => {
      onExecuteVoiceCommand?.(command);
    }, 400);
    setTimeout(() => setActiveProtocol(null), 3000);
  };

  return (
    <div className="bg-[#061019]/90 border border-[#37e6ff]/30 rounded-2xl p-5 shadow-[0_0_25px_rgba(55,230,255,0.15)] flex flex-col gap-4">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#37e6ff]/20 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <Crosshair className="w-5 h-5 text-[#37e6ff] animate-spin-counter" />
          <div>
            <h3 className="font-orbitron text-sm font-black tracking-widest text-[#eafcff]">
              STARK ARMOR DIAGNOSTICS & TELEMETRY
            </h3>
            <span className="text-[10px] font-mono-tech text-[#1b8fa8] tracking-wider uppercase">
              SUIT DEPLOYMENT: {armorModel} • FIRMWARE v85.4
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {(['Mark 85', 'Mark 50', 'Hulkbuster', 'Silver Centurion'] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                soundFX.playClick();
                setArmorModel(m);
                if (m === 'Hulkbuster') {
                  setArcPower(140);
                  setNanoIntegrity(100);
                } else {
                  setArcPower(100);
                  setNanoIntegrity(99.4);
                }
              }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-orbitron transition-all ${
                armorModel === m
                  ? 'bg-[#37e6ff]/25 text-[#eafcff] border border-[#37e6ff] shadow-[0_0_10px_rgba(55,230,255,0.3)]'
                  : 'bg-[#04080f] text-[#8fc9dd] border border-[#37e6ff]/15 hover:text-white'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Grid: Radar Canvas & Key Vital Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Holographic Radar Canvas */}
        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#04080f]/80 border border-[#37e6ff]/25 relative">
          <canvas
            ref={canvasRef}
            width={220}
            height={220}
            className="w-[200px] h-[200px] select-none"
          />
          <div className="absolute bottom-2 text-[9px] font-mono-tech text-[#37e6ff] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5dffb0] animate-pulse" />
            LIVE SENSOR SWEEP • 360° RADIAL
          </div>
        </div>

        {/* Vital Gauges */}
        <div className="space-y-3.5 col-span-1 md:col-span-2">
          {/* Arc Reactor Core Output */}
          <div className="bg-[#04080f]/80 p-3 rounded-xl border border-[#37e6ff]/20">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-[#eafcff] flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#37e6ff]" /> ARC REACTOR FLUX OUTPUT
              </span>
              <span className="font-mono-tech text-[#37e6ff] font-bold">
                {arcPower}% (3.14 GJ/s)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#091524] overflow-hidden p-0.5 border border-[#37e6ff]/30">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#1b8fa8] via-[#37e6ff] to-[#ffffff] transition-all duration-500 shadow-[0_0_8px_#37e6ff]"
                style={{ width: `${Math.min(100, arcPower)}%` }}
              />
            </div>
          </div>

          {/* Nanotech Hull Integrity */}
          <div className="bg-[#04080f]/80 p-3 rounded-xl border border-[#37e6ff]/20">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-[#eafcff] flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-[#5dffb0]" /> NANOTECH HULL INTEGRITY
              </span>
              <span className="font-mono-tech text-[#5dffb0] font-bold">
                {nanoIntegrity}% DENSITY
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#091524] overflow-hidden p-0.5 border border-[#5dffb0]/30">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#1b8fa8] via-[#5dffb0] to-[#ffffff] transition-all duration-500 shadow-[0_0_8px_#5dffb0]"
                style={{ width: `${nanoIntegrity}%` }}
              />
            </div>
          </div>

          {/* Repulsor Capacitors & Flight Thrusters */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-[#04080f]/80 border border-[#37e6ff]/20 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#8fc9dd] font-mono-tech block">REPULSOR CHARGE</span>
                <span className="text-sm font-bold text-[#eafcff] font-mono-tech">100% READY</span>
              </div>
              <Flame className="w-5 h-5 text-[#f2b23e] animate-pulse" />
            </div>

            <div className="p-2.5 rounded-xl bg-[#04080f]/80 border border-[#37e6ff]/20 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#8fc9dd] font-mono-tech block">FLIGHT VELOCITY</span>
                <span className="text-sm font-bold text-[#eafcff] font-mono-tech">MACH 3.2</span>
              </div>
              <Compass className="w-5 h-5 text-[#37e6ff]" />
            </div>
          </div>
        </div>
      </div>

      {/* Tactical Protocols Buttons */}
      <div className="pt-2 border-t border-[#37e6ff]/20">
        <span className="text-[10px] font-orbitron tracking-wider text-[#1b8fa8] uppercase block mb-2">
          Stark Tactical Defense Protocols
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => triggerProtocol('House Party', 'Initiate House Party Protocol: Prep all automated armors.')}
            className="p-2 rounded-xl bg-[#091624] hover:bg-[#37e6ff]/20 border border-[#37e6ff]/30 text-left transition-all hover:scale-[1.02] shadow-[0_0_8px_rgba(55,230,255,0.1)]"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#37e6ff]">
              <Radio className="w-3.5 h-3.5" /> House Party
            </div>
            <div className="text-[9px] text-[#8fc9dd] font-mono-tech mt-0.5">Automated suit squad</div>
          </button>

          <button
            onClick={() => triggerProtocol('Veronica', 'Deploy Veronica satellite cage and Hulkbuster support module.')}
            className="p-2 rounded-xl bg-[#091624] hover:bg-[#37e6ff]/20 border border-[#37e6ff]/30 text-left transition-all hover:scale-[1.02] shadow-[0_0_8px_rgba(55,230,255,0.1)]"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#37e6ff]">
              <Satellite className="w-3.5 h-3.5" /> Veronica
            </div>
            <div className="text-[9px] text-[#8fc9dd] font-mono-tech mt-0.5">Orbital cage deploy</div>
          </button>

          <button
            onClick={() => triggerProtocol('Overcharge', 'Overcharge Arc Reactor to 400% capacity for unibeam discharge.')}
            className="p-2 rounded-xl bg-[#091624] hover:bg-[#37e6ff]/20 border border-[#37e6ff]/30 text-left transition-all hover:scale-[1.02] shadow-[0_0_8px_rgba(55,230,255,0.1)]"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#f2b23e]">
              <Zap className="w-3.5 h-3.5" /> 400% Overcharge
            </div>
            <div className="text-[9px] text-[#8fc9dd] font-mono-tech mt-0.5">Unibeam chest blast</div>
          </button>

          <button
            onClick={() => triggerProtocol('Clean Slate', 'Run diagnostics and clean slate security refresh.')}
            className="p-2 rounded-xl bg-[#091624] hover:bg-[#37e6ff]/20 border border-[#37e6ff]/30 text-left transition-all hover:scale-[1.02] shadow-[0_0_8px_rgba(55,230,255,0.1)]"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#5dffb0]">
              <Shield className="w-3.5 h-3.5" /> Suit Diagnostics
            </div>
            <div className="text-[9px] text-[#8fc9dd] font-mono-tech mt-0.5">Full sensory sweep</div>
          </button>
        </div>
      </div>
    </div>
  );
};
