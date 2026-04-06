import { NavLink } from 'react-router-dom';

export function Header({ theme, toggleTheme }: { theme: string; toggleTheme: () => void }) {
  return (
    <div className="nf-header">
      <div className="nf-logo">
        <div className="nf-logo-icon">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <polygon points="9,2 16,6 16,12 9,16 2,12 2,6" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <polygon points="9,5 13,7.5 13,10.5 9,13 5,10.5 5,7.5" fill="currentColor" opacity="0.6" />
          </svg>
        </div>
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
        <div className="nf-wallet-pill">
          <div className="nf-wallet-dot"></div>
          <span className="mono" style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>GAXK...7R2P</span>
          <span className="mono" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-primary)' }}>124.5 XLM</span>
          <span style={{ fontSize: '10px', padding: '2px 7px', background: 'var(--color-bg-secondary)', borderRadius: '20px', color: 'var(--color-text-secondary)' }}>wallet</span>
        </div>
      </div>
    </div>
  );
}
