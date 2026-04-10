import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import os from "os";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = 3000;

  // Radar Simulation State
  let targets: any[] = [];
  let radarMode: string = "Surveillance";
  let systemStats = {
    cpu: 0,
    cpuFreq: 0,
    gpu: 0,
    npu: 0,
    mcu: 0,
    ram: 0,
    temp: { cpu: 45, gpu: 40, npu: 35, mcu: 32, ram: 38 },
    dataUsage: 120, // MB
    energyMode: "balanced"
  };

  // Helper to get real CPU usage
  let lastCpuUsage = process.cpuUsage();
  let lastTime = Date.now();

  const getRealCpuUsage = () => {
    const currCpuUsage = process.cpuUsage();
    const currTime = Date.now();
    const elapTime = currTime - lastTime;
    
    const userUsage = (currCpuUsage.user - lastCpuUsage.user) / 1000;
    const systemUsage = (currCpuUsage.system - lastCpuUsage.system) / 1000;
    
    lastCpuUsage = currCpuUsage;
    lastTime = currTime;
    
    const totalUsage = (userUsage + systemUsage) / (elapTime * os.cpus().length);
    return Math.min(100, totalUsage * 100);
  };

  const getRealRamUsage = () => {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    return ((totalMem - freeMem) / totalMem) * 100;
  };
  
  // Initialize some dummy targets for simulation
  const initTargets = () => {
    const surfaceTargets = Array.from({ length: 15 }).map((_, i) => ({
      id: `TGT-${i + 100}`,
      type: i % 4 === 0 ? "aircraft" : i % 4 === 1 ? "ship" : i % 4 === 2 ? "drone" : "missile",
      lat: 3.139 + (Math.random() - 0.5) * 2,
      lng: 101.686 + (Math.random() - 0.5) * 2,
      alt: i % 4 === 1 ? 0 : 5000 + Math.random() * 30000,
      speed: 200 + Math.random() * 1500,
      heading: Math.random() * 360,
      status: "detected",
      threatLevel: Math.random() > 0.8 ? "high" : Math.random() > 0.5 ? "medium" : "low",
      lastUpdate: Date.now(),
    }));

    const subsurfaceTargets = [
      {
        id: "GOLD-DEP-01",
        type: "gold",
        lat: 3.145,
        lng: 101.692,
        alt: -50, // 50m underground
        speed: 0,
        heading: 0,
        status: "detected",
        threatLevel: "friendly",
        lastUpdate: Date.now(),
      },
      {
        id: "OIL-RES-01",
        type: "petroleum",
        lat: 3.120,
        lng: 101.650,
        alt: -1200, // 1.2km underground
        speed: 0,
        heading: 0,
        status: "detected",
        threatLevel: "low",
        lastUpdate: Date.now(),
      },
      {
        id: "GOLD-DEP-02",
        type: "gold",
        lat: 3.160,
        lng: 101.710,
        alt: -30,
        speed: 0,
        heading: 0,
        status: "detected",
        threatLevel: "friendly",
        lastUpdate: Date.now(),
      }
    ];

    return [...surfaceTargets, ...subsurfaceTargets];
  };

  targets = initTargets();

  // Simulation Loop
  setInterval(() => {
    targets = targets.map(t => {
      const speedInDeg = t.speed / 111111; 
      const rad = (t.heading * Math.PI) / 180;
      
      // Interceptor logic: move towards target
      if (t.type === 'interceptor' && t.lockedTargetId) {
        const target = targets.find(tgt => tgt.id === t.lockedTargetId);
        if (target) {
          const dy = target.lat - t.lat;
          const dx = target.lng - t.lng;
          t.heading = (Math.atan2(dy, dx) * 180) / Math.PI;
        }
      }

      return {
        ...t,
        lat: t.lat + Math.sin(rad) * speedInDeg * 0.1,
        lng: t.lng + Math.cos(rad) * speedInDeg * 0.1,
        lastUpdate: Date.now(),
      };
    });

    // Fetch REAL system stats
    systemStats.cpu = getRealCpuUsage();
    systemStats.ram = getRealRamUsage();
    
    const cpus = os.cpus();
    const avgFreq = cpus.reduce((acc, cpu) => acc + cpu.speed, 0) / cpus.length;
    systemStats.cpuFreq = avgFreq / 1000; // Convert MHz to GHz
    
    // Simulate others as we don't have direct access in standard Node/Container
    const modeMultiplier = systemStats.energyMode === 'performance' ? 1.5 : systemStats.energyMode === 'eco' ? 0.6 : 1.0;
    const tempTarget = systemStats.energyMode === 'performance' ? 75 : systemStats.energyMode === 'eco' ? 45 : 60;

    systemStats.gpu = Math.min(100, Math.max(0, (systemStats.cpu * 0.8) + (Math.random() - 0.5) * 5));
    systemStats.npu = Math.min(100, Math.max(0, (systemStats.cpu * 0.4) + (Math.random() - 0.5) * 3));
    systemStats.mcu = Math.min(100, Math.max(0, (systemStats.cpu * 0.2) + (Math.random() - 0.5) * 2));

    // Temperature tends towards mode target and load
    const adjustTemp = (current: number, target: number, rate: number) => {
      const diff = target - current;
      return current + diff * 0.05 + (Math.random() - 0.5) * rate;
    };

    systemStats.temp.cpu = Math.min(100, Math.max(30, adjustTemp(systemStats.temp.cpu, tempTarget + systemStats.cpu/5, 2)));
    systemStats.temp.gpu = Math.min(100, Math.max(30, adjustTemp(systemStats.temp.gpu, tempTarget + systemStats.gpu/6, 1.5)));
    systemStats.temp.npu = Math.min(100, Math.max(30, adjustTemp(systemStats.temp.npu, tempTarget - 5, 1)));
    systemStats.temp.mcu = Math.min(100, Math.max(30, adjustTemp(systemStats.temp.mcu, tempTarget - 10, 0.5)));
    systemStats.temp.ram = Math.min(100, Math.max(30, adjustTemp(systemStats.temp.ram, tempTarget - 15, 0.5)));

    systemStats.dataUsage += Math.random() * 0.5 * modeMultiplier;

    // Tactical Load Simulation (Real CPU impact)
    if (systemStats.energyMode === 'performance') {
      // Busy wait for a few ms to simulate heavy tactical processing
      const start = Date.now();
      while (Date.now() - start < 50) {
        Math.sqrt(Math.random() * 1000000);
      }
    }

    io.emit("radar:update", { targets, systemStats });
  }, 1000);

  io.on("connection", (socket) => {
    console.log("Operator connected:", socket.id);
    socket.emit("radar:init", { targets, systemStats });

    socket.on("target:lock", (targetId) => {
      console.log("Target locked:", targetId);
      io.emit("target:locked", targetId);
    });

    socket.on("interceptor:launch", (data) => {
      const target = targets.find(t => t.id === data.targetId);
      if (target) {
        target.status = 'intercepting';
        io.emit("log:add", `Interceptor Launched against ${data.targetId}`);
        
        // Simulate engagement outcome after 5-10 seconds
        setTimeout(() => {
          const currentTarget = targets.find(t => t.id === data.targetId);
          if (currentTarget && currentTarget.status === 'intercepting') {
            const success = Math.random() > 0.3; // 70% success rate
            if (success) {
              currentTarget.status = 'neutralized';
              currentTarget.threatLevel = 'friendly';
              io.emit("log:add", `SUCCESS: Target ${data.targetId} neutralized.`);
            } else {
              currentTarget.status = 'lost';
              currentTarget.threatLevel = 'high';
              io.emit("log:add", `FAILURE: Target ${data.targetId} escaped engagement.`);
            }
            io.emit("radar:update", { targets, systemStats });
          }
        }, 8000 + Math.random() * 4000);
      }
      
      const newInterceptor = {
        id: `INT-${Date.now().toString().slice(-4)}`,
        type: 'interceptor',
        lat: 3.139,
        lng: 101.686,
        alt: 10000,
        speed: 2500,
        heading: 0,
        status: 'intercepting',
        threatLevel: 'friendly',
        lockedTargetId: data.targetId,
        lastUpdate: Date.now(),
      };
      targets.push(newInterceptor);
    });

    socket.on("target:takeover", (targetId) => {
      targets = targets.map(t => t.id === targetId ? { ...t, status: 'controlled', threatLevel: 'friendly' } : t);
      io.emit("log:add", `Remote Takeover Successful: ${targetId}`);
    });

    socket.on("system:energyMode", (mode) => {
      systemStats.energyMode = mode;
      console.log(`System Energy Mode updated to: ${mode}`);
    });

    socket.on("system:setEnergyMode", (mode) => {
      if (['performance', 'balanced', 'eco'].includes(mode)) {
        systemStats.energyMode = mode;
        console.log(`System Energy Mode changed to: ${mode}`);
      }
    });

    socket.on("radar:setMode", (mode) => {
      radarMode = mode;
      console.log(`Radar Mode updated to: ${mode}`);
      io.emit("log:add", `Radar Mode Switched: ${mode.toUpperCase()}`);
    });

    socket.on("disconnect", () => {
      console.log("Operator disconnected");
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Radar Command Center running on http://localhost:${PORT}`);
  });
}

startServer();
