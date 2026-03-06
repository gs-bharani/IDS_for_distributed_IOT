import React, { useRef, useEffect, useState, useCallback } from "react";

export default function EnhancedDoSSimulation() {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [packets, setPackets] = useState([]);
  const [serverHealth, setServerHealth] = useState(100);
  const [attackIntensity, setAttackIntensity] = useState(1);
  const [isAttacking, setIsAttacking] = useState(false);
  const [attackType, setAttackType] = useState('SYN_FLOOD');
  const [legitimateRequests, setLegitimateRequests] = useState([]);
  const [metrics, setMetrics] = useState({
    packetsPerSecond: 0,
    responseTime: 50,
    successfulConnections: 0,
    droppedPackets: 0
  });

  const attackTypes = {
    SYN_FLOOD: { name: 'SYN Flood', color: '#ef4444', description: 'TCP SYN packet flooding' },
    UDP_FLOOD: { name: 'UDP Flood', color: '#f97316', description: 'UDP packet bombardment' },
    HTTP_FLOOD: { name: 'HTTP Flood', color: '#8b5cf6', description: 'HTTP request flooding' },
    PING_FLOOD: { name: 'Ping Flood', color: '#06b6d4', description: 'ICMP ping flooding' }
  };

  const botnet = [
    { id: 1, x: 80, y: 80, label: 'Bot 1', active: false },
    { id: 2, x: 80, y: 150, label: 'Bot 2', active: false },
    { id: 3, x: 80, y: 220, label: 'Bot 3', active: false },
    { id: 4, x: 150, y: 80, label: 'Bot 4', active: false },
    { id: 5, x: 150, y: 220, label: 'Bot 5', active: false }
  ];

  const generatePacket = useCallback((sourceBot = null) => {
    const source = sourceBot || botnet[Math.floor(Math.random() * botnet.length)];
    const currentAttack = attackTypes[attackType];
    
    return {
      id: Math.random(),
      x: source.x + 20,
      y: source.y + (Math.random() - 0.5) * 20,
      targetX: 650,
      targetY: 200 + (Math.random() - 0.5) * 40,
      speed: 3 + Math.random() * 4,
      size: 3 + Math.random() * 3,
      color: currentAttack.color,
      type: attackType,
      sourceBot: source.id,
      opacity: 0.8 + Math.random() * 0.2,
      malicious: true
    };
  }, [attackType]);

  const generateLegitimateRequest = useCallback(() => {
    return {
      id: Math.random(),
      x: 80,
      y: 300,
      targetX: 650,
      targetY: 200,
      speed: 2 + Math.random() * 2,
      size: 4,
      color: '#10b981',
      type: 'LEGITIMATE',
      opacity: 1,
      malicious: false
    };
  }, []);

  const startAttack = () => {
    setIsAttacking(true);
    setServerHealth(100);
    setMetrics(prev => ({ ...prev, droppedPackets: 0, successfulConnections: 0 }));
  };

  const stopAttack = () => {
    setIsAttacking(false);
    setPackets([]);
    setLegitimateRequests([]);
  };

  useEffect(() => {
    let packetInterval, legitInterval, metricsInterval;

    if (isAttacking) {
      packetInterval = setInterval(() => {
        const packetsToAdd = Math.floor(attackIntensity * (1 + Math.random()));
        for (let i = 0; i < packetsToAdd; i++) {
          setPackets(prev => {
            if (prev.length > 100) return prev.slice(20);
            return [...prev, generatePacket()];
          });
        }
      }, 100 / attackIntensity);

      legitInterval = setInterval(() => {
        if (Math.random() < 0.3) {
          setLegitimateRequests(prev => {
            if (prev.length > 10) return prev.slice(1);
            return [...prev, generateLegitimateRequest()];
          });
        }
      }, 2000);

      metricsInterval = setInterval(() => {
        setMetrics(prev => ({
          packetsPerSecond: Math.floor(attackIntensity * 10 + Math.random() * 20),
          responseTime: Math.min(5000, 50 + (100 - serverHealth) * 50),
          successfulConnections: prev.successfulConnections,
          droppedPackets: prev.droppedPackets
        }));

        setServerHealth(prev => {
          const newHealth = Math.max(0, prev - attackIntensity * 0.5);
          return newHealth;
        });
      }, 1000);
    } else {
      const recoveryInterval = setInterval(() => {
        setServerHealth(prev => Math.min(100, prev + 2));
      }, 500);

      return () => clearInterval(recoveryInterval);
    }

    return () => {
      clearInterval(packetInterval);
      clearInterval(legitInterval);
      clearInterval(metricsInterval);
    };
  }, [isAttacking, attackIntensity, generatePacket, generateLegitimateRequest]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background grid
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 30) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 30) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // Draw botnet nodes
      botnet.forEach(bot => {
        const isActive = packets.some(p => p.sourceBot === bot.id);
        
        if (isActive && isAttacking) {
          const gradient = ctx.createRadialGradient(bot.x, bot.y, 0, bot.x, bot.y, 30);
          gradient.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
          gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
          ctx.fillStyle = gradient;
          ctx.fillRect(bot.x - 30, bot.y - 30, 60, 60);
        }

        ctx.fillStyle = isActive ? '#dc2626' : '#374151';
        ctx.fillRect(bot.x - 12, bot.y - 8, 24, 16);
        ctx.fillStyle = isActive ? '#fee2e2' : '#4b5563';
        ctx.fillRect(bot.x - 8, bot.y - 4, 16, 8);
        
        ctx.font = '10px monospace';
        ctx.fillStyle = '#9ca3af';
        ctx.textAlign = 'center';
        ctx.fillText(bot.label, bot.x, bot.y + 25);
      });

      // Draw legitimate user
      ctx.fillStyle = '#059669';
      ctx.fillRect(68, 292, 24, 16);
      ctx.fillStyle = '#d1fae5';
      ctx.fillRect(72, 296, 16, 8);
      ctx.font = '10px monospace';
      ctx.fillStyle = '#059669';
      ctx.textAlign = 'center';
      ctx.fillText('User', 80, 325);

      // Draw server
      const serverX = 650, serverY = 200;
      
      const healthColor = serverHealth > 70 ? '#10b981' : 
                         serverHealth > 30 ? '#f59e0b' : '#ef4444';
      const glowIntensity = (100 - serverHealth) / 100;
      
      if (glowIntensity > 0) {
        const gradient = ctx.createRadialGradient(serverX, serverY, 0, serverX, serverY, 60 + glowIntensity * 40);
        gradient.addColorStop(0, `${healthColor}30`);
        gradient.addColorStop(1, `${healthColor}00`);
        ctx.fillStyle = gradient;
        ctx.fillRect(serverX - 80, serverY - 80, 160, 160);
      }

      ctx.fillStyle = '#1f2937';
      ctx.fillRect(serverX - 25, serverY - 40, 50, 80);
      ctx.fillStyle = '#374151';
      ctx.fillRect(serverX - 20, serverY - 35, 40, 70);

      for (let i = 0; i < 6; i++) {
        const lightY = serverY - 25 + i * 8;
        const lightHealth = Math.max(0, serverHealth - i * 15);
        ctx.fillStyle = lightHealth > 50 ? '#10b981' : 
                       lightHealth > 20 ? '#f59e0b' : '#ef4444';
        ctx.fillRect(serverX - 15, lightY, 6, 4);
      }

      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = '#e5e7eb';
      ctx.textAlign = 'center';
      ctx.fillText('TARGET SERVER', serverX, serverY + 60);
      
      ctx.fillStyle = '#374151';
      ctx.fillRect(serverX - 40, serverY + 70, 80, 8);
      ctx.fillStyle = healthColor;
      ctx.fillRect(serverX - 40, serverY + 70, (serverHealth / 100) * 80, 8);
      
      ctx.font = '10px monospace';
      ctx.fillStyle = '#9ca3af';
      ctx.fillText(`Health: ${Math.round(serverHealth)}%`, serverX, serverY + 90);

      // Animate packets
      setPackets(prevPackets => {
        return prevPackets.map(packet => {
          ctx.fillStyle = packet.color;
          ctx.globalAlpha = packet.opacity;
          ctx.beginPath();
          ctx.arc(packet.x, packet.y, packet.size, 0, 2 * Math.PI);
          ctx.fill();
          
          ctx.strokeStyle = packet.color;
          ctx.lineWidth = 2;
          ctx.globalAlpha = packet.opacity * 0.3;
          ctx.beginPath();
          ctx.moveTo(packet.x - 10, packet.y);
          ctx.lineTo(packet.x, packet.y);
          ctx.stroke();
          
          ctx.globalAlpha = 1;

          const dx = packet.targetX - packet.x;
          const dy = packet.targetY - packet.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > packet.speed) {
            return {
              ...packet,
              x: packet.x + (dx / distance) * packet.speed,
              y: packet.y + (dy / distance) * packet.speed
            };
          } else {
            if (serverHealth > 30 && Math.random() < 0.1) {
              setMetrics(prev => ({ ...prev, successfulConnections: prev.successfulConnections + 1 }));
            } else {
              setMetrics(prev => ({ ...prev, droppedPackets: prev.droppedPackets + 1 }));
            }
            return null;
          }
        }).filter(Boolean);
      });

      // Animate legitimate requests
      setLegitimateRequests(prevRequests => {
        return prevRequests.map(request => {
          ctx.fillStyle = request.color;
          ctx.globalAlpha = request.opacity;
          ctx.beginPath();
          ctx.arc(request.x, request.y, request.size, 0, 2 * Math.PI);
          ctx.fill();
          
          ctx.strokeStyle = request.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(request.x - 2, request.y);
          ctx.lineTo(request.x, request.y + 2);
          ctx.lineTo(request.x + 3, request.y - 2);
          ctx.stroke();
          
          ctx.globalAlpha = 1;

          const dx = request.targetX - request.x;
          const dy = request.targetY - request.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > request.speed) {
            return {
              ...request,
              x: request.x + (dx / distance) * request.speed,
              y: request.y + (dy / distance) * request.speed
            };
          } else {
            if (serverHealth > 20) {
              setMetrics(prev => ({ ...prev, successfulConnections: prev.successfulConnections + 1 }));
            } else {
              setMetrics(prev => ({ ...prev, droppedPackets: prev.droppedPackets + 1 }));
            }
            return null;
          }
        }).filter(Boolean);
      });

      if (isAttacking) {
        ctx.font = 'bold 16px monospace';
        ctx.fillStyle = '#ef4444';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ ATTACK IN PROGRESS ⚡', canvas.width / 2, 30);
        
        ctx.font = '12px monospace';
        ctx.fillStyle = '#fbbf24';
        ctx.fillText(`${attackTypes[attackType].name} - Intensity: ${attackIntensity}`, canvas.width / 2, 50);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [packets, legitimateRequests, serverHealth, isAttacking, attackIntensity, attackType]);

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">DoS Attack Simulation</h1>
          <p className="text-gray-400">Distributed Denial of Service demonstration</p>
        </div>

        {/* Controls */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-center">
            <select 
              value={attackType}
              onChange={(e) => setAttackType(e.target.value)}
              className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
              disabled={isAttacking}
            >
              {Object.entries(attackTypes).map(([key, type]) => (
                <option key={key} value={key}>{type.name}</option>
              ))}
            </select>

            <div className="flex items-center space-x-2">
              <label className="text-white text-sm">Intensity:</label>
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={attackIntensity}
                onChange={(e) => setAttackIntensity(Number(e.target.value))}
                className="w-20"
                disabled={isAttacking}
              />
              <span className="text-white text-sm w-6">{attackIntensity}</span>
            </div>

            <button 
              onClick={startAttack} 
              disabled={isAttacking}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded font-semibold transition-colors"
            >
              {isAttacking ? "Attacking..." : "Launch Attack"}
            </button>
            
            <button 
              onClick={stopAttack}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-semibold transition-colors"
            >
              Stop Attack
            </button>
          </div>
        </div>

        {/* Attack Description */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6 text-center">
          <h3 className="text-lg font-semibold text-white mb-2">{attackTypes[attackType].name}</h3>
          <p className="text-gray-300 text-sm">{attackTypes[attackType].description}</p>
        </div>

        {/* Canvas Container */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6 flex justify-center">
          <canvas 
            ref={canvasRef} 
            width={800} 
            height={400} 
            className="border border-gray-600 rounded-lg max-w-full"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-400">{metrics.packetsPerSecond}</div>
            <div className="text-gray-400 text-sm">Packets/sec</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-400">{metrics.responseTime}ms</div>
            <div className="text-gray-400 text-sm">Response Time</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-400">{metrics.successfulConnections}</div>
            <div className="text-gray-400 text-sm">Successful</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-400">{metrics.droppedPackets}</div>
            <div className="text-gray-400 text-sm">Dropped</div>
          </div>
        </div>

        {/* Server Status */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-white mb-3 text-center">Server Status</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Health:</span>
              <span className={`font-bold ${
                serverHealth > 70 ? 'text-green-400' : 
                serverHealth > 30 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {Math.round(serverHealth)}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  serverHealth > 70 ? 'bg-green-400' : 
                  serverHealth > 30 ? 'bg-yellow-400' : 'bg-red-400'
                }`}
                style={{ width: `${serverHealth}%` }}
              ></div>
            </div>
            <div className="text-center text-sm text-gray-400">
              {serverHealth > 80 ? '🟢 Operational' :
               serverHealth > 50 ? '🟡 Degraded' :
               serverHealth > 20 ? '🟠 Critical' : '🔴 Down'}
            </div>
          </div>
        </div>

        {/* Educational Warning */}
        <div className="bg-red-900 border border-red-600 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="text-red-400">⚠️</div>
            <div className="text-red-100 text-sm">
              <strong>Educational Only:</strong> This simulation demonstrates DoS attack concepts for learning purposes. 
              Conducting real DoS attacks is illegal and can result in serious legal consequences.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}