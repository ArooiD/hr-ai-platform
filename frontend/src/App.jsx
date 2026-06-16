import { useState } from 'react';
import { ArrowRight, BriefcaseBusiness, UserRoundCheck } from 'lucide-react';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import RecruitmentFlow from './pages/RecruitmentFlow';
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
      <section className="login-hero compact">
        <div className="login-brand">
          <div className="login-logo"><BriefcaseBusiness size={26} /></div>
          <span>HR Platform</span>
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

  const login = (nextSession) => {
    localStorage.setItem('hr-session', JSON.stringify(nextSession));
    setSession(nextSession);
  };

  const logout = () => {
    localStorage.removeItem('hr-session');
    setSession(null);
  };

  if (!session) {
    return <LoginPage onLogin={login} />;
  }

  return (
    <div className="app-shell">
      <Sidebar user={session.user} />
      <main className="workspace">
        <Topbar user={session.user} onLogout={logout} />
        <div className="single-page-workspace">
          <RecruitmentFlow />
        </div>
      </main>
    </div>
  );
}
