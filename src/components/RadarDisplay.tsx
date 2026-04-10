import React, { useEffect, useRef, useState } from 'react';
import { RadarTarget, RadarMode } from '../types';

interface RadarDisplayProps {
  targets: RadarTarget[];
  mode: RadarMode;
  range: number;
}

export const RadarDisplay: React.FC<RadarDisplayProps> = ({ targets, mode, range }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const { width, height } = canvas;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) / 2 - 20;

      ctx.clearRect(0, 0, width, height);

      // Draw Background Circles
      ctx.strokeStyle = '#003b00';
      ctx.lineWidth = 1;
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, (radius / 4) * i, 0, Math.PI * 2);
        ctx.stroke();
        
        // Range text
        ctx.fillStyle = '#003b00';
        ctx.font = '10px monospace';
        ctx.fillText(`${Math.round((range / 4) * i)}km`, centerX + 5, centerY - (radius / 4) * i - 5);
      }

      // Draw Crosshair
      ctx.beginPath();
      ctx.moveTo(centerX - radius, centerY);
      ctx.lineTo(centerX + radius, centerY);
      ctx.moveTo(centerX, centerY - radius);
      ctx.lineTo(centerX, centerY + radius);
      ctx.stroke();

      // Draw Sweep
      let sweepSpeed = 2;
      if (mode === 'AESA') sweepSpeed = 5;
      if (mode === 'EarlyWarning') sweepSpeed = 1;
      if (mode === 'FireControl') sweepSpeed = 10;

      angleRef.current = (angleRef.current + sweepSpeed) % 360;
      const sweepAngle = (angleRef.current * Math.PI) / 180;
      const gradient = ctx.createConicGradient(sweepAngle, centerX, centerY);
      
      if (mode === 'Weather') {
        gradient.addColorStop(0, 'rgba(0, 200, 255, 0.3)');
        gradient.addColorStop(0.1, 'rgba(0, 200, 255, 0)');
      } else if (mode === 'Subsurface') {
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.4)'); // Gold sweep
        gradient.addColorStop(0.1, 'rgba(255, 215, 0, 0)');
      } else {
        gradient.addColorStop(0, 'rgba(0, 255, 65, 0.4)');
        gradient.addColorStop(0.1, 'rgba(0, 255, 65, 0)');
      }
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, sweepAngle - 0.2, sweepAngle);
      ctx.fill();

      // Simulated Weather Noise
      if (mode === 'Weather') {
        ctx.fillStyle = 'rgba(0, 200, 255, 0.1)';
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.arc(centerX + Math.cos(i) * 100, centerY + Math.sin(i) * 80, 40, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw Targets
      targets.forEach(target => {
        // Subsurface filtering
        if (mode === 'Subsurface') {
          if (!['gold', 'petroleum', 'mineral'].includes(target.type)) return;
        } else {
          if (['gold', 'petroleum', 'mineral'].includes(target.type)) return;
        }

        // Anti-Stealth logic: some targets might be hidden in normal surveillance
        
        const relX = (target.lng - 101.686) * 500; 
        const relY = (target.lat - 3.139) * 500;
        
        const dist = Math.sqrt(relX * relX + relY * relY);
        if (dist < radius) {
          const x = centerX + relX;
          const y = centerY - relY;

          // Target marker logic
          const isHighThreat = target.threatLevel === 'high';
          const isMediumThreat = target.threatLevel === 'medium';
          const isFriendly = target.threatLevel === 'friendly';
          
          // Flashing effect for high threat
          const flash = isHighThreat ? (Math.sin(Date.now() / 100) > 0) : true;
          
          if (flash) {
            if (target.type === 'gold') {
              ctx.fillStyle = '#ffd700';
              // Hexagon for gold
              ctx.beginPath();
              for (let i = 0; i < 6; i++) {
                ctx.lineTo(x + 5 * Math.cos(i * Math.PI / 3), y + 5 * Math.sin(i * Math.PI / 3));
              }
              ctx.closePath();
              ctx.fill();
            } else if (target.type === 'petroleum') {
              ctx.fillStyle = '#333333';
              ctx.strokeStyle = '#ffd700';
              ctx.lineWidth = 1;
              // Drop shape for oil
              ctx.beginPath();
              ctx.arc(x, y, 4, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            } else {
              ctx.fillStyle = isFriendly ? '#3b82f6' : isHighThreat ? '#ff3131' : isMediumThreat ? '#ffcc00' : '#00ff41';
              
              if (isHighThreat) {
                // Diamond shape for high threat
                ctx.beginPath();
                ctx.moveTo(x, y - 5);
                ctx.lineTo(x + 5, y);
                ctx.lineTo(x, y + 5);
                ctx.lineTo(x - 5, y);
                ctx.closePath();
                ctx.fill();
                
                // Outer glow for high threat
                ctx.strokeStyle = 'rgba(255, 49, 49, 0.5)';
                ctx.lineWidth = 2;
                ctx.stroke();
              } else if (isFriendly) {
                // Triangle for friendly/interceptor
                ctx.beginPath();
                ctx.moveTo(x, y - 4);
                ctx.lineTo(x + 4, y + 4);
                ctx.lineTo(x - 4, y + 4);
                ctx.closePath();
                ctx.fill();
              } else if (isMediumThreat) {
                // Square for medium threat
                ctx.fillRect(x - 3, y - 3, 6, 6);
              } else {
                // Circle for low threat
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }

          // Target ID
          ctx.font = '9px monospace';
          ctx.fillText(target.id, x + 5, y - 5);
          
          // Velocity vector
          const vecLen = 15;
          const vecRad = ((90 - target.heading) * Math.PI) / 180;
          ctx.strokeStyle = ctx.fillStyle;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + Math.cos(vecRad) * vecLen, y - Math.sin(vecRad) * vecLen);
          ctx.stroke();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [targets, mode, range]);

  return (
    <div className="relative w-full aspect-square glass-panel rounded-full overflow-hidden flex items-center justify-center">
      <canvas 
        ref={canvasRef} 
        width={600} 
        height={600} 
        className="w-full h-full"
      />
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest opacity-50">
        {mode} RADAR ACTIVE
      </div>
    </div>
  );
};
