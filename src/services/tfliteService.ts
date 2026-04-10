import { SystemStats } from '../types';

/**
 * Simulated TFLite Optimization Engine
 * This service simulates a trained TensorFlow Lite model that predicts optimal 
 * system states to maintain thermal and performance constraints.
 */
export const tfliteOptimize = (stats: SystemStats): { 
  nextMode: 'performance' | 'balanced' | 'eco', 
  recommendation: string,
  isThrottling: boolean 
} => {
  const { cpu, gpu, npu, mcu, ram, temp, energyMode } = stats;
  
  // Dynamic Thresholds based on current mode
  const usageLimit = energyMode === 'performance' ? 85 : 75;
  const tempLimit = energyMode === 'performance' ? 70 : 60;
  
  const metrics = [
    { name: 'CPU', val: cpu, temp: temp.cpu },
    { name: 'GPU', val: gpu, temp: temp.gpu },
    { name: 'NPU', val: npu, temp: temp.npu },
    { name: 'MCU', val: mcu, temp: temp.mcu },
    { name: 'RAM', val: ram, temp: temp.ram }
  ];
  
  const criticalMetric = metrics.find(m => m.val > usageLimit || m.temp > tempLimit);
  const extremeMetric = metrics.find(m => m.val > 90 || m.temp > 75);
  
  let nextMode = energyMode;
  let recommendation = "";
  let isThrottling = false;

  if (extremeMetric) {
    isThrottling = true;
    nextMode = 'eco';
    recommendation = `TFLite CRITICAL: ${extremeMetric.name} failure risk (${extremeMetric.val.toFixed(1)}% / ${extremeMetric.temp.toFixed(1)}°C). EMERGENCY ECO MODE.`;
  } else if (criticalMetric) {
    isThrottling = true;
    nextMode = 'balanced';
    recommendation = `TFLite WARNING: ${criticalMetric.name} approaching thermal ceiling. Throttling to BALANCED.`;
  } else if (energyMode === 'eco' && metrics.every(m => m.val < 40 && m.temp < 50)) {
    nextMode = 'balanced';
    recommendation = "TFLite OPTIMIZE: Thermal stability confirmed. Restoring BALANCED operations.";
  } else if (energyMode === 'balanced' && metrics.every(m => m.val < 30 && m.temp < 45)) {
    // Optional: Suggest performance if needed, but we'll stay safe
    recommendation = "TFLite: System running at peak efficiency.";
  } else {
    recommendation = "TFLite: Continuous monitoring active. All cores within safe parameters.";
  }

  return { nextMode, recommendation, isThrottling };
};
