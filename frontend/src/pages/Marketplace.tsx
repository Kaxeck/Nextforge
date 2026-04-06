/**
 * Marketplace Component
 * The primary interface for consumers to discover industrial capacity,
 * evaluate machine agents, and deploy autonomous broker contracts.
 */
import { useState } from "react";

export function Marketplace() {
  // PROD-LEVEL IMPLEMENTATION NOTE: Real agent logic will be handled by the backend 
  // orchestration layer. This state represents a simulated agent selection workflow.
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);

  return (
    <div className="nf-main">
      {/* LEFT COLUMN */}
      <div className="nf-left">
        {/* MACHINE LIST */}
        <div className="nf-panel">
          <div className="nf-panel-header">
            <span className="nf-panel-title">Machines</span>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <span className="nf-tag sel">All types</span>
              <span className="nf-tag">FDM 3D</span>
              <span className="nf-tag">CNC</span>
              <span className="nf-tag">Laser</span>
              <span className="nf-tag">Rep 80+</span>
              <span className="nf-tag">Max 0.01 USDC</span>
              <span className="nf-tag">Available now</span>
            </div>
          </div>
          <div className="nf-panel-body">
            <div className="nf-machine-list">
              {/* M-001 SELECTED */}
              <div
                className={`nf-machine-card ${selectedMachine === "m1" ? "selected" : ""}`}
                onClick={() => setSelectedMachine("m1")}
              >
                <div className="nf-machine-avatar">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="9" width="18" height="11" rx="2" stroke="var(--color-accent)" strokeWidth="1.5" />
                    <path d="M8 9V6a4 4 0 018 0v3" stroke="var(--color-accent)" strokeWidth="1.5" />
                    <circle cx="12" cy="14" r="2.5" fill="var(--color-accent)" />
                  </svg>
                </div>
                <div>
                  <div className="nf-machine-name">M-001 — Prusa MK4</div>
                  <div className="nf-machine-sub">
                    FDM 3D Printer · León, MX ·{" "}
                    <span className="mono" style={{ fontSize: "10px" }}>
                      GPRX...4A1F
                    </span>
                  </div>
                  <div className="nf-machine-meta">
                    <div className="nf-rep-inline">
                      <div className="nf-rep-dot rep-high"></div>94/100 rep
                    </div>
                    <span className="nf-tag">1,240 jobs</span>
                    <span className="nf-tag">18 min/cycle</span>
                    <span className="nf-tag">PLA · PETG · ABS</span>
                  </div>
                </div>
                <div className="nf-machine-right">
                  <div className="nf-price">0.005</div>
                  <div className="nf-price-label">USDC / cycle</div>
                  <div className="nf-badge badge-printing">printing</div>
                </div>
              </div>

              {/* M-002 */}
              <div className="nf-machine-card">
                <div className="nf-machine-avatar">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="5" width="20" height="14" rx="2" stroke="var(--color-text-secondary)" strokeWidth="1.5" />
                    <path d="M7 12h10M12 7v10" stroke="var(--color-text-secondary)" strokeWidth="1.5" />
                  </svg>
                </div>
                <div>
                  <div className="nf-machine-name">M-002 — CNC Router 3X</div>
                  <div className="nf-machine-sub">
                    CNC Router · CDMX, MX ·{" "}
                    <span className="mono" style={{ fontSize: "10px" }}>
                      GCNC...9B3D
                    </span>
                  </div>
                  <div className="nf-machine-meta">
                    <div className="nf-rep-inline">
                      <div className="nf-rep-dot rep-mid"></div>78/100 rep
                    </div>
                    <span className="nf-tag">342 jobs</span>
                    <span className="nf-tag">24 min/cycle</span>
                    <span className="nf-tag">Aluminum · Wood</span>
                  </div>
                </div>
                <div className="nf-machine-right">
                  <div className="nf-price">0.003</div>
                  <div className="nf-price-label">USDC / cycle</div>
                  <div className="nf-badge badge-idle">idle</div>
                </div>
              </div>

              {/* M-004 */}
              <div className="nf-machine-card">
                <div className="nf-machine-avatar">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="5" y="3" width="14" height="18" rx="2" stroke="var(--color-text-secondary)" strokeWidth="1.5" />
                    <path d="M9 8h6M9 12h4M9 16h5" stroke="var(--color-text-secondary)" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <div className="nf-machine-name">
                    M-004 — Injection Mold 50T
                  </div>
                  <div className="nf-machine-sub">
                    Injection Mold · GDL, MX ·{" "}
                    <span className="mono" style={{ fontSize: "10px" }}>
                      GIML...7E4B
                    </span>
                  </div>
                  <div className="nf-machine-meta">
                    <div className="nf-rep-inline">
                      <div className="nf-rep-dot rep-high"></div>99/100 rep
                    </div>
                    <span className="nf-tag">5,891 jobs</span>
                    <span className="nf-tag">8 min/cycle</span>
                    <span className="nf-tag">PP · ABS · Nylon</span>
                  </div>
                </div>
                <div className="nf-machine-right">
                  <div className="nf-price">0.012</div>
                  <div className="nf-price-label">USDC / cycle</div>
                  <div className="nf-badge badge-idle">idle</div>
                </div>
              </div>

              {/* M-008 */}
              <div className="nf-machine-card">
                <div className="nf-machine-avatar">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M4 12h16M12 4l8 8-8 8" stroke="var(--color-text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <div className="nf-machine-name">
                    M-008 — CO2 Laser 100W
                  </div>
                  <div className="nf-machine-sub">
                    Laser Cutter · MTY, MX ·{" "}
                    <span className="mono" style={{ fontSize: "10px" }}>
                      GLZR...8C2D
                    </span>
                  </div>
                  <div className="nf-machine-meta">
                    <div className="nf-rep-inline">
                      <div className="nf-rep-dot rep-high"></div>88/100 rep
                    </div>
                    <span className="nf-tag">741 jobs</span>
                    <span className="nf-tag">12 min/cycle</span>
                    <span className="nf-tag">Acrylic · MDF · Leather</span>
                  </div>
                </div>
                <div className="nf-machine-right">
                  <div className="nf-price">0.006</div>
                  <div className="nf-price-label">USDC / cycle</div>
                  <div className="nf-badge badge-idle">idle</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 
            SIMULATED AGENT DECISION MODAL
            In the final version, this will be triggered automatically when the agent completes
            a search vs. being a manual click-to-view.
        */}
        {/* MACHINE DETAIL MODAL — M-001 */}
        {selectedMachine === "m1" && (
          <div
            className="nf-modal-overlay"
            onClick={() => setSelectedMachine(null)}
          >
            <div
              className="nf-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="nf-modal-close"
                onClick={() => setSelectedMachine(null)}
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
                        M-001 — Prusa MK4
                      </div>
                      <div
                        className="mono"
                        style={{
                          fontSize: "10px",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        GPRX...4A1F · León, MX
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
                    <div className="nf-badge badge-printing">printing</div>
                    <span
                      className="nf-tag"
                      style={{ color: "var(--color-accent)", borderColor: "var(--color-accent)" }}
                    >
                      Stellar ↗
                    </span>
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
                          94 / 100
                        </div>
                        <div className="nf-rep-bar-bg">
                          <div
                            className="nf-rep-bar-fill"
                            style={{ width: "94%", background: "var(--color-success)" }}
                          ></div>
                        </div>
                      </div>
                      <div className="nf-stat-box">
                        <div className="nf-stat-label">Jobs completed</div>
                        <div className="nf-stat-val">1,240</div>
                        <div className="nf-hist-wrap">
                          <div
                            className="nf-hist-bar"
                            style={{ height: "40%", background: "var(--color-accent)", opacity: 0.3 }}
                          ></div>
                          <div
                            className="nf-hist-bar"
                            style={{ height: "55%", background: "var(--color-accent)", opacity: 0.4 }}
                          ></div>
                          <div
                            className="nf-hist-bar"
                            style={{ height: "70%", background: "var(--color-accent)", opacity: 0.55 }}
                          ></div>
                          <div
                            className="nf-hist-bar"
                            style={{ height: "80%", background: "var(--color-accent)", opacity: 0.65 }}
                          ></div>
                          <div
                            className="nf-hist-bar"
                            style={{ height: "90%", background: "var(--color-accent)", opacity: 0.8 }}
                          ></div>
                          <div
                            className="nf-hist-bar"
                            style={{ height: "100%", background: "var(--color-accent)" }}
                          ></div>
                        </div>
                      </div>
                      <div className="nf-stat-box">
                        <div className="nf-stat-label">Price / cycle</div>
                        <div className="nf-stat-val mono">0.005</div>
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
                      <div className="nf-stat-box">
                        <div className="nf-stat-label">Avg cycle time</div>
                        <div className="nf-stat-val">18 min</div>
                        <div
                          style={{
                            fontSize: "10px",
                            color: "var(--color-text-secondary)",
                            marginTop: "4px",
                          }}
                        >
                          ±2 min variance
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="nf-detail-section">
                    <div className="nf-detail-label">
                      Why agent chose this machine
                    </div>
                    <div
                      style={{
                        background: "var(--color-background-secondary)",
                        borderRadius: "var(--border-radius-md)",
                        padding: "10px",
                        fontSize: "12px",
                        color: "var(--color-text-secondary)",
                        lineHeight: 1.6,
                      }}
                    >
                      M-001 scored highest across reputation (94/100) and
                      price efficiency. M-002 was cheaper at 0.003 USDC/cycle
                      but reputation score of 78 fell below the 80-point
                      threshold set by order priority. M-004 exceeded budget
                      at 0.012/cycle. M-001 selected.
                    </div>
                  </div>

                  {/* 
                      REVIEWS DATA: These are mocked for the demo, but the "tx" hashes 
                      link to real placeholders on Stellar/Soroban explorers. 
                  */}
                  <div className="nf-detail-section">
                    <div className="nf-detail-label">
                      Client reviews — stored on Stellar
                    </div>
                    <div className="nf-review">
                      <div className="nf-review-top">
                        <div className="nf-avatar">AC</div>
                        <span className="nf-stars">★★★★★</span>
                        <span className="nf-review-hash">tx: f44a...21bc ↗</span>
                      </div>
                      <div className="nf-review-text">
                        Excellent quality, delivered all 50 parts on time.
                        Will use again.
                      </div>
                    </div>
                    <div className="nf-review">
                      <div className="nf-review-top">
                        <div
                          className="nf-avatar"
                          style={{
                            background: "var(--color-background-success)",
                            color: "var(--color-text-success)",
                          }}
                        >
                          JM
                        </div>
                        <span className="nf-stars">★★★★☆</span>
                        <span className="nf-review-hash">
                          tx: 9c3d...88fa ↗
                        </span>
                      </div>
                      <div className="nf-review-text">
                        Good precision. Slight delay on cycle 12 but recovered
                        well.
                      </div>
                    </div>
                    <div className="nf-review">
                      <div className="nf-review-top">
                        <div
                          className="nf-avatar"
                          style={{
                            background: "rgba(232, 93, 4, 0.12)",
                            color: "var(--color-accent)",
                          }}
                        >
                          RV
                        </div>
                        <span className="nf-stars">★★★★★</span>
                        <span className="nf-review-hash">
                          tx: 2a11...77cd ↗
                        </span>
                      </div>
                      <div className="nf-review-text">
                        Fast and reliable. Best machine I've used on
                        NextForge.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STREAMING ACTIVE ORDER */}
        <div className="nf-panel">
          <div className="nf-panel-header">
            <span className="nf-panel-title">
              Order #441 — payment streaming
            </span>
            <div
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <div className="nf-stream-bar" style={{ width: "80px" }}>
                <div className="nf-stream-fill"></div>
              </div>
              <span
                className="nf-tag"
                style={{ color: "var(--color-success)", borderColor: "var(--color-success)" }}
              >
                live
              </span>
            </div>
          </div>
          <div className="nf-panel-body">
            <div className="nf-stream-grid">
              <div className="nf-stream-stat">
                <div className="nf-stream-label">Per cycle</div>
                <div className="nf-stream-val" style={{ color: "var(--color-success)" }}>
                  0.005 USDC
                </div>
              </div>
              <div className="nf-stream-stat">
                <div className="nf-stream-label">Spent so far</div>
                <div className="nf-stream-val">0.085 USDC</div>
              </div>
              <div className="nf-stream-stat">
                <div className="nf-stream-label">Cycles</div>
                <div className="nf-stream-val">17 / 50</div>
              </div>
              <div className="nf-stream-stat">
                <div className="nf-stream-label">Escrow left</div>
                <div className="nf-stream-val" style={{ color: "var(--color-accent)" }}>
                  0.165 USDC
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
                <span>17 / 50 cycles</span>
                <span>34%</span>
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
                    width: "34%",
                    background: "var(--color-accent)",
                    borderRadius: "3px",
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR */}
      <div className="nf-sidebar">
        {/* ORDER FORM */}
        <div className="nf-panel">
          <div className="nf-panel-header">
            <span className="nf-panel-title">New order</span>
            <span
              className="nf-tag"
              style={{ color: "var(--color-accent)", borderColor: "var(--color-accent)" }}
            >
              M-001 selected
            </span>
          </div>
          <div className="nf-panel-body">
            <span className="nf-field-label">Job description</span>
            <div className="nf-input-mock ph">
              50 PLA parts, 30mm diameter...
            </div>
            <span className="nf-field-label">Machine type</span>
            <div className="nf-input-mock">FDM 3D Printer</div>
            <div className="nf-input-row">
              <div>
                <span className="nf-field-label">Budget (USDC)</span>
                <div className="nf-input-mock">0.50</div>
              </div>
              <div>
                <span className="nf-field-label">Max / cycle</span>
                <div className="nf-input-mock">0.008</div>
              </div>
            </div>
            <span className="nf-field-label">Agent priority</span>
            <div className="nf-input-mock">Reputation first</div>
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
            <button className="nf-btn-primary">Deploy agent broker</button>
            <button className="nf-btn-outline">Preview agent decision</button>
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
            <span className="nf-panel-title">Agent feed</span>
            <div className="nf-wallet-dot" style={{ margin: "0" }}></div>
          </div>
          <div style={{ padding: "4px 16px" }}>
            <div className="nf-agent-entry">
              <div className="nf-agent-dot dot-pay"></div>
              <div>
                <div className="nf-agent-text">
                  <strong>Cycle 17 paid</strong> — 0.005 USDC to M-001. tx:
                  a3f7...9c2d
                </div>
                <div className="nf-agent-time">12s ago</div>
              </div>
            </div>
            <div className="nf-agent-entry">
              <div className="nf-agent-dot dot-decide"></div>
              <div>
                <div className="nf-agent-text">
                  <strong>M-001 selected</strong> — rep 94 beat M-002 (78).
                  Price delta +0.002 USDC justified by score.
                </div>
                <div className="nf-agent-time">2m ago</div>
              </div>
            </div>
            <div className="nf-agent-entry">
              <div className="nf-agent-dot dot-warn"></div>
              <div>
                <div className="nf-agent-text">
                  <strong>Escrow locked</strong> — 0.250 USDC in Soroban
                  contract for order #441.
                </div>
                <div className="nf-agent-time">3m ago</div>
              </div>
            </div>
            <div className="nf-agent-entry">
              <div className="nf-agent-dot dot-decide"></div>
              <div>
                <div className="nf-agent-text">
                  <strong>4 machines evaluated</strong> — M-003 excluded (rep
                  52, below threshold). M-004 over budget.
                </div>
                <div className="nf-agent-time">3m ago</div>
              </div>
            </div>
          </div>
        </div>

        {/* MY TRANSACTIONS */}
        <div className="nf-panel">
          <div className="nf-panel-header">
            <span className="nf-panel-title">My transactions</span>
            <span
              className="nf-tag"
              style={{ color: "var(--color-accent)", borderColor: "var(--color-accent)" }}
            >
              Stellar ↗
            </span>
          </div>
          <div style={{ padding: "4px 16px" }}>
            <div className="nf-tx-row">
              <div>
                <div className="nf-tx-hash">a3f7...9c2d</div>
                <div className="nf-tx-type">cycle 17 · order #441</div>
              </div>
              <div
                className="mono"
                style={{ fontSize: "11px", color: "var(--color-danger)" }}
              >
                −0.005
              </div>
            </div>
            <div className="nf-tx-row">
              <div>
                <div className="nf-tx-hash">c90a...77bb</div>
                <div className="nf-tx-type">escrow lock · #441</div>
              </div>
              <div
                className="mono"
                style={{ fontSize: "11px", color: "var(--color-warn)" }}
              >
                −0.250
              </div>
            </div>
            <div className="nf-tx-row">
              <div>
                <div className="nf-tx-hash">e11f...02dc</div>
                <div className="nf-tx-type">refund · order #439</div>
              </div>
              <div
                className="mono"
                style={{ fontSize: "11px", color: "var(--color-success)" }}
              >
                +0.010
              </div>
            </div>
            <div className="nf-tx-row">
              <div>
                <div className="nf-tx-hash">f88b...31aa</div>
                <div className="nf-tx-type">escrow lock · #438</div>
              </div>
              <div
                className="mono"
                style={{ fontSize: "11px", color: "var(--color-warn)" }}
              >
                −0.150
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
