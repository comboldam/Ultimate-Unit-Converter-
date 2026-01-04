import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { CategorySelect } from './screens/CategorySelect';
import { UnitConverter } from './components/UnitConverter';
import { CurrencyPage } from './pages/CurrencyPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdMobBanner } from './components/AdMobBanner';
import { maybeShowNavigationInterstitial } from './utils/navigationInterstitial';
import './App.css';

function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const isUnitPage = location.pathname === '/' || location.pathname.startsWith('/converter');

  const navItems = [
    { id: 'unit', label: 'Unit', path: '/', active: isUnitPage },
    { id: 'currency', label: 'Currency', path: '/currency', active: location.pathname === '/currency' },
    { id: 'settings', label: 'Settings', path: '/settings', active: location.pathname === '/settings' },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <button
          key={item.id}
          className={`nav-item ${item.active ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}

// Hook to trigger navigation interstitial on route changes
function NavigationAdTrigger() {
  const location = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip on initial render (don't show ad on app start)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      console.log('[NavAd] First render, skipping ad check');
      return;
    }

    console.log('[NavAd] Route changed to:', location.pathname);
    // 10% chance to show interstitial on navigation
    maybeShowNavigationInterstitial();
  }, [location.pathname]);

  return null;
}

function AppContent() {
  const navigate = useNavigate();

  const handleSelectCategory = (categoryId: string, currentFilter: string) => {
    navigate(`/converter/${categoryId}`, { state: { previousFilter: currentFilter } });
  };

  return (
    <div className="app">
      <NavigationAdTrigger />
      <div className="app-content">
        <Routes>
          <Route path="/" element={<CategorySelect onSelectCategory={handleSelectCategory} />} />
          <Route path="/converter/:categoryId" element={<UnitConverter />} />
          <Route path="/currency" element={<CurrencyPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
      <BottomNav />
      <AdMobBanner />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
