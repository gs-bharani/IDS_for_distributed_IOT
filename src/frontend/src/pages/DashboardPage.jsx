import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Link, useNavigate } from 'react-router-dom';

// Import Shadcn UI components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Import scenario service
import scenarioService from '../services/scenarioService';

function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isLoadScenarioModalOpen, setIsLoadScenarioModalOpen] = useState(false);
  const [scenariosList, setScenariosList] = useState([]);
  const [selectedScenarioToLoad, setSelectedScenarioToLoad] = useState('');
  const [loadingScenarios, setLoadingScenarios] = useState(false);

  const fetchScenarios = useCallback(async () => {
    setLoadingScenarios(true);
    try {
      const data = await scenarioService.getScenarios();
      setScenariosList(data);
      if (data.length > 0) {
        setSelectedScenarioToLoad(data[0].id);
      } else {
        setSelectedScenarioToLoad('');
      }
    } catch (error) {
      console.error("Failed to fetch scenarios list:", error);
      alert("Failed to load your scenarios. Please try again.");
    } finally {
      setLoadingScenarios(false);
    }
  }, []);

  useEffect(() => {
    // This useEffect is intentionally empty for now. Scenarios are fetched when the dialog is triggered.
  }, []);

  const handleLoadScenario = async () => {
    if (!selectedScenarioToLoad) {
      alert("Please select a scenario to load.");
      return;
    }
    try {
      navigate(`/scenario-builder?load=${selectedScenarioToLoad}`);
      setIsLoadScenarioModalOpen(false);
    } catch (error) {
      console.error("Error navigating to load scenario:", error);
      alert(`Failed to load scenario: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Enhanced Header section */}
      <header className="bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg border-b border-slate-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Network Security Simulator</h1>
                <p className="text-slate-300 text-sm">Dashboard</p>
              </div>
            </div>
            
            <nav className="flex items-center space-x-6">
              <Link to="/dashboard" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-700 transition-colors">
                Home
              </Link>
              <Link to="/scenario-builder" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-700 transition-colors">
                Scenario Builder
              </Link>
              <Link to="/attack-lab" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-700 transition-colors">
                Attack Lab
              </Link>
              
              <div className="flex items-center space-x-4 border-l border-slate-600 pl-6">
                {user ? (
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium">Welcome, {user.email}!</span>
                  </div>
                ) : (
                  <span className="text-sm font-medium">Welcome!</span>
                )}
                <Button 
                  onClick={logout} 
                  variant="outline" 
                  size="sm"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                >
                  Logout
                </Button>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Enhanced Main Content */}
      <main className="flex-grow container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Welcome to your Security Lab</h2>
          <p className="text-slate-600">Manage your network simulations, create scenarios, and analyze security vulnerabilities.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Network Overview Card - Enhanced */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-lg">Network Overview</CardTitle>
                  <CardDescription>Current status and key metrics</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-slate-700">System Status</span>
                </div>
                <span className="text-sm font-semibold text-green-700">Online</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-sm font-medium text-slate-700">Active Scenarios</span>
                <span className="text-sm font-semibold text-slate-600">0</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-sm font-medium text-slate-700">Recent Events</span>
                <span className="text-sm font-semibold text-slate-600">None yet</span>
              </div>
              
              <div className="pt-2">
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{width: '0%'}}></div>
                </div>
                <p className="text-xs text-slate-500 mt-1">Lab utilization: 0%</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card - Enhanced */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                  <CardDescription>Get started with common tasks</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link to="/scenario-builder" className="block">
                <Button className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md transition-all duration-200 transform hover:scale-105">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create New Scenario
                </Button>
              </Link>

              <Dialog open={isLoadScenarioModalOpen} onOpenChange={setIsLoadScenarioModalOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full h-12 border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-all duration-200" 
                    onClick={fetchScenarios}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    View My Scenarios
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Load Scenario</span>
                    </DialogTitle>
                    <DialogDescription>Select a saved scenario to load onto the canvas.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    {loadingScenarios ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-muted-foreground">Loading scenarios...</span>
                      </div>
                    ) : (
                      <Select onValueChange={setSelectedScenarioToLoad} value={selectedScenarioToLoad}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select a scenario" />
                        </SelectTrigger>
                        <SelectContent>
                          {scenariosList.length === 0 ? (
                            <SelectItem value="no-scenarios" disabled>No scenarios found. Create one first!</SelectItem>
                          ) : (
                            scenariosList.map(scenario => (
                              <SelectItem key={scenario.id} value={scenario.id}>
                                {scenario.name} ({new Date(scenario.updated_at).toLocaleDateString()})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <DialogFooter>
                    <Button 
                      onClick={handleLoadScenario} 
                      disabled={!selectedScenarioToLoad || loadingScenarios}
                      className="w-full"
                    >
                      Load Scenario
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Link to="/attack-lab" className="block">
                <Button variant="outline" className="w-full h-12 border-2 border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 transition-all duration-200">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  Go to Attack Lab
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Simulation Results Card - Enhanced */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-lg">Simulation Results</CardTitle>
                  <CardDescription>Recent outcomes and analysis</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-slate-500 font-medium">No simulations run yet</p>
                <p className="text-sm text-slate-400 mt-1">Results will appear here once you start running scenarios</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md bg-white/60 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">0</div>
              <div className="text-sm text-slate-600">Total Scenarios</div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md bg-white/60 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">0</div>
              <div className="text-sm text-slate-600">Successful Tests</div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md bg-white/60 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">0</div>
              <div className="text-sm text-slate-600">Vulnerabilities Found</div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md bg-white/60 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">0</div>
              <div className="text-sm text-slate-600">Hours Simulated</div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Enhanced Footer */}
      <footer className="bg-slate-800 text-slate-400 text-center py-6 border-t border-slate-700">
        <div className="container mx-auto px-6">
          <p className="text-sm">&copy; {new Date().getFullYear()} Network Security Simulator. Built for cybersecurity professionals.</p>
        </div>
      </footer>
    </div>
  );
}

export default DashboardPage;