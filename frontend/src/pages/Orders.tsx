/**
 * Orders Component
 * Manages the lifecycle of production orders, including active job tracking,
 * payment streaming milestones, and historical logging of on-chain interactions.
 */
import { useState, useEffect } from 'react';

type LiveOrder = {
  id: number;
  machine_id: string;
  payload: string;
  status: string;
  created_at: string;
  machine_type: string;
  price: number;
  reputation: number;
};

type OrderView = 'active' | 'detail' | 'history';

export function Orders() {
  const [view, setView] = useState<OrderView>('active');

  return (
    <div className="nf-orders-page">
      {/* VIEW TABS */}
      <div className="nf-tabs">
        <button 
          className={`nf-tab ${view === 'active' ? 'active' : ''}`} 
          onClick={() => setView('active')}
        >
          Active orders
        </button>
        <button 
          className={`nf-tab ${view === 'detail' ? 'active' : ''}`} 
          onClick={() => setView('detail')}
        >
          Order detail
        </button>
        <button 
          className={`nf-tab ${view === 'history' ? 'active' : ''}`} 
          onClick={() => setView('history')}
        >
          History
        </button>
      </div>

      {view === 'active' && <ActiveView onSelectDetail={() => setView('detail')} />}
      {view === 'detail' && <DetailView />}
      {view === 'history' && <HistoryView />}
    </div>
  );
}

function ActiveView({ onSelectDetail }: { onSelectDetail: () => void }) {
  const [liveOrders, setLiveOrders] = useState<LiveOrder[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/orders`);
        const json = await res.json();
        if (json.success) {
          setLiveOrders(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch live orders", err);
      }
    };
    fetchOrders();
    const iv = setInterval(fetchOrders, 3000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="nf-view">
      <div className="nf-metrics nf-metrics-4">
        <div className="nf-metric">
          <div className="nf-metric-label">Active orders</div>
          <div className="nf-metric-value">3</div>
          <div className="nf-metric-sub">2 running · 1 pending</div>
        </div>
        <div className="nf-metric">
          <div className="nf-metric-label">Locked in escrow</div>
          <div className="nf-metric-value mono">0.415</div>
          <div className="nf-metric-sub">USDC · 2 contracts</div>
        </div>
        <div className="nf-metric">
          <div className="nf-metric-label">Cycles today</div>
          <div className="nf-metric-value">89</div>
          <div className="nf-metric-sub">across all orders</div>
        </div>
        <div className="nf-metric">
          <div className="nf-metric-label">Spent today</div>
          <div className="nf-metric-value mono">0.445</div>
          <div className="nf-metric-sub warn">USDC · streaming</div>
        </div>
      </div>

      {liveOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
             No active live orders in the database. Send a job from Marketplace to see it here!
          </div>
      ) : (
          liveOrders.map(order => (
             <div className={`nf-order-card ${order.status !== 'completed' ? 'active-job' : ''}`} key={order.id} onClick={onSelectDetail}>
                <div className="nf-order-header">
                  <div>
                    <div className="nf-order-id">#{order.id}</div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>{new Date(order.created_at).toLocaleTimeString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{order.payload}</div>
                    <div className="nf-order-meta">
                      <span className="nf-tag">{order.machine_id}</span>
                      <span className="nf-tag">{order.machine_type}</span>
                      <span className="nf-tag">rep {order.reputation}/100</span>
                    </div>
                  </div>
                  <div className="nf-order-amount">
                    <div className="nf-order-amount-val">{(order.price / 10000000).toFixed(4)}</div>
                    <div className="nf-order-amount-label">USDC per cycle</div>
                  </div>
                  <div className={`nf-badge badge-${order.status === 'completed' ? 'active' : 'printing'}`}>{order.status}</div>
                </div>
                <div className="nf-progress-wrap">
                  <div className="nf-progress-label">
                    <span>Live Hardware Event Stream</span>
                    <div className="nf-stream-bar" style={{ width: '120px', display: 'inline-block', verticalAlign: 'middle', margin: '0 8px' }}>
                      <div className="nf-stream-fill"></div>
                    </div>
                  </div>
                  <div className="nf-progress-bar">
                    <div className="nf-progress-fill orange" style={{ width: order.status === 'completed' ? '100%' : '50%' }}></div>
                  </div>
                </div>
              </div>
          ))
      )}

      {/* BACKUP DEMO ORDERS (MOCKED) FOR VISUALS */}
      <h3 style={{marginTop: '40px', color: 'var(--color-text-secondary)', fontSize: '12px'}}>Simulated Mock Data (For UI Demo)</h3>
      <div className="nf-order-card active-job" onClick={onSelectDetail}>
        <div className="nf-order-header">
          <div>
            <div className="nf-order-id">#441</div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>2h 14m ago</div>
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)' }}>50 PLA parts, 30mm diameter</div>
            <div className="nf-order-meta">
              <span className="nf-tag">M-001 · Prusa MK4</span>
              <span className="nf-tag">FDM 3D Printer</span>
              <span className="nf-tag">rep 94/100</span>
            </div>
          </div>
          <div className="nf-order-amount">
            <div className="nf-order-amount-val">0.085 / 0.250</div>
            <div className="nf-order-amount-label">USDC spent / budget</div>
          </div>
          <div className="nf-badge badge-printing">running</div>
        </div>
        <div className="nf-progress-wrap">
          <div className="nf-progress-label">
            <span>17 / 50 cycles</span>
            <div className="nf-stream-bar" style={{ width: '120px', display: 'inline-block', verticalAlign: 'middle', margin: '0 8px' }}>
              <div className="nf-stream-fill"></div>
            </div>
            <span>34% complete</span>
          </div>
          <div className="nf-progress-bar">
            <div className="nf-progress-fill orange" style={{ width: '34%' }}></div>
          </div>
        </div>
      </div>

      {/* ORDER 442 — RUNNING */}
      <div className="nf-order-card active-job">
        <div className="nf-order-header">
          <div>
            <div className="nf-order-id">#442</div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>45m ago</div>
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)' }}>Acrylic panel cuts, 200x300mm</div>
            <div className="nf-order-meta">
              <span className="nf-tag">M-004 · Injection Mold</span>
              <span className="nf-tag">rep 99/100</span>
            </div>
          </div>
          <div className="nf-order-amount">
            <div className="nf-order-amount-val">0.120 / 0.200</div>
            <div className="nf-order-amount-label">USDC spent / budget</div>
          </div>
          <div className="nf-badge badge-printing">running</div>
        </div>
        <div className="nf-progress-wrap">
          <div className="nf-progress-label">
            <span>10 / 16 cycles</span>
            <span>62% complete</span>
          </div>
          <div className="nf-progress-bar">
            <div className="nf-progress-fill" style={{ width: '62%' }}></div>
          </div>
        </div>
      </div>

      {/* ORDER 443 — PENDING */}
      <div className="nf-order-card">
        <div className="nf-order-header">
          <div>
            <div className="nf-order-id">#443</div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>just now</div>
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)' }}>Aluminum brackets x20</div>
            <div className="nf-order-meta">
              <span className="nf-tag">Agent searching...</span>
              <span className="nf-tag">CNC Router</span>
              <span className="nf-tag">budget: 0.15 USDC</span>
            </div>
          </div>
          <div className="nf-order-amount">
            <div className="nf-order-amount-val">0.000 / 0.150</div>
            <div className="nf-order-amount-label">USDC spent / budget</div>
          </div>
          <div className="nf-badge badge-pending" style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}>agent searching</div>
        </div>
        <div className="nf-progress-wrap">
          <div className="nf-progress-label">
            <span>Awaiting machine assignment</span>
            <span>0%</span>
          </div>
          <div className="nf-progress-bar">
            <div className="nf-progress-fill" style={{ width: '0%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailView() {
  // PROD-LEVEL IMPLEMENTATION NOTE: This timeline is generated by indexing 'EscrowLocked' and 'PaymentReleased' 
  // events from the Soroban contract. The 'live' state reflects micropayments per cycle.
  return (
    <div className="nf-main">
      <div className="nf-left">
        {/* ORDER HEADER */}
        <div className="nf-panel">
          <div className="nf-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="nf-panel-title">Order #441</span>
              <div className="nf-badge badge-printing">running</div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <span className="nf-tag">M-001 · Prusa MK4</span>
              <span className="nf-tag" style={{ color: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}>Stellar explorer ↗</span>
            </div>
          </div>
          <div className="nf-panel-body">
            <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
              50 PLA parts, 30mm diameter, white color
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '10px' }}>
              <div>
                <div className="nf-metric-label">Budget</div>
                <div className="mono" style={{ fontSize: '14px', fontWeight: 700 }}>0.250 USDC</div>
              </div>
              <div>
                <div className="nf-metric-label">Spent</div>
                <div className="mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-accent)' }}>0.085 USDC</div>
              </div>
              <div>
                <div className="nf-metric-label">Per cycle</div>
                <div className="mono" style={{ fontSize: '14px', fontWeight: 700 }}>0.005 USDC</div>
              </div>
              <div>
                <div className="nf-metric-label">Cycles</div>
                <div className="mono" style={{ fontSize: '14px', fontWeight: 700 }}>17 / 50</div>
              </div>
            </div>
            <div style={{ marginTop: '12px' }}>
              <div className="nf-progress-label">
                <span>Progress</span>
                <div className="nf-stream-bar" style={{ width: '100px', display: 'inline-block', verticalAlign: 'middle' }}>
                  <div className="nf-stream-fill"></div>
                </div>
                <span>34% · est. 33 min remaining</span>
              </div>
              <div className="nf-progress-bar" style={{ height: '6px' }}>
                <div className="nf-progress-fill orange" style={{ width: '34%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* MILESTONE TIMELINE */}
        <div className="nf-panel">
          <div className="nf-panel-header">
            <span className="nf-panel-title">Payment milestones</span>
            <span className="nf-tag">Soroban escrow</span>
          </div>
          <div className="nf-panel-body" style={{ padding: '8px 16px' }}>
            <div className="nf-timeline">
              <div className="nf-milestone">
                <div className="nf-milestone-icon ms-done">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7l3 3 6-6" stroke="var(--color-success)" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="nf-milestone-title">Escrow locked</div>
                  <div className="nf-milestone-sub">0.250 USDC held in Soroban contract</div>
                  <div className="nf-milestone-tx">tx: c90a...77bb ↗</div>
                </div>
                <div className="nf-milestone-right">
                  <div className="nf-milestone-amount" style={{ color: 'var(--color-success)' }}>0.250 USDC</div>
                  <div className="nf-milestone-time">2h 14m ago</div>
                </div>
              </div>

              <div className="nf-milestone">
                <div className="nf-milestone-icon ms-done">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7l3 3 6-6" stroke="var(--color-success)" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="nf-milestone-title">Job started — 50% deposit</div>
                  <div className="nf-milestone-sub">First payment released to M-001 on start</div>
                  <div className="nf-milestone-tx">tx: d44f...12ac ↗</div>
                </div>
                <div className="nf-milestone-right">
                  <div className="nf-milestone-amount" style={{ color: 'var(--color-accent)' }}>0.125 USDC</div>
                  <div className="nf-milestone-time">2h 12m ago</div>
                </div>
              </div>

              <div className="nf-milestone">
                <div className="nf-milestone-icon ms-active">
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-accent)', animation: 'pulse 1.5s infinite' }}></div>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="nf-milestone-title">Cycle payments streaming</div>
                  <div className="nf-milestone-sub">0.005 USDC per cycle · 17 paid so far</div>
                  <div className="nf-stream-bar" style={{ marginTop: '5px', width: '180px' }}>
                    <div className="nf-stream-fill"></div>
                  </div>
                </div>
                <div className="nf-milestone-right">
                  <div className="nf-milestone-amount">0.085 USDC</div>
                  <div className="nf-milestone-time">live</div>
                </div>
              </div>

              <div className="nf-milestone">
                <div className="nf-milestone-icon ms-pending">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="4" stroke="var(--color-text-dim)" strokeWidth="1.5" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="nf-milestone-title" style={{ color: 'var(--color-text-secondary)' }}>Final payment release</div>
                  <div className="nf-milestone-sub">Remaining 50% released on completion</div>
                </div>
                <div className="nf-milestone-right">
                  <div className="nf-milestone-amount" style={{ color: 'var(--color-text-secondary)' }}>0.125 USDC</div>
                  <div className="nf-milestone-time">pending</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TX LOG */}
        <div className="nf-panel">
          <div className="nf-panel-header">
            <span className="nf-panel-title">Transaction log</span>
            <span className="nf-tag" style={{ color: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}>Stellar testnet ↗</span>
          </div>
          <div style={{ padding: '4px 16px' }}>
            <div className="nf-tx-row">
              <div>
                <div className="nf-tx-hash">a3f7...9c2d</div>
                <div className="nf-tx-type">cycle 17 payment → M-001</div>
              </div>
              <div className="mono" style={{ fontSize: '11px', color: 'var(--color-danger)' }}>-0.005 USDC</div>
            </div>
            <div className="nf-tx-row">
              <div>
                <div className="nf-tx-hash">b88c...3f1e</div>
                <div className="nf-tx-type">cycle 16 payment → M-001</div>
              </div>
              <div className="mono" style={{ fontSize: '11px', color: 'var(--color-danger)' }}>-0.005 USDC</div>
            </div>
            <div className="nf-tx-row">
              <div>
                <div className="nf-tx-hash">d44f...12ac</div>
                <div className="nf-tx-type">50% deposit → M-001 on start</div>
              </div>
              <div className="mono" style={{ fontSize: '11px', color: 'var(--color-danger)' }}>-0.125 USDC</div>
            </div>
            <div className="nf-tx-row">
              <div>
                <div className="nf-tx-hash">c90a...77bb</div>
                <div className="nf-tx-type">escrow lock · Soroban contract</div>
              </div>
              <div className="mono" style={{ fontSize: '11px', color: 'var(--color-warn)' }}>0.250 USDC</div>
            </div>
          </div>
        </div>
      </div>

      {/* SIDEBAR */}
      <div className="nf-sidebar">
        <div className="nf-panel">
          <div className="nf-panel-header"><span className="nf-panel-title">Machine assigned</span></div>
          <div className="nf-panel-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', background: 'var(--color-accent-soft)', border: '0.5px solid var(--color-accent)', borderRadius: 'var(--border-radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
                  <rect x="3" y="8" width="16" height="10" rx="2" stroke="var(--color-accent)" strokeWidth="1.5" />
                  <path d="M7 8V5a4 4 0 018 0v3" stroke="var(--color-accent)" strokeWidth="1.5" />
                  <circle cx="11" cy="13" r="2" fill="var(--color-accent)" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)' }}>M-001 · Prusa MK4</div>
                <div className="mono" style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>GPRX...4A1F</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ background: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius-md)', padding: '8px' }}>
                <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '3px' }}>Reputation</div>
                <div className="mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-success)' }}>94/100</div>
              </div>
              <div style={{ background: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius-md)', padding: '8px' }}>
                <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '3px' }}>Total jobs</div>
                <div className="mono" style={{ fontSize: '14px', fontWeight: 700 }}>1,240</div>
              </div>
            </div>
            <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>Why chosen by agent:</div>
            <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--color-text-primary)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius-md)', padding: '8px', lineHeight: 1.5 }}>
              M-001 scored highest on reputation (94) and price/cycle (0.005). M-002 was cheaper but reputation 78 below threshold for this budget.
            </div>
          </div>
        </div>

        <div className="nf-panel">
          <div className="nf-panel-header"><span className="nf-panel-title">Order actions</span></div>
          <div className="nf-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button className="nf-btn-primary" style={{ width: '100%' }}>Contact machine owner</button>
            <button className="nf-btn-outline" style={{ width: '100%' }}>Pause order</button>
            <button className="nf-btn-danger" style={{ width: '100%' }}>Open dispute</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HistoryView() {
  // PROD-LEVEL IMPLEMENTATION NOTE: Historical data is queried from a Soroban-optimized archive node.
  // Reviews are stored as memo strings in completion transactions.
  return (
    <div className="nf-view">
      <div className="nf-metrics nf-metrics-4">
        <div className="nf-metric">
          <div className="nf-metric-label">Total orders</div>
          <div className="nf-metric-value">47</div>
          <div className="nf-metric-sub" style={{ color: 'var(--color-text-secondary)' }}>since joining</div>
        </div>
        <div className="nf-metric">
          <div className="nf-metric-label">Completed</div>
          <div className="nf-metric-value">43</div>
          <div className="nf-metric-sub" style={{ color: 'var(--color-success)' }}>91.5% success rate</div>
        </div>
        <div className="nf-metric">
          <div className="nf-metric-label">Total spent</div>
          <div className="nf-metric-value mono">84.2</div>
          <div className="nf-metric-sub" style={{ color: 'var(--color-text-secondary)' }}>USDC all time</div>
        </div>
        <div className="nf-metric">
          <div className="nf-metric-label">Disputes</div>
          <div className="nf-metric-value">1</div>
          <div className="nf-metric-sub warn" style={{ color: 'var(--color-warn)' }}>1 resolved · 0 open</div>
        </div>
      </div>

      <div className="nf-panel">
        <div className="nf-panel-header">
          <span className="nf-panel-title">Order history</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <span className="nf-tag sel">All</span>
            <span className="nf-tag">Completed</span>
            <span className="nf-tag">Failed</span>
            <span className="nf-tag">Disputed</span>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="nf-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Description</th>
                <th>Machine</th>
                <th>Cycles</th>
                <th>Paid</th>
                <th>Date</th>
                <th>Status</th>
                <th>Review</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="mono" style={{ color: 'var(--color-accent)' }}>#440</td>
                <td>30 ABS clips, 15mm</td>
                <td><span className="nf-tag">M-001</span></td>
                <td className="mono">30/30</td>
                <td className="mono" style={{ color: 'var(--color-text-primary)' }}>0.150 USDC</td>
                <td style={{ color: 'var(--color-text-secondary)' }}>Apr 4</td>
                <td><div className="nf-badge badge-active" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', borderColor: 'var(--color-success-border)' }}>completed</div></td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span className="nf-stars" style={{ fontSize: '11px' }}>★★★★★</span>
                    <span style={{ fontSize: '9px', color: 'var(--color-text-secondary)', textDecoration: 'underline', cursor: 'pointer' }}>Read review</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="mono" style={{ color: 'var(--color-accent)' }}>#439</td>
                <td>Laser cut acrylic 100x100</td>
                <td><span className="nf-tag">M-003</span></td>
                <td className="mono">8/10</td>
                <td className="mono" style={{ color: 'var(--color-text-primary)' }}>0.016 USDC</td>
                <td style={{ color: 'var(--color-text-secondary)' }}>Apr 3</td>
                <td><div className="nf-badge badge-maintenance" style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>incomplete</div></td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span className="nf-stars-empty" style={{ fontSize: '11px' }}>★★☆☆☆</span>
                    <span style={{ fontSize: '9px', color: 'var(--color-text-secondary)', textDecoration: 'underline', cursor: 'pointer' }}>Read review</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
