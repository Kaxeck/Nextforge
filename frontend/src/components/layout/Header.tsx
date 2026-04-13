import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { connectFreighter } from '../../lib/stellar';

export function Header({ theme, toggleTheme }: { theme: string; toggleTheme: () => void }) {
  const [wallet, setWallet] = useState<string | null>(null);

  const handleConnect = async () => {
    const address = await connectFreighter();
    if (address) setWallet(address);
    else alert("Please install the Freighter browser extension.");
  };

  return (
    <div className="nf-header">
      <div className="nf-logo">
        <img src="/icon.png" alt="NextForge" width="36" height="36" style={{ borderRadius: '6px' }} />
        <span className="nf-logo-text">Next<span>Forge</span></span>
      </div>
      <div className="nf-nav">
        <NavLink to="/" className={({ isActive }) => `nf-nav-item ${isActive ? 'active' : ''}`} end>Marketplace</NavLink>
        <NavLink to="/machines" className={({ isActive }) => `nf-nav-item ${isActive ? 'active' : ''}`}>My machines</NavLink>
        <NavLink to="/orders" className={({ isActive }) => `nf-nav-item ${isActive ? 'active' : ''}`}>Orders</NavLink>
        <NavLink to="/analytics" className={({ isActive }) => `nf-nav-item ${isActive ? 'active' : ''}`}>Analytics</NavLink>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button className="nf-theme-toggle" onClick={toggleTheme} title="Toggle Theme">
          {theme === 'dark' ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="4.22" x2="19.78" y2="5.64"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>
        {wallet ? (
          <div className="nf-wallet-pill">
            <div className="nf-wallet-dot"></div>
            <span className="mono" style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              {wallet.substring(0, 4)}...{wallet.substring(wallet.length - 4)}
            </span>
            <span style={{ fontSize: '10px', padding: '2px 7px', background: 'var(--color-bg-secondary)', borderRadius: '20px', color: 'var(--color-success)' }}>connected</span>
          </div>
        ) : (
          <button className="nf-btn-primary" style={{ padding: "6px 14px", fontSize: "11px" }} onClick={handleConnect}>
            Connect Freighter
          </button>
        )}
      </div>
    </div>
  );
}
