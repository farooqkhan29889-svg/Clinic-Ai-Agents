import React, { useEffect, useRef, useState } from 'react';
import { HudTheme, HUD_THEMES } from '../theme/hudThemes';
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
  theme?: HudTheme;
}

export const StarkHolographicHUD: React.FC<StarkHolographicHUDProps> = ({
  isSpeaking,
  onExecuteVoiceCommand,
  theme = HUD_THEMES.cyan,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [armorModel, setArmorModel] = useState<'Mark 85' | 'Mark 50' | 'Hulkbuster' | 'Silver Centurion'>('Mark 85');
  const [arcPower, setArcPower] = useState(100);
  const [repulsorLevel, setRepulsorLevel] = useState(100);
  const [nanoIntegrity, setNanoIntegrity] = useState(99.4);
  const [activeProtocol, setActiveProtocol] = useState<string | null>(null);

  const primaryColor = theme.primary;
  const primaryRgb = theme.primaryRgb;
  const secondaryColor = theme.secondary;
  const glowColor = theme.glow;


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
      ctx.strokeStyle = `rgba(${primaryRgb}, 0.25)`;
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
        ctx.strokeStyle = i % 9 === 0 ? primaryColor : `rgba(${primaryRgb}, 0.4)`;
        ctx.lineWidth = i % 9 === 0 ? 2 : 1;
        ctx.stroke();
      }

      // Rotating dashed tactical ring
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.75, angle, angle + Math.PI * 1.5);
      ctx.setLineDash([8, 6]);
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);

      // Inner counter-rotating ring
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.5, -angle * 1.5, -angle * 1.5 + Math.PI * 1.2);
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = `rgba(${primaryRgb}, 0.6)`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);

      // Radar Sweep Line
      const sweepX = cx + Math.cos(sweepAngle) * radius;
      const sweepY = cy + Math.sin(sweepAngle) * radius;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(sweepX, sweepY);
      ctx.strokeStyle = `rgba(${primaryRgb}, 0.8)`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Radar sweep gradient trail
      const sweepGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      sweepGrad.addColorStop(0, `rgba(${primaryRgb}, 0.25)`);
      sweepGrad.addColorStop(1, `rgba(${primaryRgb}, 0)`);
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
      ctx.fillStyle = isSpeaking ? '#ffffff' : primaryColor;
      ctx.shadowColor = primaryColor;
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
  }, [isSpeaking, primaryColor, primaryRgb]);

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
    <div
      className="border rounded-2xl p-5 shadow-2xl flex flex-col gap-4 transition-all duration-300"
      style={{
        backgroundColor: `${theme.bgCard}ee`,
        borderColor: theme.borderHighlight,
        boxShadow: `0 0 25px ${theme.glow}`,
      }}
    >
      {/* Top Banner */}
      <div
        className="flex flex-wrap items-center justify-between pb-3 gap-2 border-b"
        style={{ borderColor: theme.borderAlpha }}
      >
        <div className="flex items-center gap-2">
          <Crosshair className="w-5 h-5 animate-spin-counter" style={{ color: primaryColor }} />
          <div>
            <h3 className="font-orbitron text-sm font-black tracking-widest text-[#eafcff]">
              STARK ARMOR DIAGNOSTICS & TELEMETRY
            </h3>
            <span
              className="text-[10px] font-mono-tech tracking-wider uppercase"
              style={{ color: secondaryColor }}
            >
              SUIT DEPLOYMENT: {armorModel} • PALETTE: {theme.name.toUpperCase()}
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
              className="px-2.5 py-1 rounded-lg text-[10px] font-orbitron transition-all"
              style={{
                backgroundColor: armorModel === m ? theme.badgeBg : theme.bgBase,
                color: armorModel === m ? '#ffffff' : '#8fc9dd',
                border: `1px solid ${armorModel === m ? primaryColor : theme.borderAlpha}`,
                boxShadow: armorModel === m ? `0 0 10px ${theme.glow}` : undefined,
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Grid: Radar Canvas & Key Vital Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Holographic Radar Canvas */}
        <div
          className="flex flex-col items-center justify-center p-3 rounded-xl border relative"
          style={{
            backgroundColor: `${theme.bgBase}cc`,
            borderColor: theme.borderAlpha,
          }}
        >
          <canvas
            ref={canvasRef}
            width={220}
            height={220}
            className="w-[200px] h-[200px] select-none"
          />
          <div
            className="absolute bottom-2 text-[9px] font-mono-tech flex items-center gap-1"
            style={{ color: primaryColor }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: theme.accent }}
            />
            LIVE SENSOR SWEEP • 360° RADIAL
          </div>
        </div>

        {/* Vital Gauges */}
        <div className="space-y-3.5 col-span-1 md:col-span-2">
          {/* Arc Reactor Core Output */}
          <div
            className="p-3 rounded-xl border"
            style={{
              backgroundColor: `${theme.bgBase}cc`,
              borderColor: theme.borderAlpha,
            }}
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-[#eafcff] flex items-center gap-1.5">
                <Zap className="w-4 h-4" style={{ color: primaryColor }} /> ARC REACTOR FLUX OUTPUT
              </span>
              <span className="font-mono-tech font-bold" style={{ color: primaryColor }}>
                {arcPower}% (3.14 GJ/s)
              </span>
            </div>
            <div
              className="w-full h-2 rounded-full overflow-hidden p-0.5 border"
              style={{
                backgroundColor: theme.bgSurface,
                borderColor: theme.borderAlpha,
              }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, arcPower)}%`,
                  background: `linear-gradient(to right, ${theme.primaryDim}, ${primaryColor}, #ffffff)`,
                  boxShadow: `0 0 8px ${primaryColor}`,
                }}
              />
            </div>
          </div>

          {/* Nanotech Hull Integrity */}
          <div
            className="p-3 rounded-xl border"
            style={{
              backgroundColor: `${theme.bgBase}cc`,
              borderColor: theme.borderAlpha,
            }}
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-[#eafcff] flex items-center gap-1.5">
                <Shield className="w-4 h-4" style={{ color: theme.accent }} /> NANOTECH HULL INTEGRITY
              </span>
              <span className="font-mono-tech font-bold" style={{ color: theme.accent }}>
                {nanoIntegrity}% DENSITY
              </span>
            </div>
            <div
              className="w-full h-2 rounded-full overflow-hidden p-0.5 border"
              style={{
                backgroundColor: theme.bgSurface,
                borderColor: theme.borderAlpha,
              }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${nanoIntegrity}%`,
                  background: `linear-gradient(to right, ${theme.primaryDim}, ${theme.accent}, #ffffff)`,
                  boxShadow: `0 0 8px ${theme.accent}`,
                }}
              />
            </div>
          </div>

          {/* Repulsor Capacitors & Flight Thrusters */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div
              className="p-2.5 rounded-xl border flex items-center justify-between"
              style={{
                backgroundColor: `${theme.bgBase}cc`,
                borderColor: theme.borderAlpha,
              }}
            >
              <div>
                <span className="text-[10px] text-[#8fc9dd] font-mono-tech block">REPULSOR CHARGE</span>
                <span className="text-sm font-bold text-[#eafcff] font-mono-tech">100% READY</span>
              </div>
              <Flame className="w-5 h-5 animate-pulse" style={{ color: theme.accent }} />
            </div>

            <div
              className="p-2.5 rounded-xl border flex items-center justify-between"
              style={{
                backgroundColor: `${theme.bgBase}cc`,
                borderColor: theme.borderAlpha,
              }}
            >
              <div>
                <span className="text-[10px] text-[#8fc9dd] font-mono-tech block">FLIGHT VELOCITY</span>
                <span className="text-sm font-bold text-[#eafcff] font-mono-tech">MACH 3.2</span>
              </div>
              <Compass className="w-5 h-5" style={{ color: primaryColor }} />
            </div>
          </div>
        </div>
      </div>

      {/* Tactical Protocols Buttons */}
      <div className="pt-2 border-t" style={{ borderColor: theme.borderAlpha }}>
        <span
          className="text-[10px] font-orbitron tracking-wider uppercase block mb-2"
          style={{ color: secondaryColor }}
        >
          Stark Tactical Defense Protocols
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { name: 'House Party', cmd: 'Initiate House Party Protocol: Prep all automated armors.', desc: 'Automated suit squad', icon: Radio },
            { name: 'Veronica', cmd: 'Deploy Veronica satellite cage and Hulkbuster support module.', desc: 'Orbital cage deploy', icon: Satellite },
            { name: 'Overcharge', cmd: 'Overcharge Arc Reactor to 400% capacity for unibeam discharge.', desc: 'Unibeam chest blast', icon: Zap },
            { name: 'Clean Slate', cmd: 'Run diagnostics and clean slate security refresh.', desc: 'Full sensory sweep', icon: Shield },
          ].map((proto) => {
            const Icon = proto.icon;
            const isArmed = activeProtocol === proto.name;
            return (
              <button
                key={proto.name}
                onClick={() => triggerProtocol(proto.name, proto.cmd)}
                className="p-2 rounded-xl text-left transition-all hover:scale-[1.02] border"
                style={{
                  backgroundColor: isArmed ? theme.badgeBg : theme.bgSurface,
                  borderColor: isArmed ? primaryColor : theme.borderAlpha,
                  boxShadow: isArmed ? `0 0 12px ${theme.glow}` : undefined,
                }}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: primaryColor }}>
                  <Icon className="w-3.5 h-3.5" /> {proto.name}
                </div>
                <div className="text-[9px] text-[#8fc9dd] font-mono-tech mt-0.5">
                  {proto.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
