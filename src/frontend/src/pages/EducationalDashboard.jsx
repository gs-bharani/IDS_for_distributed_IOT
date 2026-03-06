import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import EnhancedPortScanSimulation from "../simulations/PortScanSimulation";
import  EnhancedDoSSimulation  from "../simulations/DoSSimulation";
import  MitmSimulation  from "../simulations/MitmSimulation";
import { Terminal, Shield, Wifi, Lock, Activity, AlertTriangle } from "lucide-react";
import  BruteForceSimulation  from "../simulations/BruteForceSimulation";

const ATTACKS = [
  {
    id: "port_scan",
    title: "Port Scan Attack",
    desc: "Systematically probe target ports to identify open services and potential vulnerabilities.",
    icon: Terminal,
    sim: <EnhancedPortScanSimulation compact />,
    color: "text-green-400"
  },
  {
    id: "dos",
    title: "Denial of Service (DoS)",
    desc: "Overwhelm target server with traffic to disrupt normal operations and cause service outages.",
    icon: Activity,
    sim: <EnhancedDoSSimulation compact />,
    color: "text-red-400"
  },
  {
    id: "mitm",
    title: "Man-in-the-Middle (MITM)",
    desc: "Intercept and potentially modify communication between two parties without their knowledge.",
    icon: Wifi,
    sim: <MitmSimulation compact />,
    color: "text-yellow-400"
  },
  {
    id: "brute_force",
    title: "Brute Force Attack",
    desc: "Systematically attempt thousands of password combinations to gain unauthorized access.",
    icon: Lock,
    sim: <BruteForceSimulation compact />,
    color: "text-orange-400"
  },
];

export default function EducationalDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-950 to-black">
      <div className="container mx-auto px-6 py-8">
        {/* Header Section */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-blue-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Cyber Attack Learning Lab
            </h1>
          </div>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Interactive cybersecurity simulations to understand attack vectors and defense strategies
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto mt-4 rounded-full"></div>
        </header>

        {/* Attack Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {ATTACKS.map((attack) => {
            const IconComponent = attack.icon;
            return (
              <Card key={attack.id} className="bg-zinc-800/50 border-zinc-700/50 backdrop-blur-sm hover:bg-zinc-800/70 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/10">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-zinc-700/50 rounded-lg">
                      <IconComponent className={`w-5 h-5 ${attack.color}`} />
                    </div>
                    <CardTitle className="text-xl text-white">{attack.title}</CardTitle>
                  </div>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    {attack.desc}
                  </p>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Simulation Container */}
                  <div className="relative">
                    {attack.sim}
                  </div>
                  
                  {/* Action Button */}
                  <div className="pt-4 border-t border-zinc-700/50">
                    <button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/25">
                      <AlertTriangle className="w-4 h-4" />
                      Launch {attack.title}
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full ml-2">
                        Safe Mode
                      </span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer */}
        <footer className="text-center mt-16 pb-8">
          <div className="flex items-center justify-center gap-2 text-zinc-500 text-sm">
            <Shield className="w-4 h-4" />
            <span>Educational purposes only - All simulations are contained and safe</span>
          </div>
        </footer>
      </div>
    </div>
  );
}