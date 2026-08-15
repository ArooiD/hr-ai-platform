import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import MobileBottomNav from './components/layout/MobileBottomNav';
import RecruitmentFlow from './pages/RecruitmentFlow';
import VacanciesPage from './pages/Vacancies';
import VacancyDetailPage from './pages/VacancyDetail';
import CandidatesPage from './pages/Candidates';
import AnalyticsPage from './pages/Analytics';
import CandidateDetailPage from './pages/CandidateDetail';
import SupportPage from './pages/Support';
import KnowledgeBase from './pages/KnowledgeBase';
import { initSSEClient } from './api/sseNotifications';
import { KeycloakProvider, useKeycloak } from './contexts/KeycloakContext';
import './styles/index.css';

function AppLayout({ children }) {
  const { userInfo, logout } = useKeycloak();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const user = userInfo ? {
    id: userInfo.sub,
    email: userInfo.email,
    name: `${userInfo.given_name || ''} ${userInfo.family_name || ''}`.trim() || userInfo.preferred_username,
    username: userInfo.preferred_username,
    roles: userInfo.roles || [],
  } : null;

  const handleLogout = () => {
    logout({ redirectUri: window.location.origin });
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="app-shell">
      <Sidebar user={user} isOpen={sidebarOpen} onToggle={toggleSidebar} />
      <main className="workspace">
        <Topbar user={user} onLogout={handleLogout} onToggleSidebar={toggleSidebar} />
        <div className="single-page-workspace">
          {children}
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}

function App() {
  const { authenticated, getToken } = useKeycloak();

  useEffect(() => {
    if (authenticated && getToken()) {
      console.log('[App] Initializing SSE client...');
      initSSEClient(getToken());
    }
  }, [authenticated, getToken]);

  if (!authenticated) {
    return null;
  }

  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<VacanciesPage />} />
          <Route path="/vacancies" element={<VacanciesPage />} />
          <Route path="/vacancies/:id" element={<VacancyDetailPage />} />
          <Route path="/candidates" element={<CandidatesPage />} />
          <Route path="/recruitment" element={<RecruitmentFlow />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/knowledge-base" element={<KnowledgeBase />} />
          <Route path="/candidates/:id" element={<CandidateDetailPage />} />
          <Route path="*" element={<Navigate to="/vacancies" replace />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

function AppWithProviders() {
  return (
    <KeycloakProvider>
      <App />
    </KeycloakProvider>
  );
}

export default AppWithProviders;
