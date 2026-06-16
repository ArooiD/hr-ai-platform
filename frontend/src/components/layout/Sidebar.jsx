import { BarChart3, BriefcaseBusiness, CalendarDays, FileText, GraduationCap, LayoutGrid, Menu, MessageCircle, ShieldCheck, Star, Target, Users, Wallet } from 'lucide-react';

export default function Sidebar({ user, currentPage, setCurrentPage }) {
  const favorite = [['Аналитика', BarChart3, 'analytics'], ['Моя команда', Users, 'team'], ['Замещения', CalendarDays, 'replacements']];
  const common = [['Оценка 5+', Star, 'rating'], ['Моё здоровье', ShieldCheck, 'health'], ['Документы', FileText, 'documents'], ['Моя карьера', Target, 'career'], ['Подбор талантов', BriefcaseBusiness, 'recruitment'], ['Мой доход', Wallet, 'income'], ['SberU', GraduationCap, 'sberu']];

  const navItems = [
    { label: 'Вакансии', icon: BriefcaseBusiness, id: 'vacancies' },
    { label: 'Кандидаты', icon: Users, id: 'candidates' },
    { label: 'Сценарий подбора', icon: CalendarDays, id: 'recruitment' },
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
      <nav className="nav-section"><p>основное</p>{navItems.map(({label, Icon, id}) => (
        <a key={id} className={currentPage === id ? 'active' : ''} onClick={() => setCurrentPage(id)}>
          <Icon size={17} /> {label}
        </a>
      ))}</nav>
      <nav className="nav-section"><p>избранные</p>{favorite.map(([label,Icon]) => <a key={label}><Icon size={17}/> {label}</a>)}</nav>
      <nav className="nav-section"><p>часто используемые</p>{common.map(([label,Icon]) => <a key={label}><Icon size={17}/> {label}</a>)}</nav>
      <div className="support"><MessageCircle size={16}/> поддержка</div>
    </aside>
  );
}
