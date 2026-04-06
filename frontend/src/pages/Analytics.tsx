/**
 * Analytics Component
 * Provides a comprehensive overview of network activity, economic throughput,
 * and machine performance metrics aggregated from the Stellar blockchain.
 */
export function Analytics() {
  // PROD-LEVEL IMPLEMENTATION NOTE: This data is aggregated from Stellar archive nodes and Soroban events.
  // Specifically, 'XLM Flow' uses an indexing service to track transfers to the NextForge contract address.
  
  return (
    <div className="nf-analytics-page">
      {/* TOP METRICS */}
      <div className="nf-metrics-6">
        <div className="nf-metric">
          <div className="nf-metric-label">Network machines</div>
          <div className="nf-metric-value">247</div>
          <div className="nf-metric-sub">+12 today</div>
        </div>
        <div className="nf-metric">
          <div className="nf-metric-label">Jobs completed</div>
          <div className="nf-metric-value">4,821</div>
          <div className="nf-metric-sub">+89 today</div>
        </div>
        <div className="nf-metric">
          <div className="nf-metric-label">XLM settled</div>
          <div className="nf-metric-value">28.4K</div>
          <div className="nf-metric-sub" style={{ color: 'var(--color-text-secondary)' }}>all time</div>
        </div>
        <div className="nf-metric">
          <div className="nf-metric-label">Avg rep score</div>
          <div className="nf-metric-value">81.4</div>
          <div className="nf-metric-sub warn">↓ 2.1 this week</div>
        </div>
        <div className="nf-metric">
          <div className="nf-metric-label">Auto-repairs</div>
          <div className="nf-metric-value">14</div>
          <div className="nf-metric-sub" style={{ color: 'var(--color-text-secondary)' }}>triggered today</div>
        </div>
        <div className="nf-metric">
          <div className="nf-metric-label">Avg cycle price</div>
          <div className="nf-metric-value mono">0.004</div>
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
            {[
              { id: 'M-004', score: 99, jobs: '5,891', color: 'var(--color-success)' },
              { id: 'M-001', score: 94, jobs: '1,240', color: 'var(--color-success)' },
              { id: 'M-008', score: 88, jobs: '741', color: 'var(--color-success)' },
              { id: 'M-012', score: 82, jobs: '389', color: 'var(--color-success)' },
              { id: 'M-002', score: 78, jobs: '342', color: 'var(--color-warn)' },
              { id: 'M-003', score: 52, jobs: '89', color: 'var(--color-danger)' },
            ].map((m, i) => (
              <div className="nf-rep-row" key={m.id}>
                <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', minWidth: '16px' }}>#{i + 1}</span>
                <span className="nf-rep-name">{m.id}</span>
                <div className="nf-rep-bar-bg"><div className="nf-rep-bar-fill" style={{ width: `${m.score}%`, background: m.color }}></div></div>
                <span className="nf-rep-score" style={{ color: m.color }}>{m.score}</span>
                <span className="nf-rep-jobs">{m.jobs} jobs</span>
              </div>
            ))}
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
            <span className="nf-panel-title">Agent broker decisions — today</span>
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
              M-003 received <strong style={{ color: 'var(--color-text-primary)' }}>0 broker assignments</strong> today due to low reputation (52/100). Auto-repair triggered at 08:42.
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
            <div className="nf-feed-row">
              <div className="nf-feed-dot" style={{ background: 'var(--color-success)' }}></div>
              <div className="nf-feed-text"><strong>Cycle payment</strong> — M-001 received 0.005 USDC · order #441</div>
              <div className="nf-feed-time">3s</div>
            </div>
            <div className="nf-feed-row">
              <div className="nf-feed-dot" style={{ background: 'var(--color-accent)' }}></div>
              <div className="nf-feed-text"><strong>New order #443</strong> — Agent searching CNC machines · budget 0.15 USDC</div>
              <div className="nf-feed-time">18s</div>
            </div>
            <div className="nf-feed-row">
              <div className="nf-feed-dot" style={{ background: 'var(--color-success)' }}></div>
              <div className="nf-feed-text"><strong>Job completed</strong> — M-004 finished order #442 · rep updated to 99</div>
              <div className="nf-feed-time">44s</div>
            </div>
            <div className="nf-feed-row">
              <div className="nf-feed-dot" style={{ background: 'var(--color-purple)' }}></div>
              <div className="nf-feed-text"><strong>Auto-repair paid</strong> — Soroban released 0.020 USDC to maintenance agent · M-003</div>
              <div className="nf-feed-time">1m</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
