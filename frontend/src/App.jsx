import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  Gem,
  GraduationCap,
  LayoutGrid,
  Menu,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Users,
  Wallet,
} from 'lucide-react';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const stages = ['new', 'screening', 'interview', 'offer', 'hired', 'rejected'];
const stageLabels = {
  new: 'новые',
  screening: 'скрининг',
  interview: 'интервью',
  offer: 'оффер',
  hired: 'наняты',
  rejected: 'отказ',
};

const people = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=160&h=160&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&h=160&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=160&h=160&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&h=160&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=160&h=160&fit=crop&crop=face',
];

function Sidebar() {
  const favorite = [
    ['Аналитика', BarChart3],
    ['Моя команда', Users],
    ['Замещения', CalendarDays],
  ];
  const common = [
    ['Оценка 5+', Star],
    ['Моё здоровье', ShieldCheck],
    ['Документы', FileText],
    ['Моя карьера', Target],
    ['Подбор талантов', BriefcaseBusiness],
    ['Мой доход', Wallet],
    ['SberU', GraduationCap],
  ];

  return (
    <aside className="sidebar">
      <div className="brand-row">
        <div className="brand">пульс</div>
        <Menu size={20} />
      </div>

      <div className="profile">
        <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=180&h=180&fit=crop&crop=face" alt="profile" />
        <strong>София Бродская</strong>
        <span>HR business partner</span>
      </div>

      <nav className="nav-section">
        <a><LayoutGrid size={17} /> все приложения</a>
      </nav>

      <nav className="nav-section">
        <p>избранные</p>
        {favorite.map(([label, Icon]) => <a key={label}><Icon size={17} /> {label}</a>)}
      </nav>

      <nav className="nav-section">
        <p>часто используемые</p>
        {common.map(([label, Icon]) => <a key={label}><Icon size={17} /> {label}</a>)}
      </nav>

      <div className="support"><MessageCircle size={16} /> поддержка</div>
    </aside>
  );
}

function Topbar() {
  return (
    <header className="topbar">
      <div className="breadcrumbs">главная / hr-платформа / подбор</div>
      <div className="top-actions">
        <span><Search size={18} /> поиск</span>
        <span><Bell size={18} /> уведомления</span>
      </div>
    </header>
  );
}

function TaskCards() {
  return (
    <section className="section-block">
      <div className="section-title">
        <h2>задачи</h2>
        <button className="round-plus">+</button>
        <a>все</a>
      </div>
      <div className="task-grid">
        <article className="task-card">
          <span>подтверждение запроса</span>
          <h3>Согласовать вакансию Middle Python Developer</h3>
          <p>20.09 — 24.09</p>
        </article>
        <article className="task-card">
          <span>ознакомление</span>
          <h3>Проверить AI-рекомендации по кандидатам</h3>
          <p>25.09</p>
        </article>
      </div>
    </section>
  );
}

function PeopleBlock({ candidates }) {
  const visible = candidates.length ? candidates : people.map((url, index) => ({ id: index + 1, avatar: url, full_name: `Кандидат ${index + 1}` }));

  return (
    <section className="section-block">
      <div className="section-title people-title">
        <div>
          <h2>люди</h2>
          <p>HR-платформа · прямые кандидаты</p>
        </div>
        <a>посмотреть структуру</a>
      </div>
      <div className="people-grid">
        {visible.slice(0, 14).map((person, index) => (
          <img
            key={person.id || index}
            src={person.avatar || people[index % people.length]}
            title={person.full_name}
            alt={person.full_name}
          />
        ))}
      </div>
    </section>
  );
}

function Analytics({ dashboard }) {
  const hired = dashboard?.applications_by_stage?.hired || 0;
  const total = dashboard?.applications || 0;
  const score = dashboard?.avg_ai_score || 0;
  const hiredPercent = total ? Math.round((hired / total) * 100) : 0;

  return (
    <section className="section-block">
      <div className="section-title">
        <h2>аналитика</h2>
      </div>
      <div className="analytics-card">
        <div>
          <p className="metric-label">фактическая воронка</p>
          <div className="donut" style={{ '--value': `${hiredPercent * 3.6}deg` }}>
            <strong>{hiredPercent}</strong><span>%</span>
          </div>
          <small>нанято из всех откликов</small>
        </div>
        <div>
          <p className="metric-label">AI соответствие</p>
          <div className="donut violet" style={{ '--value': `${score * 3.6}deg` }}>
            <strong>{score}</strong><span>%</span>
          </div>
          <small>средний match score</small>
        </div>
        <div className="analytics-list">
          <p><b>{dashboard?.open_vacancies || 0}</b> открытых вакансий</p>
          <p><b>{dashboard?.candidates || 0}</b> кандидатов</p>
          <p><b>{dashboard?.applications || 0}</b> откликов</p>
        </div>
      </div>
    </section>
  );
}

function Pipeline({ applications, onAnalyze, onStage }) {
  const grouped = useMemo(() => {
    const result = Object.fromEntries(stages.map((stage) => [stage, []]));
    applications.forEach((item) => result[item.stage]?.push(item));
    return result;
  }, [applications]);

  return (
    <section className="section-block">
      <div className="section-title">
        <h2>подбор талантов</h2>
        <button className="blue-button">создать кандидата</button>
      </div>
      <div className="pipeline">
        {stages.map((stage) => (
          <div className="pipeline-column" key={stage}>
            <div className="pipeline-head">
              <span>{stageLabels[stage]}</span>
              <b>{grouped[stage].length}</b>
            </div>
            {grouped[stage].map((application) => (
              <article className="candidate-card" key={application.id}>
                <div className="candidate-head">
                  <img src={people[application.id % people.length]} alt="candidate" />
                  <div>
                    <strong>Кандидат #{application.candidate_id}</strong>
                    <p>Вакансия #{application.vacancy_id}</p>
                  </div>
                </div>
                <div className="score-row">
                  <Sparkles size={16} />
                  <span>AI score</span>
                  <b>{application.ai_analysis?.score ?? '—'}</b>
                </div>
                {application.ai_analysis && <p className="ai-summary">{application.ai_analysis.recommendation}</p>}
                <div className="card-actions">
                  <button onClick={() => onAnalyze(application.id)}>AI-анализ</button>
                  <select value={application.stage} onChange={(event) => onStage(application.id, event.target.value)}>
                    {stages.map((item) => <option key={item} value={item}>{stageLabels[item]}</option>)}
                  </select>
                </div>
              </article>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function RightRail() {
  return (
    <aside className="right-rail">
      <div className="learning-card">
        <h3>хотите закрывать вакансии эффективнее?</h3>
        <p>AI-подсказки помогут быстрее находить сильных кандидатов.</p>
        <div className="learning-illustration"><GraduationCap size={54} /><Sparkles size={38} /></div>
      </div>
      <div className="birthday-card">
        <h3>события</h3>
        <div className="event-card">
          <span>сегодня</span>
          <img src={people[2]} alt="event" />
          <b>Оксана Новикова</b>
          <p>интервью в 15:00</p>
          <div>👏 24 &nbsp; 😊 13 &nbsp; 🎂 19</div>
        </div>
      </div>
      <div className="goals-card">
        <h3>цели</h3>
        <div className="goal-progress"><span style={{ width: '53%' }} /></div>
        <p>Продажа HR-платформы внешним клиентам — тест</p>
      </div>
    </aside>
  );
}

async function api(path, options) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) throw new Error(`Request failed: ${path}`);
  return response.json();
}

export default function App() {
  const [dashboard, setDashboard] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [applications, setApplications] = useState([]);

  const loadData = async () => {
    const [dashboardData, candidatesData, applicationsData] = await Promise.all([
      api('/api/dashboard'),
      api('/api/candidates'),
      api('/api/applications'),
    ]);
    setDashboard(dashboardData);
    setCandidates(candidatesData);
    setApplications(applicationsData);
  };

  const seed = async () => {
    await api('/api/demo-seed', { method: 'POST' });
    await loadData();
  };

  const analyze = async (id) => {
    await api(`/api/applications/${id}/analyze`, { method: 'POST' });
    await loadData();
  };

  const updateStage = async (id, stage) => {
    await api(`/api/applications/${id}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ stage }),
    });
    await loadData();
  };

  useEffect(() => {
    loadData().catch(() => {});
  }, []);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="workspace">
        <Topbar />
        <div className="workspace-grid">
          <section className="content">
            <div className="hero-row">
              <div>
                <h1>HR-платформа</h1>
                <p>Подбор, адаптация, аналитика и AI-рекомендации в одном рабочем пространстве.</p>
              </div>
              <button className="blue-button" onClick={seed}>создать demo-данные</button>
            </div>
            <TaskCards />
            <PeopleBlock candidates={candidates} />
            <Analytics dashboard={dashboard || {}} />
            <Pipeline applications={applications} onAnalyze={analyze} onStage={updateStage} />
          </section>
          <RightRail />
        </div>
      </main>
    </div>
  );
}
