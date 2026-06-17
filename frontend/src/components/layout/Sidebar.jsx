import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, BriefcaseBusiness, CalendarDays, Menu, X, MessageCircle, Users } from 'lucide-react';

export default function Sidebar({ user, isOpen, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Вакансии', icon: BriefcaseBusiness, path: '/vacancies', id: 'nav-vacancies' },
    { label: 'Кандидаты', icon: Users, path: '/candidates', id: 'nav-candidates' },
    { label: 'Подбор', icon: CalendarDays, path: '/recruitment', id: 'nav-recruitment' },
    { label: 'Аналитика', icon: BarChart3, path: '/analytics', id: 'nav-analytics' },
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
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`} id="main-sidebar">
      <div className="sidebar-header" id="sidebar-header">
        <div className="brand-row">
          <div className="brand-neutral" id="sidebar-brand">HR AI</div>
          <button 
            className="sidebar-toggle-btn" 
            onClick={onToggle}
            id="sidebar-toggle-btn"
            title={isOpen ? 'Скрыть меню' : 'Показать меню'}
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      <div className="profile" id="sidebar-profile">
        <div className="profile-avatar" id="profile-avatar">ДП</div>
        <strong id="profile-name">{user?.full_name || 'Дарья Попова'}</strong>
        <span id="profile-role">{user?.role || 'HR business partner'}</span>
        <small id="profile-login">{user?.login || 'dapopova'}</small>
      </div>
      <nav className="nav-section" id="sidebar-nav">
        <p id="nav-section-label">основное</p>
        {navItems.map(({label, icon: Icon, path, id}) => (
          <a 
            key={path} 
            id={id}
            className={isActive(path) ? 'active' : ''} 
            onClick={() => handleNavigate(path)}
            style={{ cursor: 'pointer' }}
          >
            <Icon size={17} /> {label}
          </a>
        ))}
      </nav>
      <div className="support" id="sidebar-support">
        <MessageCircle size={16} /> поддержка
      </div>
    </aside>
  );
}
