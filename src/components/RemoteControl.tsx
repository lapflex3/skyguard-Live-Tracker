import React, { useState, useEffect } from 'react';
import { RadarTarget } from '../types';
import { 
  Gamepad2, 
  Video, 
  Wind, 
  Navigation, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight,
  Power,
  ShieldCheck,
  Activity,
  Maximize2,
  Sliders,
  RotateCcw,
  Check,
  Flame,
  Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RemoteControlProps {
  target: RadarTarget | null;
  onLaunchInterceptor?: (id: string) => void;
  loraStatus?: { connected: boolean, deviceId: string | null, connecting: boolean };
  onConnectLoRa?: () => void;
}

interface CalibrationSettings {
  deadzone: number;
  sensitivity: number;
  invertY: boolean;
  invertX: boolean;
}

export const RemoteControl: React.FC<RemoteControlProps> = ({ 
  target, 
  onLaunchInterceptor,
  loraStatus,
  onConnectLoRa
}) => {
  const [isTakeoverActive, setIsTakeoverActive] = useState(false);
  const [throttle, setThrottle] = useState(75);
  const [altitude, setAltitude] = useState(target?.alt || 0);
  const [heading, setHeading] = useState(target?.heading || 0);
  const [showCalibration, setShowCalibration] = useState(false);
  const [calibration, setCalibration] = useState<CalibrationSettings>({
    deadzone: 10,
    sensitivity: 1.0,
    invertY: false,
    invertX: false
  });

  useEffect(() => {
    if (target) {
      setAltitude(target.alt);
      setHeading(target.heading);
      setIsTakeoverActive(target.status === 'controlled');
    }
  }, [target]);

  const resetCalibration = () => {
    setCalibration({
      deadzone: 10,
      sensitivity: 1.0,
      invertY: false,
      invertX: false
    });
  };

  if (!target) {
    return (
      <div className="h-full flex items-center justify-center text-radar-dim uppercase tracking-widest text-xs">
        No target selected for remote control
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4 relative">
      <div className="flex justify-between items-center border-b border-radar-dim pb-2">
        <div className="flex items-center gap-2">
          <Gamepad2 size={18} className="text-radar-green" />
          <h3 className="text-sm font-bold uppercase">Full Control Interface: {target.id}</h3>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowCalibration(true)}
            className="flex items-center gap-2 px-3 py-1 text-[10px] font-bold uppercase rounded border border-radar-dim text-radar-green hover:bg-radar-green/10 transition-all"
          >
            <Sliders size={12} /> Calibrate
          </button>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isTakeoverActive ? 'bg-radar-green animate-pulse' : 'bg-radar-dim'}`} />
            <span className="text-[10px] uppercase opacity-60">Pilot Override: {isTakeoverActive ? 'ACTIVE' : 'INACTIVE'}</span>
          </div>
          <button 
            onClick={() => setIsTakeoverActive(!isTakeoverActive)}
            className={`px-3 py-1 text-[10px] font-bold uppercase rounded border transition-all ${
              isTakeoverActive ? 'bg-threat-high border-threat-high text-white' : 'border-radar-green text-radar-green hover:bg-radar-green/10'
            }`}
          >
            <Power size={12} className="inline mr-1" /> {isTakeoverActive ? 'Release Control' : 'Engage Override'}
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-4 overflow-hidden">
        {/* Camera Viewer */}
        <div className="col-span-8 relative glass-panel rounded-lg overflow-hidden bg-black">
          <div className="absolute inset-0 opacity-40 pointer-events-none">
            <div className="w-full h-full border-[40px] border-transparent border-t-radar-green/20 border-b-radar-green/20" />
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-radar-green/30" />
            <div className="absolute top-0 left-1/2 w-[1px] h-full bg-radar-green/30" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-radar-green/50 rounded-full" />
          </div>
          
          <img 
            src={`https://picsum.photos/seed/${target.id}/1280/720`} 
            alt="Target Camera Feed"
            className="w-full h-full object-cover opacity-80"
            referrerPolicy="no-referrer"
          />
          
          <div className="absolute top-4 left-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 bg-black/60 px-2 py-1 rounded border border-radar-green/30">
              <Video size={12} className="text-threat-high animate-pulse" />
              <span className="text-[10px] font-mono text-radar-green">LIVE FEED // {target.id}</span>
            </div>
            <div className="text-[8px] font-mono text-radar-green/60 bg-black/40 px-2 py-0.5 rounded">
              LAT: {target.lat.toFixed(4)} | LNG: {target.lng.toFixed(4)}
            </div>
          </div>

          <div className="absolute bottom-4 right-4 flex gap-2">
            <button className="p-2 bg-black/60 border border-radar-dim rounded hover:border-radar-green transition-all">
              <Maximize2 size={14} className="text-radar-green" />
            </button>
          </div>

          {/* HUD Overlay */}
          <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
            <div className="flex flex-col items-center gap-2">
              <div className="h-48 w-8 bg-radar-dim/20 border border-radar-green/30 relative rounded">
                <motion.div 
                  className="absolute bottom-0 w-full bg-radar-green/40"
                  animate={{ height: `${(altitude / 40000) * 100}%` }}
                />
                <div className="absolute inset-0 flex flex-col justify-between py-2 text-[8px] font-mono text-radar-green px-1">
                  <span>40K</span>
                  <span>20K</span>
                  <span>0</span>
                </div>
              </div>
              <span className="text-[8px] font-bold text-radar-green">ALT</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="h-48 w-8 bg-radar-dim/20 border border-radar-green/30 relative rounded">
                <motion.div 
                  className="absolute bottom-0 w-full bg-radar-green/40"
                  animate={{ height: `${throttle}%` }}
                />
                <div className="absolute inset-0 flex flex-col justify-between py-2 text-[8px] font-mono text-radar-green px-1">
                  <span>MAX</span>
                  <span>50%</span>
                  <span>IDLE</span>
                </div>
              </div>
              <span className="text-[8px] font-bold text-radar-green">THR</span>
            </div>
          </div>
        </div>

        {/* Controls Panel */}
        <div className="col-span-4 flex flex-col gap-4">
          <div className="glass-panel p-4 rounded-lg flex flex-col gap-4">
            <div className="text-[10px] font-bold uppercase border-b border-radar-dim pb-2 flex items-center gap-2">
              <Navigation size={14} /> Flight Dynamics
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[8px] uppercase opacity-50">Airspeed</span>
                <span className="text-lg font-mono text-radar-green">{target.speed} <span className="text-[10px]">KM/H</span></span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[8px] uppercase opacity-50">Heading</span>
                <span className="text-lg font-mono text-radar-green">{heading.toFixed(0)}°</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <div className="flex justify-between text-[8px] uppercase opacity-50">
                <span>Structural Integrity</span>
                <span>94%</span>
              </div>
              <div className="h-1 bg-radar-dim rounded-full overflow-hidden">
                <div className="h-full bg-radar-green w-[94%]" />
              </div>
            </div>
          </div>

          <div className="flex-1 glass-panel p-4 rounded-lg flex flex-col gap-4">
            <div className="text-[10px] font-bold uppercase border-b border-radar-dim pb-2 flex items-center gap-2">
              <Activity size={14} /> Manual Override Controls
            </div>

            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              {/* Directional Pad */}
              <div className="grid grid-cols-3 gap-2">
                <div />
                <button className="p-3 border border-radar-dim rounded hover:bg-radar-green hover:text-military-bg transition-all">
                  <ArrowUp size={20} />
                </button>
                <div />
                <button className="p-3 border border-radar-dim rounded hover:bg-radar-green hover:text-military-bg transition-all">
                  <ArrowLeft size={20} />
                </button>
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-radar-green animate-pulse" />
                </div>
                <button className="p-3 border border-radar-dim rounded hover:bg-radar-green hover:text-military-bg transition-all">
                  <ArrowRight size={20} />
                </button>
                <div />
                <button className="p-3 border border-radar-dim rounded hover:bg-radar-green hover:text-military-bg transition-all">
                  <ArrowDown size={20} />
                </button>
                <div />
              </div>

              {/* Throttle Slider */}
              <div className="w-full flex flex-col gap-2">
                <div className="flex justify-between text-[8px] uppercase opacity-50">
                  <span>Manual Throttle</span>
                  <span>{throttle}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={throttle}
                  onChange={(e) => setThrottle(parseInt(e.target.value))}
                  className="w-full accent-radar-green"
                />
              </div>
            </div>

            <div className="p-3 bg-radar-dim/10 rounded border border-radar-dim flex items-center gap-3">
              <ShieldCheck size={16} className="text-radar-green" />
              <div className="flex flex-col">
                <span className="text-[8px] uppercase opacity-50">Encryption Status</span>
                <span className="text-[10px] font-bold text-radar-green">LINK SECURED // AES-512</span>
              </div>
            </div>

            {/* IoT & LoRa Section */}
            <div className="p-3 bg-radar-dim/10 rounded border border-radar-dim flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Radio size={14} className={loraStatus?.connected ? 'text-radar-green' : 'text-radar-dim'} />
                <span className="text-[8px] uppercase opacity-50">IoT / LoRa Connectivity</span>
              </div>
              
              {loraStatus?.connected ? (
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-radar-green">{loraStatus.deviceId}</span>
                    <span className="text-[8px] bg-radar-green/20 text-radar-green px-1 rounded">ONLINE</span>
                  </div>
                  <div className="text-[8px] opacity-40">Frequency: 915.0 MHz | SF: 10</div>
                </div>
              ) : (
                <button 
                  onClick={onConnectLoRa}
                  disabled={loraStatus?.connecting}
                  className={`w-full py-2 border border-radar-dim text-[9px] font-bold uppercase hover:border-radar-green transition-all ${loraStatus?.connecting ? 'animate-pulse opacity-50' : ''}`}
                >
                  {loraStatus?.connecting ? 'Handshaking...' : 'Connect IoT via LoRa'}
                </button>
              )}
            </div>

            {/* Weapons System */}
            <div className="mt-auto flex flex-col gap-2">
              <div className="text-[10px] font-bold uppercase border-b border-radar-dim pb-2 flex items-center gap-2">
                <ShieldCheck size={14} className="text-threat-high" /> Weapons System
              </div>
              <button 
                onClick={() => onLaunchInterceptor?.(target.id)}
                className="w-full p-4 bg-threat-high text-white text-xs font-bold uppercase flex items-center justify-center gap-3 hover:bg-red-700 transition-all shadow-[0_0_15px_rgba(255,49,49,0.3)] group"
              >
                <Flame size={18} className="group-hover:animate-bounce" />
                Launch Interceptor Missile
              </button>
              <p className="text-[8px] opacity-40 text-center uppercase">Warning: Authorized Personnel Only</p>
            </div>
          </div>
        </div>
      </div>

      {/* Calibration Modal */}
      <AnimatePresence>
        {showCalibration && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-military-bg/95 backdrop-blur-md flex items-center justify-center p-8"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-panel max-w-md w-full p-6 rounded-lg border-radar-green flex flex-col gap-6"
            >
              <div className="flex items-center justify-between border-b border-radar-dim pb-4">
                <div className="flex items-center gap-2 text-radar-green">
                  <Sliders size={20} />
                  <h2 className="text-lg font-bold uppercase tracking-tighter">Joystick Calibration</h2>
                </div>
                <button 
                  onClick={() => setShowCalibration(false)}
                  className="text-radar-dim hover:text-radar-green transition-all"
                >
                  <Check size={20} />
                </button>
              </div>

              <div className="flex flex-col gap-6">
                {/* Deadzone */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-[10px] uppercase font-bold">
                    <span className="opacity-60">Deadzone</span>
                    <span className="text-radar-green">{calibration.deadzone}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="30" 
                    value={calibration.deadzone}
                    onChange={(e) => setCalibration(prev => ({ ...prev, deadzone: parseInt(e.target.value) }))}
                    className="w-full accent-radar-green"
                  />
                  <p className="text-[8px] opacity-40">Minimum input threshold to prevent stick drift.</p>
                </div>

                {/* Sensitivity */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-[10px] uppercase font-bold">
                    <span className="opacity-60">Sensitivity</span>
                    <span className="text-radar-green">{calibration.sensitivity.toFixed(1)}x</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="2.0" 
                    step="0.1"
                    value={calibration.sensitivity}
                    onChange={(e) => setCalibration(prev => ({ ...prev, sensitivity: parseFloat(e.target.value) }))}
                    className="w-full accent-radar-green"
                  />
                  <p className="text-[8px] opacity-40">Multiplier for manual control responsiveness.</p>
                </div>

                {/* Inversion */}
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setCalibration(prev => ({ ...prev, invertY: !prev.invertY }))}
                    className={`p-3 border rounded text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-2 ${
                      calibration.invertY ? 'bg-radar-green text-military-bg border-radar-green' : 'border-radar-dim text-radar-dim'
                    }`}
                  >
                    Invert Y-Axis {calibration.invertY && <Check size={12} />}
                  </button>
                  <button 
                    onClick={() => setCalibration(prev => ({ ...prev, invertX: !prev.invertX }))}
                    className={`p-3 border rounded text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-2 ${
                      calibration.invertX ? 'bg-radar-green text-military-bg border-radar-green' : 'border-radar-dim text-radar-dim'
                    }`}
                  >
                    Invert X-Axis {calibration.invertX && <Check size={12} />}
                  </button>
                </div>
              </div>

              <div className="flex gap-4 mt-4">
                <button 
                  onClick={resetCalibration}
                  className="flex-1 p-3 border border-radar-dim text-[10px] font-bold uppercase hover:bg-radar-dim transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw size={14} /> Reset Defaults
                </button>
                <button 
                  onClick={() => setShowCalibration(false)}
                  className="flex-1 p-3 bg-radar-green text-military-bg text-[10px] font-bold uppercase hover:bg-radar-green/80 transition-all"
                >
                  Apply Settings
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
