import { Bell, LogOut, Search } from 'lucide-react';

export default function Topbar({ user, onLogout }) {
  return (
    <header className="topbar">
      <div className="breadcrumbs">главная / hr-платформа / подбор</div>
      <div className="top-actions">
        <span><Search size={18} /> поиск</span>
        <span><Bell size={18} /> уведомления</span>
        <span>{user?.full_name || 'Дарья Попова'}</span>
        <button className="logout-button" onClick={onLogout}><LogOut size={16} /> выйти</button>
      </div>
    </header>
  );
}
