import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, AlertTriangle, Clock, Target, Shield } from "lucide-react";

export default function BruteForceSimulation() {
  const canvasRef = useRef(null);
  const [attempt, setAttempt] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [speed, setSpeed] = useState(800);
  const [startTime, setStartTime] = useState(Date.now());
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [mode, setMode] = useState('dictionary'); // 'dictionary' or 'brute'

  const dictionaryPasswords = [
    "admin", "password", "letmein", "123456", "qwerty", 
    "root", "hunter2", "welcome", "password123", "admin123",
    "login", "guest", "test", "user", "opensesame"
  ];

  const bruteForceChars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const targetPassword = "opensesame";

  const generateBruteForceAttempt = (attemptNum) => {
    let result = "";
    let num = attemptNum;
    const base = bruteForceChars.length;
    
    do {
      result = bruteForceChars[num % base] + result;
      num = Math.floor(num / base);
    } while (num > 0);
    
    return result.padStart(3, 'a');
  };

  const getCurrentAttempt = () => {
    if (mode === 'dictionary') {
      return dictionaryPasswords[attempt % dictionaryPasswords.length];
    } else {
      return generateBruteForceAttempt(attempt);
    }
  };

  const isSuccess = () => {
    if (mode === 'dictionary') {
      return attempt === dictionaryPasswords.length - 1;
    } else {
      return getCurrentAttempt() === targetPassword.substring(0, getCurrentAttempt().length);
    }
  };

  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        setAttempt(a => {
          const newAttempt = a + 1;
          setTotalAttempts(newAttempt);
          
          if (mode === 'dictionary' && newAttempt >= dictionaryPasswords.length) {
            setIsRunning(false);
            return dictionaryPasswords.length - 1;
          }
          
          if (mode === 'brute' && getCurrentAttempt() === targetPassword) {
            setIsRunning(false);
          }
          
          return newAttempt;
        });
      }, speed);
      return () => clearInterval(interval);
    }
  }, [isRunning, speed, mode, dictionaryPasswords.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = 500 * dpr;
    canvas.height = 350 * dpr;
    canvas.style.width = "500px";
    canvas.style.height = "350px";
    ctx.scale(dpr, dpr);
    
    drawScene(ctx);
  }, [attempt, mode]);

  const drawScene = (ctx) => {
    ctx.clearRect(0, 0, 500, 350);
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 500, 350);
    gradient.addColorStop(0, "#0f172a");
    gradient.addColorStop(1, "#1e293b");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 500, 350);

    // Terminal window
    drawTerminal(ctx);
    
    // Login form
    drawLoginForm(ctx);
    
    // Attack visualization
    drawAttackVisualization(ctx);
  };

  const drawTerminal = (ctx) => {
    // Terminal window
    ctx.fillStyle = "#000000";
    ctx.fillRect(20, 20, 240, 180);
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, 240, 180);
    
    // Terminal header
    ctx.fillStyle = "#1f2937";
    ctx.fillRect(20, 20, 240, 25);
    ctx.font = "11px monospace";
    ctx.fillStyle = "#22c55e";
    ctx.fillText("🔴 🟡 🟢 Terminal - Brute Force Attack", 25, 37);
    
    // Terminal content
    ctx.font = "10px monospace";
    ctx.fillStyle = "#22c55e";
    const lines = [
      "$ python bruteforce.py",
      "Starting brute force attack...",
      `Mode: ${mode === 'dictionary' ? 'Dictionary' : 'Brute Force'}`,
      `Target: ${mode === 'dictionary' ? 'admin panel' : targetPassword}`,
      "",
      `Attempt #${attempt + 1}:`,
      `Trying: ${getCurrentAttempt()}`,
      isSuccess() ? "✓ SUCCESS! Password found!" : "✗ Failed, trying next..."
    ];
    
    lines.forEach((line, i) => {
      const color = line.includes('SUCCESS') ? '#22c55e' : 
                   line.includes('Failed') ? '#ef4444' : '#22c55e';
      ctx.fillStyle = color;
      ctx.fillText(line, 25, 60 + i * 12);
    });
  };

  const drawLoginForm = (ctx) => {
    const success = isSuccess();
    
    // Login form background
    ctx.fillStyle = success ? "#064e3b" : "#1f2937";
    ctx.fillRect(280, 50, 200, 120);
    ctx.strokeStyle = success ? "#22c55e" : "#ef4444";
    ctx.lineWidth = 2;
    ctx.strokeRect(280, 50, 200, 120);
    
    // Form header
    ctx.font = "bold 16px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("🔐 Secure Login", 320, 75);
    
    // Username field
    ctx.font = "12px Arial";
    ctx.fillStyle = "#d1d5db";
    ctx.fillText("Username:", 290, 95);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(290, 100, 180, 20);
    ctx.fillStyle = "#000000";
    ctx.fillText("admin", 295, 113);
    
    // Password field
    ctx.fillStyle = "#d1d5db";
    ctx.fillText("Password:", 290, 135);
    ctx.fillStyle = success ? "#dcfce7" : "#ffffff";
    ctx.fillRect(290, 140, 180, 20);
    
    // Password being attempted
    ctx.fillStyle = success ? "#166534" : "#000000";
    const displayPassword = success ? getCurrentAttempt() : "•".repeat(getCurrentAttempt().length);
    ctx.fillText(displayPassword, 295, 153);
    
    // Status message
    ctx.font = "bold 12px Arial";
    if (success) {
      ctx.fillStyle = "#22c55e";
      ctx.fillText("✓ ACCESS GRANTED!", 315, 185);
    } else {
      ctx.fillStyle = "#ef4444";
      ctx.fillText("✗ Access Denied", 325, 185);
    }
  };

  const drawAttackVisualization = (ctx) => {
    // Progress bar
    const progress = mode === 'dictionary' ? 
      (attempt / dictionaryPasswords.length) * 100 : 
      Math.min((attempt / 1000) * 100, 100);
    
    ctx.fillStyle = "#374151";
    ctx.fillRect(20, 220, 460, 20);
    ctx.fillStyle = isSuccess() ? "#22c55e" : "#3b82f6";
    ctx.fillRect(20, 220, (progress / 100) * 460, 20);
    
    ctx.font = "11px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`Progress: ${progress.toFixed(1)}%`, 25, 233);
    
    // Attack patterns
    drawAttackPatterns(ctx);
  };

  const drawAttackPatterns = (ctx) => {
    // Animated attack indicators
    const time = Date.now() / 100;
    
    for (let i = 0; i < 8; i++) {
      const x = 50 + i * 50;
      const y = 270 + Math.sin(time + i) * 10;
      const alpha = Math.sin(time + i * 0.5) * 0.5 + 0.5;
      
      ctx.globalAlpha = alpha;
      ctx.fillStyle = isSuccess() ? "#22c55e" : "#ef4444";
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    
    // Attack vector label
    ctx.font = "10px Arial";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("Attack vectors active...", 180, 300);
  };

  const toggleAttack = () => {
    setIsRunning(!isRunning);
  };

  const resetAttack = () => {
    setAttempt(0);
    setTotalAttempts(0);
    setStartTime(Date.now());
    setIsRunning(false);
  };

  const getTimeElapsed = () => {
    return ((Date.now() - startTime) / 1000).toFixed(1);
  };

  const getAttackRate = () => {
    const timeElapsed = (Date.now() - startTime) / 1000;
    return timeElapsed > 0 ? (totalAttempts / timeElapsed).toFixed(1) : "0";
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-slate-900 rounded-xl shadow-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <AlertTriangle className="text-red-500" size={24} />
          Brute Force Attack Simulation
        </h2>
        <p className="text-slate-300">
          Watch how attackers systematically try passwords to gain unauthorized access
        </p>
      </div>

      <div className="border-2 border-slate-600 rounded-lg mb-6 bg-slate-800">
        <canvas
          ref={canvasRef}
          className="w-full h-auto block rounded-lg"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-600">
          <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
            <Target size={18} className="text-blue-400" />
            Attack Statistics
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-300">
              <span>Attempts:</span>
              <span className="text-white font-mono">{totalAttempts}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Rate:</span>
              <span className="text-white font-mono">{getAttackRate()}/s</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Duration:</span>
              <span className="text-white font-mono">{getTimeElapsed()}s</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-4 rounded-lg border border-slate-600">
          <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
            <Clock size={18} className="text-green-400" />
            Current Status
          </h3>
          <div className="space-y-2 text-sm">
            <div className="text-slate-300">
              Mode: <span className="text-white font-semibold">{mode === 'dictionary' ? 'Dictionary' : 'Brute Force'}</span>
            </div>
            <div className="text-slate-300">
              Trying: <span className="text-white font-mono">{getCurrentAttempt()}</span>
            </div>
            <div className={`font-semibold ${isSuccess() ? 'text-green-400' : 'text-red-400'}`}>
              {isSuccess() ? '✓ Success!' : '⚠ In Progress'}
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-4 rounded-lg border border-slate-600">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <Shield size={18} className="text-purple-400" />
            Controls
          </h3>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                onClick={toggleAttack}
                className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
              >
                {isRunning ? <Pause size={14} /> : <Play size={14} />}
                {isRunning ? "Pause" : "Start"}
              </button>
              <button
                onClick={resetAttack}
                className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
              >
                <RotateCcw size={14} />
                Reset
              </button>
            </div>
            
            <div className="flex gap-1">
              <button
                onClick={() => setMode('dictionary')}
                className={`px-2 py-1 text-xs rounded ${
                  mode === 'dictionary' ? 'bg-purple-600 text-white' : 'bg-slate-600 text-slate-300'
                }`}
              >
                Dictionary
              </button>
              <button
                onClick={() => setMode('brute')}
                className={`px-2 py-1 text-xs rounded ${
                  mode === 'brute' ? 'bg-purple-600 text-white' : 'bg-slate-600 text-slate-300'
                }`}
              >
                Brute Force
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-red-950 border border-red-800 rounded-lg p-4">
          <h3 className="font-semibold text-red-200 mb-2">⚠️ Attack Vectors</h3>
          <ul className="text-red-300 text-sm space-y-1">
            <li>• Dictionary attacks use common passwords</li>
            <li>• Brute force tries all possible combinations</li>
            <li>• Weak passwords are compromised quickly</li>
            <li>• No rate limiting allows rapid attempts</li>
          </ul>
        </div>

        <div className="bg-green-950 border border-green-800 rounded-lg p-4">
          <h3 className="font-semibold text-green-200 mb-2">🛡️ Protection Methods</h3>
          <ul className="text-green-300 text-sm space-y-1">
            <li>• Use strong, unique passwords (12+ chars)</li>
            <li>• Implement account lockout policies</li>
            <li>• Add CAPTCHA after failed attempts</li>
            <li>• Enable two-factor authentication</li>
          </ul>
        </div>
      </div>
    </div>
  );
}