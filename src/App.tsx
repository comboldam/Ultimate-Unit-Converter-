import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { CategorySelect } from './screens/CategorySelect';
import { UnitConverter } from './components/UnitConverter';
import { CurrencyPage } from './pages/CurrencyPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdMobBanner } from './components/AdMobBanner';
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


function AppContent() {
  const navigate = useNavigate();

  const handleSelectCategory = (categoryId: string, currentFilter: string) => {
    navigate(`/converter/${categoryId}`, { state: { previousFilter: currentFilter } });
  };

  return (
    <div className="app">
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
