import { BarChart3, BriefcaseBusiness, CalendarDays, FileText, GraduationCap, LayoutGrid, Menu, MessageCircle, ShieldCheck, Star, Target, Users, Wallet } from 'lucide-react';

export default function Sidebar({ user }) {
  const favorite = [['Аналитика', BarChart3], ['Моя команда', Users], ['Замещения', CalendarDays]];
  const common = [['Оценка 5+', Star], ['Моё здоровье', ShieldCheck], ['Документы', FileText], ['Моя карьера', Target], ['Подбор талантов', BriefcaseBusiness], ['Мой доход', Wallet], ['SberU', GraduationCap]];

  return (
    <aside className="sidebar">
      <div className="brand-row"><div className="brand-neutral">HR AI</div><Menu size={20} /></div>
      <div className="profile">
        <div className="profile-avatar">ДП</div>
        <strong>{user?.full_name || 'Дарья Попова'}</strong>
        <span>{user?.role || 'HR business partner'}</span>
        <small>{user?.login || 'dapopova'}</small>
      </div>
      <nav className="nav-section"><a><LayoutGrid size={17}/> все приложения</a></nav>
      <nav className="nav-section"><p>избранные</p>{favorite.map(([label,Icon]) => <a key={label}><Icon size={17}/> {label}</a>)}</nav>
      <nav className="nav-section"><p>часто используемые</p>{common.map(([label,Icon]) => <a key={label}><Icon size={17}/> {label}</a>)}</nav>
      <div className="support"><MessageCircle size={16}/> поддержка</div>
    </aside>
  );
}
