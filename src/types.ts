export interface RadarTarget {
  id: string;
  type: 'aircraft' | 'ship' | 'drone' | 'missile' | 'interceptor' | 'gold' | 'petroleum' | 'mineral';
  lat: number;
  lng: number;
  alt: number;
  speed: number;
  heading: number;
  status: 'detected' | 'tracked' | 'locked' | 'lost' | 'intercepting' | 'controlled';
  threatLevel: 'low' | 'medium' | 'high' | 'friendly';
  lastUpdate: number;
  capturedImage?: string;
  capturedVideo?: string;
}

export interface SystemStats {
  cpu: number;
  cpuFreq: number;
  gpu: number;
  npu: number;
  mcu: number;
  ram: number;
  temp: {
    cpu: number;
    gpu: number;
    npu: number;
    mcu: number;
    ram: number;
  };
  dataUsage: number;
  energyMode: 'performance' | 'balanced' | 'eco';
}

export type RadarMode = 
  | 'Surveillance'
  | 'EarlyWarning'
  | 'OTH'
  | 'FireControl'
  | 'Tracking'
  | 'AESA'
  | 'Doppler'
  | 'SAR'
  | 'GMTI'
  | 'AntiStealth'
  | 'LPI'
  | 'Multistatic'
  | 'Navigation'
  | 'Weather'
  | 'Subsurface';

export interface RadarState {
  mode: RadarMode;
  range: number;
  isScanning: boolean;
  isJamming: boolean;
  isStealthMode: boolean;
}
