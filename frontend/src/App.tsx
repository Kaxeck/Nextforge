import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Banner } from './components/layout/Banner';
import { Marketplace } from './pages/Marketplace';
import { MyMachines } from './pages/MyMachines';
import { Orders } from './pages/Orders';
import { Analytics } from './pages/Analytics';
import './App.css';

function Layout({ theme, toggleTheme }: { theme: string; toggleTheme: () => void }) {
  const location = useLocation();
  const isMachinesPage = location.pathname === '/machines';

  return (
    <div className="nf" data-theme={theme}>
      <Header theme={theme} toggleTheme={toggleTheme} />
      {!isMachinesPage && (
        <div style={{ paddingBottom: '20px' }}>
          <Routes>
            <Route path="/" element={<Banner />} />
          </Routes>
        </div>
      )}
      <Outlet />
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('nf-theme') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('nf-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout theme={theme} toggleTheme={toggleTheme} />}>
          <Route index element={<Marketplace />} />
          <Route path="machines" element={<MyMachines />} />
          <Route path="orders" element={<Orders />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
