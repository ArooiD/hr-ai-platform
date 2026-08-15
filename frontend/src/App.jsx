import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ArrowRight, Briefcase, CalendarCheck2, BarChart3, FileText, UserRoundCheck, UsersRound, Users, BookOpen } from 'lucide-react';
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
import { authApi } from './api/client';
import { initSSEClient } from './api/sseNotifications';
import { KeycloakProvider, useKeycloak } from './contexts/KeycloakContext';
import './styles/index.css';

// Страница входа - Keycloak login
function LoginPage() {
  const { login } = useKeycloak();
  const location = useLocation();

  const handleLogin = () => {
    // Сохраняем текущий путь для redirect после входа
    const redirectAfter = location.pathname === '/' ? '/vacancies' : location.pathname;
    login({ redirectAfter });
  };

  return (
    <main className="login-page">
      <section className="login-hero visual">
        <div className="login-brand">
          <div className="login-logo"><Briefcase size={26} /></div>
          <span>HR Platform</span>
        </div>
        <div className="login-dashboard-art" aria-hidden="true">
          <div className="art-card art-main">
            <div className="art-header"><UsersRound size={22} /><span>Подбор</span></div>
            <div className="art-row"><span>Новые кандидаты</span><b>24</b></div>
            <div className="art-row"><span>Интервью</span><b>8</b></div>
            <div className="art-progress"><i style={{ width: '68%' }} /></div>
          </div>
          <div className="art-card art-small art-top"><CalendarCheck2 size={20} /><b>5</b><span>встреч</span></div>
          <div className="art-card art-small art-bottom"><BarChart3 size={20} /><b>82%</b><span>match</span></div>
          <div className="art-document"><FileText size={26} /><span>CV</span></div>
        </div>
      </section>

      <section className="login-card">
        <div className="login-card-header">
          <div className="login-user-icon"><UserRoundCheck size={24} /></div>
          <div>
            <h2>Вход в систему</h2>
            <p>Аутентификация через Keycloak</p>
          </div>
        </div>

        <div className="login-form">
          <p style={{ marginBottom: '20px', color: '#6b7280' }}>
            Для доступа к системе пожалуйста войдите через корпоративную учётную запись.
          </p>
          
          <button 
            type="button" 
            onClick={handleLogin}
            className="keycloak-login-button"
            style={{
              width: '100%',
              padding: '12px 24px',
              background: '#0b73ff',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <UserRoundCheck size={20} />
            Войти через Keycloak
          </button>
        </div>
      </section>
    </main>
  );
}

function ProtectedRoute({ children }) {
  const { authenticated, initializing } = useKeycloak();

  if (initializing) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>Проверка аутентификации...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppLayout({ children }) {
  const { userInfo, logout, getToken } = useKeycloak();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Создаем объект user из userInfo Keycloak
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

// Root компонент приложения с React Router
export default function App() {
  const { authenticated, initializing, getToken } = useKeycloak();

  // Инициализация SSE client после входа
  useEffect(() => {
    if (authenticated && getToken()) {
      console.log('[App] Initializing SSE client...');
      initSSEClient(getToken());
    }
  }, [authenticated, getToken]);

  if (initializing) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>Загрузка системы...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <LoginPage />;
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

// Обёртка приложения с Keycloak Provider
function AppWithProviders() {
  return (
    <KeycloakProvider>
      <App />
    </KeycloakProvider>
  );
}

export default AppWithProviders;
