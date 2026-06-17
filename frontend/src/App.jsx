import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ArrowRight, BriefcaseBusiness, CalendarCheck2, ChartNoAxesColumnIncreasing, FileText, UserRoundCheck, UsersRound, Users } from 'lucide-react';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import RecruitmentFlow from './pages/RecruitmentFlow';
import VacanciesPage from './pages/Vacancies';
import VacancyDetailPage from './pages/VacancyDetail';
import CandidatesPage from './pages/Candidates';
import AnalyticsPage from './pages/Analytics';
import CandidateDetailPage from './pages/CandidateDetail';
import { authApi } from './api/client';
import './styles.css';

// Страница входа - форма авторизации
function LoginPage({ onLogin }) {
  const [login, setLogin] = useState('depopova');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Обработчик отправки формы входа
  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const session = await authApi.login({ login, password });
      onLogin(session);
    } catch (err) {
      setError('Неверный логин или пароль.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-hero visual">
        <div className="login-brand">
          <div className="login-logo"><BriefcaseBusiness size={26} /></div>
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
          <div className="art-card art-small art-bottom"><ChartNoAxesColumnIncreasing size={20} /><b>82%</b><span>match</span></div>
          <div className="art-document"><FileText size={26} /><span>CV</span></div>
        </div>
      </section>

      <section className="login-card">
        <div className="login-card-header">
          <div className="login-user-icon"><UserRoundCheck size={24} /></div>
          <div>
            <h2>Вход в систему</h2>
            <p>Дарья Попова</p>
          </div>
        </div>

        <form onSubmit={submit} className="login-form">
          <label>
            <span>Логин</span>
            <input value={login} onChange={(event) => setLogin(event.target.value)} placeholder="depopova" autoFocus />
          </label>
          <label>
            <span>Пароль</span>
            <input 
              type="password" 
              value={password} 
              onChange={(event) => setPassword(event.target.value)} 
              placeholder="••••••••" 
            />
          </label>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" disabled={loading}>{loading ? 'вход...' : <>войти <ArrowRight size={18} /></>}</button>
        </form>
      </section>
    </main>
  );
}

function ProtectedRoute({ children }) {
  const [session] = useState(() => {
    const saved = localStorage.getItem('hr-session');
    return saved ? JSON.parse(saved) : null;
  });

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppLayout({ children }) {
  const [session] = useState(() => {
    const saved = localStorage.getItem('hr-session');
    return saved ? JSON.parse(saved) : null;
  });

  const logout = () => {
    localStorage.removeItem('hr-session');
    window.location.href = '/';
  };

  return (
    <div className="app-shell">
      <Sidebar user={session.user} />
      <main className="workspace">
        <Topbar user={session.user} onLogout={logout} />
        <div className="single-page-workspace">
          {children}
        </div>
      </main>
    </div>
  );
}

// Root компонент приложения с React Router
export default function App() {
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem('hr-session');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (nextSession) => {
    localStorage.setItem('hr-session', JSON.stringify(nextSession));
    setSession(nextSession);
  };

  if (!session) {
    return <LoginPage onLogin={login} />;
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
          <Route path="/candidates/:id" element={<CandidateDetailPage />} />
          <Route path="*" element={<Navigate to="/vacancies" replace />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
