import React, { useState, useEffect } from 'react';
import { SystemStats } from '../types';
import { 
  Cpu, 
  Zap, 
  Activity, 
  ShieldCheck, 
  Brain, 
  Layers, 
  Network,
  Terminal,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';

interface AiMonitoringProps {
  stats: SystemStats;
  tfliteStatus: { active: boolean, msg: string };
}

export const AiMonitoring: React.FC<AiMonitoringProps> = ({ stats, tfliteStatus }) => {
  const [nodes, setNodes] = useState<number[]>([]);

  useEffect(() => {
    // Generate random neural activity
    const interval = setInterval(() => {
      setNodes(Array.from({ length: 12 }).map(() => Math.random()));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col gap-6 overflow-hidden">
      <div className="flex justify-between items-center border-b border-radar-dim pb-2">
        <div className="flex items-center gap-2">
          <Brain size={18} className="text-radar-green" />
          <h3 className="text-sm font-bold uppercase">TFLite AI Optimization Engine</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${tfliteStatus.active ? 'bg-threat-medium animate-pulse' : 'bg-radar-green'}`} />
            <span className="text-[10px] uppercase opacity-60">AI Status: {tfliteStatus.active ? 'THROTTLING' : 'OPTIMAL'}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
        {/* Neural Net Visualization */}
        <div className="col-span-7 glass-panel rounded-lg p-6 flex flex-col gap-4 bg-black/40 relative overflow-hidden">
          <div className="text-[10px] font-bold uppercase text-radar-green flex items-center gap-2 mb-2">
            <Network size={14} /> Neural Network Activity
          </div>
          
          <div className="flex-1 flex items-center justify-around relative">
            {/* Input Layer */}
            <div className="flex flex-col gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <motion.div 
                  key={`in-${i}`}
                  animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
                  className="w-3 h-3 rounded-full bg-radar-green shadow-[0_0_10px_rgba(0,255,65,0.5)]" 
                />
              ))}
            </div>

            {/* Hidden Layer */}
            <div className="flex flex-col gap-3">
              {nodes.map((val, i) => (
                <motion.div 
                  key={`hid-${i}`}
                  animate={{ 
                    backgroundColor: val > 0.7 ? '#ff3131' : val > 0.3 ? '#00ff41' : '#1a1a1a',
                    boxShadow: val > 0.7 ? '0 0 15px rgba(255,49,49,0.5)' : '0 0 10px rgba(0,255,65,0.3)'
                  }}
                  className="w-4 h-4 rounded-full border border-radar-dim" 
                />
              ))}
            </div>

            {/* Output Layer */}
            <div className="flex flex-col gap-8">
              <motion.div 
                animate={{ opacity: stats.energyMode === 'performance' ? 1 : 0.2 }}
                className="flex items-center gap-2"
              >
                <div className="w-4 h-4 rounded bg-threat-high" />
                <span className="text-[8px] font-bold uppercase">Boost</span>
              </motion.div>
              <motion.div 
                animate={{ opacity: stats.energyMode === 'balanced' ? 1 : 0.2 }}
                className="flex items-center gap-2"
              >
                <div className="w-4 h-4 rounded bg-threat-medium" />
                <span className="text-[8px] font-bold uppercase">Balance</span>
              </motion.div>
              <motion.div 
                animate={{ opacity: stats.energyMode === 'eco' ? 1 : 0.2 }}
                className="flex items-center gap-2"
              >
                <div className="w-4 h-4 rounded bg-radar-green" />
                <span className="text-[8px] font-bold uppercase">Eco</span>
              </motion.div>
            </div>

            {/* Connection Lines (SVG) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
              <line x1="10%" y1="20%" x2="45%" y2="50%" stroke="#00ff41" strokeWidth="0.5" />
              <line x1="10%" y1="40%" x2="45%" y2="50%" stroke="#00ff41" strokeWidth="0.5" />
              <line x1="10%" y1="60%" x2="45%" y2="50%" stroke="#00ff41" strokeWidth="0.5" />
              <line x1="45%" y1="50%" x2="90%" y2="30%" stroke="#00ff41" strokeWidth="1" />
              <line x1="45%" y1="50%" x2="90%" y2="50%" stroke="#00ff41" strokeWidth="1" />
              <line x1="45%" y1="50%" x2="90%" y2="70%" stroke="#00ff41" strokeWidth="1" />
            </svg>
          </div>

          <div className="absolute bottom-4 left-6 right-6 p-3 bg-radar-dim/10 rounded border border-radar-dim flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[8px] uppercase opacity-50">Inference Latency</span>
              <span className="text-[10px] font-mono text-radar-green">1.24ms</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[8px] uppercase opacity-50">Model Accuracy</span>
              <span className="text-[10px] font-mono text-radar-green">99.8%</span>
            </div>
          </div>
        </div>

        {/* AI Decision Panel */}
        <div className="col-span-5 flex flex-col gap-4">
          <div className="glass-panel p-4 rounded-lg flex flex-col gap-4">
            <div className="text-[10px] font-bold uppercase border-b border-radar-dim pb-2 flex items-center gap-2">
              <Terminal size={14} /> AI Decision Logs
            </div>
            <div className="flex flex-col gap-3 h-48 overflow-y-auto pr-2">
              <div className="flex flex-col gap-1">
                <span className="text-[8px] text-radar-green opacity-50 font-mono">[{new Date().toLocaleTimeString()}]</span>
                <p className="text-[9px] leading-tight">{tfliteStatus.msg || "Monitoring system health..."}</p>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[8px] text-radar-green opacity-50 font-mono">[{new Date(Date.now()-5000).toLocaleTimeString()}]</span>
                <p className="text-[9px] leading-tight">Analyzing thermal gradients across NPU cores...</p>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[8px] text-radar-green opacity-50 font-mono">[{new Date(Date.now()-12000).toLocaleTimeString()}]</span>
                <p className="text-[9px] leading-tight">Optimizing data packet compression for low-latency link.</p>
              </div>
            </div>
          </div>

          <div className="flex-1 glass-panel p-4 rounded-lg flex flex-col gap-4">
            <div className="text-[10px] font-bold uppercase border-b border-radar-dim pb-2 flex items-center gap-2">
              <Layers size={14} /> Hardware Constraints
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[9px] uppercase">
                  <span className="opacity-60">Max CPU Frequency</span>
                  <span className="text-radar-green">{(stats.cpuFreq || 0).toFixed(2)} GHz</span>
                </div>
                <div className="h-1 bg-radar-dim rounded-full overflow-hidden">
                  <div className="h-full bg-radar-green" style={{ width: `${(stats.cpuFreq / 5) * 100}%` }} />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[9px] uppercase">
                  <span className="opacity-60">Thermal Limit</span>
                  <span className="text-threat-medium">60.0°C</span>
                </div>
                <div className="h-1 bg-radar-dim rounded-full overflow-hidden">
                  <div className="h-full bg-threat-medium" style={{ width: '60%' }} />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[9px] uppercase">
                  <span className="opacity-60">Usage Cap</span>
                  <span className="text-threat-medium">75.0%</span>
                </div>
                <div className="h-1 bg-radar-dim rounded-full overflow-hidden">
                  <div className="h-full bg-threat-medium" style={{ width: '75%' }} />
                </div>
              </div>
            </div>

            <div className="mt-auto p-3 bg-threat-high/10 rounded border border-threat-high/30 flex items-center gap-3">
              <AlertCircle size={16} className="text-threat-high" />
              <div className="flex flex-col">
                <span className="text-[8px] uppercase opacity-50">Safety Protocol</span>
                <span className="text-[10px] font-bold text-threat-high">AUTO-THROTTLE ENABLED</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
