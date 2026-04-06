/**
 * MetricsBar Component
 * Global status bar providing high-level network health and user account overview.
 */
export function MetricsBar() {
  // PROD-LEVEL IMPLEMENTATION NOTE: General marketplace metrics are currently static mocks.
  // Real implementation will stream data from a Soroban-native indexing 
  // service to provide live network utilization.
  return (
    <div className="nf-metrics">
      <div className="nf-metric">
        <div className="nf-metric-label">Available now</div>
        <div className="nf-metric-value">184</div>
        <div className="nf-metric-sub">of 247 machines</div>
      </div>
      <div className="nf-metric">
        <div className="nf-metric-label">My active orders</div>
        <div className="nf-metric-value">3</div>
        <div className="nf-metric-sub">1 running · 2 pending</div>
      </div>
      <div className="nf-metric">
        <div className="nf-metric-label">Wallet balance</div>
        <div className="nf-metric-value mono">124.5</div>
        <div className="nf-metric-sub">XLM · Freighter</div>
      </div>
      <div className="nf-metric">
        <div className="nf-metric-label">Spent this month</div>
        <div className="nf-metric-value mono">18.4</div>
        <div className="nf-metric-sub">USDC · 9 orders</div>
      </div>
    </div>
  );
}
