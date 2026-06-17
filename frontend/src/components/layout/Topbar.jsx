import { Bell, LogOut, Search, Menu } from 'lucide-react';

export default function Topbar({ user, onLogout, onToggleSidebar }) {
  return (
    <header className="topbar" id="topbar">
      <div className="topbar-left" id="topbar-left">
        <button 
          className="sidebar-toggle-mobile" 
          onClick={onToggleSidebar}
          id="topbar-sidebar-toggle"
          title="Переключить меню"
        >
          <Menu size={20} />
        </button>
        <div className="breadcrumbs" id="topbar-breadcrumbs">главная / hr-платформа / подбор</div>
      </div>
      <div className="top-actions" id="topbar-actions">
        <span className="search-btn" id="topbar-search">
          <Search size={18} /> поиск
        </span>
        <span className="notifications-btn" id="topbar-notifications">
          <Bell size={18} /> уведомления
        </span>
        <span className="user-name" id="topbar-user-name">{user?.full_name || 'Дарья Попова'}</span>
        <button className="logout-button" onClick={onLogout} id="topbar-logout">
          <LogOut size={16} /> выйти
        </button>
      </div>
    </header>
  );
}
