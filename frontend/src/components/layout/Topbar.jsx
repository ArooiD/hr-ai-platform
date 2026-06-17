import { Bell, LogOut, Search, Menu } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

export default function Topbar({ user, onLogout, onToggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Определяем текущий путь для хлебных крошек
  const getPathname = () => {
    const path = location.pathname;
    if (path === '/' || path === '/vacancies') return 'вакансии';
    if (path === '/candidates') return 'кандидаты';
    if (path === '/recruitment') return 'подбор';
    if (path === '/analytics') return 'аналитика';
    if (path === '/support') return 'поддержка';
    if (path.startsWith('/vacancies/')) return 'вакансия';
    if (path.startsWith('/candidates/')) return 'кандидат';
    return 'подбор';
  };

  const currentPath = getPathname();

  const breadcrumbs = [
    { label: 'главная', path: '/vacancies' },
    { label: currentPath, path: location.pathname, active: true }
  ];

  return (
    <header className="topbar" id="topbar">
      <div className="topbar-left" id="topbar-left">
        <button 
          className="sidebar-toggle-mobile" 
          onClick={onToggleSidebar}
          id="topbar-sidebar-toggle"
          title="Переключить меню"
          type="button"
        >
          <Menu size={20} />
        </button>
        <div className="breadcrumbs" id="topbar-breadcrumbs">
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="breadcrumb-item">
              {index > 0 && <span className="breadcrumb-separator"> / </span>}
              {crumb.active ? (
                <span className="breadcrumb-active">{crumb.label}</span>
              ) : (
                <Link 
                  to={crumb.path}
                  className="breadcrumb-link"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </div>
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
