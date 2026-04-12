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


export function Orders() {
  return (
    <div className="nf-orders-page" style={{ padding: '24px' }}>
      <h2 style={{ color: 'var(--color-text-primary)', marginBottom: '24px' }}>Active Production Streams</h2>
      <ActiveView />
    </div>
  );
}

function ActiveView() {
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
      {liveOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
             No active live orders in the database. Send a job from Marketplace to see it here!
          </div>
      ) : (
          liveOrders.map(order => (
             <div className={`nf-order-card ${order.status !== 'completed' ? 'active-job' : ''}`} key={order.id}>
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


    </div>
  );
}
