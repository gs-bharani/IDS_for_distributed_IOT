import React, { useRef, useEffect, useState } from "react";
import { Play, Pause, RotateCcw, Shield, AlertTriangle } from "lucide-react";

export default function MitmSimulation() {
  const canvasRef = useRef(null);
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1200);
  const animationRef = useRef(null);

  const steps = [
    { title: "Normal Communication", desc: "Client sends secure request to server" },
    { title: "Server Response", desc: "Server responds with encrypted data" },
    { title: "Attack Initiated", desc: "Attacker positions between client and server" },
    { title: "Data Intercepted", desc: "All communication flows through attacker" }
  ];

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setStep((s) => (s + 1) % 4);
      }, speed);
      return () => clearInterval(interval);
    }
  }, [isPlaying, speed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    
    // Set canvas size for crisp rendering
    canvas.width = 600 * dpr;
    canvas.height = 300 * dpr;
    canvas.style.width = "600px";
    canvas.style.height = "300px";
    ctx.scale(dpr, dpr);
    
    drawScene(ctx, step);
  }, [step]);

  const drawScene = (ctx, currentStep) => {
    ctx.clearRect(0, 0, 600, 300);
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 600, 300);
    gradient.addColorStop(0, "#f8fafc");
    gradient.addColorStop(1, "#e2e8f0");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 300);

    // Draw network lines (background)
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    // Direct line (faded when attacked)
    ctx.globalAlpha = currentStep >= 2 ? 0.3 : 0.7;
    ctx.beginPath();
    ctx.moveTo(120, 140);
    ctx.lineTo(480, 140);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.setLineDash([]);

    // Client node
    drawNode(ctx, 80, 140, 35, "#3b82f6", "👤", "Client", currentStep === 0);
    
    // Server node
    drawNode(ctx, 520, 140, 35, "#8b5cf6", "🖥️", "Server", currentStep === 1);
    
    // Attacker node
    const attackerActive = currentStep >= 2;
    drawNode(ctx, 300, 220, 32, attackerActive ? "#ef4444" : "#64748b", 
             "🕵️", "Attacker", attackerActive);

    // Draw communication paths
    drawCommunication(ctx, currentStep);
    
    // Draw data packets
    drawDataPackets(ctx, currentStep);
    
    // Security indicators
    drawSecurityIndicators(ctx, currentStep);
  };

  const drawNode = (ctx, x, y, radius, color, emoji, label, isActive) => {
    // Node shadow
    ctx.shadowColor = "rgba(0,0,0,0.2)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;
    
    // Node circle
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    
    // Active pulse effect
    if (isActive) {
      ctx.beginPath();
      ctx.arc(x, y, radius + 8, 0, 2 * Math.PI);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.6;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    
    ctx.shadowColor = "transparent";
    
    // Emoji
    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.fillText(emoji, x, y + 8);
    
    // Label
    ctx.font = "bold 14px Arial";
    ctx.fillStyle = "#1e293b";
    ctx.fillText(label, x, y + radius + 20);
  };

  const drawCommunication = (ctx, currentStep) => {
    ctx.lineWidth = 4;
    
    if (currentStep === 0) {
      // Client to Server (direct)
      drawArrow(ctx, 120, 140, 480, 140, "#10b981", "Request");
    } else if (currentStep === 1) {
      // Server to Client (direct)
      drawArrow(ctx, 480, 135, 120, 135, "#3b82f6", "Response");
      drawArrow(ctx, 120, 145, 480, 145, "#10b981", "Request");
    } else if (currentStep >= 2) {
      // Through attacker
      drawArrow(ctx, 120, 140, 270, 200, "#ef4444", "Intercepted");
      drawArrow(ctx, 330, 200, 480, 140, "#ef4444", "Forwarded");
      
      if (currentStep === 3) {
        drawArrow(ctx, 480, 135, 330, 195, "#f59e0b", "Response");
        drawArrow(ctx, 270, 195, 120, 135, "#f59e0b", "Modified");
      }
    }
  };

  const drawArrow = (ctx, x1, y1, x2, y2, color, label) => {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    
    // Line
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    // Arrowhead
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLength = 15;
    
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), 
               y2 - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), 
               y2 - headLength * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    
    // Label
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2 - 10;
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#374151";
    ctx.fillText(label, midX, midY);
  };

  const drawDataPackets = (ctx, currentStep) => {
    if (currentStep >= 2) {
      // Show intercepted data
      ctx.fillStyle = "#fef3c7";
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2;
      
      ctx.fillRect(250, 250, 100, 30);
      ctx.strokeRect(250, 250, 100, 30);
      
      ctx.font = "11px Arial";
      ctx.fillStyle = "#92400e";
      ctx.textAlign = "center";
      ctx.fillText("Sensitive Data", 300, 268);
      ctx.fillText("🔓 Exposed", 300, 280);
    }
  };

  const drawSecurityIndicators = (ctx, currentStep) => {
    // Security status
    const isSecure = currentStep < 2;
    const statusX = 50;
    const statusY = 50;
    
    ctx.fillStyle = isSecure ? "#dcfce7" : "#fef2f2";
    ctx.strokeStyle = isSecure ? "#16a34a" : "#dc2626";
    ctx.lineWidth = 2;
    
    ctx.fillRect(statusX, statusY, 150, 40);
    ctx.strokeRect(statusX, statusY, 150, 40);
    
    ctx.font = "bold 12px Arial";
    ctx.fillStyle = isSecure ? "#15803d" : "#dc2626";
    ctx.textAlign = "left";
    ctx.fillText(isSecure ? "🔒 Secure" : "⚠️ Compromised", statusX + 10, statusY + 25);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const resetAnimation = () => {
    setStep(0);
    setIsPlaying(false);
  };

  const handleSpeedChange = (newSpeed) => {
    setSpeed(newSpeed);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <AlertTriangle className="text-red-500" size={24} />
          Man-in-the-Middle Attack Simulation
        </h2>
        <p className="text-gray-600">
          Watch how an attacker can intercept communications between a client and server
        </p>
      </div>

      <div className="border-2 border-gray-200 rounded-lg mb-6 bg-gray-50">
        <canvas
          ref={canvasRef}
          className="w-full h-auto block"
          style={{ maxWidth: "100%" }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
            <Shield size={18} />
            Current Step: {step + 1}/4
          </h3>
          <p className="text-blue-700 font-medium">{steps[step].title}</p>
          <p className="text-blue-600 text-sm mt-1">{steps[step].desc}</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-3">Controls</h3>
          <div className="flex gap-2 mb-3">
            <button
              onClick={togglePlayPause}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              {isPlaying ? "Pause" : "Play"}
            </button>
            <button
              onClick={resetAnimation}
              className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              <RotateCcw size={16} />
              Reset
            </button>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Animation Speed
            </label>
            <div className="flex gap-2">
              {[
                { label: "Slow", value: 2000 },
                { label: "Normal", value: 1200 },
                { label: "Fast", value: 600 }
              ].map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => handleSpeedChange(value)}
                  className={`px-3 py-1 text-sm rounded ${
                    speed === value
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  } transition-colors`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="font-semibold text-red-800 mb-2">⚠️ Security Impact</h3>
        <ul className="text-red-700 text-sm space-y-1">
          <li>• Attacker can read all transmitted data</li>
          <li>• Passwords and sensitive information are exposed</li>
          <li>• Communications can be modified in real-time</li>
          <li>• Both parties remain unaware of the breach</li>
        </ul>
        <div className="mt-3 pt-3 border-t border-red-200">
          <p className="text-red-800 font-medium text-sm">
            🛡️ Protection: Use HTTPS, VPNs, and certificate pinning
          </p>
        </div>
      </div>
    </div>
  );
}