import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { RadarTarget, RadarMode, RadarState, SystemStats } from './types';
import { RadarDisplay } from './components/RadarDisplay';
import { TacticalMap } from './components/TacticalMap';
import { SystemHealth } from './components/SystemHealth';
import { TargetVisualizer } from './components/TargetVisualizer';
import { AudioController } from './components/AudioController';
import { RemoteControl } from './components/RemoteControl';
import { MissileCam } from './components/MissileCam';
import { AiMonitoring } from './components/AiMonitoring';
import { IotControl } from './components/IotControl';
import { analyzeThreats } from './services/geminiService';
import { tfliteOptimize } from './services/tfliteService';
import { iotService } from './services/iotService';
import { 
  Activity, 
  Shield, 
  Target, 
  Wind, 
  Zap, 
  Radio, 
  Crosshair, 
  AlertTriangle,
  Settings,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  CloudRain,
  Navigation,
  Monitor,
  MessageSquare,
  Bell,
  Cpu,
  Smartphone,
  ShieldAlert,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const RADAR_MODES: RadarMode[] = [
  'Surveillance', 'EarlyWarning', 'OTH', 'FireControl', 'Tracking', 
  'AESA', 'Doppler', 'SAR', 'GMTI', 'AntiStealth', 'LPI', 
  'Multistatic', 'Navigation', 'Weather', 'Subsurface'
];

export default function App() {
  const [targets, setTargets] = useState<RadarTarget[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats>({
    cpu: 0, gpu: 0, npu: 0, mcu: 0, ram: 0,
    temp: { cpu: 0, gpu: 0, npu: 0, mcu: 0, ram: 0 },
    dataUsage: 0, energyMode: 'balanced'
  });
  const [radarState, setRadarState] = useState<RadarState>({
    mode: 'Surveillance',
    range: 500,
    isScanning: true,
    isJamming: false,
    isStealthMode: false
  });
  const [socket, setSocket] = useState<Socket | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>("Initializing tactical AI...");
  const [selectedTarget, setSelectedTarget] = useState<RadarTarget | null>(null);
  const [logs, setLogs] = useState<string[]>(["System Boot Sequence Initiated...", "Radar Array Online."]);
  const [activeTab, setActiveTab] = useState<'tactical' | 'visual' | 'comms' | 'control' | 'ai' | 'iot'>('tactical');
  const [showApproval, setShowApproval] = useState<{ type: string, targetId: string } | null>(null);
  const [showMissileCam, setShowMissileCam] = useState<string | null>(null);
  const [tfliteStatus, setTfliteStatus] = useState<{ active: boolean, msg: string }>({ active: false, msg: "" });
  const [alertLevel, setAlertLevel] = useState<'none' | 'low' | 'medium' | 'high'>('none');
  const [loraStatus, setLoraStatus] = useState<{ connected: boolean, deviceId: string | null, connecting: boolean }>({
    connected: false,
    deviceId: null,
    connecting: false
  });
  const targetsRef = useRef<RadarTarget[]>([]);

  useEffect(() => {
    targetsRef.current = targets;
  }, [targets]);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('radar:init', (data: { targets: RadarTarget[], systemStats: SystemStats }) => {
      setTargets(data.targets);
      setSystemStats(data.systemStats);
    });

    newSocket.on('radar:update', (data: { targets: RadarTarget[], systemStats: SystemStats }) => {
      setTargets(data.targets);
      setSystemStats(data.systemStats);
      
      // TFLite Optimization Engine
      const { nextMode, recommendation, isThrottling } = tfliteOptimize(data.systemStats);
      const { dataUsage } = data.systemStats;
      
      if (nextMode !== data.systemStats.energyMode) {
        newSocket.emit('system:energyMode', nextMode);
        addLog(`AI DECISION: ${recommendation}`);
        
        // Log specific optimization reason
        if (isThrottling) {
          addLog(`AI ACTION: Throttling system to prevent thermal runaway.`);
        } else {
          addLog(`AI ACTION: Restoring performance based on thermal headroom.`);
        }
      }
      
      setTfliteStatus({ active: isThrottling, msg: recommendation });

      // Data Usage Management
      if (dataUsage > 900 && dataUsage < 950) {
        if (Math.random() > 0.95) addLog("AI WARNING: Data usage exceeding 90% of tactical quota.");
      } else if (dataUsage >= 950) {
        if (Math.random() > 0.9) addLog("AI URGENT: Data quota critical. Initiating extreme packet compression.");
      }

      // Check for high threats to trigger alert level
      const hasHighThreat = data.targets.some(t => t.threatLevel === 'high');
      setAlertLevel(hasHighThreat ? 'high' : 'none');
    });

    newSocket.on('log:add', (msg: string) => {
      addLog(msg);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (targetsRef.current.length > 0) {
        const analysis = await analyzeThreats(targetsRef.current);
        setAiAnalysis(analysis || "No analysis available.");
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 15));
  };

  const toggleMode = (mode: RadarMode) => {
    setRadarState(prev => ({ ...prev, mode }));
    socket?.emit('radar:setMode', mode);
    addLog(`Radar Mode Switched: ${mode.toUpperCase()}`);
  };

  const handleLock = (id: string) => {
    socket?.emit('target:lock', id);
    addLog(`Target Locked: ${id}`);
  };

  const handleTakeover = (id: string) => {
    setShowApproval({ type: 'takeover', targetId: id });
  };

  const handleLaunchInterceptor = (id: string) => {
    setShowApproval({ type: 'interceptor', targetId: id });
  };

  const handleSetEnergyMode = (mode: 'performance' | 'balanced' | 'eco') => {
    socket?.emit('system:setEnergyMode', mode);
    addLog(`Manual Override: System Energy Mode set to ${mode.toUpperCase()}`);
  };

  const handleConnectLoRa = async () => {
    setLoraStatus(prev => ({ ...prev, connecting: true }));
    addLog("LoRa: Initializing long-range IoT handshake...");
    
    // Using the first device as a target for this global connection simulation
    const devices = iotService.getDevices();
    const success = await iotService.connectToDevice(devices[0].id);
    
    if (success) {
      setLoraStatus({ connected: true, deviceId: devices[0].id, connecting: false });
      addLog(`LoRa: Connection established with ${devices[0].id}`);
    } else {
      setLoraStatus({ connected: false, deviceId: null, connecting: false });
      addLog("LoRa: Connection failed. Signal interference detected.");
    }
  };

  const confirmAction = () => {
    if (!showApproval) return;
    if (showApproval.type === 'takeover') {
      socket?.emit('target:takeover', showApproval.targetId);
      setActiveTab('control');
    } else if (showApproval.type === 'interceptor') {
      socket?.emit('interceptor:launch', { targetId: showApproval.targetId });
      setShowMissileCam(showApproval.targetId);
      addLog(`CRITICAL: Interceptor Launched against ${showApproval.targetId}`);
    }
    setShowApproval(null);
  };

  const sendNotification = (id: string) => {
    addLog(`Push Notification sent to ${id}: "SURRENDER IMMEDIATELY"`);
  };

  return (
    <div className="h-screen w-screen flex flex-col p-4 gap-4 overflow-hidden select-none bg-military-bg">
      <AudioController alertLevel={alertLevel} />
      
      {/* Header */}
      <header className="flex justify-between items-center border-b border-radar-dim pb-2">
        <div className="flex items-center gap-3">
          <ShieldAlert className={`text-radar-green ${alertLevel === 'high' ? 'animate-pulse text-threat-high' : ''}`} />
          <h1 className="text-xl font-bold tracking-tighter uppercase">Aegis Sentinel Premium v5.0</h1>
          <span className="text-[10px] bg-radar-dim px-2 py-0.5 rounded text-radar-green">AI INTEGRATED</span>
        </div>
        <div className="flex gap-6 text-[10px] uppercase opacity-70">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => handleConnectLoRa()}
              disabled={loraStatus.connecting}
              className="px-3 py-1 text-[10px] font-bold uppercase rounded border border-radar-green text-radar-green hover:bg-radar-green/10 transition-all flex items-center gap-2"
            >
              {loraStatus.connecting ? <RefreshCw size={12} className="animate-spin" /> : <Radio size={12} />}
              {loraStatus.connected ? 'Network Active' : 'Scan LoRa Network'}
            </button>
            <div className={`w-2 h-2 rounded-full ${alertLevel === 'high' ? 'bg-threat-high animate-ping' : 'bg-radar-green animate-ping'}`} />
            Status: {alertLevel === 'high' ? 'CRITICAL THREAT' : 'SECURE'}
          </div>
          <div>System Time: {new Date().toLocaleTimeString()}</div>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-12 gap-4">
        {/* Left Panel: Radar & System Health */}
        <div className="col-span-3 flex flex-col gap-4">
          <RadarDisplay targets={targets} mode={radarState.mode} range={radarState.range} />
          <SystemHealth 
            stats={systemStats} 
            tfliteStatus={tfliteStatus} 
            onSetEnergyMode={handleSetEnergyMode}
          />
          
          <div className="flex-1 glass-panel p-4 rounded-lg flex flex-col gap-2 overflow-hidden">
            <div className="text-[10px] font-bold uppercase border-b border-radar-dim pb-2 flex items-center gap-2">
              <Settings size={14} /> Radar Control
            </div>
            <div className="grid grid-cols-2 gap-1 overflow-y-auto pr-1">
              {RADAR_MODES.map(m => (
                <button
                  key={m}
                  onClick={() => toggleMode(m)}
                  className={`text-[8px] p-1.5 border transition-all uppercase ${
                    radarState.mode === m 
                      ? 'bg-radar-green text-military-bg border-radar-green' 
                      : 'border-radar-dim hover:border-radar-green/50'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center Panel: Tactical Map & Tabs */}
        <div className="col-span-6 flex flex-col gap-4">
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab('tactical')}
              className={`px-4 py-2 text-[10px] uppercase font-bold border-t border-x rounded-t transition-all ${activeTab === 'tactical' ? 'bg-radar-dim border-radar-green text-radar-green' : 'border-radar-dim opacity-50'}`}
            >
              Tactical Map
            </button>
            <button 
              onClick={() => setActiveTab('visual')}
              className={`px-4 py-2 text-[10px] uppercase font-bold border-t border-x rounded-t transition-all ${activeTab === 'visual' ? 'bg-radar-dim border-radar-green text-radar-green' : 'border-radar-dim opacity-50'}`}
            >
              Visual Acquisition
            </button>
            <button 
              onClick={() => setActiveTab('comms')}
              className={`px-4 py-2 text-[10px] uppercase font-bold border-t border-x rounded-t transition-all ${activeTab === 'comms' ? 'bg-radar-dim border-radar-green text-radar-green' : 'border-radar-dim opacity-50'}`}
            >
              Comms & Control
            </button>
            <button 
              onClick={() => setActiveTab('control')}
              className={`px-4 py-2 text-[10px] uppercase font-bold border-t border-x rounded-t transition-all ${activeTab === 'control' ? 'bg-radar-dim border-radar-green text-radar-green' : 'border-radar-dim opacity-50'}`}
            >
              Full Control
            </button>
            <button 
              onClick={() => setActiveTab('ai')}
              className={`px-4 py-2 text-[10px] uppercase font-bold border-t border-x rounded-t transition-all ${activeTab === 'ai' ? 'bg-radar-dim border-radar-green text-radar-green' : 'border-radar-dim opacity-50'}`}
            >
              AI Monitoring
            </button>
            <button 
              onClick={() => setActiveTab('iot')}
              className={`px-4 py-2 text-[10px] uppercase font-bold border-t border-x rounded-t transition-all ${activeTab === 'iot' ? 'bg-radar-dim border-radar-green text-radar-green' : 'border-radar-dim opacity-50'}`}
            >
              IoT & LoRa
            </button>
          </div>

          <div className="flex-1 relative">
            <AnimatePresence mode="wait">
              {activeTab === 'tactical' && (
                <motion.div key="tactical" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                  <TacticalMap targets={targets} center={[3.139, 101.686]} range={radarState.range} />
                </motion.div>
              )}
              {activeTab === 'visual' && (
                <motion.div key="visual" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full glass-panel p-4 rounded">
                  <TargetVisualizer target={selectedTarget} />
                </motion.div>
              )}
              {activeTab === 'comms' && (
                <motion.div key="comms" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full glass-panel p-6 rounded flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-bold uppercase flex items-center gap-2"><MessageSquare size={16} /> Target Communication</h3>
                    <p className="text-xs opacity-60">Establish direct link with selected target for negotiation or surrender demand.</p>
                  </div>
                  
                  {selectedTarget ? (
                    <div className="flex flex-col gap-4">
                      <div className="p-4 bg-radar-dim/20 border border-radar-dim rounded">
                        <div className="text-[10px] uppercase opacity-50 mb-1">Target Identity</div>
                        <div className="text-lg font-bold">{selectedTarget.id}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => sendNotification(selectedTarget.id)}
                          className="p-4 border border-radar-green text-radar-green text-xs uppercase font-bold flex items-center justify-center gap-2 hover:bg-radar-green hover:text-military-bg transition-all"
                        >
                          <Bell size={16} /> Send Push Alert
                        </button>
                        <button 
                          onClick={() => handleTakeover(selectedTarget.id)}
                          className="p-4 border border-threat-high text-threat-high text-xs uppercase font-bold flex items-center justify-center gap-2 hover:bg-threat-high hover:text-white transition-all"
                        >
                          <Smartphone size={16} /> Remote Takeover
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-radar-dim uppercase tracking-widest text-xs">
                      No target selected for communication
                    </div>
                  )}
                </motion.div>
              )}
              {activeTab === 'control' && (
                <motion.div key="control" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full glass-panel p-6 rounded">
                  <RemoteControl 
                    target={selectedTarget} 
                    onLaunchInterceptor={handleLaunchInterceptor}
                    loraStatus={loraStatus}
                    onConnectLoRa={handleConnectLoRa}
                  />
                </motion.div>
              )}
              {activeTab === 'ai' && (
                <motion.div key="ai" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full glass-panel p-6 rounded">
                  <AiMonitoring stats={systemStats} tfliteStatus={tfliteStatus} />
                </motion.div>
              )}
              {activeTab === 'iot' && (
                <motion.div key="iot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full glass-panel p-6 rounded">
                  <IotControl />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="h-24 glass-panel p-3 rounded-lg flex gap-4">
            <div className="flex-1 flex flex-col gap-1">
              <div className="text-[10px] uppercase font-bold text-radar-green flex items-center gap-2">
                <Radio size={12} /> AI Intelligence Report
              </div>
              <div className="text-[10px] leading-tight opacity-80 overflow-y-auto">
                {aiAnalysis}
              </div>
            </div>
            <div className="w-48 border-l border-radar-dim pl-4 flex flex-col gap-1">
              <div className="text-[10px] uppercase font-bold text-radar-green">Event Logs</div>
              <div className="text-[8px] opacity-50 flex flex-col gap-0.5 overflow-y-auto">
                {logs.map((log, i) => (
                  <div key={i} className="truncate">{log}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Target Data & Weapons */}
        <div className="col-span-3 flex flex-col gap-4">
          <div className="flex-1 glass-panel p-4 rounded-lg flex flex-col gap-3 overflow-hidden">
            <div className="text-xs font-bold uppercase flex items-center gap-2 border-b border-radar-dim pb-2">
              <Target size={14} /> Target Acquisition
            </div>
            
            <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-2">
              {targets.map(t => (
                <div 
                  key={t.id}
                  onClick={() => setSelectedTarget(t)}
                  className={`p-2 border text-[10px] cursor-pointer transition-all ${
                    selectedTarget?.id === t.id ? 'border-radar-green bg-radar-green/10' : 'border-radar-dim hover:border-radar-green/30'
                  } ${t.threatLevel === 'friendly' ? 'border-blue-500/50' : ''}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold">{t.id}</span>
                    <span className={`px-1 rounded ${
                      t.threatLevel === 'high' ? 'bg-threat-high text-white' : 
                      t.threatLevel === 'medium' ? 'bg-threat-medium text-black' : 
                      t.threatLevel === 'friendly' ? 'bg-blue-500 text-white' : 'bg-radar-green text-black'
                    }`}>
                      {t.threatLevel.toUpperCase()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 opacity-70">
                    <span>SPD: {t.speed}km/h</span>
                    <span>ALT: {t.alt}m</span>
                    <span>HDG: {t.heading}°</span>
                    <span>TYPE: {t.type}</span>
                  </div>
                </div>
              ))}
            </div>

            <AnimatePresence>
              {selectedTarget && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-radar-dim pt-3 flex flex-col gap-2"
                >
                  <div className="text-[10px] font-bold uppercase text-radar-green">Selected: {selectedTarget.id}</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => handleLock(selectedTarget.id)}
                      className="p-2 bg-threat-high text-white text-[10px] font-bold flex items-center justify-center gap-2"
                    >
                      <Lock size={12} /> LOCK TARGET
                    </button>
                    <button 
                      onClick={() => handleLaunchInterceptor(selectedTarget.id)}
                      className="p-2 border border-radar-green text-radar-green text-[10px] font-bold flex items-center justify-center gap-2 hover:bg-radar-green hover:text-military-bg transition-all"
                    >
                      <Shield size={12} /> INTERCEPT
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-48 glass-panel p-4 rounded-lg flex flex-col gap-2">
            <div className="text-xs font-bold uppercase flex items-center gap-2 border-b border-radar-dim pb-2">
              <CloudRain size={14} /> Environmental Data
            </div>
            <div className="grid grid-cols-2 gap-4 text-[10px] uppercase">
              <div className="flex flex-col gap-1">
                <span className="opacity-50">Visibility</span>
                <span className="text-sm">98% (Clear)</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="opacity-50">Wind Speed</span>
                <span className="text-sm">12kts / NW</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="opacity-50">Humidity</span>
                <span className="text-sm">45%</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="opacity-50">Pressure</span>
                <span className="text-sm">1013 hPa</span>
              </div>
            </div>
            <div className="mt-auto h-12 bg-radar-dim/30 rounded flex items-center justify-center relative overflow-hidden">
              <div className="scan-line" />
              <span className="text-[9px] opacity-50">WEATHER RADAR SWEEP ACTIVE</span>
            </div>
          </div>
        </div>
      </main>

      {/* Approval Modal */}
      <AnimatePresence>
        {showApproval && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-panel max-w-md w-full p-8 rounded-lg border-threat-high flex flex-col gap-6"
            >
              <div className="flex items-center gap-4 text-threat-high">
                <AlertTriangle size={32} />
                <h2 className="text-xl font-bold uppercase tracking-tighter">Critical Authorization Required</h2>
              </div>
              
              <div className="text-sm opacity-80 leading-relaxed">
                {showApproval.type === 'takeover' ? (
                  <p>You are attempting to initiate a <span className="text-threat-high font-bold underline">REMOTE TAKEOVER</span> of target <span className="font-bold text-radar-green">{showApproval.targetId}</span>. This will bypass target encryption and grant full control to the Aegis Sentinel network.</p>
                ) : (
                  <p>You are authorizing the launch of an <span className="text-threat-high font-bold underline">AI-CONTROLLED INTERCEPTOR</span> against target <span className="font-bold text-radar-green">{showApproval.targetId}</span>. The interceptor will use autonomous guidance to neutralize the threat.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowApproval(null)}
                  className="p-3 border border-radar-dim text-[12px] font-bold uppercase hover:bg-radar-dim transition-all"
                >
                  Abort Action
                </button>
                <button 
                  onClick={confirmAction}
                  className="p-3 bg-threat-high text-white text-[12px] font-bold uppercase hover:bg-red-700 transition-all shadow-[0_0_20px_rgba(255,49,49,0.3)]"
                >
                  Confirm Authorization
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer HUD */}
      <footer className="h-8 flex items-center justify-between px-4 glass-panel rounded text-[9px] uppercase tracking-widest">
        <div className="flex gap-4">
          <div className="flex items-center gap-1">
            <span>CPU: {(systemStats.cpu || 0).toFixed(0)}%</span>
            <span className="opacity-40">@ {(systemStats.cpuFreq || 0).toFixed(2)}GHz</span>
          </div>
          <span>MEM: {((systemStats.ram || 0) * 0.16).toFixed(1)}GB</span>
          <span>DATA: {(systemStats.dataUsage || 0).toFixed(1)}MB</span>
        </div>
        <div className="flex gap-4">
          <span className="text-radar-green">SECURE ENCRYPTION: AES-256</span>
          <span className="text-radar-green">OPERATOR: RAZIF</span>
        </div>
      </footer>

      {/* Missile Cam Overlay */}
      <AnimatePresence>
        {showMissileCam && (
          <MissileCam 
            target={targets.find(t => t.id === showMissileCam) || null} 
            onClose={() => setShowMissileCam(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
