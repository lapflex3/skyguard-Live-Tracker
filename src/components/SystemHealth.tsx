import React from 'react';
import { SystemStats } from '../types';
import { Cpu, Zap, Database, Thermometer, HardDrive, ShieldCheck } from 'lucide-react';

interface SystemHealthProps {
  stats: SystemStats;
  tfliteStatus?: { active: boolean, msg: string };
  onSetEnergyMode?: (mode: 'performance' | 'balanced' | 'eco') => void;
}

export const SystemHealth: React.FC<SystemHealthProps> = ({ stats, tfliteStatus, onSetEnergyMode }) => {
  const getStatusColor = (val: number, limit: number = 80) => {
    if (val > limit) return 'text-threat-high';
    if (val > limit - 20) return 'text-threat-medium';
    return 'text-radar-green';
  };

  return (
    <div className="glass-panel p-4 rounded-lg flex flex-col gap-3">
      <div className="text-[10px] font-bold uppercase border-b border-radar-dim pb-2 flex items-center gap-2">
        <Cpu size={14} /> AI Resource Monitoring
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[9px] uppercase opacity-60">
            <span>CPU Usage</span>
            <div className="flex items-center gap-1">
              <span className="text-[8px] opacity-40">{(stats.cpuFreq || 0).toFixed(2)} GHz</span>
              <span className={getStatusColor(stats.cpu)}>{(stats.cpu || 0).toFixed(1)}%</span>
            </div>
          </div>
          <div className="h-1 bg-radar-dim rounded-full overflow-hidden">
            <div className="h-full bg-radar-green" style={{ width: `${stats.cpu}%` }} />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[9px] uppercase opacity-60">
            <span>GPU Usage</span>
            <span className={getStatusColor(stats.gpu)}>{(stats.gpu || 0).toFixed(1)}%</span>
          </div>
          <div className="h-1 bg-radar-dim rounded-full overflow-hidden">
            <div className="h-full bg-radar-green" style={{ width: `${stats.gpu}%` }} />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[9px] uppercase opacity-60">
            <span>NPU / AI Core</span>
            <span className={getStatusColor(stats.npu)}>{(stats.npu || 0).toFixed(1)}%</span>
          </div>
          <div className="h-1 bg-radar-dim rounded-full overflow-hidden">
            <div className="h-full bg-radar-green" style={{ width: `${stats.npu}%` }} />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[9px] uppercase opacity-60">
            <span>MCU / Controller</span>
            <span className={getStatusColor(stats.mcu)}>{(stats.mcu || 0).toFixed(1)}%</span>
          </div>
          <div className="h-1 bg-radar-dim rounded-full overflow-hidden">
            <div className="h-full bg-radar-green" style={{ width: `${stats.mcu}%` }} />
          </div>
        </div>

        <div className="flex flex-col gap-1 col-span-2">
          <div className="flex justify-between text-[9px] uppercase opacity-60">
            <span>RAM Usage</span>
            <span className={getStatusColor(stats.ram)}>{(stats.ram || 0).toFixed(1)}%</span>
          </div>
          <div className="h-1 bg-radar-dim rounded-full overflow-hidden">
            <div className="h-full bg-radar-green" style={{ width: `${stats.ram}%` }} />
          </div>
        </div>
      </div>

      <div className="text-[10px] font-bold uppercase border-b border-radar-dim pb-2 flex items-center gap-2 mt-2">
        <Thermometer size={14} /> Thermal Monitoring (°C)
      </div>

      <div className="grid grid-cols-1 gap-2">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[8px] uppercase opacity-60">
            <span>CPU Temperature</span>
            <span className={getStatusColor(stats.temp?.cpu, 75)}>{(stats.temp?.cpu || 0).toFixed(1)}°C</span>
          </div>
          <div className="h-1 bg-radar-dim rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${stats.temp?.cpu > 75 ? 'bg-threat-high' : stats.temp?.cpu > 55 ? 'bg-threat-medium' : 'bg-radar-green'}`} 
              style={{ width: `${(stats.temp?.cpu / 100) * 100}%` }} 
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[8px] uppercase opacity-60">
            <span>GPU Temperature</span>
            <span className={getStatusColor(stats.temp?.gpu, 75)}>{(stats.temp?.gpu || 0).toFixed(1)}°C</span>
          </div>
          <div className="h-1 bg-radar-dim rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${stats.temp?.gpu > 75 ? 'bg-threat-high' : stats.temp?.gpu > 55 ? 'bg-threat-medium' : 'bg-radar-green'}`} 
              style={{ width: `${(stats.temp?.gpu / 100) * 100}%` }} 
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[8px] uppercase opacity-60">
            <span>RAM Temperature</span>
            <span className={getStatusColor(stats.temp?.ram, 75)}>{(stats.temp?.ram || 0).toFixed(1)}°C</span>
          </div>
          <div className="h-1 bg-radar-dim rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${stats.temp?.ram > 75 ? 'bg-threat-high' : stats.temp?.ram > 55 ? 'bg-threat-medium' : 'bg-radar-green'}`} 
              style={{ width: `${(stats.temp?.ram / 100) * 100}%` }} 
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-1 mt-2">
        <div className="flex flex-col items-center p-1 bg-radar-dim/20 rounded">
          <span className="text-[7px] uppercase opacity-50">CPU</span>
          <span className={`text-[9px] font-bold ${getStatusColor(stats.temp?.cpu, 75)}`}>{(stats.temp?.cpu || 0).toFixed(0)}°</span>
        </div>
        <div className="flex flex-col items-center p-1 bg-radar-dim/20 rounded">
          <span className="text-[7px] uppercase opacity-50">GPU</span>
          <span className={`text-[9px] font-bold ${getStatusColor(stats.temp?.gpu, 75)}`}>{(stats.temp?.gpu || 0).toFixed(0)}°</span>
        </div>
        <div className="flex flex-col items-center p-1 bg-radar-dim/20 rounded">
          <span className="text-[7px] uppercase opacity-50">NPU</span>
          <span className={`text-[9px] font-bold ${getStatusColor(stats.temp?.npu, 75)}`}>{(stats.temp?.npu || 0).toFixed(0)}°</span>
        </div>
        <div className="flex flex-col items-center p-1 bg-radar-dim/20 rounded">
          <span className="text-[7px] uppercase opacity-50">MCU</span>
          <span className={`text-[9px] font-bold ${getStatusColor(stats.temp?.mcu, 75)}`}>{(stats.temp?.mcu || 0).toFixed(0)}°</span>
        </div>
        <div className="flex flex-col items-center p-1 bg-radar-dim/20 rounded">
          <span className="text-[7px] uppercase opacity-50">RAM</span>
          <span className={`text-[9px] font-bold ${getStatusColor(stats.temp?.ram, 75)}`}>{(stats.temp?.ram || 0).toFixed(0)}°</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <div className="flex items-center gap-2 p-2 bg-radar-dim/20 rounded">
          <HardDrive size={12} className={getStatusColor(stats.dataUsage, 900)} />
          <div className="flex flex-col">
            <span className="text-[8px] uppercase opacity-50">DATA USAGE</span>
            <span className="text-[10px] font-bold">{(stats.dataUsage || 0).toFixed(1)}MB</span>
          </div>
        </div>
        <div className="flex flex-col gap-1 p-2 bg-radar-dim/20 rounded">
          <div className="flex items-center gap-2">
            <Zap size={12} className={stats.energyMode === 'performance' ? 'text-threat-high' : stats.energyMode === 'eco' ? 'text-radar-green' : 'text-threat-medium'} />
            <span className="text-[8px] uppercase opacity-50">ENERGY MODE</span>
          </div>
          <div className="flex gap-1 mt-1">
            {(['eco', 'balanced', 'performance'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => onSetEnergyMode?.(mode)}
                className={`flex-1 text-[7px] py-0.5 rounded border transition-all uppercase font-bold ${
                  stats.energyMode === mode 
                    ? 'bg-radar-green text-military-bg border-radar-green' 
                    : 'border-radar-dim hover:border-radar-green/50 text-radar-dim'
                }`}
              >
                {mode.slice(0, 4)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="text-[8px] uppercase text-radar-green/50 animate-pulse mt-1">
        {tfliteStatus?.active ? (
          <span className="text-threat-medium font-bold">TFLite: {tfliteStatus.msg}</span>
        ) : (
          "AI: Optimizing resource allocation for thermal efficiency..."
        )}
      </div>
    </div>
  );
};
