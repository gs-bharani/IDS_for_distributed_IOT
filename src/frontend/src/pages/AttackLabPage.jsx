import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

// Import Shadcn UI components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea'; // Assuming you have this for malware payload
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Services
import scenarioService from '../services/scenarioService';
import attackService from '../services/attackService';

// Define possible attack types (must match backend's Literal type)
const ATTACK_TYPES = [
  { value: 'port_scan', label: 'Port Scan' },
  { value: 'dos', label: 'Denial of Service (DoS)' },
  { value: 'mitm', label: 'Man-in-the-Middle (MITM)' },
  { value: 'brute_force', label: 'Brute Force' },
  { value: 'malware_delivery', label: 'Malware Delivery' }, // Added for completeness if you expand
  { value: 'ddos', label: 'Distributed DoS (DDoS)' },     // Added for completeness if you expand
];

export default function AttackLabPage() {
  const [scenarios, setScenarios] = useState([]);
  // selectedScenarioId will now store the SCENARIO NAME, as IDs are undefined from backend
  const [selectedScenarioId, setSelectedScenarioId] = useState('');
  const [scenarioNodes, setScenarioNodes] = useState([]);
  const [selectedAttackType, setSelectedAttackType] = useState('port_scan');
  const [formParams, setFormParams] = useState({});
  const [launchingAttack, setLaunchingAttack] = useState(false);
  const [attackResult, setAttackResult] = useState(null);
  const [error, setError] = useState('');
  const [loadingScenarios, setLoadingScenarios] = useState(true);
  const [scenarioFetchError, setScenarioFetchError] = useState('');
  const [attackHistory, setAttackHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await attackService.getAttackHistory();
        setAttackHistory(data);
      } catch (err) {
        console.error("Failed to fetch attack history", err);
      }
    };

    fetchHistory();
  }, []);

  // --- Get Default Form Params based on attack type ---
  const getDefaults = useCallback((type) => {
    let defaults = {
      duration_seconds: 30, // Common default
    };
    switch (type) {
      case 'port_scan':
        defaults = { ...defaults, port_range_start: 1, port_range_end: 1024, scan_type: 'tcp_syn' };
        break;
      case 'dos':
        defaults = { ...defaults, protocol: 'tcp', payload_size_bytes: 100, packet_rate_per_second: 100 };
        break;
      case 'mitm':
        defaults = { ...defaults, target_node_id_secondary: '', intercept_protocols: ['all'] };
        break;
      case 'brute_force':
        defaults = { ...defaults, service_port: 22, usernames: "", passwords: "", delay_per_attempt_ms: 100 };
        break;
      case 'malware_delivery':
        defaults = { ...defaults, payload: 'base64_encoded_malware_example', delivery_method: 'http_download' };
        break;
      case 'ddos':
        defaults = { ...defaults, num_attackers: 2, protocol: 'udp', payload_size_bytes: 50, packet_rate_per_second: 50 };
        break;
      default:
        break;
    }
    return defaults;
  }, []);

  // --- Effect 1: Fetch scenarios once on mount and set initial states ---
  useEffect(() => {
    const fetchAndSetInitialScenario = async () => {
      setLoadingScenarios(true);
      setScenarioFetchError('');
      try {
        const data = await scenarioService.getScenarios();
        setScenarios(data);
        console.log("Fetched Scenarios (data received):", data);
        console.log("Fetched Scenario IDs (for debugging - expecting 'undefined'):", data.map(s => s.id));
        console.log("Fetched Scenario Names (for debugging):", data.map(s => s.name));

        if (data.length > 0) {
          const firstScenario = data[0];
          // Use name for selection because id is undefined
          setSelectedScenarioId(firstScenario._id);
          console.log("Initially selected scenario NAME:", firstScenario.name);

          const nodesInScenario = firstScenario.nodes || [];
          setScenarioNodes(nodesInScenario);
          console.log("Initial scenario, nodes, and form params set for first scenario.");

          setFormParams(prev => {
            const defaults = getDefaults(selectedAttackType);
            const firstNodeId = nodesInScenario.length > 0 ? nodesInScenario[0].id : '';
            const secondNodeId = nodesInScenario.length > 1 ? nodesInScenario[1].id : '';
            return {
              ...defaults,
              source_node_id: firstNodeId,
              target_node_id: (secondNodeId || firstNodeId),
              target_node_id_secondary: (selectedAttackType === 'mitm' && secondNodeId !== firstNodeId ? secondNodeId : '')
            };
          });
        } else {
          setSelectedScenarioId('');
          setScenarioNodes([]);
          setFormParams({});
          console.log("No scenarios available after fetch, resetting states.");
        }
      } catch (err) {
        console.error("Error fetching scenarios:", err);
        setScenarioFetchError(`Failed to load scenarios: ${err.message || "Network Error"}. Please ensure you are logged in and backend is running.`);
      } finally {
        setLoadingScenarios(false);
      }
    };

    fetchAndSetInitialScenario();
  }, []);

  // --- Effect 2: Update nodes and form params when selectedScenarioId (name) changes (user interaction) ---
  useEffect(() => {
    console.log("selectedScenarioId (name) changed:", selectedScenarioId);
    if (!selectedScenarioId || scenarios.length === 0) {
      setScenarioNodes([]);
      setFormParams({});
      console.log("Scenario ID (name) changed to empty or scenarios are not loaded, clearing nodes and form params.");
      return;
    }

    // Find the scenario by its name now
    const foundScenario = scenarios.find(s => s._id === selectedScenarioId);

    if (foundScenario) {
      const nodesInScenario = foundScenario.nodes || [];
      setScenarioNodes(nodesInScenario);
      console.log("User selected scenario changed, updated scenarioNodes:", nodesInScenario);

      setFormParams(prev => {
        const defaults = getDefaults(selectedAttackType);
        const firstNodeId = nodesInScenario.length > 0 ? nodesInScenario[0].id : '';
        const secondNodeId = nodesInScenario.length > 1 ? nodesInScenario[1].id : '';

        const currentSourceNodeValid = nodesInScenario.some(n => n.id === prev.source_node_id);
        const currentTargetNodeValid = nodesInScenario.some(n => n.id === prev.target_node_id);
        const currentSecondaryTargetNodeValid = nodesInScenario.some(n => n.id === prev.target_node_id_secondary);

        const newFormParams = {
          ...defaults,
          source_node_id: currentSourceNodeValid ? prev.source_node_id : firstNodeId,
          target_node_id: currentTargetNodeValid ? prev.target_node_id : (secondNodeId || firstNodeId),
          target_node_id_secondary: (selectedAttackType === 'mitm' && currentSecondaryTargetNodeValid)
            ? prev.target_node_id_secondary
            : (selectedAttackType === 'mitm' && secondNodeId !== firstNodeId ? secondNodeId : '')
        };
        console.log("User selected scenario changed, updated formParams:", newFormParams);
        return newFormParams;
      });
    } else {
      setScenarioNodes([]);
      setFormParams({});
      console.log("Selected Scenario (by name) not found in scenarios list, resetting nodes and form params.");
    }
  }, [selectedScenarioId, scenarios, selectedAttackType, getDefaults]);

  // --- Effect 3: Update form parameters when selectedAttackType changes ---
  useEffect(() => {
    setFormParams(prev => ({
      ...prev,
      ...getDefaults(selectedAttackType),
    }));
    console.log("Attack type changed, updated formParams with new defaults:", getDefaults(selectedAttackType));
  }, [selectedAttackType, getDefaults]);


  // --- Handle Form Input Changes ---
  const handleFormChange = useCallback((key, value) => {
    setFormParams(prev => ({ ...prev, [key]: value }));
  }, []);

  // --- Render Attack-Specific Parameters ---
  const renderAttackParameters = useCallback(() => {
    switch (selectedAttackType) {
      case 'port_scan':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="port-range-start">Port Start</Label>
                <Input
                  id="port-range-start"
                  type="number"
                  value={formParams.port_range_start ?? ''}
                  onChange={(e) => handleFormChange('port_range_start', parseInt(e.target.value) || 0)}
                  min="1" max="65535"
                />
              </div>
              <div>
                <Label htmlFor="port-range-end">Port End</Label>
                <Input
                  id="port-range-end"
                  type="number"
                  value={formParams.port_range_end ?? ''}
                  onChange={(e) => handleFormChange('port_range_end', parseInt(e.target.value) || 0)}
                  min="1" max="65535"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Scan Type</Label>
              <RadioGroup
                value={formParams.scan_type || 'tcp_syn'}
                onValueChange={(val) => handleFormChange('scan_type', val)}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="tcp_syn" id="scan-tcp-syn" />
                  <Label htmlFor="scan-tcp-syn">TCP SYN</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="tcp_connect" id="scan-tcp-connect" />
                  <Label htmlFor="scan-tcp-connect">TCP Connect</Label>
                </div>
              </RadioGroup>
            </div>
          </>
        );
      case 'dos':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dos-protocol">Protocol</Label>
                <Select onValueChange={(val) => handleFormChange('protocol', val)} value={formParams.protocol || 'tcp'}>
                  <SelectTrigger id="dos-protocol">
                    <SelectValue placeholder="Select protocol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tcp">TCP</SelectItem>
                    <SelectItem value="udp">UDP</SelectItem>
                    <SelectItem value="http">HTTP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="payload-size">Payload Size (Bytes)</Label>
                <Input
                  id="payload-size"
                  type="number"
                  value={formParams.payload_size_bytes ?? ''}
                  onChange={(e) => handleFormChange('payload_size_bytes', parseInt(e.target.value) || 0)}
                  min="1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="packet-rate">Packet Rate (per second)</Label>
              <Input
                id="packet-rate"
                type="number"
                value={formParams.packet_rate_per_second ?? ''}
                onChange={(e) => handleFormChange('packet_rate_per_second', parseInt(e.target.value) || 0)}
                min="1"
              />
            </div>
          </>
        );
      case 'mitm':
        return (
          <>
            <div>
              <Label htmlFor="target-node-id-secondary">Secondary Target Node</Label>
              <Select onValueChange={(val) => handleFormChange('target_node_id_secondary', val)} value={formParams.target_node_id_secondary || ''}>
                <SelectTrigger id="target-node-id-secondary" disabled={!selectedScenarioId || scenarioNodes.length < 2}>
                  <SelectValue placeholder="Select a node" />
                </SelectTrigger>
                <SelectContent>
                  {scenarioNodes.length < 2 ? (
                    <SelectItem value="not-available" disabled>Need at least 2 nodes in scenario.</SelectItem>
                  ) : (
                    scenarioNodes.map(node => (
                      <SelectItem key={node.id} value={node.id}>{node.name} ({node.id})</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Intercept Protocols</Label>
              <Select onValueChange={(val) => handleFormChange('intercept_protocols', [val])} value={formParams.intercept_protocols?.[0] || 'all'}>
                <SelectTrigger>
                  <SelectValue placeholder="Select protocols" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="http">HTTP</SelectItem>
                  <SelectItem value="https">HTTPS</SelectItem>
                  <SelectItem value="dns">DNS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
      case 'brute_force':
        return (
          <>
            <div>
              <Label htmlFor="service-port">Service Port</Label>
              <Input
                id="service-port"
                type="number"
                value={formParams.service_port ?? ''}
                onChange={(e) => handleFormChange('service_port', parseInt(e.target.value) || 0)}
                min="1" max="65535"
              />
            </div>
            <div>
              <Label htmlFor="usernames">Usernames (comma-separated)</Label>
              <Input
                id="usernames"
                value={formParams.usernames || ''}
                onChange={(e) => handleFormChange('usernames', e.target.value)}
                placeholder="user1,user2,admin"
              />
            </div>
            <div>
              <Label htmlFor="passwords">Passwords (comma-separated)</Label>
              <Input
                id="passwords"
                value={formParams.passwords || ''}
                onChange={(e) => handleFormChange('passwords', e.target.value)}
                placeholder="pass1,pass2,123456"
              />
            </div>
            <div>
              <Label htmlFor="delay-ms">Delay per Attempt (ms)</Label>
              <Input
                id="delay-ms"
                type="number"
                value={formParams.delay_per_attempt_ms ?? ''}
                onChange={(e) => handleFormChange('delay_per_attempt_ms', parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>
          </>
        );
      case 'malware_delivery':
        return (
          <>
            <div>
              <Label htmlFor="payload">Malware Payload (Base64 Encoded)</Label>
              <Textarea
                id="payload"
                value={formParams.payload || ''}
                onChange={(e) => handleFormChange('payload', e.target.value)}
                placeholder="Base64 encoded malicious code or file"
              />
            </div>
            <div>
              <Label htmlFor="delivery-method">Delivery Method</Label>
              <Select onValueChange={(val) => handleFormChange('delivery_method', val)} value={formParams.delivery_method || 'http_download'}>
                <SelectTrigger id="delivery-method">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="http_download">HTTP Download</SelectItem>
                  <SelectItem value="email_attachment">Email Attachment</SelectItem>
                  <SelectItem value="usb">USB Drop</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
      case 'ddos':
        return (
          <>
            <div>
              <Label htmlFor="num-attackers">Number of Attackers</Label>
              <Input
                id="num-attackers"
                type="number"
                value={formParams.num_attackers ?? ''}
                onChange={(e) => handleFormChange('num_attackers', parseInt(e.target.value) || 0)}
                min="2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ddos-protocol">Protocol</Label>
                <Select onValueChange={(val) => handleFormChange('protocol', val)} value={formParams.protocol || 'udp'}>
                  <SelectTrigger id="ddos-protocol">
                    <SelectValue placeholder="Select protocol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tcp">TCP</SelectItem>
                    <SelectItem value="udp">UDP</SelectItem>
                    <SelectItem value="http">HTTP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ddos-payload-size">Payload Size (Bytes)</Label>
                <Input
                  id="ddos-payload-size"
                  type="number"
                  value={formParams.payload_size_bytes ?? ''}
                  onChange={(e) => handleFormChange('payload_size_bytes', parseInt(e.target.value) || 0)}
                  min="1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="ddos-packet-rate">Packet Rate (per second, per attacker)</Label>
              <Input
                id="ddos-packet-rate"
                type="number"
                value={formParams.packet_rate_per_second ?? ''}
                onChange={(e) => handleFormChange('packet_rate_per_second', parseInt(e.target.value) || 0)}
                min="1"
              />
            </div>
          </>
        );
      default:
        return <p className="text-muted-foreground">Select an attack type to configure its parameters.</p>;
    }
  }, [selectedAttackType, formParams, handleFormChange, scenarioNodes]);

  // --- Handle Launch Attack ---
  const handleLaunchAttack = useCallback(async () => {
    setError('');
    setAttackResult(null);
    setLaunchingAttack(true);

    // Basic validation checks before sending to backend
    if (!selectedScenarioId) {
      setError("Please select a scenario.");
      setLaunchingAttack(false);
      return;
    }
    // Find the actual scenario object by name to get its ID for the backend
    const currentScenario = scenarios.find(s => s._id === selectedScenarioId);
    if (!currentScenario) {
      setError("Selected scenario not found. Please re-select a scenario.");
      setLaunchingAttack(false);
      return;
    }

    if (!formParams.source_node_id) {
      setError("Please select a source node.");
      setLaunchingAttack(false);
      return;
    }
    // Target node is required for most attacks, special handling for MITM
    if (selectedAttackType !== 'mitm' && !formParams.target_node_id) {
      setError("Please select a target node.");
      setLaunchingAttack(false);
      return;
    }
    // Specific validation for MITM secondary target
    if (selectedAttackType === 'mitm' && (!formParams.target_node_id || !formParams.target_node_id_secondary)) {
      setError("For MITM, please select both primary and secondary target nodes.");
      setLaunchingAttack(false);
      return;
    }
    // Add more specific validation for critical parameters of other attack types here
    if (selectedAttackType === 'port_scan') {
      if (isNaN(formParams.port_range_start) || isNaN(formParams.port_range_end) || formParams.port_range_start === '' || formParams.port_range_end === '') {
        setError("Port Scan requires valid start and end ports.");
        setLaunchingAttack(false);
        return;
      }
    }
    // Add validation for other attack types here (e.g., protocol, payload size for DoS etc.)

    try {
      const attackRequest = {
        scenario_id: selectedScenarioId, // <-- now valid ObjectId
        // CHANGED: Using name as ID for the backend
        attack_config: {
          attack_type: selectedAttackType,
          // Filter out potential undefined/null/empty string values, but keep arrays even if empty
          ...Object.fromEntries(
            Object.entries(formParams).filter(([key, value]) => {
              // Keep arrays, even if empty, as backend might expect them
              if (Array.isArray(value)) return true;
              // Filter out null, undefined, and empty strings for other types
              return value !== '' && value !== null && value !== undefined;
            })
          ),
        },
      };

      console.log("Launching attack with payload:", attackRequest);

      const result = await attackService.launchAttack(attackRequest);
      setAttackResult(result);
      console.log(`Attack "${result.attack_id}" initiated successfully! Status: ${result.status}`, result);
      if (result.ids_alert) {
        alert(`⚠️ IDS Alert: ${result.ids_alert.threat_type}\n${result.ids_alert.details}`);
      }
    } catch (err) {
      console.error("Attack launch failed with error object:", err);

      let displayError = 'Failed to launch attack: An unexpected error occurred.';
      if (err.response) {
        if (err.response.data && err.response.data.detail) {
          if (Array.isArray(err.response.data.detail)) {
            displayError = 'Launch failed: ' + err.response.data.detail.map(d => `${d.loc.join('.')} - ${d.msg}`).join('; ');
          } else if (typeof err.response.data.detail === 'string') {
            displayError = `Launch failed: ${err.response.data.detail}`;
          } else {
            displayError = `Launch failed: ${JSON.stringify(err.response.data.detail)}`;
          }
        } else if (err.response.status) {
          displayError = `Launch failed: Server responded with status ${err.response.status} - ${err.response.statusText || 'Error'}`;
        }
      } else if (err.message) {
        displayError = `Launch failed: ${err.message}`;
      }
      if (err.response) {
        if (err.response.data && err.response.data.detail) {
          if (Array.isArray(err.response.data.detail)) {
            displayError = 'Launch failed: ' + err.response.data.detail.map(d => `${d.loc.join('.')} - ${d.msg}`).join('; ');
          } else if (typeof err.response.data.detail === 'string') {
            displayError = `Launch failed: ${err.response.data.detail}`;
          } else {
            displayError = `Launch failed: ${JSON.stringify(err.response.data.detail)}`;
          }
        } else if (err.response.status) {
          displayError = `Launch failed: Server responded with status ${err.response.status} - ${err.response.statusText || 'Error'}`;
        }
      } else if (err.message) {
        displayError = `Launch failed: ${err.message}`;
      }
      setError(displayError);
    } finally {
      setLaunchingAttack(false);
    }
  }, [selectedScenarioId, selectedAttackType, formParams, scenarioNodes, handleFormChange, scenarios]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <header className="p-6 flex justify-between items-center shadow bg-gray-950">
        <h1 className="text-xl font-bold">🧨 Attack Lab</h1>
        <nav className="space-x-6">
          <Link to="/dashboard" className="hover:underline">Dashboard</Link>
          <Link to="/scenario-builder" className="hover:underline">Scenario Builder</Link>
        </nav>
      </header>

      <main className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-zinc-900 text-white border-zinc-700">
          <CardHeader>
            <CardTitle>Configure & Launch Attack</CardTitle>
            <CardDescription>Select scenario and configure attack parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Scenario Selection */}
            <Select onValueChange={setSelectedScenarioId} value={selectedScenarioId}>
              <SelectTrigger
                id="scenario-select"
                className="w-full !bg-white !text-black border border-gray-300 dark:!bg-zinc-900 dark:!text-white dark:border-zinc-700 shadow"
              >
                <SelectValue placeholder="Choose scenario" />
              </SelectTrigger>
              <SelectContent className="!bg-white !text-black dark:!bg-zinc-900 dark:!text-white shadow-lg border border-gray-300 dark:border-zinc-700">
                {scenarios.length === 0 ? (
                  <SelectItem value="no-scenarios" disabled>
                    No scenarios found. Create one first!
                  </SelectItem>
                ) : (
                  scenarios.map(s => (
                    <SelectItem
                      key={s._id}
                      value={s._id}
                      className="!bg-white !text-black dark:!bg-zinc-900 dark:!text-white"
                    >
                      {s.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>


            {/* Source Node Selection */}
            {/* Source Node Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="source-node-select">Source Node (Attacker)</Label>
                <Select
                  id="source-node-select"
                  value={formParams.source_node_id || ''}
                  onValueChange={(v) => handleFormChange('source_node_id', v)}
                  disabled={!selectedScenarioId || scenarioNodes.length === 0}
                >
                  <SelectTrigger className="w-full !bg-white !text-black border border-gray-300 dark:!bg-zinc-900 dark:!text-white dark:border-zinc-700">
                    <SelectValue placeholder="Pick source" />
                  </SelectTrigger>
                  <SelectContent className="!bg-white !text-black dark:!bg-zinc-900 dark:!text-white">
                    {scenarioNodes.length === 0 ? (
                      <SelectItem value="no-nodes" className="!bg-white !text-black dark:!bg-zinc-900 dark:!text-white" disabled>
                        Select a scenario with nodes first!
                      </SelectItem>
                    ) : (
                      scenarioNodes.map(n => (
                        <SelectItem
                          key={n.id}
                          value={n.id}
                          className="!bg-white !text-black dark:!bg-zinc-900 dark:!text-white"
                        >
                          {n.name} ({n.type})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              {/* Target Node Selection */}
              <div>
                <Label htmlFor="target-node-select">Target Node</Label>
                <Select
                  id="target-node-select"
                  value={formParams.target_node_id || ''}
                  onValueChange={(v) => handleFormChange('target_node_id', v)}
                  disabled={!selectedScenarioId || scenarioNodes.length === 0}
                >
                  <SelectTrigger className="w-full !bg-white !text-black border border-gray-300 dark:!bg-zinc-900 dark:!text-white dark:border-zinc-700">
                    <SelectValue placeholder="Pick target" />
                  </SelectTrigger>
                  <SelectContent className="!bg-white !text-black dark:!bg-zinc-900 dark:!text-white">
                    {scenarioNodes.length === 0 ? (
                      <SelectItem value="no-nodes" className="!bg-white !text-black dark:!bg-zinc-900 dark:!text-white" disabled>
                        Select a scenario with nodes first!
                      </SelectItem>
                    ) : (
                      scenarioNodes.map(n => (
                        <SelectItem
                          key={n.id}
                          value={n.id}
                          className="!bg-white !text-black dark:!bg-zinc-900 dark:!text-white"
                        >
                          {n.name} ({n.type})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="attack-type-select">Attack Type</Label>
              <Select value={selectedAttackType} onValueChange={setSelectedAttackType}>
                <SelectTrigger id="attack-type-select" className="!bg-white !text-black dark:!bg-zinc-900 dark:!text-white border border-gray-300 dark:border-zinc-700">
                  <SelectValue placeholder="Choose attack type" />
                </SelectTrigger>
                <SelectContent className="!bg-white !text-black dark:!bg-zinc-900 dark:!text-white">
                  {ATTACK_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value} className="!bg-white !text-black dark:!bg-zinc-900 dark:!text-white">
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>


            {/* Common Attack Parameters (like duration_seconds) */}
            <div>
              <Label htmlFor="duration-seconds">Duration (seconds)</Label>
              <Input
                id="duration-seconds"
                type="number"
                value={formParams.duration_seconds ?? ''}
                onChange={(e) => handleFormChange('duration_seconds', parseInt(e.target.value) || 0)}
                min="1"
                placeholder="e.g., 30"
              />
            </div>

            {/* Dynamic Attack-Specific Parameters */}
            <Card className="p-4 border border-zinc-700">
              <CardTitle className="text-lg mb-4">Attack Parameters ({ATTACK_TYPES.find(t => t.value === selectedAttackType)?.label})</CardTitle>
              <div className="space-y-4">
                {renderAttackParameters()}
              </div>
            </Card>

            {error && <p className="text-red-500 text-sm font-semibold text-center">{error}</p>}

            <Button onClick={handleLaunchAttack} className="w-full" disabled={launchingAttack || !selectedScenarioId || !formParams.source_node_id || (selectedAttackType !== 'mitm' && !formParams.target_node_id)}>
              {launchingAttack ? 'Launching...' : '🚀 Launch Attack'}
            </Button>

            {attackResult && (
              <div className="mt-4 p-4 rounded bg-green-600/10 border border-green-500">
                <p className="font-medium">Attack Launched Successfully!</p>
                <p>ID: {attackResult.attack_id}</p>
                <p>Status: {attackResult.status}</p>
                <p>Message: {attackResult.message}</p>
                <p>Started At: {new Date(attackResult.started_at).toLocaleString()}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attack History / Real-time Status (Placeholder) */}
        <Card className="col-span-1 bg-zinc-900 text-white border-zinc-700">
          <CardHeader>
            <CardTitle>Attack History / Real-time Status</CardTitle>
            <CardDescription>View results and status of past and ongoing attacks.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Attack history will appear here once attacks are launched and tracked.</p>
            {attackHistory.length === 0 ? (
              <p className="text-muted-foreground">No attacks yet.</p>
            ) : (
              <ul className="space-y-3">
                {attackHistory.map((a) => (
                  <li key={a.attack_id} className="border p-2 rounded bg-zinc-800">
                    <div className="font-semibold">{a.attack_type.toUpperCase()} — {a.status}</div>
                    <div className="text-xs text-muted-foreground">Started: {new Date(a.started_at).toLocaleString()}</div>
                    <div className="text-xs">Scenario: {a.scenario_id}</div>
                    <div className="text-xs">Source → Target: {a.source_node_id} → {a.target_node_id}</div>
                  </li>
                ))}
              </ul>
            )}

          </CardContent>
        </Card>
      </main>

      <footer className="p-4 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} CyberSim Network Attack Lab
      </footer>
    </div>
  );
}


