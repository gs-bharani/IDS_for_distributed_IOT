import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  addEdge,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css'; // Import React Flow styles
import { Link, useSearchParams } from 'react-router-dom'; // Import useSearchParams

// Shadcn UI components for layout and controls
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

// Custom service for scenario API calls
import scenarioService from '../services/scenarioService';

// Initial setup for React Flow - start with an empty canvas
// These are the initial values for the hooks, which are used on first render
const initialNodes = [];
const initialEdges = [];

// Helper function to generate unique IDs
let idCounter = 0;
const getId = (type) => `${type}_${idCounter++}`;

// Node type configurations with icons and colors
const nodeTypeConfig = {
  victim: { 
    name: 'Victim Host', 
    icon: '🖥️', 
    color: 'bg-red-100 hover:bg-red-200 border-red-300 text-red-800',
    darkColor: 'dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:border-red-700 dark:text-red-300'
  },
  attacker: { 
    name: 'Attacker Machine', 
    icon: '⚡', 
    color: 'bg-orange-100 hover:bg-orange-200 border-orange-300 text-orange-800',
    darkColor: 'dark:bg-orange-900/20 dark:hover:bg-orange-900/30 dark:border-orange-700 dark:text-orange-300'
  },
  server: { 
    name: 'Server', 
    icon: '🖨️', 
    color: 'bg-blue-100 hover:bg-blue-200 border-blue-300 text-blue-800',
    darkColor: 'dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300'
  },
  router: { 
    name: 'Router', 
    icon: '📡', 
    color: 'bg-green-100 hover:bg-green-200 border-green-300 text-green-800',
    darkColor: 'dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:border-green-700 dark:text-green-300'
  },
  iot: { 
    name: 'IoT Device', 
    icon: '📱', 
    color: 'bg-purple-100 hover:bg-purple-200 border-purple-300 text-purple-800',
    darkColor: 'dark:bg-purple-900/20 dark:hover:bg-purple-900/30 dark:border-purple-700 dark:text-purple-300'
  },
  switch: { 
    name: 'Switch', 
    icon: '🔀', 
    color: 'bg-cyan-100 hover:bg-cyan-200 border-cyan-300 text-cyan-800',
    darkColor: 'dark:bg-cyan-900/20 dark:hover:bg-cyan-900/30 dark:border-cyan-700 dark:text-cyan-300'
  },
  firewall: { 
    name: 'Firewall', 
    icon: '🛡️', 
    color: 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300 text-yellow-800',
    darkColor: 'dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-300'
  },
  cloud: { 
    name: 'Cloud', 
    icon: '☁️', 
    color: 'bg-indigo-100 hover:bg-indigo-200 border-indigo-300 text-indigo-800',
    darkColor: 'dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30 dark:border-indigo-700 dark:text-indigo-300'
  },
};

function ScenarioBuilderPage() {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges); 
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioDescription, setScenarioDescription] = useState('');
  const [currentScenarioId, setCurrentScenarioId] = useState(null);
  const [isNewScenarioModalOpen, setIsNewScenarioModalOpen] = useState(false);
  const [scenariosList, setScenariosList] = useState([]);
  const [isLoadScenarioModalOpen, setIsLoadScenarioModalOpen] = useState(false);
  const [selectedScenarioToLoad, setSelectedScenarioToLoad] = useState('');
  const [loadingScenarios, setLoadingScenarios] = useState(false); 

  const [searchParams, setSearchParams] = useSearchParams();

  // --- Node Dragging from Palette ---
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const name = event.dataTransfer.getData('application/reactflow/name');

      if (typeof type === 'undefined' || !type || typeof name === 'undefined' || !name) {
        return;
      }

      if (!reactFlowInstance) {
          console.error("ReactFlow instance not initialized on drop.");
          return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: getId(type),
        type,
        position,
        // Initialize data.properties here
        data: { label: name, properties: {}}, 
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes],
  );

  // --- Edge Connection ---
  const onConnect = useCallback(
    (params) => {
      const newEdge = { ...params, id: `edge_${params.source}-${params.target}_${idCounter++}` };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges],
  );

  // --- Node Selection for Editing ---
  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  // --- Update Node Properties ---
  const handleNodePropertyChange = useCallback((key, value) => {
    if (!selectedNode) return;

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          const updatedProperties = { ...node.data.properties, [key]: value };
          return {
            ...node,
            data: {
              ...node.data,
              properties: updatedProperties,
            },
          };
        }
        return node;
      })
    );
    // Also update the selectedNode state to reflect changes in the form immediately
    setSelectedNode(prev => ({
        ...prev,
        data: {
            ...prev.data,
            properties: { ...prev.data.properties, [key]: value }
        }
    }));
  }, [selectedNode, setNodes]);


  // --- Clear Canvas & Scenario State ---
  const handleClearCanvas = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setScenarioName('');
    setScenarioDescription('');
    setCurrentScenarioId(null); 
    setSelectedNode(null); 
    alert('Canvas cleared for a new scenario.');
    setSearchParams({}, { replace: true });
  }, [setNodes, setEdges, setScenarioName, setScenarioDescription, setCurrentScenarioId, setSelectedNode, setSearchParams]);


  // --- Save Scenario ---
  const handleSaveScenario = async () => {
    // Basic validation
    if (!scenarioName.trim()) {
        alert("Please enter a scenario name.");
        return;
    }
    if (nodes.length === 0) {
        alert("Please add at least one node to the scenario before saving.");
        return;
    }

    try {
      const scenarioData = {
        name: scenarioName,
        description: scenarioDescription,
        nodes: nodes.map(node => ({
          id: node.id,
          name: node.data.label,
          type: node.type,
          position: node.position,
          properties: node.data.properties || {}, // Ensure properties are included
        })),
        connections: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          properties: edge.data?.properties || {}, // Ensure properties are included
        })),
      };

      let response;
      if (currentScenarioId) {
        response = await scenarioService.updateScenario(currentScenarioId, scenarioData);
        alert('Scenario updated successfully!');
      } else {
        response = await scenarioService.createScenario(scenarioData);
        setCurrentScenarioId(response.id); 
        alert('Scenario saved successfully!');
      }
      setIsNewScenarioModalOpen(false); 
    } catch (error) {
      alert(`Failed to save scenario: ${error.message || 'Unknown error'}`);
      console.error("Save scenario error:", error);
    }
  };

  // --- Load Scenario (from modal or URL param) ---
  const loadScenario = useCallback(async (scenarioId) => {
    try {
      const loadedScenario = await scenarioService.getScenarioById(scenarioId);
      
      const rfNodes = loadedScenario.nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: { label: node.name, properties: node.properties || {} },
      }));
      const rfEdges = loadedScenario.connections.map(connection => ({
        id: connection.id,
        source: connection.source,
        target: connection.target,
        data: { properties: connection.properties || {} },
      }));

      setNodes(rfNodes);
      setEdges(rfEdges);
      setScenarioName(loadedScenario.name);
      setScenarioDescription(loadedScenario.description || '');
      setCurrentScenarioId(loadedScenario.id); 
      setSelectedNode(null); 
      
      alert(`Scenario "${loadedScenario.name}" loaded successfully!`);
    } catch (error) {
      console.error("Failed to load scenario:", error);
      alert(`Failed to load scenario: ${error.message || 'Unknown error'}`);
      setCurrentScenarioId(null);
      setSearchParams({}, { replace: true });
    }
  }, [setNodes, setEdges, setScenarioName, setScenarioDescription, setCurrentScenarioId, setSelectedNode, setSearchParams]);


  // --- Fetch Scenarios for Load Modal (used by DialogTrigger) ---
  const fetchScenariosForModal = useCallback(async () => {
    setLoadingScenarios(true);
    try {
      const data = await scenarioService.getScenarios();
      setScenariosList(data);
      // Pre-select the first scenario if available
      if (data.length > 0 && !selectedScenarioToLoad) {
        setSelectedScenarioToLoad(data[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch scenarios list for modal:", error);
      alert("Failed to load your scenarios. Please try again.");
    } finally {
      setLoadingScenarios(false);
    }
  }, [selectedScenarioToLoad]); 

  // --- Handler for Load Scenario Button (from inside builder page's modal) ---
  const handleLoadScenarioFromBuilder = () => {
    if (!selectedScenarioToLoad) {
      alert("Please select a scenario to load.");
      return;
    }
    loadScenario(selectedScenarioToLoad); 
    setIsLoadScenarioModalOpen(false);
  };


  // --- Effect to handle URL parameter loading and initial canvas state ---
  useEffect(() => {
    const loadScenarioId = searchParams.get('load');
    if (loadScenarioId && loadScenarioId !== currentScenarioId) {
      loadScenario(loadScenarioId);
    } else if (!loadScenarioId && currentScenarioId) {
      handleClearCanvas();
    }
  }, [searchParams, currentScenarioId, loadScenario, handleClearCanvas]); 

  // --- Node Palette Drag Start ---
  const onDragStart = (event, nodeType, nodeName) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/reactflow/name', nodeName);
    event.dataTransfer.effectAllowed = 'move';
  };

  // --- Render ---
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
      {/* Enhanced Header */}
      <header className="bg-gradient-to-r from-slate-800 to-slate-700 dark:from-slate-900 dark:to-slate-800 text-white shadow-xl border-b border-slate-600/50">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SB</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Scenario Builder</h2>
            {scenarioName && (
              <div className="ml-4 px-3 py-1 bg-blue-600/20 rounded-full border border-blue-400/30">
                <span className="text-blue-200 text-sm font-medium">{scenarioName}</span>
              </div>
            )}
          </div>
          <nav>
            <ul className="flex items-center space-x-3">
              <li>
                <Link 
                  to="/dashboard" 
                  className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors duration-200 text-slate-200 hover:text-white"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Button 
                  onClick={handleClearCanvas} 
                  variant="secondary"
                  className="bg-slate-600 hover:bg-slate-500 text-white border-slate-500"
                >
                  ✨ New Scenario
                </Button>
              </li>
              <li>
                <Dialog open={isNewScenarioModalOpen} onOpenChange={setIsNewScenarioModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
                      {currentScenarioId ? '💾 Update Scenario' : '💾 Save Scenario'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px] bg-amber-50">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-semibold">
                        {currentScenarioId ? '✏️ Update Scenario' : '💾 Save New Scenario'}
                      </DialogTitle>
                      <DialogDescription className="text-slate-600 bg-amber-50 dark:text-slate-400">
                        {currentScenarioId ? 'Modify details for the current scenario.' : 'Enter details for your new network scenario.'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="scenario-name" className="text-sm font-medium">
                          Scenario Name
                        </Label>
                        <Input
                          id="scenario-name"
                          value={scenarioName}
                          onChange={(e) => setScenarioName(e.target.value)}
                          placeholder="e.g., Small Office Network"
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="scenario-description" className="text-sm font-medium">
                          Description
                        </Label>
                        <Textarea
                          id="scenario-description"
                          value={scenarioDescription}
                          onChange={(e) => setScenarioDescription(e.target.value)}
                          placeholder="A brief description of your network setup..."
                          className="min-h-[100px] resize-none"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleSaveScenario} className="bg-blue-600 hover:bg-blue-700">
                        {currentScenarioId ? 'Update' : 'Save'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </li>
              <li>
                <Dialog open={isLoadScenarioModalOpen} onOpenChange={setIsLoadScenarioModalOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="bg-white/10 border-slate-500 text-white hover:bg-white/20"
                      onClick={fetchScenariosForModal}
                    >
                      📁 Load Scenario
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-semibold">📁 Load Scenario</DialogTitle>
                      <DialogDescription className="text-slate-600 dark:text-slate-400">
                        Select a saved scenario to load onto the canvas.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      {loadingScenarios ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          <span className="ml-3 text-slate-600 dark:text-slate-400">Loading scenarios...</span>
                        </div>
                      ) : (
                        <Select onValueChange={setSelectedScenarioToLoad} value={selectedScenarioToLoad}>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select a scenario" />
                          </SelectTrigger>
                          <SelectContent>
                            {scenariosList.length === 0 ? (
                              <SelectItem value="no-scenarios" disabled>
                                No scenarios found. Create one first!
                              </SelectItem>
                            ) : (
                              scenariosList.map(scenario => (
                                <SelectItem key={scenario.id} value={scenario.id}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{scenario.name}</span>
                                    <span className="text-xs text-slate-500">
                                      Updated: {new Date(scenario.updated_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <DialogFooter>
                      <Button 
                        onClick={handleLoadScenarioFromBuilder} 
                        disabled={!selectedScenarioToLoad || loadingScenarios}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Load
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Main Content Area: Palette + React Flow Canvas + Details Panel */}
      <div className="flex flex-grow overflow-hidden">
        {/* Enhanced Node Palette Sidebar */}
        <aside className="w-72 bg-white dark:bg-gray-800 border-r border-slate-200 dark:border-gray-700 shadow-lg">
          <div className="p-6 border-b border-slate-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
              <span className="mr-2">🧩</span>
              Node Palette
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Drag nodes to the canvas
            </p>
          </div>
          <div className="p-4 space-y-3 overflow-y-auto max-h-full">
            {Object.entries(nodeTypeConfig).map(([type, config]) => (
              <div
                key={type}
                className={`
                  p-4 rounded-xl cursor-grab active:cursor-grabbing 
                  transition-all duration-200 transform hover:scale-[1.02] hover:shadow-md
                  border-2 border-dashed
                  ${config.color} ${config.darkColor}
                `}
                onDragStart={(event) => onDragStart(event, type, config.name)}
                draggable
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{config.icon}</span>
                  <div>
                    <div className="font-semibold text-sm">{config.name}</div>
                    <div className="text-xs opacity-75 capitalize">{type}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Enhanced React Flow Canvas */}
        <div className="flex-grow h-full relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            fitView
            attributionPosition="bottom-left"
            className="bg-slate-50 dark:bg-gray-900"
          >
            <Controls className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 shadow-lg" />
            <Background 
              variant="dots" 
              gap={20} 
              size={1} 
              className="opacity-30"
              color="#94a3b8"
            />
          </ReactFlow>
          
          {/* Canvas Status Indicator */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center p-8 bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-lg backdrop-blur-sm border border-slate-200 dark:border-gray-700">
                <div className="text-6xl mb-4">🚀</div>
                <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                  Start Building Your Scenario
                </h3>
                <p className="text-slate-600 dark:text-slate-400 max-w-md">
                  Drag nodes from the palette on the left to begin creating your network scenario
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Node Details Panel */}
        {selectedNode && (
          <Card className="w-80 bg-white dark:bg-gray-800 border-l border-slate-200 dark:border-gray-700 shadow-lg">
            <CardHeader className="bg-slate-50 dark:bg-gray-700/50 border-b border-slate-200 dark:border-gray-600">
              <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <span className="mr-2">⚙️</span>
                Node Properties
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                    {selectedNode.id}
                  </span>
                </div>
                <div className="mt-1 font-medium text-slate-700 dark:text-slate-300">
                  {selectedNode.data.label}
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6 overflow-y-auto max-h-96">
              {/* Node Label Section */}
              <div className="space-y-2">
                <Label htmlFor="node-label" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Display Name
                </Label>
                <Input
                  id="node-label"
                  value={selectedNode.data.label || ''}
                  onChange={(e) => setNodes((nds) => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, label: e.target.value } } : n))}
                  className="h-10"
                />
              </div>

              {/* New: Operating System Property */}
              <div className="space-y-2">
                <Label htmlFor="node-os" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Operating System (OS)
                </Label>
                <Select
                  value={selectedNode.data.properties.os || ''}
                  onValueChange={(value) => handleNodePropertyChange('os', value)}
                >
                  <SelectTrigger id="node-os" className="h-10">
                    <SelectValue placeholder="Select OS" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="linux">Linux</SelectItem>
                    <SelectItem value="windows">Windows</SelectItem>
                    <SelectItem value="macos">macOS</SelectItem>
                    <SelectItem value="freebsd">FreeBSD</SelectItem>
                    <SelectItem value="android">Android</SelectItem>
                    <SelectItem value="ios">iOS</SelectItem>
                    <SelectItem value="routeros">RouterOS</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* New: Running Services Property */}
              <div className="space-y-2">
                <Label htmlFor="node-services" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Running Services (comma-separated)
                </Label>
                <Input
                  id="node-services"
                  value={selectedNode.data.properties.services || ''}
                  onChange={(e) => handleNodePropertyChange('services', e.target.value)}
                  placeholder="e.g., HTTP, SSH, DNS"
                  className="h-10"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  List common services like "HTTP", "SSH", "DNS", "FTP", etc.
                </p>
              </div>

              {/* Custom Properties Section (existing) */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Other Custom Properties</h4>
                  <div className="h-px bg-slate-200 dark:bg-gray-600 flex-1"></div>
                </div>
                
                {Object.entries(selectedNode.data.properties || {}).filter(([key]) => key !== 'os' && key !== 'services').map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                      {key.replace(/_/g, ' ')}
                    </Label>
                    <Input
                      value={value}
                      onChange={(e) => handleNodePropertyChange(key, e.target.value)}
                      className="h-9 text-sm"
                      placeholder={`Enter ${key.replace(/_/g, ' ')}`}
                    />
                  </div>
                ))}

                {/* Add New Property */}
                <div className="pt-3 border-t border-slate-200 dark:border-gray-600">
                  <Label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Add Custom Property
                  </Label>
                  <Input
                    placeholder="Property name (press Enter)"
                    className="h-9 text-sm mt-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim() !== '') {
                        handleNodePropertyChange(e.target.value.trim(), '');
                        e.target.value = '';
                        e.preventDefault();
                      }
                    }}
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Define additional properties not listed above.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default ScenarioBuilderPage;
