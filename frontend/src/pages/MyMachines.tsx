import { useState, useEffect } from "react";
import { registerMachineOnChain, connectFreighter } from "../lib/stellar";
import { ShieldCheck, Cpu, Wallet, CheckCircle2, TrendingUp, Award, Settings2, Activity, Info, ExternalLink, Pencil, CreditCard, Loader2 } from "lucide-react";

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
}

export function MyMachines() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Custom Alert Modal
  const [customAlert, setCustomAlert] = useState<{title: string, message: string, type?: 'success' | 'danger' | 'info'} | null>(null);

  // Registration Success Modal
  const [showSuccessModal, setShowSuccessModal] = useState<{hash: string, id: string} | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    id: `M-${Math.floor(Math.random() * 10000)}`,
    type: "FDM",
    price: "50000",
    location: "GDL, MX",
    materials: "PLA, PETG",
    autoRepair: true
  });
  const [submitting, setSubmitting] = useState(false);

  // Edit Pricing Modals
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [editPriceVal, setEditPriceVal] = useState("");
  const [editingSubmit, setEditingSubmit] = useState(false);
  // x402 payment tracking
  const [x402Payments, setX402Payments] = useState<any[]>([]);

  const fetchMyMachines = (address: string) => {
    setLoading(true);
    fetch(`${API_URL}/machines?owner=${address}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) setMachines(json.data);
        setLoading(false);
      })
      .catch(console.error);
  };

  useEffect(() => {
    if (walletAddress) {
      fetchMyMachines(walletAddress);
      const interval = setInterval(() => fetchMyMachines(walletAddress), 5000);
      return () => clearInterval(interval);
    }
  }, [walletAddress]);

  // Helper: display price correctly whether stored as stroops or direct USDC
  const displayPrice = (price: number) => {
    if (price > 1000) return (price / 10000000).toFixed(4);
    return price.toFixed(4);
  };

  // Fetch x402 payment history
  useEffect(() => {
    fetch(`${API_URL}/x402/payments`)
      .then(r => r.json())
      .then(j => { if (j.success) setX402Payments(j.data); })
      .catch(() => {});
    const iv = setInterval(() => {
      fetch(`${API_URL}/x402/payments`)
        .then(r => r.json())
        .then(j => { if (j.success) setX402Payments(j.data); })
        .catch(() => {});
    }, 10000);
    return () => clearInterval(iv);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // 1. Force wallet interaction
      let currentWallet = walletAddress;
      if (!currentWallet) {
        currentWallet = await connectFreighter();
        if (!currentWallet) {
          setCustomAlert({ title: "Wallet Missing", message: "Please connect your Freighter wallet to register a machine.", type: 'danger' });
          setSubmitting(false);
          return;
        }
        setWalletAddress(currentWallet);
      }

      // 2. REAL ON-CHAIN TRANSACTION
      // This will open Freighter, build the XDR, and submit to Testnet.
      const machineIdStr = formData.id || `M-${Math.floor(Math.random() * 1000)}`;
      const priceStroops = Number(formData.price);
      
      const txHash = await registerMachineOnChain(
        machineIdStr,
        currentWallet, // owner
        formData.type,
        priceStroops,
        formData.location,
        formData.materials,
        formData.autoRepair
      );

      if (!txHash) {
        throw new Error("Transaction rejected or failed on the blockchain");
      }

      // 3. Deploy Machine Agent / Webhook to confirm the chain event (Because we aren't running an indexer locally)
      // The onboard agent uses Gemini to check if it's suspicious and verify it.
      const res = await fetch(`${API_URL}/webhook/machine_registered`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          machine_id: machineIdStr,
          owner: currentWallet,
          machine_type: formData.type,
          price: priceStroops,
          location: formData.location,
          materials: formData.materials
        })
      });
      
      if (res.ok) {
        setShowSuccessModal({ hash: txHash, id: machineIdStr });
        setFormData({ ...formData, id: `M-${Math.floor(Math.random() * 10000)}` }); // Reset ID for next
      }
    } catch (err: any) {
      console.error(err);
      setCustomAlert({
        title: "Transaction Failed",
        message: `${err.message || err}\n\nTroubleshooting:\n1. Is your machine ID unique?\n2. Does your wallet have XLM from Friendbot?\n3. Ensure Freighter is set to Testnet.`,
        type: 'danger'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const networkJobs = machines.reduce((acc, m) => acc + (m.reputation >= 50 ? (m.reputation - 50) * 4 : 0), 0);
  const usdcVolume = machines.reduce((acc, m) => {
    const p = m.price > 1000 ? m.price / 10000000 : m.price;
    return acc + (p * (m.reputation >= 50 ? (m.reputation - 50) * 4 : 0));
  }, 0).toFixed(4);
  const machinesNeedingRepair = machines.filter(m => m.reputation > 0 && m.reputation < 50);
  const averageReputation = machines.length > 0 ? (machines.reduce((acc, m) => acc + m.reputation, 0) / machines.length).toFixed(0) : "0";

  return (
    <div id="view-mymachines">

      {!walletAddress ? (
        <div style={{ padding: '60px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div className="nf-panel" style={{ textAlign: 'center', padding: '50px 40px', maxWidth: '480px', width: '100%', background: 'linear-gradient(180deg, rgba(30, 30, 40, 0.4) 0%, rgba(20, 20, 25, 0.6) 100%)', backdropFilter: 'blur(10px)', border: '1px solid rgba(139, 92, 246, 0.2)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', borderRadius: '24px' }}>
            
            <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 24px auto', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={40} color="var(--color-purple)" strokeWidth={1.5} />
              <div style={{ position: 'absolute', bottom: '0', right: '0', background: 'var(--color-bg-primary)', padding: '4px', borderRadius: '50%' }}>
                <Wallet size={20} color="var(--color-accent)" strokeWidth={2} />
              </div>
            </div>

            <h2 style={{ color: 'var(--color-text-primary)', fontSize: '24px', letterSpacing: '-0.5px', marginBottom: '12px' }}>Web3 Verification Required</h2>
            
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', lineHeight: '1.6', marginBottom: '32px' }}>
              To view or register machines as a network vendor, you must cryptographically prove your identity. This secures the protocol's ledger and prevents impersonation.
            </p>
            
            <button 
              className="nf-btn-primary" 
              style={{ width: '100%', padding: '16px', fontSize: '15px', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', borderRadius: '12px', background: 'linear-gradient(90deg, var(--color-purple), var(--color-accent))', border: 'none', boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)' }}
              onClick={async () => {
                const addr = await connectFreighter();
                if (addr) setWalletAddress(addr);
              }}
            >
              <Wallet size={18} />
              Connect Freighter Wallet
            </button>
            
            <div style={{ fontSize: '12px', color: 'var(--color-text-dim)', marginTop: '20px' }}>
              Requires Freighter extension installed on Testnet.
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* VENDOR DASHBOARD HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '28px', color: 'var(--color-text-primary)', marginBottom: '8px', letterSpacing: '-0.5px' }}>
                Vendor Command Center
              </h1>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>
                Manage your connected autonomous agents and monitor on-chain throughput.
              </p>
            </div>
            <div style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(76, 29, 149, 0.2))', padding: '12px 20px', borderRadius: '16px', border: '1px solid rgba(139, 92, 246, 0.3)', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: 'var(--color-purple)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award strokeWidth={2} size={20} color="white" />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Global Vendor Rank</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-purple)' }}>{averageReputation}</span>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>/ 100</span>
                </div>
              </div>
            </div>
          </div>

          {/* SELLER METRICS */}
          <div className="nf-metrics nf-metrics-4" style={{ marginBottom: '32px' }}>
            <div className="nf-metric" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-secondary)' }}>
              <div className="nf-metric-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Cpu size={16} color="var(--color-accent)"/> Configured Agents</div>
              <div className="nf-metric-value">{machines.length}</div>
              <div className="nf-metric-sub">{machines.filter(m => m.reputation > 50).length} active · {machines.filter(m => m.reputation === 50).length} probational</div>
            </div>
            <div className="nf-metric" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-secondary)' }}>
              <div className="nf-metric-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><TrendingUp size={16} color="var(--color-success)"/> USDC Volume</div>
              <div className="nf-metric-value mono">{usdcVolume}</div>
              <div className="nf-metric-sub">{networkJobs > 0 ? 'Since registration' : 'Awaiting jobs'}</div>
            </div>
            <div className="nf-metric" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-secondary)' }}>
              <div className="nf-metric-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={16} color="var(--color-purple)"/> Network Jobs</div>
              <div className="nf-metric-value mono">{networkJobs}</div>
              <div className="nf-metric-sub">{networkJobs > 0 ? 'Fully completed' : 'Awaiting jobs'}</div>
            </div>
            <div className="nf-metric" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-secondary)' }}>
              <div className="nf-metric-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Settings2 size={16} color="var(--color-warn)"/> Auto-Repairs</div>
              <div className="nf-metric-value">{machinesNeedingRepair.length}</div>
              <div className="nf-metric-sub warn">{machinesNeedingRepair.length > 0 ? 'Triggered recently' : 'All systems normal'}</div>
            </div>
          </div>

      {/* 
          TODO (DEVELOPER NOTE): 
          This alert simulates a real-time event triggered by a Soroban contract
          when machine reputation drops below a certain threshold. In the full 
          implementation, this would be a listener to the contract's event stream.
      */}
      {/* AUTO-REPAIR ALERT */}
      {machinesNeedingRepair.length > 0 && (
        <div className="nf-alert nf-alert-purple" style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '16px', flexShrink: 0 }}>⬡</div>
          <div>
            <strong>Soroban auto-repair executed</strong> — {machinesNeedingRepair[0].id} reputation dropped to {machinesNeedingRepair[0].reputation}/100. Contract released 0.020 USDC to maintenance agent autonomously. No action needed.
          </div>
        </div>
      )}

      {/* DYNAMIC MACHINE CARDS */}
      {loading && machines.length === 0 ? (
        <div className="nf-panel" style={{ padding: '20px', textAlign: 'center' }}>
          Loading your assets from Stellar...
        </div>
      ) : machines.map(m => (
        <div key={m.id} className="nf-owner-card" style={{ 
          borderColor: m.status === 'pending_physical_verify' ? 'var(--color-warn-border)' : 'var(--color-border-secondary)' 
        }}>
          <div className="nf-owner-card-header" style={{ 
            background: m.status === 'pending_physical_verify' ? 'var(--color-warn-bg)' : 'transparent' 
          }}>
            <div className="nf-machine-avatar" style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
              <Cpu size={24} color="var(--color-purple)" strokeWidth={1.5} />
            </div>
            <div>
              <div className="nf-machine-name">{m.id} — {m.machine_type}</div>
              <div className="nf-machine-type">{m.machine_type} · {m.location}</div>
              <div className="nf-machine-meta">
                <span className="nf-tag">{displayPrice(m.price)} USDC/cycle</span>
                <span className="nf-tag">{m.materials}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              {m.reputation >= 90 ? (
                <div className="nf-badge" style={{ background: 'var(--color-purple)', color: 'white', border: 'none' }}>
                  Verified Plus 🏆
                </div>
              ) : (
                <div className={`nf-badge ${m.status === 'verified' ? 'badge-active' : 'badge-maintenance'}`}>
                  {m.status}
                </div>
              )}
            </div>
          </div>

          <div className="nf-owner-card-body">
            <div className="nf-owner-stat">
              <div className="nf-owner-stat-label">Reputation</div>
              <div className="nf-owner-stat-val" style={{ color: m.reputation > 80 ? 'var(--color-success)' : m.reputation === 50 ? 'var(--color-accent)' : 'var(--color-warn)' }}>
                {m.reputation}/100
              </div>
              <div className="nf-rep-bar-wrap">
                <div style={{fontSize: "10px", color: "var(--color-text-secondary)", marginBottom: "4px", display: 'flex', alignItems: 'center'}}>
                  {m.reputation === 50 ? (
                    <><ShieldCheck size={12} color="var(--color-accent)" style={{ marginRight: '4px' }} /> PROBATIONARY: 0 / 2 Trial Jobs</>
                  ) : 'On-chain Trust Score'}
                </div>
                <div className="nf-rep-bar">
                  <div className={`nf-rep-fill ${m.reputation > 80 ? 'fill-high' : 'fill-low'}`} style={{ width: `${m.reputation}%`, background: m.reputation === 50 ? 'var(--color-accent)' : undefined }}></div>
                </div>
              </div>
            </div>
            
            <div className="nf-owner-stat" style={{ flex: 2 }}>
              <div className="nf-owner-stat-label">Machine Agent Context</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: 1.4, marginTop: '8px' }}>
                {m.ai_notes || "Machine Agent is currently performing on-chain verification sequence..."}
              </div>
            </div>
          </div>

          <div className="nf-owner-card-footer" style={{ alignItems: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <a href={`https://stellar.expert/explorer/testnet/account/${walletAddress}?filter=contract-invocation`} target="_blank" rel="noreferrer" style={{ color: 'var(--color-purple)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <ExternalLink size={12} />
                View On-Chain Footprint
              </a>
            </div>
            
            {m.status === 'verified' && m.reputation < 90 && (
              <button 
                style={{ fontSize: '11px', padding: '5px 12px', border: 'none', background: 'var(--color-purple)', borderRadius: 'var(--border-radius-md)', cursor: 'pointer', color: 'white', marginRight: '8px' }}
                onClick={() => setCustomAlert({ title: "In Progress", message: "Requesting physical auditor for Verified Plus... Feature in development.", type: 'info' })}
              >
                Request Plus Certification
              </button>
            )}

            <button 
              onClick={() => {
                setEditingMachine(m);
                setEditPriceVal(displayPrice(m.price));
              }}
              style={{ fontSize: '11px', padding: '5px 12px', border: '0.5px solid var(--color-border-secondary)', background: 'transparent', borderRadius: 'var(--border-radius-md)', cursor: 'pointer', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Pencil size={12} /> Edit Conditions ($0.0005 x402)
            </button>
          </div>
        </div>
      ))}

      {/* DEPLOY NEW MACHINE AGENT FORM */}
      <div className="nf-panel" style={{ marginTop: '20px' }}>
        <div className="nf-panel-header">
          <span className="nf-panel-title">Deploy Hardware Node (Machine Agent)</span>
        </div>
        <div className="nf-panel-body">
          {/* EDUCATIONAL BANNER */}
          <div style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.2)', padding: '16px', borderRadius: 'var(--border-radius-md)', marginBottom: '24px', display: 'flex', gap: '12px' }}>
            <div style={{ flexShrink: 0, marginTop: '2px' }}>
              <Info size={18} color="var(--color-purple)" />
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
              <strong>How deployment works:</strong> When you deploy hardware to the network, your conditions are committed cryptographically to the Stellar Soroban network. Simultaneously, a localized Machine Agent uses AI to establish pricing parameters and securely expose your hardware to incoming requests.
              <br/><br/>Once deployed, your Machine Agent autonomously intercepts jobs from the MCP Server, defends against impossible CAD files, and receives direct x402 crypto payouts.
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <div>
                <span className="nf-field-label">Machine ID (Auto-assigned)</span>
                <div 
                  className="nf-input-mock mono" 
                  style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)', cursor: 'not-allowed', display: 'flex', alignItems: 'center' }}
                >
                  {formData.id}
                </div>
              </div>
              <div>
                <span className="nf-field-label">Machine Type</span>
                <select className="nf-input-mock" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} style={{ width: '100%', marginBottom: 0 }}>
                  <option value="FDM">FDM 3D Printer (Plastic)</option>
                  <option value="SLA">SLA 3D Printer (Resin)</option>
                  <option value="CNC">CNC Milling (Wood/Metal)</option>
                  <option value="Laser">Laser Cutter</option>
                  <option value="Metal3D">Metal 3D DMLS</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              <div>
                <span className="nf-field-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Price per Cycle (USDC)</span>
                  <span style={{ fontSize: '10px', color: 'var(--color-accent)' }}>Agent Monitored</span>
                </span>
                <input type="number" step="0.01" className="nf-input-mock" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required style={{ width: '100%', marginBottom: 0 }}/>
              </div>
              <div>
                <span className="nf-field-label">Operating Location</span>
                <input type="text" className="nf-input-mock" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} required style={{ width: '100%', marginBottom: 0 }}/>
              </div>
              <div>
                <span className="nf-field-label">Supported Materials</span>
                <input type="text" className="nf-input-mock" value={formData.materials} onChange={e => setFormData({...formData, materials: e.target.value})} required style={{ width: '100%', marginBottom: 0 }}/>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <span className="nf-field-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Autonomous Maintenance Setting</span>
                <span style={{ fontSize: '10px', color: 'var(--color-purple)' }}>Smart Contract Trigger</span>
              </span>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <div 
                  style={{ flex: 1, padding: '12px', border: `1px solid ${formData.autoRepair ? 'var(--color-purple)' : 'var(--color-border-secondary)'}`, borderRadius: 'var(--border-radius-md)', background: formData.autoRepair ? 'rgba(139, 92, 246, 0.1)' : 'transparent', cursor: 'pointer' }}
                  onClick={() => setFormData({...formData, autoRepair: true})}
                >
                  <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)' }}><Settings2 size={14} style={{ display: 'inline', marginRight: '6px' }}/>Autonomous Maintenance (1% fee)</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Contract automatically summons and pays a repair drone if reputation falls critically.</div>
                </div>
                <div 
                  style={{ flex: 1, padding: '12px', border: `1px solid ${!formData.autoRepair ? 'white' : 'var(--color-border-secondary)'}`, borderRadius: 'var(--border-radius-md)', background: !formData.autoRepair ? 'rgba(255, 255, 255, 0.05)' : 'transparent', cursor: 'pointer' }}
                  onClick={() => setFormData({...formData, autoRepair: false})}
                >
                  <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)' }}><Activity size={14} style={{ display: 'inline', marginRight: '6px' }}/>Self-Managed</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>No autonomous action taken. Network alerts you to repair it manually.</div>
                </div>
              </div>
            </div>
            
            <button type="submit" className="nf-btn-primary" style={{ width: '100%', padding: '14px', fontSize: '15px' }} disabled={submitting}>
              {submitting ? "Deploying via Freighter..." : "Deploy Agent & Sign On-Chain"}
            </button>
          </form>
        </div>
      </div>
      </>
      )}

      {/* EDIT MODAL — Now with x402 fee indicator */}
      {editingMachine && (
        <div className="nf-modal-overlay">
          <div className="nf-modal-content" style={{ padding: '30px', borderRadius: '16px', maxWidth: '420px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '8px', color: 'var(--color-text-primary)' }}>Update Machine Pricing</h3>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
              Propose a new base price for {editingMachine.id}. Your onboard Machine Agent will evaluate the market viability before allowing the contract update.
            </p>

            {/* x402 Fee Notice */}
            <div style={{ background: 'rgba(232, 93, 4, 0.1)', border: '1px solid rgba(232, 93, 4, 0.3)', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CreditCard size={16} color="var(--color-accent)" />
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                <strong style={{ color: 'var(--color-accent)' }}>x402 Fee: $0.0005 USDC</strong>
                <br/>This audit request is gated by an x402 micropayment on Stellar Testnet.
              </div>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <span className="nf-field-label">New Price per Cycle (USDC)</span>
              <input type="number" step="0.0001" className="nf-input-mock" style={{ width: '100%', marginBottom: 0 }} value={editPriceVal} onChange={(e) => setEditPriceVal(e.target.value)} />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="nf-btn-outline" 
                style={{ flex: 1, padding: '10px 16px' }} 
                onClick={() => setEditingMachine(null)}
                disabled={editingSubmit}
              >
                Cancel
              </button>
              <button 
                className="nf-btn-primary" 
                style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                disabled={editingSubmit}
                onClick={async () => {
                  setEditingSubmit(true);
                  try {
                    // First, attempt the x402-gated endpoint
                    const res = await fetch(`${API_URL}/machine/evaluate_pricing`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        machine_id: editingMachine.id,
                        machine_type: editingMachine.machine_type,
                        new_price: parseFloat(editPriceVal)
                      })
                    });
                    
                    if (res.status === 402) {
                      // x402 Payment Required! Show the flow
                      setCustomAlert({ 
                        title: "x402 Payment Flow Activated", 
                        message: `HTTP 402 Payment Required detected.\n\nThe Machine Agent optimization for ${editingMachine.id} costs $0.0005 USDC via x402 micropayment on Stellar Testnet.\n\nIn production, Freighter would sign the Soroban auth entries and the Coinbase facilitator would settle the payment automatically.\n\nEndpoint: POST /api/machine/evaluate_pricing\nProtocol: x402 (HTTP 402)\nNetwork: Stellar Testnet`,
                        type: 'info'
                      });
                      setEditingMachine(null);
                    } else {
                      const json = await res.json();
                      if (json.success) {
                        setCustomAlert({ 
                          title: "Machine Agent Approved Update ✔", 
                          message: `Reasoning: ${json.ai_notes}\n\nProceeding to sign contract update on Soroban...`,
                          type: 'success'
                        });
                        setEditingMachine(null);
                      } else {
                        setCustomAlert({ 
                          title: "Machine Agent Rejected Update ❌", 
                          message: `Reasoning: ${json.error}`,
                          type: 'danger'
                        });
                      }
                    }
                  } catch (e) {
                     setCustomAlert({ title: "Network Error", message: "Machine Agent validation failed to connect.", type: 'danger' });
                  }
                  setEditingSubmit(false);
                }}
              >
                {editingSubmit ? (
                  <><Loader2 size={14} className="spin" /> Agent Verifying...</>
                ) : (
                  <><Cpu size={14} /> Pay $0.0005 & Verify</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="nf-modal-overlay">
          <div className="nf-modal-content" style={{ textAlign: 'center', padding: '40px 20px', borderRadius: '24px', border: '1px solid rgba(139, 92, 246, 0.3)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <CheckCircle2 size={60} color="var(--color-success)" strokeWidth={1.5} />
            </div>
            <h2 style={{ color: 'var(--color-text-primary)' }}>Machine Registered</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginTop: '12px', lineHeight: '1.5' }}>
              Transaction successfully signed on Soroban Testnet.
            </p>
            <div className="mono" style={{ background: 'var(--color-background)', padding: '10px', borderRadius: '4px', marginTop: '20px', fontSize: '11px', color: 'var(--color-accent)' }}>
              Hash: {showSuccessModal.hash}
            </div>
            
            <a href={`https://stellar.expert/explorer/testnet/tx/${showSuccessModal.hash}`} target="_blank" rel="noreferrer" className="nf-btn-primary" style={{ marginTop: '20px', width: '100%', textDecoration: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px' }}>
              <ExternalLink size={16} />
              Verify on Stellar Expert
            </a>
            
            <button className="nf-btn-outline" style={{ marginTop: '10px', width: '100%', padding: '12px' }} onClick={() => setShowSuccessModal(null)}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* CUSTOM GLOBAL ALERTS */}
      {customAlert && (
        <div className="nf-modal-overlay" style={{ zIndex: 9999 }}>
          <div className="nf-modal-content" style={{ padding: '30px', borderRadius: '16px', maxWidth: '400px', border: `1px solid ${customAlert.type === 'danger' ? 'var(--color-warn-border)' : customAlert.type === 'success' ? 'var(--color-success-border)' : 'var(--color-border-primary)'}` }}>
            <h3 style={{ marginTop: 0, marginBottom: '12px', color: customAlert.type === 'danger' ? 'var(--color-warn)' : customAlert.type === 'success' ? 'var(--color-success)' : 'var(--color-text-primary)' }}>
              {customAlert.title}
            </h3>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              {customAlert.message}
            </div>
            <button 
              className="nf-btn-primary" 
              style={{ marginTop: '24px', width: '100%' }}
              onClick={() => setCustomAlert(null)}
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}
      {/* x402 PAYMENT HISTORY */}
      {walletAddress && x402Payments.length > 0 && (
        <div className="nf-panel" style={{ marginTop: '20px' }}>
          <div className="nf-panel-header">
            <span className="nf-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={16} color="var(--color-accent)" />
              x402 Payment Activity
            </span>
            <span className="nf-tag" style={{ color: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}>
              {x402Payments.length} transactions
            </span>
          </div>
          <div style={{ padding: '8px 16px' }}>
            {x402Payments.slice(0, 8).map((p: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border-secondary)', fontSize: '12px' }}>
                <div>
                  <div style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{p.payment_type?.replace(/_/g, ' ')}</div>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '10px', marginTop: '2px' }}>{p.machine_id} · {p.created_at}</div>
                </div>
                <div className="mono" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
                  {p.amount > 1000 ? (p.amount / 10000000).toFixed(4) : Number(p.amount).toFixed(4)} USDC
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
