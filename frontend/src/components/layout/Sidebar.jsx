import { BarChart3, BriefcaseBusiness, CalendarDays, Menu, MessageCircle, Users } from 'lucide-react';

export default function Sidebar({ user, currentPage, setCurrentPage }) {
  const navItems = [
    { label: 'Вакансии', icon: BriefcaseBusiness, id: 'vacancies' },
    { label: 'Кандидаты', icon: Users, id: 'candidates' },
    { label: 'Подбор', icon: CalendarDays, id: 'recruitment' },
    { label: 'Аналитика', icon: BarChart3, id: 'analytics' },
  ];

  return (
    <aside className="sidebar">
      <div className="brand-row"><div className="brand-neutral">HR AI</div><Menu size={20} /></div>
      <div className="profile">
        <div className="profile-avatar">ДП</div>
        <strong>{user?.full_name || 'Дарья Попова'}</strong>
        <span>{user?.role || 'HR business partner'}</span>
        <small>{user?.login || 'dapopova'}</small>
      </div>
      <nav className="nav-section">
        <p>основное</p>
        {navItems.map(({label, icon: Icon, id}) => (
          <a key={id} className={currentPage === id ? 'active' : ''} onClick={() => setCurrentPage(id)}>
            <Icon size={17} /> {label}
          </a>
        ))}
      </nav>
      <div className="support"><MessageCircle size={16}/> поддержка</div>
    </aside>
  );
}
