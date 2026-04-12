import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';


/**
 * Analytics Component
 * Provides a comprehensive overview of network activity, economic throughput,
 * and machine performance metrics aggregated from the Stellar blockchain.
 */
export function Analytics() {
  const [machines, setMachines] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/machines`)
      .then(res => res.json())
      .then(json => setMachines(json.data || []));

    fetch(`${API_URL}/x402/payments?limit=50`)
      .then(res => res.json())
      .then(json => setPayments(json.data || []));
  }, []);

  // Compute live metrics
  const totalMachines = machines.length > 0 ? machines.length : 0;
  const jobsCompleted = payments.filter(p => p.payment_type === 'cycle_execution').length;
  const avgReputation = totalMachines > 0 
    ? (machines.reduce((acc, m) => acc + (m.reputation || 0), 0) / totalMachines).toFixed(1)
    : "0.0";
    
  const autoRepairs = machines.filter(m => m.reputation < 50 && m.reputation > 0).length;

  return (
    <div className="nf-analytics-page">
      {/* TOP METRICS */}
      <div className="nf-metrics-6">
        <div className="nf-metric">
          <div className="nf-metric-label">Network machines</div>
          <div className="nf-metric-value">{totalMachines}</div>
          <div className="nf-metric-sub">+3 today</div>
        </div>
        <div className="nf-metric">
          <div className="nf-metric-label">Cycles completed</div>
          <div className="nf-metric-value">{jobsCompleted}</div>
          <div className="nf-metric-sub">live via streaming</div>
        </div>
        <div className="nf-metric">
          <div className="nf-metric-label">MPP Payments</div>
          <div className="nf-metric-value">{payments.length}</div>
          <div className="nf-metric-sub" style={{ color: 'var(--color-text-secondary)' }}>tracked on-chain</div>
        </div>
        <div className="nf-metric">
          <div className="nf-metric-label">Avg rep score</div>
          <div className="nf-metric-value">{avgReputation}</div>
          <div className="nf-metric-sub warn">out of 100</div>
        </div>
        <div className="nf-metric">
          <div className="nf-metric-label">Auto-repairs</div>
          <div className="nf-metric-value">{autoRepairs}</div>
          <div className="nf-metric-sub" style={{ color: 'var(--color-text-secondary)' }}>critical conditions</div>
        </div>
        <div className="nf-metric">
          <div className="nf-metric-label">Avg cycle price</div>
          <div className="nf-metric-value mono">0.005</div>
          <div className="nf-metric-sub" style={{ color: 'var(--color-text-secondary)' }}>USDC · stable</div>
        </div>
      </div>

      {/* ROW 1: VOLUME + MACHINE TYPES */}
      <div className="nf-grid-31">

        {/* XLM VOLUME BAR CHART */}
        <div className="nf-panel">
          <div className="nf-panel-header">
            <span className="nf-panel-title">XLM volume — last 14 days</span>
            <div className="nf-range">
              <button className="nf-range-btn">7d</button>
              <button className="nf-range-btn active">14d</button>
              <button className="nf-range-btn">30d</button>
            </div>
          </div>
          <div className="nf-panel-body">
            <div className="nf-chart">
              {[38, 45, 52, 48, 61, 55, 70, 65, 78, 72, 85, 80, 92, 100].map((h, i) => (
                <div className="nf-bar-col" key={i}>
                  <div 
                    className="nf-bar" 
                    style={{ 
                      height: `${h}%`, 
                      background: 'var(--color-accent)', 
                      opacity: i === 13 ? 1 : 0.3 + (i * 0.05) 
                    }}
                  ></div>
                  <div className="nf-bar-label" style={i === 13 ? { color: 'var(--color-accent)', fontWeight: 700 } : {}}>
                    {i < 10 ? `M${22 + i}` : i === 10 ? 'A1' : i === 11 ? 'A2' : i === 12 ? 'A3' : 'A4'}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              <span>Total: <span className="mono" style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>28,420 XLM</span></span>
              <span>Peak: <span className="mono" style={{ color: 'var(--color-accent)', fontWeight: 700 }}>4,820 XLM</span> · Apr 4</span>
              <span>Txns: <span className="mono" style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>18,441</span></span>
            </div>
          </div>
        </div>

        {/* MACHINE TYPE DONUT */}
        <div className="nf-panel">
          <div className="nf-panel-header"><span className="nf-panel-title">Machine types</span></div>
          <div className="nf-panel-body">
            <div className="nf-donut-wrap">
              <svg width="80" height="80" viewBox="0 0 80 80" style={{ flexShrink: 0 }}>
                <circle cx="40" cy="40" r="30" fill="none" stroke="var(--color-bg-secondary)" strokeWidth="14"/>
                <circle cx="40" cy="40" r="30" fill="none" stroke="var(--color-accent)" strokeWidth="14" strokeDasharray="75 113" strokeDashoffset="0" transform="rotate(-90 40 40)"/>
                <circle cx="40" cy="40" r="30" fill="none" stroke="var(--color-success)" strokeWidth="14" strokeDasharray="34 154" strokeDashoffset="-75" transform="rotate(-90 40 40)"/>
                <circle cx="40" cy="40" r="30" fill="none" stroke="var(--color-warn)" strokeWidth="14" strokeDasharray="23 165" strokeDashoffset="-109" transform="rotate(-90 40 40)"/>
                <circle cx="40" cy="40" r="30" fill="none" stroke="var(--color-purple)" strokeWidth="14" strokeDasharray="20 168" strokeDashoffset="-132" transform="rotate(-90 40 40)"/>
                <text x="40" y="44" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--color-text-primary)" fontFamily="Space Mono">247</text>
              </svg>
              <div className="nf-donut-legend">
                <div className="nf-legend-row"><div className="nf-legend-dot" style={{ background: 'var(--color-accent)' }}></div><span style={{ flex: 1, color: 'var(--color-text-secondary)' }}>FDM 3D</span><span className="mono" style={{ fontSize: '11px', fontWeight: 700 }}>42%</span></div>
                <div className="nf-legend-row"><div className="nf-legend-dot" style={{ background: 'var(--color-success)' }}></div><span style={{ flex: 1, color: 'var(--color-text-secondary)' }}>CNC</span><span className="mono" style={{ fontSize: '11px', fontWeight: 700 }}>22%</span></div>
                <div className="nf-legend-row"><div className="nf-legend-dot" style={{ background: 'var(--color-warn)' }}></div><span style={{ flex: 1, color: 'var(--color-text-secondary)' }}>Laser</span><span className="mono" style={{ fontSize: '11px', fontWeight: 700 }}>19%</span></div>
                <div className="nf-legend-row"><div className="nf-legend-dot" style={{ background: 'var(--color-purple)' }}></div><span style={{ flex: 1, color: 'var(--color-text-secondary)' }}>Other</span><span className="mono" style={{ fontSize: '11px', fontWeight: 700 }}>17%</span></div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ROW 2: REPUTATION + JOBS PER HOUR */}
      <div className="nf-grid-2">

        {/* REPUTATION LEADERBOARD */}
        <div className="nf-panel">
          <div className="nf-panel-header">
            <span className="nf-panel-title">Reputation leaderboard — on-chain</span>
            <span className="nf-tag">Soroban · live</span>
          </div>
          <div className="nf-panel-body" style={{ padding: '8px 16px' }}>
            {machines
              .sort((a, b) => (b.reputation || 0) - (a.reputation || 0))
              .slice(0, 6)
              .map((m, i) => (
              <div className="nf-rep-row" key={m.id}>
                <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', minWidth: '16px' }}>#{i + 1}</span>
                <span className="nf-rep-name">{m.id}</span>
                <div className="nf-rep-bar-bg">
                  <div className="nf-rep-bar-fill" style={{ width: `${m.reputation || 0}%`, background: m.reputation > 80 ? 'var(--color-success)' : m.reputation > 50 ? 'var(--color-warn)' : 'var(--color-danger)' }}></div>
                </div>
                <span className="nf-rep-score" style={{ color: m.reputation > 80 ? 'var(--color-success)' : m.reputation > 50 ? 'var(--color-warn)' : 'var(--color-danger)' }}>{m.reputation || 0}</span>
                <span className="nf-rep-jobs" style={{ fontSize: '10px' }}>{m.machine_type}</span>
              </div>
            ))}
            {machines.length === 0 && <div style={{ fontSize: '12px', padding: '16px 0', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No machines registered yet.</div>}
          </div>
        </div>

        {/* JOBS PER HOUR HEATMAP + LINE */}
        <div className="nf-panel">
          <div className="nf-panel-header">
            <span className="nf-panel-title">Jobs per hour — today</span>
            <span className="nf-tag">Apr 5 · 24h</span>
          </div>
          <div className="nf-panel-body">
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Activity heatmap</div>
              <div className="nf-heatmap">
                {[...Array(24)].map((_, i) => {
                  const op = [0.08, 0.06, 0.05, 0.04, 0.06, 0.08, 0.15, 0.28, 0.45, 0.55, 0.62, 0.58, 0.48, 0.70, 0.78, 0.85, 0.90, 0.82, 0.75, 0.60, 0.50, 0.40, 0.30, 1][i];
                  return <div className="nf-heat-cell" key={i} style={{ background: 'var(--color-accent)', opacity: op }}></div>;
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--color-text-secondary)', marginTop: '3px', fontFamily: "'Space Mono', monospace" }}>
                <span>00h</span><span>06h</span><span>12h</span><span>18h</span><span>now</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Payment flow rate (USDC/min)</div>
              <svg className="nf-line-chart" viewBox="0 0 300 60" preserveAspectRatio="none">
                <polyline points="0,55 20,52 40,48 60,44 80,38 100,32 120,35 140,28 160,22 180,18 200,14 220,16 240,10 260,12 280,8 300,4" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="0,55 20,52 40,48 60,44 80,38 100,32 120,35 140,28 160,22 180,18 200,14 220,16 240,10 260,12 280,8 300,4 300,60 0,60" fill="var(--color-accent)" fillOpacity="0.08"/>
              </svg>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                <span>0.8 USDC/min</span>
                <span style={{ color: 'var(--color-accent)', fontWeight: 500 }}>↑ 4.2 USDC/min now</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ROW 3: AGENT DECISIONS + NETWORK ACTIVITY */}
      <div className="nf-grid-2">

        {/* AGENT DECISION STATS */}
        <div className="nf-panel">
          <div className="nf-panel-header">
            <span className="nf-panel-title">Agent-to-Agent Negotiations — Today</span>
          </div>
          <div className="nf-panel-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              <div style={{ background: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius-md)', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Decisions made</div>
                <div className="mono" style={{ fontSize: '18px', fontWeight: 700 }}>89</div>
              </div>
              <div style={{ background: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius-md)', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Avg eval time</div>
                <div className="mono" style={{ fontSize: '18px', fontWeight: 700 }}>1.2s</div>
              </div>
              <div style={{ background: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius-md)', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Rep-over-price</div>
                <div className="mono" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-success)' }}>71%</div>
              </div>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: '8px' }}>Most selected machines</div>
            <div className="nf-rep-row">
              <span className="nf-rep-name">M-001</span>
              <div className="nf-rep-bar-bg"><div className="nf-rep-bar-fill" style={{ width: '62%', background: 'var(--color-accent)' }}></div></div>
              <span className="mono" style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>31 jobs</span>
            </div>
            <div className="nf-rep-row">
              <span className="nf-rep-name">M-004</span>
              <div className="nf-rep-bar-bg"><div className="nf-rep-bar-fill" style={{ width: '48%', background: 'var(--color-accent)', opacity: .7 }}></div></div>
              <span className="mono" style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>24 jobs</span>
            </div>
            <div style={{ marginTop: '10px', padding: '8px', background: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius-md)', fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              M-003 received <strong>0 agent bids</strong> today due to low reputation (52/100). Escrow auto-repair triggered at 08:42.
            </div>
          </div>
        </div>

        {/* NETWORK LIVE FEED */}
        <div className="nf-panel">
          <div className="nf-panel-header">
            <span className="nf-panel-title">Network activity — live</span>
            <div className="nf-wallet-dot" style={{ margin: 0 }}></div>
          </div>
          <div style={{ padding: '4px 16px' }}>
            {payments.slice(0, 10).map((p, i) => (
              <div className="nf-feed-row" key={i}>
                <div className="nf-feed-dot" style={{ background: p.payment_type === 'cycle_execution' ? 'var(--color-success)' : p.payment_type === 'job_verification' ? 'var(--color-accent)' : 'var(--color-purple)' }}></div>
                <div className="nf-feed-text">
                  <strong style={{ textTransform: 'capitalize' }}>{p.payment_type.replace(/_/g, ' ')}</strong> — {p.machine_id} received {p.amount} MPP
                </div>
                <div className="nf-feed-time">{new Date(p.created_at).toLocaleTimeString()}</div>
              </div>
            ))}
            {payments.length === 0 && <div style={{ fontSize: '12px', padding: '16px 0', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Awaiting network activity.</div>}
          </div>
        </div>

      </div>
    </div>
  );
}
