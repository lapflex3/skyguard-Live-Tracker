import React, { useState, useEffect } from 'react';
import { RadarTarget } from '../types';
import { getTargetVisual } from '../services/geminiService';
import { Camera, Video, Maximize2, RefreshCw, Loader2 } from 'lucide-react';

interface TargetVisualizerProps {
  target: RadarTarget | null;
}

export const TargetVisualizer: React.FC<TargetVisualizerProps> = ({ target }) => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (target) {
      handleRefresh();
    } else {
      setImage(null);
    }
  }, [target?.id]);

  const handleRefresh = async () => {
    if (!target) return;
    setLoading(true);
    const img = await getTargetVisual(target);
    setImage(img);
    setLoading(false);
  };

  if (!target) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-radar-dim gap-4">
        <Camera size={48} />
        <span className="text-xs uppercase tracking-widest">Select target for visual acquisition</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex justify-between items-center border-b border-radar-dim pb-2">
        <div className="flex items-center gap-2">
          <Video size={14} className="text-radar-green" />
          <span className="text-xs font-bold uppercase">Live Feed: {target.id}</span>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={loading}
          className="p-1 hover:bg-radar-dim rounded transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
        </button>
      </div>

      <div className="flex-1 relative glass-panel rounded overflow-hidden bg-black flex items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={32} className="animate-spin text-radar-green" />
            <span className="text-[10px] uppercase opacity-50">Acquiring Visual...</span>
          </div>
        ) : image ? (
          <img 
            src={image} 
            alt="Target Visual" 
            className="w-full h-full object-cover opacity-80"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="text-[10px] uppercase opacity-30">No visual data available</div>
        )}
        
        {/* Overlay HUD */}
        <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
          <div className="flex justify-between">
            <div className="border-t border-l border-radar-green w-8 h-8" />
            <div className="border-t border-r border-radar-green w-8 h-8" />
          </div>
          
          <div className="flex justify-center">
            <div className="bg-black/50 px-3 py-1 border border-radar-dim rounded text-[10px] uppercase">
              {target.type} | ALT: {target.alt}m | SPD: {target.speed}km/h
            </div>
          </div>

          <div className="flex justify-between">
            <div className="border-b border-l border-radar-green w-8 h-8" />
            <div className="border-b border-r border-radar-green w-8 h-8" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button className="p-2 border border-radar-dim text-[10px] uppercase hover:bg-radar-dim transition-colors flex items-center justify-center gap-2">
          <Maximize2 size={12} /> Fullscreen
        </button>
        <button className="p-2 border border-radar-dim text-[10px] uppercase hover:bg-radar-dim transition-colors">Thermal</button>
        <button className="p-2 border border-radar-dim text-[10px] uppercase hover:bg-radar-dim transition-colors">Night Vision</button>
      </div>
    </div>
  );
};
