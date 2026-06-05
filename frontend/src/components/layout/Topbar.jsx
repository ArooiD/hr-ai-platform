import { Bell, Search } from 'lucide-react';

export default function Topbar() {
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
