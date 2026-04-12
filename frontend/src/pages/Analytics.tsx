import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Analytics Component
 * Real-time network intelligence dashboard.
 * All visualizations are computed from live API data — zero hardcoded values.
 */
export function Analytics() {
  const [machines, setMachines] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    const fetchAll = () => {
      fetch(`${API_URL}/machines`)
        .then(res => res.json())
        .then(json => setMachines(json.data || []));

      fetch(`${API_URL}/mpp/payments?limit=50`)
        .then(res => res.json())
        .then(json => setPayments(json.data || []));
    };
    fetchAll();
    const iv = setInterval(fetchAll, 8000);
    return () => clearInterval(iv);
  }, []);

  // ===== COMPUTED METRICS (all from real data) =====
  const totalMachines = machines.length;
  const cyclePayments = payments.filter(p => p.payment_type === 'cycle_execution');
  const jobsCompleted = cyclePayments.length;

  const avgReputation = totalMachines > 0
    ? (machines.reduce((acc, m) => acc + (m.reputation || 0), 0) / totalMachines).toFixed(1)
    : "—";

  const autoRepairs = machines.filter(m => m.reputation < 50 && m.reputation > 0).length;

  const totalVolume = payments.reduce((acc, p) => {
    const amt = p.amount > 1000 ? p.amount / 10_000_000 : Number(p.amount);
    return acc + amt;
  }, 0);

  const avgCyclePrice = totalMachines > 0
    ? (machines.reduce((acc, m) => {
        const p = m.price > 1000 ? m.price / 10_000_000 : m.price;
        return acc + p;
      }, 0) / totalMachines).toFixed(4)
    : "—";

  // ===== MACHINE TYPE DISTRIBUTION =====
  const typeCount: Record<string, number> = {};
  machines.forEach(m => {
    const t = m.machine_type || 'Unknown';
    typeCount[t] = (typeCount[t] || 0) + 1;
  });
  const typeEntries = Object.entries(typeCount).sort((a, b) => b[1] - a[1]);
  const typeColors = ['var(--color-accent)', 'var(--color-success)', 'var(--color-warn)', 'var(--color-purple)', 'var(--color-danger)'];

  // Build donut segments from real data
  const circumference = 2 * Math.PI * 30; // r=30
  let cumulativeOffset = 0;
  const donutSegments = typeEntries.map(([type, count], i) => {
    const pct = totalMachines > 0 ? count / totalMachines : 0;
    const dashLength = pct * circumference;
    const segment = { type, count, pct, dashLength, offset: -cumulativeOffset, color: typeColors[i % typeColors.length] };
    cumulativeOffset += dashLength;
    return segment;
  });

  // ===== PAYMENT VOLUME OVER TIME (grouped by day) =====
  const volumeByDay: Record<string, number> = {};
  payments.forEach(p => {
    const day = p.created_at ? p.created_at.split(' ')[0].split('T')[0] : 'unknown';
    const amt = p.amount > 1000 ? p.amount / 10_000_000 : Number(p.amount);
    volumeByDay[day] = (volumeByDay[day] || 0) + amt;
  });
  const volumeDays = Object.entries(volumeByDay).sort((a, b) => a[0].localeCompare(b[0])).slice(-14);
  const maxVolume = Math.max(...volumeDays.map(d => d[1]), 0.001);

  // ===== PAYMENT TYPE DISTRIBUTION (for heatmap replacement) =====
  const paymentTypeCount: Record<string, number> = {};
  payments.forEach(p => {
    const t = p.payment_type || 'unknown';
    paymentTypeCount[t] = (paymentTypeCount[t] || 0) + 1;
  });
  const paymentTypeEntries = Object.entries(paymentTypeCount).sort((a, b) => b[1] - a[1]);

  // ===== AGENT DECISION STATS (from payments + machines) =====
  const machineJobCount: Record<string, number> = {};
  payments.forEach(p => {
    if (p.machine_id) {
      machineJobCount[p.machine_id] = (machineJobCount[p.machine_id] || 0) + 1;
    }
  });
  const topMachines = Object.entries(machineJobCount).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const maxJobs = Math.max(...topMachines.map(m => m[1]), 1);

  return (
    <div className="nf-analytics-page">
      {/* TOP METRICS — ALL REAL */}
      <div className="nf-metrics-6">
        <div className="nf-metric">
          <div className="nf-metric-label">Network machines</div>
          <div className="nf-metric-value">{totalMachines}</div>
          <div className="nf-metric-sub">registered on-chain</div>
        </div>
        <div className="nf-metric">
          <div className="nf-metric-label">Cycles completed</div>
          <div className="nf-metric-value">{jobsCompleted}</div>
          <div className="nf-metric-sub">via MPP streaming</div>
        </div>
        <div className="nf-metric">
          <div className="nf-metric-label">MPP Payments</div>
          <div className="nf-metric-value">{payments.length}</div>
          <div className="nf-metric-sub">tracked on-chain</div>
        </div>
        <div className="nf-metric">
          <div className="nf-metric-label">Avg rep score</div>
          <div className="nf-metric-value">{avgReputation}</div>
          <div className="nf-metric-sub warn">out of 100</div>
        </div>
        <div className="nf-metric">
          <div className="nf-metric-label">Auto-repairs</div>
          <div className="nf-metric-value">{autoRepairs}</div>
          <div className="nf-metric-sub">{autoRepairs > 0 ? 'critical conditions' : 'all systems normal'}</div>
        </div>
        <div className="nf-metric">
          <div className="nf-metric-label">Avg cycle price</div>
          <div className="nf-metric-value mono">{avgCyclePrice}</div>
          <div className="nf-metric-sub">USDC · computed</div>
        </div>
      </div>

      {/* ROW 1: VOLUME + MACHINE TYPES — REAL DATA */}
      <div className="nf-grid-31">

        {/* USDC VOLUME BAR CHART — from real payment history */}
        <div className="nf-panel">
          <div className="nf-panel-header">
            <span className="nf-panel-title">USDC volume — {volumeDays.length > 0 ? `last ${volumeDays.length} days` : 'no data yet'}</span>
            <span className="nf-tag">live</span>
          </div>
          <div className="nf-panel-body">
            {volumeDays.length > 0 ? (
              <>
                <div className="nf-chart">
                  {volumeDays.map(([day, vol], i) => (
                    <div className="nf-bar-col" key={i}>
                      <div
                        className="nf-bar"
                        style={{
                          height: `${Math.max((vol / maxVolume) * 100, 4)}%`,
                          background: 'var(--color-accent)',
                          opacity: 0.4 + (i / volumeDays.length) * 0.6
                        }}
                      ></div>
                      <div className="nf-bar-label" style={i === volumeDays.length - 1 ? { color: 'var(--color-accent)', fontWeight: 700 } : {}}>
                        {day.slice(-5)}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                  <span>Total: <span className="mono" style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>{totalVolume.toFixed(4)} USDC</span></span>
                  <span>Peak: <span className="mono" style={{ color: 'var(--color-accent)', fontWeight: 700 }}>{maxVolume.toFixed(4)} USDC</span></span>
                  <span>Txns: <span className="mono" style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>{payments.length}</span></span>
                </div>
              </>
            ) : (
              <div style={{ fontSize: '12px', padding: '30px 0', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                Awaiting first MPP transactions to populate volume chart.
              </div>
            )}
          </div>
        </div>

        {/* MACHINE TYPE DONUT — computed from real machine data */}
        <div className="nf-panel">
          <div className="nf-panel-header"><span className="nf-panel-title">Machine types</span></div>
          <div className="nf-panel-body">
            {totalMachines > 0 ? (
              <div className="nf-donut-wrap">
                <svg width="80" height="80" viewBox="0 0 80 80" style={{ flexShrink: 0 }}>
                  <circle cx="40" cy="40" r="30" fill="none" stroke="var(--color-bg-secondary)" strokeWidth="14"/>
                  {donutSegments.map((s, i) => (
                    <circle
                      key={i}
                      cx="40" cy="40" r="30"
                      fill="none"
                      stroke={s.color}
                      strokeWidth="14"
                      strokeDasharray={`${s.dashLength} ${circumference - s.dashLength}`}
                      strokeDashoffset={s.offset}
                      transform="rotate(-90 40 40)"
                    />
                  ))}
                  <text x="40" y="44" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--color-text-primary)" fontFamily="Space Mono">{totalMachines}</text>
                </svg>
                <div className="nf-donut-legend">
                  {donutSegments.map((s, i) => (
                    <div className="nf-legend-row" key={i}>
                      <div className="nf-legend-dot" style={{ background: s.color }}></div>
                      <span style={{ flex: 1, color: 'var(--color-text-secondary)' }}>{s.type}</span>
                      <span className="mono" style={{ fontSize: '11px', fontWeight: 700 }}>{(s.pct * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '12px', padding: '30px 0', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                No machines registered yet.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ROW 2: REPUTATION + PAYMENT BREAKDOWN */}
      <div className="nf-grid-2">

        {/* REPUTATION LEADERBOARD — from real machines */}
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

        {/* PAYMENT BREAKDOWN — real data replacing fake heatmap */}
        <div className="nf-panel">
          <div className="nf-panel-header">
            <span className="nf-panel-title">Payment breakdown — by type</span>
            <span className="nf-tag">MPP · live</span>
          </div>
          <div className="nf-panel-body">
            {paymentTypeEntries.length > 0 ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ background: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius-md)', padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Total payments</div>
                    <div className="mono" style={{ fontSize: '18px', fontWeight: 700 }}>{payments.length}</div>
                  </div>
                  <div style={{ background: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius-md)', padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Total volume</div>
                    <div className="mono" style={{ fontSize: '18px', fontWeight: 700 }}>{totalVolume.toFixed(4)}</div>
                  </div>
                  <div style={{ background: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius-md)', padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Unique machines</div>
                    <div className="mono" style={{ fontSize: '18px', fontWeight: 700 }}>{Object.keys(machineJobCount).length}</div>
                  </div>
                </div>

                {/* Payment type bars */}
                <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: '8px' }}>By payment type</div>
                {paymentTypeEntries.map(([type, count], i) => (
                  <div className="nf-rep-row" key={type}>
                    <span className="nf-rep-name" style={{ textTransform: 'capitalize' }}>{type.replace(/_/g, ' ')}</span>
                    <div className="nf-rep-bar-bg">
                      <div className="nf-rep-bar-fill" style={{ width: `${(count / payments.length) * 100}%`, background: typeColors[i % typeColors.length] }}></div>
                    </div>
                    <span className="mono" style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{count}</span>
                  </div>
                ))}
              </>
            ) : (
              <div style={{ fontSize: '12px', padding: '30px 0', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                Awaiting MPP payment activity.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ROW 3: MOST ACTIVE MACHINES + NETWORK ACTIVITY */}
      <div className="nf-grid-2">

        {/* MOST ACTIVE MACHINES — computed from real payments */}
        <div className="nf-panel">
          <div className="nf-panel-header">
            <span className="nf-panel-title">Most active machines — by payments</span>
          </div>
          <div className="nf-panel-body">
            {topMachines.length > 0 ? (
              <>
                <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: '8px' }}>Ranked by total transactions</div>
                {topMachines.map(([machineId, count], i) => (
                  <div className="nf-rep-row" key={machineId}>
                    <span className="nf-rep-name">{machineId}</span>
                    <div className="nf-rep-bar-bg"><div className="nf-rep-bar-fill" style={{ width: `${(count / maxJobs) * 100}%`, background: 'var(--color-accent)', opacity: 1 - (i * 0.15) }}></div></div>
                    <span className="mono" style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{count} txns</span>
                  </div>
                ))}

                {/* Zero-activity machines alert */}
                {machines.filter(m => !machineJobCount[m.id]).length > 0 && (
                  <div style={{ marginTop: '10px', padding: '8px', background: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius-md)', fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    {machines.filter(m => !machineJobCount[m.id]).map(m => m.id).join(', ')} — <strong>0 transactions</strong> recorded.
                  </div>
                )}
              </>
            ) : (
              <div style={{ fontSize: '12px', padding: '30px 0', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                No payment activity yet. Machines are awaiting their first MPP transactions.
              </div>
            )}
          </div>
        </div>

        {/* NETWORK LIVE FEED — from real payments */}
        <div className="nf-panel">
          <div className="nf-panel-header">
            <span className="nf-panel-title">Network activity — live</span>
            <div className="nf-wallet-dot" style={{ margin: 0 }}></div>
          </div>
          <div style={{ padding: '4px 16px' }}>
            {payments.slice(0, 10).map((p, i) => (
              <div className="nf-feed-row" key={i}>
                <div className="nf-feed-dot" style={{ background: p.payment_type === 'cycle_execution' ? 'var(--color-success)' : p.payment_type === 'mpp_gate_payment' ? 'var(--color-accent)' : 'var(--color-purple)' }}></div>
                <div className="nf-feed-text">
                  <strong style={{ textTransform: 'capitalize' }}>{p.payment_type.replace(/_/g, ' ')}</strong> — {p.machine_id} · {(p.amount > 1000 ? p.amount / 10_000_000 : Number(p.amount)).toFixed(4)} USDC
                  {p.tx_hash && <span style={{ fontSize: '10px', color: 'var(--color-text-dim)', marginLeft: '6px' }}>tx: {p.tx_hash.slice(0, 8)}…</span>}
                </div>
                <div className="nf-feed-time">{p.created_at ? new Date(p.created_at).toLocaleTimeString() : '—'}</div>
              </div>
            ))}
            {payments.length === 0 && <div style={{ fontSize: '12px', padding: '16px 0', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Awaiting network activity.</div>}
          </div>
        </div>

      </div>
    </div>
  );
}
