import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Briefcase, Users, BarChart3 } from 'lucide-react';

const mobileNavItems = [
  { path: '/dashboard', icon: Home, label: 'Главная' },
  { path: '/vacancies', icon: Briefcase, label: 'Вакансии' },
  { path: '/candidates', icon: Users, label: 'Кандидаты' },
  { path: '/recruitment', icon: Briefcase, label: 'Подбор' },
  { path: '/analytics', icon: BarChart3, label: 'Аналитика' },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="mobile-bottom-nav">
      {mobileNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        
        return (
          <button
            key={item.path}
            className={`mobile-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
            type="button"
          >
            <Icon size={22} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
