import React, { useEffect, useRef, useState } from "react";

export default function EnhancedPortScanSimulation({ compact = false }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [scanIndex, setScanIndex] = useState(-1);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState({});
  const [scanSpeed, setScanSpeed] = useState(600);
  const [targetIP, setTargetIP] = useState("192.168.1.100");

  const ports = [
    { port: 21, label: "FTP", open: false, description: "File Transfer Protocol" },
    { port: 22, label: "SSH", open: true, description: "Secure Shell" },
    { port: 23, label: "Telnet", open: false, description: "Telnet Protocol" },
    { port: 53, label: "DNS", open: true, description: "Domain Name System" },
    { port: 80, label: "HTTP", open: false, description: "Web Server" },
    { port: 135, label: "RPC", open: false, description: "Remote Procedure Call" },
    { port: 443, label: "HTTPS", open: true, description: "Secure Web Server" },
    { port: 993, label: "IMAPS", open: false, description: "Secure IMAP" },
    { port: 3306, label: "MySQL", open: true, description: "MySQL Database" },
    { port: 5432, label: "PostgreSQL", open: false, description: "PostgreSQL Database" }
  ];

  const startScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanResults({});
    setScanIndex(0);

    const scanPorts = () => {
      setScanIndex((prev) => {
        if (prev >= ports.length - 1) {
          setIsScanning(false);
          return -1;
        }

        const currentPort = ports[prev + 1];
        const responseTime = currentPort.open ? Math.random() * 200 + 50 : Math.random() * 3000 + 1000;

        setTimeout(() => {
          setScanResults((results) => ({
            ...results,
            [currentPort.port]: {
              ...currentPort,
              responseTime: Math.round(responseTime),
              timestamp: new Date().toLocaleTimeString()
            }
          }));
        }, Math.min(responseTime, scanSpeed * 0.8));

        return prev + 1;
      });
    };

    animationRef.current = setInterval(scanPorts, scanSpeed);
  };

  const stopScan = () => {
    setIsScanning(false);
    setScanIndex(-1);
    if (animationRef.current) {
      clearInterval(animationRef.current);
    }
  };

  const resetScan = () => {
    stopScan();
    setScanResults({});
  };

  useEffect(() => {
    return () => animationRef.current && clearInterval(animationRef.current);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Basic Drawing
    const attackerX = 50, attackerY = 120;
    const serverX = 330, serverY = 120;
    ctx.fillStyle = "#4b5563";
    ctx.fillRect(attackerX - 20, attackerY - 15, 40, 30);
    ctx.fillStyle = "#10b981";
    ctx.fillRect(attackerX - 12, attackerY - 4, 24, 8);
    ctx.fillStyle = "#e5e7eb";
    ctx.font = "10px monospace";
    ctx.fillText("Attacker", attackerX, attackerY + 30);

    ctx.fillStyle = "#4b5563";
    ctx.fillRect(serverX - 25, serverY - 20, 50, 40);
    ctx.fillStyle = "#e5e7eb";
    ctx.fillText("Target", serverX, serverY + 30);
    ctx.fillText(targetIP, serverX, serverY + 42);

    ports.forEach((port, i) => {
      const y = 20 + i * 18;
      const result = scanResults[port.port];
      const isCurrentScan = scanIndex === i;
      ctx.fillStyle = "#374151";
      ctx.fillRect(440, y, 90, 14);
      ctx.fillStyle = result ? (result.open ? "#10b981" : "#ef4444") : "#6b7280";
      ctx.fillRect(442, y + 2, 6, 10);
      ctx.fillStyle = "#e5e7eb";
      ctx.font = "9px monospace";
      ctx.fillText(`${port.port} ${port.label}`, 452, y + 10);

      if (isCurrentScan) {
        ctx.strokeStyle = "#fbbf24";
        ctx.setLineDash([6, 3]);
        ctx.beginPath();
        ctx.moveTo(attackerX + 20, attackerY);
        ctx.lineTo(440, y + 7);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });
  }, [scanIndex, scanResults, isScanning, targetIP]);

  const completedScans = Object.keys(scanResults).length;
  const openPorts = Object.values(scanResults).filter((r) => r.open).length;

  return (
    <div className={`flex flex-col w-full items-center ${compact ? "space-y-2 p-2" : "space-y-6 p-6"}`}>
      <div className="text-center">
        <h2 className="text-lg font-semibold text-white">Advanced Port Scanner</h2>
        {!compact && <p className="text-gray-400 text-sm">Network reconnaissance simulation</p>}
      </div>

      <div className="flex flex-wrap gap-2 items-center justify-center bg-gray-800 p-3 rounded-lg">
        <input
          type="text"
          value={targetIP}
          onChange={(e) => setTargetIP(e.target.value)}
          placeholder="Target IP"
          disabled={isScanning}
          className="px-2 py-1 text-sm bg-gray-700 text-white rounded border border-gray-600 w-[120px]"
        />
        <select
          value={scanSpeed}
          onChange={(e) => setScanSpeed(Number(e.target.value))}
          disabled={isScanning}
          className="px-2 py-1 text-sm bg-gray-700 text-white rounded border border-gray-600"
        >
          <option value={200}>Fast</option>
          <option value={600}>Normal</option>
          <option value={1200}>Slow</option>
        </select>
        <button onClick={startScan} disabled={isScanning} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded text-sm">
          Start
        </button>
        <button onClick={stopScan} disabled={!isScanning} className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded text-sm">
          Stop
        </button>
        <button onClick={resetScan} className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm">
          Reset
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={550}
        height={260}
        className="border border-gray-600 rounded bg-gray-800"
      />

      <div className="grid grid-cols-3 gap-2 w-full text-center">
        <div className="bg-gray-800 p-2 rounded text-xs">
          <div className="text-lg font-bold text-blue-400">{completedScans}</div>
          <div className="text-gray-400">Scanned</div>
        </div>
        <div className="bg-gray-800 p-2 rounded text-xs">
          <div className="text-lg font-bold text-green-400">{openPorts}</div>
          <div className="text-gray-400">Open</div>
        </div>
        <div className="bg-gray-800 p-2 rounded text-xs">
          <div className="text-lg font-bold text-red-400">{completedScans - openPorts}</div>
          <div className="text-gray-400">Closed</div>
        </div>
      </div>

      {!compact && (
        <div className="max-w-lg bg-yellow-900 border border-yellow-600 rounded p-2 text-xs text-yellow-100 mt-2">
          ⚠️ For educational use only. Don’t run port scans on unauthorized targets.
        </div>
      )}
    </div>
  );
}
