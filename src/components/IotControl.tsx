import React, { useState, useEffect } from 'react';
import { iotService, IotDevice } from '../services/iotService';
import { 
  Radio, 
  Wifi, 
  Battery, 
  Signal, 
  Activity, 
  RefreshCw, 
  Send,
  Cpu,
  Link,
  Unlink
} from 'lucide-react';
import { motion } from 'motion/react';

export const IotControl: React.FC = () => {
  const [devices, setDevices] = useState<IotDevice[]>([]);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [command, setCommand] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    setDevices(iotService.getDevices());
  }, []);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10));
  };

  const handleConnect = async (id: string) => {
    setIsConnecting(id);
    addLog(`Initiating LoRa handshake with ${id}...`);
    const success = await iotService.connectToDevice(id);
    if (success) {
      addLog(`LoRa Link Established: ${id}`);
      setDevices([...iotService.getDevices()]);
    } else {
      addLog(`Connection Failed: ${id} unreachable.`);
    }
    setIsConnecting(null);
  };

  const handleSendCommand = async (id: string) => {
    if (!command) return;
    addLog(`Transmitting LoRa Packet to ${id}: ${command}`);
    const response = await iotService.sendLoraCommand(id, command);
    addLog(response);
    setCommand('');
  };

  return (
    <div className="h-full flex flex-col gap-6 overflow-hidden">
      <div className="flex justify-between items-center border-b border-radar-dim pb-2">
        <div className="flex items-center gap-2">
          <Radio size={18} className="text-radar-green" />
          <h3 className="text-sm font-bold uppercase">IoT & LoRa Network Control</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-radar-green animate-pulse" />
            <span className="text-[10px] uppercase opacity-60">Gateway Status: ONLINE</span>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
        {/* Device List */}
        <div className="col-span-7 flex flex-col gap-4 overflow-y-auto pr-2">
          {devices.map(device => (
            <div key={device.id} className="glass-panel p-4 rounded-lg border border-radar-dim/50 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded bg-radar-dim/20 ${device.status === 'online' ? 'text-radar-green' : 'text-radar-dim'}`}>
                    {device.type === 'gateway' ? <Wifi size={20} /> : <Cpu size={20} />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold">{device.id}</span>
                    <span className="text-[8px] uppercase opacity-50">{device.type} // LoRaWAN Node</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Battery size={12} className={device.battery < 20 ? 'text-threat-high' : 'text-radar-green'} />
                    <span className="text-[10px] font-mono">{device.battery}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Signal size={12} className="text-radar-green" />
                    <span className="text-[10px] font-mono">{device.signalStrength} dBm</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 py-2 border-y border-radar-dim/20">
                {Object.entries(device.data).map(([key, val]) => (
                  <div key={key} className="flex flex-col">
                    <span className="text-[7px] uppercase opacity-50">{key}</span>
                    <span className="text-[10px] font-bold text-radar-green">{String(val)}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => handleConnect(device.id)}
                  disabled={isConnecting === device.id}
                  className={`flex-1 flex items-center justify-center gap-2 p-2 border text-[10px] font-bold uppercase transition-all ${
                    device.status === 'online' 
                      ? 'border-radar-green text-radar-green bg-radar-green/5' 
                      : 'border-radar-dim text-radar-dim hover:border-radar-green'
                  }`}
                >
                  {isConnecting === device.id ? (
                    <RefreshCw size={12} className="animate-spin" />
                  ) : device.status === 'online' ? (
                    <Link size={12} />
                  ) : (
                    <Unlink size={12} />
                  )}
                  {isConnecting === device.id ? 'Connecting...' : device.status === 'online' ? 'Connected' : 'Reconnect'}
                </button>
                
                {device.status === 'online' && (
                  <div className="flex-1 flex gap-1">
                    <input 
                      type="text" 
                      placeholder="LoRa CMD..."
                      value={command}
                      onChange={(e) => setCommand(e.target.value)}
                      className="flex-1 bg-black/40 border border-radar-dim rounded px-2 text-[10px] text-radar-green focus:border-radar-green outline-none"
                    />
                    <button 
                      onClick={() => handleSendCommand(device.id)}
                      className="p-2 bg-radar-green text-military-bg rounded hover:bg-radar-green/80 transition-all"
                    >
                      <Send size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Network Stats & Logs */}
        <div className="col-span-5 flex flex-col gap-4">
          <div className="glass-panel p-4 rounded-lg flex flex-col gap-4">
            <div className="text-[10px] font-bold uppercase border-b border-radar-dim pb-2 flex items-center gap-2">
              <Activity size={14} /> LoRa Spectrum Analysis
            </div>
            <div className="h-32 flex items-end gap-1 px-2">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div 
                  key={i}
                  animate={{ height: `${20 + Math.random() * 80}%` }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
                  className="flex-1 bg-radar-green/30 rounded-t"
                />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 text-[8px] uppercase opacity-60">
              <div className="flex justify-between">
                <span>Frequency</span>
                <span className="text-radar-green">915.0 MHz</span>
              </div>
              <div className="flex justify-between">
                <span>SF</span>
                <span className="text-radar-green">12</span>
              </div>
              <div className="flex justify-between">
                <span>Bandwidth</span>
                <span className="text-radar-green">125 kHz</span>
              </div>
              <div className="flex justify-between">
                <span>CR</span>
                <span className="text-radar-green">4/5</span>
              </div>
            </div>
          </div>

          <div className="flex-1 glass-panel p-4 rounded-lg flex flex-col gap-4 overflow-hidden">
            <div className="text-[10px] font-bold uppercase border-b border-radar-dim pb-2">Network Logs</div>
            <div className="flex-1 overflow-y-auto flex flex-col gap-1 pr-2">
              {logs.map((log, i) => (
                <div key={i} className="text-[9px] font-mono leading-tight opacity-70 border-l border-radar-dim pl-2 py-1">
                  {log}
                </div>
              ))}
              {logs.length === 0 && (
                <div className="h-full flex items-center justify-center text-[10px] uppercase opacity-30">
                  No network activity
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
