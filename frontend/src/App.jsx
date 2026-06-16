import { useState } from 'react';
import { BriefcaseBusiness, Sparkles, UserRoundCheck } from 'lucide-react';
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
      setError('Для demo-входа используйте логин depopova.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-hero">
        <div className="login-logo"><BriefcaseBusiness size={26} /></div>
        <p className="login-kicker">HR AI Platform</p>
        <h1>Единый контур подбора персонала</h1>
        <p>Вакансии, кандидаты, AI-анализ, интервью и pipeline найма в одном рабочем пространстве HR-команды.</p>
        <div className="login-feature"><Sparkles size={18} /> AI-модуль работает в demo-режиме</div>
      </section>

      <section className="login-card">
        <div className="login-card-header">
          <UserRoundCheck size={24} />
          <div>
            <h2>Вход в систему</h2>
            <p>Демо-пользователь: Дарья Попова</p>
          </div>
        </div>

        <form onSubmit={submit} className="login-form">
          <label>
            Логин
            <input value={login} onChange={(event) => setLogin(event.target.value)} placeholder="depopova" autoFocus />
          </label>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" disabled={loading}>{loading ? 'вход...' : 'войти как Дарья Попова'}</button>
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
