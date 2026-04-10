export interface IotDevice {
  id: string;
  type: 'sensor' | 'actuator' | 'gateway';
  status: 'online' | 'offline' | 'connecting';
  battery: number;
  signalStrength: number; // dBm
  lastSeen: number;
  data: any;
}

export interface LoraConfig {
  frequency: number; // MHz
  spreadingFactor: number;
  bandwidth: number; // kHz
  codingRate: string;
}

class IotService {
  private devices: IotDevice[] = [
    { 
      id: 'LORA-NODE-01', 
      type: 'sensor', 
      status: 'online', 
      battery: 85, 
      signalStrength: -105, 
      lastSeen: Date.now(),
      data: { temp: 24.5, humidity: 60 }
    },
    { 
      id: 'LORA-GATEWAY', 
      type: 'gateway', 
      status: 'online', 
      battery: 100, 
      signalStrength: -80, 
      lastSeen: Date.now(),
      data: { connectedNodes: 12, uptime: '45d 12h' }
    }
  ];

  getDevices(): IotDevice[] {
    return this.devices;
  }

  async connectToDevice(id: string): Promise<boolean> {
    // Simulate connection logic
    return new Promise((resolve) => {
      setTimeout(() => {
        const device = this.devices.find(d => d.id === id);
        if (device) {
          device.status = 'online';
          resolve(true);
        } else {
          resolve(false);
        }
      }, 2000);
    });
  }

  async sendLoraCommand(deviceId: string, command: string): Promise<string> {
    // Simulate LoRa command transmission
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`ACK: Command "${command}" received by ${deviceId} via LoRa.`);
      }, 1500);
    });
  }
}

export const iotService = new IotService();
