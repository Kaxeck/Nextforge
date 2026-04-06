/**
 * MyMachines Component
 * Dashboard for machine owners to manage their industrial assets,
 * track earnings, and monitor autonomous maintenance events via Soroban.
 */
export function MyMachines() {
  // PROD-LEVEL IMPLEMENTATION NOTE: This dashboard is hardcoded with mock machine data for the demo.
  // IN PRODUCTION: These machines will be fetched from the machine mapping contract 
  // on Stellar/Soroban using the provider's wallet address.
  
  return (
    <div id="view-mymachines">
      {/* SELLER METRICS */}
      <div className="nf-metrics nf-metrics-5">
        <div className="nf-metric">
          <div className="nf-metric-label">My machines</div>
          <div className="nf-metric-value">2</div>
          <div className="nf-metric-sub">1 active · 1 idle</div>
        </div>
        <div className="nf-metric">
          <div className="nf-metric-label">Earned today</div>
          <div className="nf-metric-value mono">6.24</div>
          <div className="nf-metric-sub">USDC total</div>
        </div>
        <div className="nf-metric">
          <div className="nf-metric-label">Earned this month</div>
          <div className="nf-metric-value mono">142.8</div>
          <div className="nf-metric-sub">USDC · 312 jobs</div>
        </div>
        <div className="nf-metric">
          <div className="nf-metric-label">Avg reputation</div>
          <div className="nf-metric-value mono">86</div>
          <div className="nf-metric-sub warn">M-003 needs attention</div>
        </div>
        <div className="nf-metric">
          <div className="nf-metric-label">Auto-repairs</div>
          <div className="nf-metric-value">1</div>
          <div className="nf-metric-sub warn">triggered today</div>
        </div>
      </div>

      {/* 
          TODO (DEVELOPER NOTE): 
          This alert simulates a real-time event triggered by a Soroban contract
          when machine reputation drops below a certain threshold. In the full 
          implementation, this would be a listener to the contract's event stream.
      */}
      {/* AUTO-REPAIR ALERT */}
      <div className="nf-alert nf-alert-purple" style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '16px', flexShrink: 0 }}>⬡</div>
        <div>
          <strong>Soroban auto-repair executed</strong> — M-003 reputation dropped to 52/100. Contract released 0.020 USDC to maintenance agent autonomously. No action needed.
        </div>
      </div>

      {/* ACTIVE MACHINE CARD (M-001) */}
      <div className="nf-owner-card">
        <div className="nf-owner-card-header">
          <div className="nf-machine-avatar">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="3" y="8" width="16" height="10" rx="2" stroke="var(--color-accent)" strokeWidth="1.5" />
              <path d="M7 8V5a4 4 0 018 0v3" stroke="var(--color-accent)" strokeWidth="1.5" />
              <circle cx="11" cy="13" r="2" fill="var(--color-accent)" />
            </svg>
          </div>
          <div>
            <div className="nf-machine-name">M-001 — Prusa MK4</div>
            <div className="nf-machine-type">FDM 3D Printer · wallet: GPRX...4A1F</div>
            <div className="nf-machine-meta">
              <span className="nf-tag">0.005 USDC/cycle</span>
              <span className="nf-tag">18 min avg</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="nf-badge badge-active">printing · job #441</div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '6px' }}>
              cycle 17 / 50
            </div>
          </div>
        </div>

        <div className="nf-owner-card-body">
          <div className="nf-owner-stat">
            <div className="nf-owner-stat-label">Reputation</div>
            <div className="nf-owner-stat-val" style={{ color: 'var(--color-success)' }}>94/100</div>
            <div className="nf-rep-bar-wrap">
              <div className="nf-rep-label">
                <span>on-chain score</span>
                <span>↑ +3 this week</span>
              </div>
              <div className="nf-rep-bar">
                <div className="nf-rep-fill fill-high" style={{ width: '94%' }}></div>
              </div>
            </div>
          </div>
          <div className="nf-owner-stat">
            <div className="nf-owner-stat-label">Earned today</div>
            <div className="nf-owner-stat-val" style={{ color: 'var(--color-success)' }}>5.80 USDC</div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              1,240 total jobs
            </div>
            <div className="nf-hist-wrap" style={{ height: '28px' }}>
              <div className="nf-hist-bar-fluid" style={{ height: '40%', background: 'var(--color-accent)', opacity: 0.3 }}></div>
              <div className="nf-hist-bar-fluid" style={{ height: '55%', background: 'var(--color-accent)', opacity: 0.4 }}></div>
              <div className="nf-hist-bar-fluid" style={{ height: '70%', background: 'var(--color-accent)', opacity: 0.55 }}></div>
              <div className="nf-hist-bar-fluid" style={{ height: '75%', background: 'var(--color-accent)', opacity: 0.65 }}></div>
              <div className="nf-hist-bar-fluid" style={{ height: '85%', background: 'var(--color-accent)', opacity: 0.75 }}></div>
              <div className="nf-hist-bar-fluid" style={{ height: '90%', background: 'var(--color-accent)', opacity: 0.85 }}></div>
              <div className="nf-hist-bar-fluid" style={{ height: '100%', background: 'var(--color-accent)' }}></div>
            </div>
          </div>
          <div className="nf-owner-stat">
            <div className="nf-owner-stat-label">Utilization</div>
            <div className="nf-owner-stat-val">87%</div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              today
            </div>
            <div className="nf-stream-bar" style={{ marginTop: '6px' }}>
              <div className="nf-stream-fill" style={{ width: '87%', animation: 'none' }}></div>
            </div>
          </div>
        </div>

        <div className="nf-owner-card-footer" style={{ alignItems: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Price: <span className="mono" style={{ color: 'var(--color-text-primary)' }}>0.005 USDC</span></span>
            <span>·</span>
            <span>Energy index: <span style={{ color: 'var(--color-success)' }}>normal</span></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '10px' }}>
            <div style={{ width: '28px', height: '16px', background: 'var(--color-success)', borderRadius: '10px', padding: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', boxSizing: 'border-box' }}>
              <div style={{ width: '12px', height: '12px', background: 'var(--color-background)', borderRadius: '50%' }}></div>
            </div>
            <span style={{ fontSize: '10px', color: 'var(--color-text-primary)', fontWeight: 500 }}>AI Auto-adjust</span>
          </div>
          <button style={{ fontSize: '11px', padding: '5px 12px', border: '0.5px solid var(--color-border-secondary)', background: 'transparent', borderRadius: 'var(--border-radius-md)', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", color: 'var(--color-text-primary)' }}>Edit price</button>
        </div>
      </div>

      {/* 
          TODO (DEVELOPER): This card uses theme-adapted colors for 'maintenance' mode.
          In a production build, these values come from dynamic machine-level 
          monitoring agents (LiteNode / Pinocchio).
      */}
      {/* MAINTENANCE MACHINE CARD (M-003) */}
      <div className="nf-owner-card" style={{ borderColor: 'var(--color-warn-border)' }}>
        <div className="nf-owner-card-header" style={{ background: 'var(--color-warn-bg)' }}>
          <div className="nf-machine-avatar" style={{ border: '0.5px solid var(--color-warn-border)' }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M4 11h14M11 4l7 7-7 7" stroke="var(--color-warn)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <div className="nf-machine-name">M-003 — CO2 Laser 80W</div>
            <div className="nf-machine-type">Laser Cutter · wallet: GLZR...2C9A</div>
            <div className="nf-machine-meta">
              <span className="nf-tag">0.002 USDC/cycle</span>
              <span className="nf-tag">auto-repair active</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="nf-badge badge-maintenance">under maintenance</div>
            <div style={{ fontSize: '11px', color: 'var(--color-warn)', marginTop: '6px' }}>
              est. back in 2h
            </div>
          </div>
        </div>

        <div className="nf-owner-card-body">
          <div className="nf-owner-stat" style={{ border: '0.5px solid var(--color-warn-border)' }}>
            <div className="nf-owner-stat-label">Reputation</div>
            <div className="nf-owner-stat-val" style={{ color: 'var(--color-warn)' }}>52/100</div>
            <div className="nf-rep-bar-wrap">
              <div className="nf-rep-label">
                <span>on-chain score</span>
                <span style={{ color: 'var(--color-danger)' }}>↓ -18 this week</span>
              </div>
              <div className="nf-rep-bar">
                <div className="nf-rep-fill fill-low" style={{ width: '52%' }}></div>
              </div>
            </div>
          </div>
          <div className="nf-owner-stat">
            <div className="nf-owner-stat-label">Earned today</div>
            <div className="nf-owner-stat-val" style={{ color: 'var(--color-text-primary)' }}>0.44 USDC</div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              89 total jobs
            </div>
            <div className="nf-hist-wrap" style={{ height: '28px' }}>
              <div className="nf-hist-bar-fluid" style={{ height: '80%', background: 'var(--color-warn)', opacity: 0.5 }}></div>
              <div className="nf-hist-bar-fluid" style={{ height: '90%', background: 'var(--color-warn)', opacity: 0.6 }}></div>
              <div className="nf-hist-bar-fluid" style={{ height: '100%', background: 'var(--color-warn)', opacity: 0.7 }}></div>
              <div className="nf-hist-bar-fluid" style={{ height: '70%', background: 'var(--color-warn)', opacity: 0.6 }}></div>
              <div className="nf-hist-bar-fluid" style={{ height: '40%', background: 'var(--color-danger)', opacity: 0.6 }}></div>
              <div className="nf-hist-bar-fluid" style={{ height: '20%', background: 'var(--color-danger)', opacity: 0.7 }}></div>
              <div className="nf-hist-bar-fluid" style={{ height: '10%', background: 'var(--color-danger)' }}></div>
            </div>
          </div>
          <div className="nf-owner-stat">
            <div className="nf-owner-stat-label">Auto-repair</div>
            <div className="nf-owner-stat-val" style={{ color: 'var(--color-purple)' }}>0.020 USDC</div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              paid by Soroban
            </div>
            <div style={{ fontSize: '10px', color: 'var(--color-purple)', marginTop: '4px' }}>
              tx: b12e...44fa ↗
            </div>
          </div>
        </div>

        <div className="nf-owner-card-footer" style={{ background: 'var(--color-warn-bg)', borderTop: '0.5px solid var(--color-warn-border)' }}>
          <div style={{ fontSize: '11px', color: 'var(--color-warn)', flex: 1 }}>
            Maintenance agent working · reputation threshold: 55/100
          </div>
          <button style={{ fontSize: '11px', padding: '5px 12px', border: '0.5px solid var(--color-warn-border)', background: 'transparent', borderRadius: 'var(--border-radius-md)', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", color: 'var(--color-warn)' }}>View repair log</button>
        </div>
      </div>

      {/* 
          TODO (DEVELOPER): This form will use the Anchor-generated TS client 
          to call the 'register_machine' function on the Soroban contract.
      */}
      {/* REGISTER NEW MACHINE SECTION */}
      <div className="nf-panel" style={{ marginTop: '20px' }}>
        <div className="nf-panel-header">
          <span className="nf-panel-title">Register a new machine</span>
        </div>
        <div className="nf-panel-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div>
              <span className="nf-field-label">Machine name</span>
              <div className="nf-input-mock ph">e.g. My CNC Router</div>
            </div>
            <div>
              <span className="nf-field-label">Type</span>
              <div className="nf-input-mock">Select type...</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div>
              <span className="nf-field-label">Price per cycle (USDC)</span>
              <div className="nf-input-mock ph">0.005</div>
            </div>
            <div>
              <span className="nf-field-label">Location</span>
              <div className="nf-input-mock ph">e.g. GDL, MX</div>
            </div>
            <div>
              <span className="nf-field-label">Materials</span>
              <div className="nf-input-mock ph">e.g. PLA, ABS</div>
            </div>
          </div>
          <button className="nf-btn-primary" style={{ marginTop: '16px', maxWidth: '200px' }}>
            Register on Stellar
          </button>
        </div>
      </div>
    </div>
  );
}
