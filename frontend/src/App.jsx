import { useEffect, useState } from 'react';
import { ArrowRight, BriefcaseBusiness, CalendarCheck2, ChartNoAxesColumnIncreasing, FileText, UserRoundCheck, UsersRound, Users } from 'lucide-react';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import RecruitmentFlow from './pages/RecruitmentFlow';
import VacanciesPage from './pages/Vacancies';
import CandidatesPage from './pages/Candidates';
import AnalyticsPage from './pages/Analytics';
import VacancyDetailPage from './pages/VacancyDetail';
import { authApi } from './api/client';
import './styles.css';

function LoginPage({ onLogin }) {
  const [login, setLogin] = useState('depopova');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const session = await authApi.login({ login });
      onLogin(session);
    } catch (err) {
      setError('Для входа используйте логин depopova.');
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

          {error && <div className="login-error">{error}</div>}

          <button type="submit" disabled={loading}>{loading ? 'вход...' : <>войти <ArrowRight size={18} /></>}</button>
        </form>
      </section>
    </main>
  );
}

export default function App() {
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem('hr-session');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentPage, setCurrentPage] = useState('vacancies');
  const [selectedVacancyId, setSelectedVacancyId] = useState(null);

  const login = (nextSession) => {
    localStorage.setItem('hr-session', JSON.stringify(nextSession));
    setSession(nextSession);
  };

  const logout = () => {
    localStorage.removeItem('hr-session');
    setSession(null);
  };

  // Handle direct navigation to vacancy detail
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/vacancies/')) {
        const id = hash.split('/')[2];
        if (id) {
          setCurrentPage('vacancy-detail');
          setSelectedVacancyId(parseInt(id));
        }
      } else {
        setCurrentPage('vacancies');
        setSelectedVacancyId(null);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Check on mount

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (!session) {
    return <LoginPage onLogin={login} />;
  }

  const renderPage = () => {
    if (currentPage === 'vacancy-detail' && selectedVacancyId) {
      return <VacancyDetailPage id={selectedVacancyId} />;
    }
    
    switch (currentPage) {
      case 'vacancies':
        return <VacanciesPage />;
      case 'candidates':
        return <CandidatesPage />;
      case 'recruitment':
        return <RecruitmentFlow />;
      case 'analytics':
        return <AnalyticsPage />;
      default:
        return <VacanciesPage />;
    }
  };

  return (
    <div className="app-shell">
      <Sidebar user={session.user} currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="workspace">
        <Topbar user={session.user} onLogout={logout} />
        <div className="single-page-workspace">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
