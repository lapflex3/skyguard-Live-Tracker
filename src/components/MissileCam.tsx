import React, { useState, useEffect } from 'react';
import { RadarTarget } from '../types';
import { 
  Crosshair, 
  Target, 
  AlertTriangle, 
  Zap, 
  ShieldAlert,
  Navigation,
  Activity,
  Maximize2,
  Flame,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MissileCamProps {
  target: RadarTarget | null;
  onClose: () => void;
}

export const MissileCam: React.FC<MissileCamProps> = ({ target, onClose }) => {
  const [distance, setDistance] = useState(5000);
  const [speed, setSpeed] = useState(2400); // Mach 2+
  const [impactTime, setImpactTime] = useState(15);
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    if (!target) return;

    const interval = setInterval(() => {
      setDistance(prev => {
        const next = prev - (speed / 3.6) * 0.1; // km/h to m/s
        return next > 0 ? next : 0;
      });
      setImpactTime(prev => (prev > 0.1 ? prev - 0.1 : 0));
      
      // Random glitch effect as it gets closer
      if (Math.random() > 0.95) {
        setGlitch(true);
        setTimeout(() => setGlitch(false), 50);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [target, speed]);

  if (!target) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[3000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="max-w-5xl w-full h-[80vh] glass-panel border-threat-high rounded-lg overflow-hidden flex flex-col relative">
        {/* Header */}
        <div className="p-4 border-b border-threat-high/30 flex justify-between items-center bg-threat-high/10">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-threat-high rounded-full animate-pulse" />
            <h2 className="text-xl font-bold uppercase tracking-widest text-threat-high">Missile Seeker Feed // AGM-114 HELLFIRE</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-threat-high/20 rounded-full transition-all text-threat-high"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Main Feed */}
          <div className="flex-1 relative bg-black overflow-hidden">
            {/* Camera Feed Simulation */}
            <div className={`w-full h-full relative transition-all ${glitch ? 'invert grayscale' : 'grayscale contrast-150'}`}>
              <img 
                src={`https://picsum.photos/seed/${target.id}_missile/1920/1080?blur=1`} 
                alt="Missile Seeker View"
                className="w-full h-full object-cover opacity-60"
                referrerPolicy="no-referrer"
              />
              
              {/* Static Overlay */}
              <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
              
              {/* HUD Elements */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {/* Crosshair */}
                <div className="relative w-64 h-64 border-2 border-threat-high/40 rounded-full">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-8 bg-threat-high" />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-8 bg-threat-high" />
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 w-8 bg-threat-high" />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 h-1 w-8 bg-threat-high" />
                  
                  {/* Target Box */}
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.1, 1],
                      x: [0, 5, -5, 0],
                      y: [0, -5, 5, 0]
                    }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-threat-high flex items-center justify-center"
                  >
                    <div className="text-[10px] font-bold text-threat-high absolute -top-6">LOCK ON: {target.id}</div>
                    <Crosshair size={32} className="text-threat-high" />
                  </motion.div>
                </div>
              </div>

              {/* Corner Data */}
              <div className="absolute top-8 left-8 flex flex-col gap-2 font-mono text-threat-high text-xs">
                <div className="flex items-center gap-2">
                  <Navigation size={14} />
                  <span>HDG: {target.heading.toFixed(1)}°</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity size={14} />
                  <span>ALT: {target.alt.toFixed(0)}M</span>
                </div>
              </div>

              <div className="absolute top-8 right-8 flex flex-col items-end gap-2 font-mono text-threat-high text-xs">
                <div className="bg-threat-high text-black px-2 py-1 font-bold">LIVE TELEMETRY</div>
                <span>LAT: {target.lat.toFixed(4)}</span>
                <span>LNG: {target.lng.toFixed(4)}</span>
              </div>

              {/* Bottom HUD */}
              <div className="absolute bottom-12 inset-x-12 flex justify-between items-end">
                <div className="flex flex-col gap-1">
                  <div className="text-[10px] uppercase font-bold text-threat-high opacity-60">Closing Velocity</div>
                  <div className="text-3xl font-bold text-threat-high">{speed} KM/H</div>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className="text-4xl font-black text-threat-high tracking-tighter">
                    {impactTime.toFixed(1)}S
                  </div>
                  <div className="text-[10px] uppercase font-bold text-threat-high animate-pulse">Time to Impact</div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <div className="text-[10px] uppercase font-bold text-threat-high opacity-60">Range to Target</div>
                  <div className="text-3xl font-bold text-threat-high">{distance.toFixed(0)} M</div>
                </div>
              </div>

              {/* Scanlines */}
              <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,114,0.06))] bg-[length:100%_2px,3px_100%]" />
            </div>
          </div>

          {/* Side Panel: Systems */}
          <div className="w-64 border-l border-threat-high/30 flex flex-col p-4 gap-6 bg-black">
            <div className="flex flex-col gap-2">
              <div className="text-[10px] font-bold uppercase text-threat-high opacity-50">Weapon Status</div>
              <div className="p-3 border border-threat-high/50 rounded bg-threat-high/5 flex items-center gap-3">
                <Flame size={20} className="text-threat-high" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-threat-high">ARMED</span>
                  <span className="text-[8px] opacity-60">WARHEAD ACTIVE</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-[10px] font-bold uppercase text-threat-high opacity-50">Seeker Mode</div>
              <div className="p-3 border border-radar-green/50 rounded bg-radar-green/5 flex items-center gap-3">
                <Zap size={20} className="text-radar-green" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-radar-green">INFRARED</span>
                  <span className="text-[8px] opacity-60">THERMAL LOCK</span>
                </div>
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-4">
              <div className="p-4 border border-threat-high rounded flex flex-col gap-2 bg-threat-high/10">
                <ShieldAlert size={24} className="text-threat-high animate-pulse mx-auto" />
                <div className="text-center">
                  <div className="text-[10px] font-bold text-threat-high">TERMINAL PHASE</div>
                  <div className="text-[8px] opacity-60">AUTONOMOUS GUIDANCE</div>
                </div>
              </div>
              
              <button 
                onClick={onClose}
                className="w-full p-3 bg-threat-high text-white text-xs font-bold uppercase hover:bg-red-700 transition-all"
              >
                Abort Attack
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-2 bg-threat-high text-black text-[9px] font-bold uppercase flex justify-between px-4">
          <span>Secure Link: AEGIS-SAT-04</span>
          <span>Encryption: MIL-STD-2048</span>
          <span>Signal Strength: 98%</span>
        </div>
      </div>
    </motion.div>
  );
};
