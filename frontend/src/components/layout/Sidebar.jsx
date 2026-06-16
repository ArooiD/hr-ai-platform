import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, BriefcaseBusiness, CalendarDays, Menu, MessageCircle, Users } from 'lucide-react';

export default function Sidebar({ user }) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Вакансии', icon: BriefcaseBusiness, path: '/vacancies' },
    { label: 'Кандидаты', icon: Users, path: '/candidates' },
    { label: 'Подбор', icon: CalendarDays, path: '/recruitment' },
    { label: 'Аналитика', icon: BarChart3, path: '/analytics' },
  ];

  const isActive = (path) => {
    if (path === '/vacancies') {
      return location.pathname === '/vacancies' || location.pathname === '/';
    }
    return location.pathname === path;
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

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
        {navItems.map(({label, icon: Icon, path}) => (
          <a 
            key={path} 
            className={isActive(path) ? 'active' : ''} 
            onClick={() => handleNavigate(path)}
            style={{ cursor: 'pointer' }}
          >
            <Icon size={17} /> {label}
          </a>
        ))}
      </nav>
      <div className="support"><MessageCircle size={16}/> поддержка</div>
    </aside>
  );
}
