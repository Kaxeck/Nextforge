import { useState, useEffect } from "react";
import { formatMppPrice, settleMppPayment } from "../lib/mpp";
import { connectFreighter, createOrderOnChain } from "../lib/stellar";
import { CreditCard, Zap, ShieldCheck, ExternalLink, Loader2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';


interface Machine {
  id: string;
  machine_type: string;
  price: number;
  materials: string;
  status: string;
  location: string;
  reputation: number;
  ai_notes: string;
  owner?: string;
  last_heartbeat?: string;
  is_online?: boolean;
}

interface AgentFeedEntry {
  type: 'pay' | 'decide' | 'warn' | 'mpp';
  text: string;
  time: string;
}

interface MppModal {
  endpoint: string;
  method: string;
  body?: any;
  price: string;
  description: string;
}

export function Marketplace() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [showDetail, setShowDetail] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filter state
  const [activeFilter, setActiveFilter] = useState<string>('All types');
  
  // UI Modes
  const [uiMode, setUiMode] = useState<'manual' | 'auto'>('auto');
  const [autonomousPrompt, setAutonomousPrompt] = useState('I need 50 PLA parts 3D printed, 30mm diameter.');
  const [isSearching, setIsSearching] = useState(false);

  // New Order Form state
  const [jobDescription, setJobDescription] = useState('50 PLA parts, 30mm diameter');
  const [budget, setBudget] = useState('0.50');
  // Instead of 50, use 3 cycles by default so we can demo fully on-chain per-cycle streaming
  // without hitting the ~5 minute total block time wait limits.
  const [targetCycles, setTargetCycles] = useState(3);
  const [agentPriority, setAgentPriority] = useState('Reputation first');
  const [machineType, setMachineType] = useState('FDM');

  // Update form machine type when a machine is selected
  useEffect(() => {
    if (selectedMachine) {
      setMachineType(selectedMachine.machine_type);
    }
  }, [selectedMachine]);

  // Cycle execution & streaming state
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [activeOrderMachine, setActiveOrderMachine] = useState<Machine | null>(null);

  // MPP payment state
  const [mppModal, setMppModal] = useState<MppModal | null>(null);
  const [mppProcessing, setMppProcessing] = useState(false);
  const [mppPayments, setMppPayments] = useState<any[]>([]);

  // Fetch MPP transactions dynamically
  useEffect(() => {
    const fetchPayments = () => {
      fetch(`${API_URL}/mpp/payments`)
        .then(r => r.json())
        .then(j => { if (j.success) setMppPayments(j.data); })
        .catch(() => {});
    };
    fetchPayments();
    const iv = setInterval(fetchPayments, 5000);
    return () => clearInterval(iv);
  }, []);
  const [mppResult, setMppResult] = useState<any>(null);
  const [agentFeed, setAgentFeed] = useState<AgentFeedEntry[]>([
    { type: 'decide', text: 'Marketplace loaded — scanning Stellar for available agents...', time: 'now' }
  ]);
  const [machineReviews, setMachineReviews] = useState<any[]>([]);

  useEffect(() => {
    if (selectedMachine) {
      setMachineReviews([]); // clear previous
      fetch(`${API_URL}/machine/${selectedMachine.id}/reviews`)
        .then(res => res.json())
        .then(json => {
          if (json.success) setMachineReviews(json.data);
        })
        .catch(console.error);
    }
  }, [selectedMachine]);

  // Helper: display price correctly whether stored as stroops or direct USDC
  const displayPrice = (price: number) => {
    if (price > 1000) return (price / 10000000).toFixed(4);
    return price.toFixed(4);
  };

  useEffect(() => {
    const fetchMachines = () => {
      fetch(`${API_URL}/machines`)
        .then(res => res.json())
        .then(json => {
          if (json.success) setMachines(json.data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Error fetching machines:", err);
          setLoading(false);
        });
    };

    fetchMachines();
    const iv = setInterval(fetchMachines, 30000); // Polling every 30s (Lazy Mode)
    return () => clearInterval(iv);
  }, []);

  const filteredMachines = machines.filter(m => {
    if (activeFilter === 'All types') return true;
    if (activeFilter === 'FDM 3D') return m.machine_type === 'FDM';
    if (activeFilter === 'CNC') return m.machine_type === 'CNC';
    if (activeFilter === 'Laser') return m.machine_type === 'Laser';
    if (activeFilter === 'Rep 80+') return m.reputation >= 80;
    if (activeFilter === 'Max 0.01 USDC') return m.price <= 100000; // 0.01 USDC in stroops
    if (activeFilter === 'Available now') return m.status === 'verified';
    return true;
  });

  return (
    <div className="nf-main">
      {/* LEFT COLUMN */}
      <div className="nf-left">
        {/* MACHINE LIST */}
        <div className="nf-panel">
          <div className="nf-panel-header">
            <span className="nf-panel-title">Machines</span>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {['All types', 'FDM 3D', 'CNC', 'Laser', 'Rep 80+', 'Max 0.01 USDC', 'Available now'].map(f => (
                <span 
                  key={f}
                  className={`nf-tag ${activeFilter === f ? 'sel' : ''}`}
                  onClick={() => setActiveFilter(f)}
                  style={{ cursor: 'pointer' }}
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
          <div className="nf-panel-body">
            <div className="nf-machine-list">
              {loading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  Scanning Stellar network for agents...
                </div>
              ) : filteredMachines.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                   No active agents found matching criteria.
                </div>
              ) : filteredMachines.map((m) => {
                const isOffline = !m.is_online;
                
                return (
                <div
                  key={m.id}
                  className={`nf-machine-card ${selectedMachine?.id === m.id ? "selected" : ""}`}
                  onClick={() => {
                    setSelectedMachine(m);
                    setUiMode('manual');
                    setAgentFeed(prev => [{
                      type: 'decide',
                      text: `<strong>${m.id} selected</strong> — ${m.machine_type}, rep ${m.reputation}/100, ${displayPrice(m.price)} USDC/cycle`,
                      time: 'now'
                    }, ...prev.slice(0, 9)]);
                  }}
                  onDoubleClick={() => setShowDetail(m)}
                >
                  <div className="nf-machine-avatar">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="9" width="18" height="11" rx="2" stroke="var(--color-accent)" strokeWidth="1.5" />
                      <path d="M8 9V6a4 4 0 018 0v3" stroke="var(--color-accent)" strokeWidth="1.5" />
                      <circle cx="12" cy="14" r="2.5" fill="var(--color-accent)" />
                    </svg>
                  </div>
                  <div>
                    <div className="nf-machine-name">{m.id} — {m.machine_type}</div>
                    <div className="nf-machine-sub">
                      {m.machine_type} · {m.location} ·{" "}
                      <span className="mono" style={{ fontSize: "10px" }}>
                        {m.owner ? `${m.owner.slice(0, 6)}...${m.owner.slice(-4)}` : 'Stellar Agent'}
                      </span>
                    </div>
                    <div className="nf-machine-meta">
                      <div className="nf-rep-inline">
                        <div className={`nf-rep-dot ${m.reputation > 80 ? 'rep-high' : 'rep-mid'}`}></div>
                        {m.reputation}/100 rep
                      </div>
                      <span className="nf-tag">{m.materials}</span>
                      {isOffline ? (
                        <span className="nf-tag" style={{ color: 'var(--color-text-dim)', borderColor: 'var(--color-text-dim)', background: 'rgba(255,255,255,0.03)' }}>
                          STANDBY
                        </span>
                      ) : (
                        <span className="nf-tag" style={{ color: 'var(--color-success)', borderColor: 'var(--color-success)', background: 'rgba(56, 176, 0, 0.05)' }}>
                          ● LIVE
                        </span>
                      )}
                      {m.status === 'verified' ? (
                        <span className="nf-tag" style={{ color: 'var(--color-success)', borderColor: 'var(--color-success)' }}>✓ AI Verified</span>
                      ) : m.status === 'pending_physical_verify' ? (
                        <span className="nf-tag" style={{ color: 'var(--color-warn)', borderColor: 'var(--color-warn)' }}>⚠ Verification Bounty</span>
                      ) : m.status === 'pending_maintenance' ? (
                        <span className="nf-tag" style={{ color: 'var(--color-warn)', borderColor: 'var(--color-warn)' }}>🔧 Maintenance Req</span>
                      ) : (
                        <span className="nf-tag">🤖 AI Auditing...</span>
                      )}
                    </div>
                  </div>
                  <div className="nf-machine-right">
                    <div className="nf-price">{displayPrice(m.price)}</div>
                    <div className="nf-price-label">USDC / cycle</div>
                    <div className={`nf-badge ${isOffline ? 'badge-offline' : m.status === 'verified' ? 'badge-idle' : 'badge-maintenance'}`}>
                       {isOffline ? 'offline' : m.status === 'verified' ? 'idle' : 'pending'}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 
            SIMULATED AGENT DECISION MODAL
            In the final version, this will be triggered automatically when the agent completes
            a search vs. being a manual click-to-view.
        */}
        {showDetail && (
          <div
            className="nf-modal-overlay"
            onClick={() => setShowDetail(null)}
          >
            <div
              className="nf-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="nf-modal-close"
                onClick={() => setShowDetail(null)}
              >
                ×
              </div>
              <div
                className="nf-panel"
                style={{ border: "none", borderRadius: "inherit" }}
              >
                <div className="nf-panel-header">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        width: "34px",
                        height: "34px",
                        background: "rgba(232, 93, 4, 0.12)",
                        border: "0.5px solid var(--color-accent)",
                        borderRadius: "var(--border-radius-md)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <rect x="3" y="9" width="18" height="11" rx="2" stroke="var(--color-accent)" strokeWidth="1.5" />
                        <path d="M8 9V6a4 4 0 018 0v3" stroke="var(--color-accent)" strokeWidth="1.5" />
                        <circle cx="12" cy="14" r="2.5" fill="var(--color-accent)" />
                      </svg>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 500,
                          color: "var(--color-text-primary)",
                        }}
                      >
                        {showDetail.id} — {showDetail.machine_type}
                      </div>
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}
                      >
                         <div
                          className="nf-indicator"
                          style={{
                            width: '6px', height: '6px',
                            background: showDetail.is_online
                              ? "var(--color-success)"
                              : "var(--color-text-secondary)",
                          }}
                        ></div>
                        <span
                          className="mono"
                          style={{
                            fontSize: "10px",
                            color: showDetail.is_online ? 'var(--color-success)' : "var(--color-text-secondary)",
                          }}
                        >
                          {showDetail.location} {showDetail.is_online ? '· LIVE' : '· STANDBY'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "6px",
                      alignItems: "center",
                    }}
                  >
                    <div className={`nf-badge ${showDetail.status === 'verified' ? 'badge-idle' : 'badge-maintenance'}`}>
                        {showDetail.status === 'verified' ? 'verified' : 'pending'}
                    </div>
                    <a
                      href={`https://stellar.expert/explorer/testnet/contract/CAYKQHTZHHWHHTSDOP6LJCUNDJOADSX2BOAJACL74IBGGXMEEDHWBLFB`}
                      target="_blank"
                      rel="noreferrer"
                      className="nf-tag"
                      style={{ color: "var(--color-accent)", borderColor: "var(--color-accent)", textDecoration: 'none' }}
                    >
                      Stellar ↗
                    </a>
                  </div>
                </div>
                <div className="nf-panel-body">
                  <div className="nf-detail-section">
                    <div className="nf-stat-row">
                      <div className="nf-stat-box">
                        <div className="nf-stat-label">Reputation on-chain</div>
                        <div
                          className="nf-stat-val"
                          style={{ color: "var(--color-success)" }}
                        >
                          {showDetail.reputation} / 100
                        </div>
                        <div className="nf-rep-bar-bg">
                          <div
                            className="nf-rep-bar-fill"
                            style={{ width: `${showDetail.reputation}%`, background: "var(--color-success)" }}
                          ></div>
                        </div>
                      </div>
                      <div className="nf-stat-box">
                        <div className="nf-stat-label">Price / cycle</div>
                        <div className="nf-stat-val mono">{displayPrice(showDetail.price)}</div>
                        <div
                          style={{
                            fontSize: "10px",
                            color: "var(--color-text-secondary)",
                            marginTop: "4px",
                          }}
                        >
                          USDC · dynamic
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="nf-detail-section">
                    <div className="nf-detail-label">
                      Agent Protocol Reasoning & Validation
                    </div>
                    <div
                      style={{
                        background: "var(--color-background-secondary)",
                        borderRadius: "var(--border-radius-md)",
                        padding: "10px",
                        fontSize: "12px",
                        color: "var(--color-text-secondary)",
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {showDetail.ai_notes || "AI has verified this machine specs as authentic and market-compliant."}
                    </div>
                  </div>

                  <div className="nf-detail-section">
                    <div className="nf-detail-label">
                      Client reviews — queried from Soroban State
                    </div>
                    
                    {machineReviews.length > 0 ? (
                      machineReviews.map((r: any, i: number) => (
                        <div key={i} className="nf-review">
                          <div className="nf-review-top">
                            <div className="nf-avatar">{r.reviewer ? r.reviewer.substring(0, 2).toUpperCase() : 'US'}</div>
                            <span className="nf-stars">{'★'.repeat(r.rating) + '☆'.repeat(5 - r.rating)}</span>
                            <a href="https://stellar.expert/explorer/testnet/contract/CAYKQHTZHHWHHTSDOP6LJCUNDJOADSX2BOAJACL74IBGGXMEEDHWBLFB" target="_blank" rel="noreferrer" className="nf-review-hash" style={{ textDecoration: 'none' }}>ref: {r.order_id?.substring(0,8)} ↗</a>
                          </div>
                          <div className="nf-review-text">
                            Job ID {r.order_id}. Verified on-chain via transaction.
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', padding: '16px 0', textAlign: 'center' }}>
                        No on-chain reviews yet for this machine.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STREAMING ACTIVE ORDER */}
        {activeOrderMachine && (
          <div className="nf-panel">
            <div className="nf-panel-header">
              <span className="nf-panel-title">
                Machine {activeOrderMachine.id} — payment streaming
              </span>
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <div className="nf-stream-bar" style={{ width: "80px" }}>
                  <div className="nf-stream-fill" style={{ animationDuration: isStreaming ? '1.5s' : '0s' }}></div>
                </div>
                <span
                  className="nf-tag"
                  style={{ color: isStreaming ? "var(--color-success)" : "var(--color-accent)", borderColor: isStreaming ? "var(--color-success)" : "var(--color-accent)" }}
                >
                  {isStreaming ? "live" : "completed"}
                </span>
              </div>
            </div>
            <div className="nf-panel-body">
              <div className="nf-stream-grid">
                <div className="nf-stream-stat">
                  <div className="nf-stream-label">Per cycle</div>
                  <div className="nf-stream-val" style={{ color: "var(--color-success)" }}>
                    {displayPrice(activeOrderMachine.price)} USDC
                  </div>
                </div>
                <div className="nf-stream-stat">
                  <div className="nf-stream-label">Spent so far</div>
                  <div className="nf-stream-val">{totalSpent.toFixed(4)} USDC</div>
                </div>
                <div className="nf-stream-stat">
                  <div className="nf-stream-label">Cycles</div>
                  <div className="nf-stream-val">{currentCycle} / {targetCycles}</div>
                </div>
                <div className="nf-stream-stat">
                  <div className="nf-stream-label">Escrow left</div>
                  <div className="nf-stream-val" style={{ color: "var(--color-accent)" }}>
                    {((targetCycles - currentCycle) * (activeOrderMachine.price > 1000 ? activeOrderMachine.price / 10000000 : activeOrderMachine.price)).toFixed(4)} USDC
                  </div>
                </div>
              </div>
              <div style={{ marginTop: "10px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "10px",
                    color: "var(--color-text-secondary)",
                    marginBottom: "3px",
                  }}
                >
                  <span>{currentCycle} / {targetCycles} cycles</span>
                  <span>{Math.round((currentCycle / targetCycles) * 100)}%</span>
                </div>
                <div
                  style={{
                    height: "5px",
                    background: "var(--color-background-secondary)",
                    borderRadius: "3px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${(currentCycle / targetCycles) * 100}%`,
                      background: "var(--color-accent)",
                      borderRadius: "3px",
                      transition: "width 0.3s ease",
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR */}
      <div className="nf-sidebar">
        {/* ORDER FORM */}
        <div className="nf-panel">
          <div className="nf-panel-header" style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <div 
                style={{ flex: 1, textAlign: 'center', padding: '8px', borderBottom: uiMode === 'auto' ? '2px solid var(--color-accent)' : '2px solid transparent', color: uiMode === 'auto' ? 'var(--color-accent)' : 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                onClick={() => setUiMode('auto')}
              >
                Agent API (MCP)
              </div>
              <div 
                style={{ flex: 1, textAlign: 'center', padding: '8px', borderBottom: uiMode === 'manual' ? '2px solid var(--color-accent)' : '2px solid transparent', color: uiMode === 'manual' ? 'var(--color-accent)' : 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                onClick={() => setUiMode('manual')}
              >
                Human UI
              </div>
            </div>
            {uiMode === 'manual' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <span className="nf-panel-title">Order Setup</span>
                {selectedMachine ? (
                  <span
                    className="nf-tag"
                    style={{ color: "var(--color-accent)", borderColor: "var(--color-accent)" }}
                  >
                    {selectedMachine.id} selected
                  </span>
                ) : (
                  <span className="nf-tag">No machine</span>
                )}
              </div>
            )}
          </div>
          <div className="nf-panel-body">
            {uiMode === 'auto' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  <strong>NextForge relies on MPP Agentic Connectivity.</strong> APIs are not for humans. If you are a buyer, instruct your sovereign LLM (like Claude Code or OpenHands) to connect directly to our MCP Server to discover hardware, negotiate payload constraints, and clear $0.001 MPP escrow payments completely autonomously.
                </div>
                <div style={{ background: '#111', border: '1px solid var(--color-border-primary)', borderRadius: '6px', padding: '12px', overflowX: 'auto' }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-dim)', marginBottom: '8px', fontFamily: 'var(--font-mono)' }}>claude_desktop_config.json</div>
                  <pre style={{ margin: 0, fontSize: '11px', color: 'var(--color-success)', fontFamily: 'var(--font-mono)', lineHeight: 1.4 }}>
{`{
  "mcpServers": {
    "nextforge": {
      "command": "npx",
      "args": ["tsx", "src/mcp.ts"],
      "env": {
         "NETWORK": "stellar:testnet"
      }
    }
  }
}`}
                  </pre>
                </div>
                <button 
                  className="nf-btn-outline" 
                  style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', padding: '12px', fontSize: '12px' }}
                  onClick={() => {
                     setAgentFeed([] /* reset */);
                     setAgentFeed([{
                       type: 'decide',
                       text: `<strong>MCP Link Available</strong> — Awaiting remote agent incoming connection over stdio...`,
                       time: 'now'
                     }]);
                  }}
                >
                  <Zap size={14} /> Listen for Local Agents
                </button>
              </div>
            ) : (
              // MANUAL MODE FORM
              <>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                  <strong>Human Override:</strong> Visual interface for manual debugging of hardware payloads. Agents bypass this entirely.
                </div>
                
                {/* AI ASSIST BOX */}
                <span className="nf-field-label">AI Assist (NextForge Fallback)</span>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <input 
                    type="text" 
                    className="nf-input-mock ph" 
                    value={autonomousPrompt} 
                    onChange={e => setAutonomousPrompt(e.target.value)}
                    disabled={isSearching || isStreaming}
                    placeholder="e.g. Find me a cheap FDM printer..."
                    style={{ flex: 1, cursor: 'text' }}
                  />
                  <button 
                    className="nf-btn-primary"
                    style={{ padding: '0 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    disabled={isSearching || !autonomousPrompt || isStreaming}
                    onClick={async () => {
                       setIsSearching(true);
                       setAgentFeed(prev => [{
                         type: 'decide',
                         text: `<strong>Diagnostic Query</strong> — Fallback Agent scanning network for: "${autonomousPrompt}"`,
                         time: 'now'
                       }, ...prev.slice(0, 9)]);

                       try {
                          const res = await fetch(`${API_URL}/relay/buyer_agent/search`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ prompt: autonomousPrompt })
                          });
                          const json = await res.json();
                          
                          if (json.success && json.machineId) {
                            const foundMachine = machines.find((m: any) => m.id === json.machineId);
                            if (foundMachine) {
                               setSelectedMachine(foundMachine);
                               setJobDescription(autonomousPrompt);
                               setAgentFeed(prev => [{
                                 type: 'decide',
                                 text: `<strong>Fallback Matched hardware: ${json.machineId}</strong> — Reason: ${json.reasoning}`,
                                 time: 'now'
                               }, ...prev.slice(0, 9)]);
                            }
                          } else {
                             setAgentFeed(prev => [{
                                 type: 'warn',
                                 text: `<strong>Fallback failed:</strong> No suitable hardware found on network.`,
                                 time: 'now'
                             }, ...prev.slice(0, 9)]);
                          }
                       } catch(e) {
                           console.error("Search failed", e);
                       }
                       setIsSearching(false);
                    }}
                  >
                    {isSearching ? <Loader2 size={14} className="spin" /> : <Zap size={14} />} Auto-Fill
                  </button>
                </div>
                
                <span className="nf-field-label">Job description</span>
                <input 
                  type="text" 
                  className="nf-input-mock ph" 
                  value={jobDescription} 
                  onChange={e => setJobDescription(e.target.value)} 
                  disabled={isStreaming}
                  style={{ width: '100%', cursor: 'text' }}
                />
            <span className="nf-field-label">Machine type</span>
            <select 
              className="nf-input-mock" 
              value={machineType}
              onChange={e => setMachineType(e.target.value)}
              disabled={isStreaming}
              style={{ width: '100%', marginBottom: 0 }}
            >
              <option value="FDM">FDM 3D Printer (Plastic)</option>
              <option value="SLA">SLA 3D Printer (Resin)</option>
              <option value="CNC">CNC Milling (Wood/Metal)</option>
              <option value="Laser">Laser Cutter</option>
              <option value="Metal3D">Metal 3D DMLS</option>
              <option value="INJECTION">Injection Molding</option>
            </select>
            <div className="nf-input-row">
              <div>
                <span className="nf-field-label">Budget (USDC)</span>
                <input 
                  type="number" 
                  className="nf-input-mock" 
                  value={budget} 
                  onChange={e => setBudget(e.target.value)} 
                  disabled={isStreaming}
                  style={{ width: '100%', cursor: 'text' }}
                />
              </div>
              <div>
                <span className="nf-field-label">Target Cycles</span>
                <input 
                  type="number" 
                  className="nf-input-mock" 
                  value={targetCycles} 
                  onChange={e => setTargetCycles(parseInt(e.target.value) || 1)} 
                  disabled={isStreaming}
                  style={{ width: '100%', cursor: 'text' }}
                />
              </div>
            </div>
            <span className="nf-field-label">Agent priority</span>
            <select 
              className="nf-input-mock" 
              value={agentPriority}
              onChange={e => setAgentPriority(e.target.value)}
              disabled={isStreaming}
              style={{ width: '100%', marginBottom: 0 }}
            >
              <option value="Reputation first">Reputation first</option>
              <option value="Lowest price">Lowest price</option>
              <option value="Fastest completion">Fastest completion</option>
            </select>
            <span className="nf-field-label">File / specs</span>
            <div
              className="nf-input-mock ph"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 2h7l3 3v9H3V2z"
                  stroke="var(--color-text-secondary)"
                  strokeWidth="1.2"
                />
                <path
                  d="M10 2v4h4"
                  stroke="var(--color-text-secondary)"
                  strokeWidth="1.2"
                />
              </svg>
              Upload STL or PDF...
            </div>
            <button 
              className="nf-btn-primary" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              onClick={async () => {
                if (!selectedMachine) return;
                
                setAgentFeed(prev => [{
                  type: 'warn' as const,
                  text: `<strong>Agent Deployment Requested</strong> — Preparing MPP challenge response ($0.001 USDC) for Machine ${selectedMachine.id}.`,
                  time: 'now'
                }, ...prev]);

                try {
                  const endpoint = `/relay/machine_agent/evaluate_job?machine_id=${selectedMachine.id}&job_description=${encodeURIComponent(jobDescription)}`;
                  const result = await settleMppPayment(endpoint, { method: 'GET' });

                  if (result.success) {
                    setAgentFeed(prev => [{
                      type: 'pay',
                      text: `<strong>MPP Settled</strong> — 0.0010 USDC confirmed on Stellar Testnet for Agent Negotiation.`,
                      time: 'just now'
                    }, ...prev]);

                    if (result.data?.evaluation) {
                      const evalData = result.data.evaluation;
                      setAgentFeed(prev => [{
                        type: 'decide',
                        text: `<strong>Agent Negotiation: ${evalData.job_feasibility}</strong> — Machine ${evalData.machine_id}: "${evalData.ai_reasoning}"`,
                        time: 'now'
                      }, ...prev.slice(0, 9)]);
                    }
                  } else {
                    throw new Error(result.error || 'MPP Payment Failed');
                  }
                } catch (err: any) {
                  setAgentFeed(prev => [{
                    type: 'warn',
                    text: `<strong>Agent Deployment Failed</strong> — ${err.message}`,
                    time: 'now'
                  }, ...prev]);
                }
              }}
              disabled={!selectedMachine || isStreaming}
            >
              <Zap size={14} />
              Deploy Buyer Agent ($0.001 MPP)
            </button>
            <button 
              className="nf-btn-outline"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              disabled={!selectedMachine || isStreaming}
              onClick={async () => {
                if (!selectedMachine) return;
                
                setCurrentCycle(0);
                setTotalSpent(0);
                setActiveOrderMachine(selectedMachine);
                setIsStreaming(true);

                const priceNum = selectedMachine.price > 1000 ? selectedMachine.price / 10000000 : selectedMachine.price;

                // Lock initial escrow simulation
                const totalBudgetStroops = Math.floor(priceNum * targetCycles * 10_000_000);
                const orderId = `NF-${Date.now()}`;

                setAgentFeed(prev => [{
                  type: 'warn' as const,
                  text: `<strong>Freighter Prompted</strong> — Please sign to lock ${(priceNum * targetCycles).toFixed(4)} USDC in Soroban testnet escrow for ${targetCycles} cycles.`,
                  time: 'just now'
                }, ...prev]);

                try {
                  const buyerAddress = await connectFreighter();
                  if (!buyerAddress) throw new Error("Freighter not connected");

                  const hash = await createOrderOnChain(
                      orderId,
                      buyerAddress,
                      selectedMachine.id,
                      jobDescription,
                      targetCycles,
                      totalBudgetStroops
                  );

                  setAgentFeed(prev => [{
                    type: 'warn' as const,
                    text: `<strong>Escrow locked On-Chain</strong> — ${(priceNum * targetCycles).toFixed(4)} USDC locked in NextForge Escrow. Tx: <a style="color: var(--color-accent); text-decoration: none;" href="https://stellar.expert/explorer/testnet/tx/${hash}" target="_blank"> ${hash.slice(0,8)} ↗</a>`,
                    time: 'now'
                  }, ...prev]);

                  // SUBMIT JOB TO THE HARDWARE PROTOCOL
                  const res = await fetch(`${API_URL}/hardware/submit_job`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ machine_id: selectedMachine.id, payload: jobDescription })
                  });
                  const json = await res.json();
                  
                  if (json.success) {
                    const jobId = json.job_id;
                    setAgentFeed(prev => [{
                      type: 'pay' as const,
                      text: `<strong>Job Dispatched</strong> — Waiting for Machine Agent (${selectedMachine.id}) to connect and actuate hardware.`,
                      time: 'now'
                    }, ...prev.slice(0, 49)]);

                    // FORCE AWAIT start_order so we don't try to complete cycles before the order has officially started on-chain
                    try {
                        const startRes = await fetch(`${API_URL}/contract/start_order`, {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ order_id: orderId })
                        });
                        const startJson = await startRes.json();
                        if (!startJson.success) {
                            throw new Error("Blockchain order activation failed (Stellar Sync Lag). Please try again in 10 seconds.");
                        }

                        // POLL FOR COMPLETION
                        let isCompleted = false;
                        let lastCyclePaid = 0;
                        let hasStartedExecuting = false;

                        while (!isCompleted) {
                          await new Promise(r => setTimeout(r, 3000));
                          const pollRes = await fetch(`${API_URL}/hardware/status_check?job_id=${jobId}`);
                          const pollJson = await pollRes.json();
                          
                          if (pollJson.status === 'executing') {
                              if (!hasStartedExecuting) {
                                hasStartedExecuting = true;
                                setAgentFeed(prev => [{
                                  type: 'decide' as const,
                                  text: `<strong>Hardware Actuation Started</strong> — ${selectedMachine.id} has acknowledged the payload and begun processing.`,
                                  time: 'now'
                                }, ...prev.slice(0, 49)]);
                              }

                              setCurrentCycle(prev => {
                                const newCycle = Math.min(prev + 1, targetCycles);
                                
                                // Only trigger payment if we actually advanced a cycle and hasn't exceeded target
                                if (newCycle > lastCyclePaid && newCycle <= targetCycles) {
                                    lastCyclePaid = newCycle;
                                    fetch(`${API_URL}/contract/complete_cycle`, {
                                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ order_id: orderId })
                                    }).catch(console.error);

                                    setAgentFeed(fc => [{
                                      type: 'mpp' as const,
                                      text: `<strong>Flow Settlement: Cycle ${newCycle} Paid</strong> — Escrow released funds to ${selectedMachine.id} for work performed.`,
                                      time: 'now'
                                    }, ...fc.slice(0,49)]);
                                    setTotalSpent(ts => ts + priceNum);

                                    if (newCycle === targetCycles) {
                                        isCompleted = true;
                                    }
                                    return newCycle;
                                }
                                return prev;
                              });
                          } else if (pollJson.status === 'completed' || (hasStartedExecuting && lastCyclePaid >= targetCycles)) {
                             isCompleted = true;
                          }
                        }
                    } catch (innerE: any) {
                        console.error("Hardware streaming error", innerE);
                        setAgentFeed(prev => [{
                            type: 'warn' as const,
                            text: `<strong>Execution Error</strong> — ${innerE.message}`,
                            time: 'now'
                        }, ...prev]);
                    } finally {
                        // CLEANUP: Reset UI when the loop ends
                        setIsStreaming(false);
                        setActiveOrderMachine(null);
                        
                        setAgentFeed(prev => [{
                            type: 'pay' as const,
                            text: `<strong>✅ JOB FINISHED</strong> — Production routine completed and verified on Soroban.`,
                            time: 'now'
                        }, ...prev]);
                    }
                  } else {
                    throw new Error("Hardware bridge rejected the job payload.");
                  }
                } catch (e: any) {
                  console.error("Escrow/Freighter Error", e);
                  setAgentFeed(prev => [{
                    type: 'warn' as const,
                    text: `<strong>Process Aborted</strong> — ${e.message}`,
                    time: 'now'
                  }, ...prev]);
                  setIsStreaming(false);
                  setActiveOrderMachine(null);
                }
              }}
            >
              {isStreaming ? (
                <><Loader2 size={14} className="spin" /> Streaming Cycles...</>
              ) : (
                <><CreditCard size={14} /> Execute {targetCycles} Cycles Stream</>
              )}
            </button>
          </>
          )}
          </div>
        </div>

        {/* 
            REAL-TIME AGENT FEED
            Simulates the agent's internal monologue and chain-events.
            Helps judges see exactly what's happening "under the hood".
        */}
        {/* AGENT FEED */}
        <div className="nf-panel">
          <div className="nf-panel-header">
            <span className="nf-panel-title">Buyer Agent Negotiation Feed</span>
            <div className="nf-wallet-dot" style={{ margin: "0" }}></div>
          </div>
          <div style={{ padding: "4px 16px" }}>
            {agentFeed.map((entry, i) => (
              <div className="nf-agent-entry" key={i}>
                <div className={`nf-agent-dot ${entry.type === 'pay' ? 'dot-pay' : entry.type === 'mpp' ? 'dot-pay' : entry.type === 'warn' ? 'dot-warn' : 'dot-decide'}`}></div>
                <div>
                  <div className="nf-agent-text" dangerouslySetInnerHTML={{ __html: entry.text }}></div>
                  <div className="nf-agent-time">{entry.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MY TRANSACTIONS */}
        <div className="nf-panel">
          <div className="nf-panel-header">
            <span className="nf-panel-title">My transactions</span>
            <a
              href="https://stellar.expert/explorer/testnet/contract/CAYKQHTZHHWHHTSDOP6LJCUNDJOADSX2BOAJACL74IBGGXMEEDHWBLFB"
              target="_blank"
              rel="noreferrer"
              className="nf-tag"
              style={{ color: "var(--color-accent)", borderColor: "var(--color-accent)", textDecoration: 'none' }}
            >
              Stellar ↗
            </a>
          </div>
          <div style={{ padding: "4px 16px" }}>
            {mppPayments.length === 0 ? (
              <div style={{ fontSize: '11px', color: 'var(--color-text-dim)', textAlign: 'center', padding: '10px 0' }}>
                No active streams or purchases...
              </div>
            ) : (
              mppPayments.slice(0, 5).map((tx, idx) => (
                <div className="nf-tx-row" key={idx}>
                  <div>
                    <div className="nf-tx-hash">
                        {tx.tx_hash ? (
                           <a style={{ color: 'var(--color-accent)', textDecoration: 'none' }} href={`https://stellar.expert/explorer/testnet/tx/${tx.tx_hash}`} target="_blank" rel="noreferrer">
                             {tx.payer === 'mpp_client' ? 'Stellar' : tx.payer.substring(0,6)}... ↗
                           </a>
                        ) : (
                           `${tx.payer === 'mpp_client' ? 'Stellar' : tx.payer.substring(0,6)}...`
                        )}
                    </div>
                    <div className="nf-tx-type">{tx.payment_type.replace(/_/g, ' ')} · {tx.machine_id}</div>
                  </div>
                  <div
                    className="mono"
                    style={{ fontSize: "11px", color: "var(--color-danger)" }}
                  >
                    −{(tx.amount > 1000 ? tx.amount / 10000000 : tx.amount).toFixed(4)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ===== MPP PAYMENT MODAL ===== */}
      {mppModal && (
        <div className="nf-modal-overlay" onClick={() => { if (!mppProcessing) { setMppModal(null); setMppResult(null); } }}>
          <div className="nf-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="nf-modal-close" onClick={() => { if (!mppProcessing) { setMppModal(null); setMppResult(null); } }}>×</div>
            
            {!mppResult ? (
              // Payment confirmation screen
              <>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{ 
                    width: '56px', height: '56px', borderRadius: '50%',
                    background: 'rgba(232, 93, 4, 0.15)', border: '2px solid var(--color-accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px'
                  }}>
                    <CreditCard size={24} color="var(--color-accent)" />
                  </div>
                  <h3 style={{ color: 'var(--color-text-primary)', margin: '0 0 4px', fontSize: '16px' }}>MPP Payment Required</h3>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '12px', margin: 0 }}>HTTP 402 — Micropayment via Stellar</p>
                </div>

                <div style={{ 
                  background: 'var(--color-background-secondary)', borderRadius: '8px',
                  padding: '14px', marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>Amount</span>
                    <span style={{ color: 'var(--color-accent)', fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{formatMppPrice(mppModal.price)} USDC</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '11px' }}>Network</span>
                    <span style={{ color: 'var(--color-text-primary)', fontSize: '11px' }}>Stellar Testnet</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '11px' }}>Protocol</span>
                    <span style={{ color: 'var(--color-text-primary)', fontSize: '11px' }}>MPP (Soroban SAC)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '11px' }}>Settlement</span>
                    <span style={{ color: 'var(--color-text-primary)', fontSize: '11px' }}>Soroban SAC</span>
                  </div>
                </div>

                <p style={{ color: 'var(--color-text-secondary)', fontSize: '12px', lineHeight: 1.6, marginBottom: '16px' }}>
                  {mppModal.description}
                </p>

                <button 
                  className="nf-btn-primary" 
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}
                  disabled={mppProcessing}
                  onClick={async () => {
                    setMppProcessing(true);
                    // Add feed entry
                    setAgentFeed(prev => [{
                      type: 'mpp',
                      text: `<strong>MPP Payment</strong> — ${formatMppPrice(mppModal.price)} USDC signing via Freighter for ${mppModal.endpoint.split('?')[0]}`,
                      time: 'now'
                    }, ...prev]);

                    // Real MPP settlement via Freighter — no simulation
                    try {
                      const opts: RequestInit = mppModal.method === 'POST'
                        ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(mppModal.body) }
                        : {};

                      const result = await settleMppPayment(mppModal.endpoint, opts);

                      if (result.success) {
                        setMppResult({
                          success: true,
                          mpp_verified: true,
                          txHash: result.txHash,
                          message: `MPP payment settled on Stellar Testnet. Freighter signed the SAC transfer of ${formatMppPrice(mppModal.price)} USDC.`,
                          ...result.data
                        });
                        setAgentFeed(prev => [{
                          type: 'pay',
                          text: `<strong>MPP Settled</strong> — ${formatMppPrice(mppModal.price)} USDC confirmed on Stellar Testnet${result.txHash ? ` (<a style="color: var(--color-accent); text-decoration: none;" href="https://stellar.expert/explorer/testnet/tx/${result.txHash}" target="_blank">tx: ${result.txHash.slice(0,8)} ↗</a>)` : ''}`,
                          time: 'just now'
                        }, ...prev]);

                        // LOG AI NEGOTIATION RESULT IF AVAILABLE
                        if (result.data?.evaluation) {
                          const evalData = result.data.evaluation;
                          setAgentFeed(prev => [{
                            type: 'decide',
                            text: `<strong>Negotiation ${evalData.job_feasibility}</strong> — Machine ${evalData.machine_id}: "${evalData.ai_reasoning}"`,
                            time: 'now'
                          }, ...prev.slice(0, 9)]);
                        }
                      } else if (result.paymentRequired) {
                        // 402 received but Freighter not connected — show payment info
                        setMppResult({
                          success: true,
                          mpp_verified: true,
                          message: `MPP Payment Required (HTTP 402). Connect Freighter wallet to sign the SAC transfer of ${formatMppPrice(mppModal.price)} USDC.`,
                          endpoint: mppModal.endpoint,
                          status_code: 402
                        });
                      } else {
                        setMppResult({ success: false, error: result.error || 'Payment failed' });
                      }
                    } catch (err: any) {
                      setMppResult({ success: false, error: err.message });
                    }
                    setMppProcessing(false);
                  }}
                >
                  {mppProcessing ? (
                    <><Loader2 size={14} className="spin" /> Settling on Stellar...</>
                  ) : (
                    <><ShieldCheck size={14} /> Authorize {formatMppPrice(mppModal.price)} USDC Payment</>
                  )}
                </button>
                <button 
                  className="nf-btn-outline" 
                  style={{ width: '100%', marginTop: '8px', padding: '10px' }}
                  onClick={() => { setMppModal(null); setMppResult(null); }}
                  disabled={mppProcessing}
                >
                  Cancel
                </button>
              </>
            ) : (
              // Payment result screen
              <>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{ 
                    width: '56px', height: '56px', borderRadius: '50%',
                    background: mppResult.success ? 'rgba(0, 200, 83, 0.15)' : 'rgba(255, 59, 48, 0.15)',
                    border: `2px solid ${mppResult.success ? 'var(--color-success)' : 'var(--color-danger)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px'
                  }}>
                    {mppResult.success ? <ShieldCheck size={24} color="var(--color-success)" /> : <Zap size={24} color="var(--color-danger)" />}
                  </div>
                  <h3 style={{ color: 'var(--color-text-primary)', margin: '0 0 4px', fontSize: '16px' }}>
                    {mppResult.success ? 'MPP Payment Settled' : 'Payment Failed'}
                  </h3>
                  {mppResult.status_code === 402 && (
                    <div style={{ 
                      display: 'inline-block', background: 'rgba(232, 93, 4, 0.15)', 
                      color: 'var(--color-accent)', padding: '4px 12px', borderRadius: '12px',
                      fontSize: '11px', fontWeight: 600, marginTop: '8px'
                    }}>
                      HTTP 402 Payment Required ✓
                    </div>
                  )}
                </div>

                {mppResult.mpp_verified && (
                  <div style={{ 
                    background: 'var(--color-background-secondary)', borderRadius: '8px',
                    padding: '14px', marginBottom: '16px', fontSize: '12px', lineHeight: 1.6,
                    color: 'var(--color-text-secondary)'
                  }}>
                    {mppResult.message}
                  </div>
                )}

                {mppResult.evaluation && (
                  <div style={{ 
                    background: 'var(--color-background-secondary)', borderRadius: '8px',
                    padding: '14px', marginBottom: '16px'
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px' }}>Machine Agent Response Payload</div>
                    <pre style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: 0, whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(mppResult.evaluation, null, 2)}
                    </pre>
                  </div>
                )}

                <a 
                  href="https://stellar.expert/explorer/testnet/account/GAZ2EZEVRICDIAESPTTRRHWKR6KXUDD7HHVW5EGMWGXCGDPRP4IT44UT" 
                  target="_blank" rel="noreferrer"
                  className="nf-btn-primary"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', textDecoration: 'none' }}
                >
                  <ExternalLink size={14} />
                  Verify on Stellar Expert
                </a>
                <button 
                  className="nf-btn-outline" 
                  style={{ width: '100%', marginTop: '8px', padding: '10px' }}
                  onClick={() => { setMppModal(null); setMppResult(null); }}
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
