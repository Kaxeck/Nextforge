import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * MetricsBar Component
 * Global status bar providing real-time network health pulled from the backend API.
 * All values are computed dynamically — zero hardcoded data.
 */
export function MetricsBar() {
  const [machines, setMachines] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = () => {
      fetch(`${API_URL}/machines`)
        .then(r => r.json())
        .then(j => { if (j.success) setMachines(j.data || []); })
        .catch(() => {});

      fetch(`${API_URL}/mpp/payments`)
        .then(r => r.json())
        .then(j => { if (j.success) setPayments(j.data || []); })
        .catch(() => {});
    };

    fetchData();
    const iv = setInterval(fetchData, 8000);
    return () => clearInterval(iv);
  }, []);

  const totalMachines = machines.length;
  const verifiedMachines = machines.filter(m => m.status === 'verified').length;

  const activeOrders = payments.filter(p => p.payment_type === 'cycle_execution').length;
  const pendingJobs = payments.filter(p => p.payment_type === 'mpp_gate_payment').length;

  const totalSpent = payments.reduce((acc, p) => {
    const amt = p.amount > 1000 ? p.amount / 10_000_000 : p.amount;
    return acc + amt;
  }, 0);

  return (
    <div className="nf-metrics">
      <div className="nf-metric">
        <div className="nf-metric-label">Available now</div>
        <div className="nf-metric-value">{verifiedMachines}</div>
        <div className="nf-metric-sub">of {totalMachines} machines</div>
      </div>
      <div className="nf-metric">
        <div className="nf-metric-label">MPP transactions</div>
        <div className="nf-metric-value">{payments.length}</div>
        <div className="nf-metric-sub">{activeOrders} cycles · {pendingJobs} gate fees</div>
      </div>
      <div className="nf-metric">
        <div className="nf-metric-label">Network volume</div>
        <div className="nf-metric-value mono">{totalSpent.toFixed(4)}</div>
        <div className="nf-metric-sub">USDC · all time</div>
      </div>
      <div className="nf-metric">
        <div className="nf-metric-label">Avg reputation</div>
        <div className="nf-metric-value mono">
          {totalMachines > 0
            ? (machines.reduce((a, m) => a + (m.reputation || 0), 0) / totalMachines).toFixed(0)
            : '—'}
        </div>
        <div className="nf-metric-sub">on-chain score</div>
      </div>
    </div>
  );
}
