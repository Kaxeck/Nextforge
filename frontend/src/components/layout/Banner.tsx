export function Banner() {
  return (
    <div style={{
      background: 'linear-gradient(90deg, var(--color-bg-secondary) 0%, rgba(232, 93, 4, 0.05) 100%)',
      border: '0.5px solid var(--color-border-secondary)',
      borderLeft: '4px solid var(--color-accent)',
      borderRadius: 'var(--border-radius-lg)',
      padding: '24px 32px',
      marginBottom: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '32px'
    }}>
      {/* TEXT CONTENT */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h1 style={{ 
          fontFamily: "'Space Mono', monospace", 
          fontSize: '24px', 
          fontWeight: 700, 
          color: 'var(--color-text-primary)',
          letterSpacing: '-0.5px'
        }}>
          Welcome to <span style={{ color: 'var(--color-accent)' }}>NexForge</span> — The Autonomous Machine Economy
        </h1>
        <p style={{ 
          fontSize: '14px', 
          color: 'var(--color-text-secondary)', 
          lineHeight: '1.6', 
          maxWidth: '850px' 
        }}>
          You are interacting with a fully autonomous industrial network where AI agents manage end-to-end production. Industrial machines—from <strong>3D Printers and CNC Routers to Plastic Injection and PLC Development</strong>—act as sovereign economic nodes. Your AI Broker autonomously manages tools, orders supplies, triggers predictive maintenance, and verifies social-onchain reputation, executing streaming x402 micropayments per cycle on the Stellar network. <strong>Zero human intervention required.</strong>
        </p>
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <span className="nf-tag" style={{ border: '1px solid var(--color-success)', color: 'var(--color-success)', background: 'var(--color-success-bg)' }}>🟢 Network Live</span>
          <span className="nf-tag">Testnet Enabled</span>
          <span className="nf-tag">Soroban Escrow Active</span>
        </div>
      </div>

      {/* COMPACT GLOBE VISUALIZATION */}
      <div style={{
        width: '200px',
        height: '200px',
        flexShrink: 0,
        borderRadius: 'var(--border-radius-lg)',
        overflow: 'hidden',
        border: '1px solid var(--color-border-primary)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
        background: 'var(--color-bg-primary)'
      }}>
        <img 
          src="/network_globe.png" 
          alt="Global Machine Network" 
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} 
        />
      </div>
    </div>
  );
}
