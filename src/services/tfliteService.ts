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
  
  // Weights for our "Neural Network" simulation
  const usageThreshold = 75;
  const tempThreshold = 60;
  
  const maxUsage = Math.max(cpu, gpu, npu, mcu, ram);
  const maxTemp = Math.max(temp.cpu, temp.gpu, temp.npu, temp.mcu, temp.ram);
  
  let nextMode = energyMode;
  let recommendation = "";
  let isThrottling = false;

  // Inference Logic (Simulated TFLite model output)
  if (maxTemp >= tempThreshold || maxUsage >= usageThreshold) {
    isThrottling = true;
    if (maxTemp > 65 || maxUsage > 85) {
      nextMode = 'eco';
      recommendation = `TFLite: Critical violation detected (${maxTemp.toFixed(1)}°C / ${maxUsage.toFixed(1)}%). Enforcing ECO mode.`;
    } else {
      nextMode = 'balanced';
      recommendation = `TFLite: Approaching limits. Throttling to BALANCED to maintain <60°C and <75% usage.`;
    }
  } else if (maxTemp < 50 && maxUsage < 40 && energyMode === 'eco') {
    nextMode = 'balanced';
    recommendation = "TFLite: Thermal headroom detected. Gradual ramp-up to BALANCED.";
  } else if (maxTemp < 55 && maxUsage < 50 && energyMode === 'balanced') {
    // We stay in balanced to be safe, unless specifically needed
    recommendation = "TFLite: System stabilized within optimal parameters.";
  }

  return { nextMode, recommendation, isThrottling };
};
