import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Briefcase, MapPin, DollarSign, Calendar, Users, Edit2, Trash2 } from 'lucide-react';
import { hrApi } from '../../api/client';

export default function VacancyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vacancy, setVacancy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadVacancy = async () => {
      try {
        const allVacancies = await hrApi.vacancies();
        const found = allVacancies.find(v => v.id === parseInt(id));
        if (found) {
          setVacancy(found);
        } else {
          setError('Вакансия не найдена');
        }
      } catch (err) {
        setError('Ошибка при загрузке вакансии');
      } finally {
        setLoading(false);
      }
    };
    loadVacancy();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить эту вакансию?')) return;
    try {
      await hrApi.deleteVacancy(parseInt(id));
      navigate('/vacancies');
    } catch (err) {
      alert('Ошибка при удалении вакансии');
    }
  };

  const handleEdit = () => {
    navigate('/vacancies');
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">Загрузка...</div>
      </div>
    );
  }

  if (error || !vacancy) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p>{error || 'Вакансия не найдена'}</p>
          <button onClick={() => navigate('/vacancies')}>← Вернуться к списку</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            className="icon-button" 
            onClick={() => navigate('/vacancies')}
            style={{ width: '40px', height: '40px' }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>{vacancy.title}</h1>
            <p style={{ color: '#64748b' }}>Детали вакансии</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="secondary-button" onClick={handleEdit}>
            <Edit2 size={18} /> Редактировать
          </button>
          <button className="secondary-button danger" onClick={handleDelete}>
            <Trash2 size={18} /> Удалить
          </button>
        </div>
      </div>

      {/* Status Badge */}
      <div style={{ marginBottom: '24px' }}>
        <span className={`status-badge ${vacancy.status}`} style={{ padding: '8px 16px', fontSize: '14px' }}>
          {vacancy.status === 'open' ? '✓ Открыта для кандидатов' : '✗ Закрыта'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Main Content */}
        <div style={{ display: 'grid', gap: '24px' }}>
          {/* Description */}
          <div className="card">
            <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Briefcase size={20} /> Описание вакансии
            </h2>
            <div style={{ lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
              {vacancy.description || 'Описание отсутствует'}
            </div>
          </div>

          {/* Requirements */}
          {vacancy.required_skills?.length > 0 && (
            <div className="card">
              <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} /> Требуемые навыки
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {vacancy.required_skills.map((skill) => (
                  <span key={skill} className="skill-tag" style={{ padding: '8px 16px', fontSize: '14px' }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'grid', gap: '16px' }}>
          {/* Info Card */}
          <div className="card">
            <h3 style={{ marginBottom: '16px' }}>Информация</h3>
            
            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <MapPin size={20} color="#64748b" style={{ marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Отдел</div>
                  <div style={{ fontWeight: '500' }}>{vacancy.department}</div>
                </div>
              </div>

              {(vacancy.salary_from || vacancy.salary_to) && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <DollarSign size={20} color="#166534" style={{ marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Зарплата</div>
                    <div style={{ fontWeight: '500', color: '#166534' }}>
                      {vacancy.salary_from && `${Number(vacancy.salary_from).toLocaleString()} ₽`}
                      {vacancy.salary_to && ` - ${Number(vacancy.salary_to).toLocaleString()} ₽`}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <Calendar size={20} color="#64748b" style={{ marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Статус</div>
                  <div style={{ fontWeight: '500' }}>
                    {vacancy.status === 'open' ? 'Открыта' : 'Закрыта'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 style={{ marginBottom: '16px' }}>Действия</h3>
            <div style={{ display: 'grid', gap: '8px' }}>
              <button 
                className="primary-button"
                onClick={() => navigate(`/candidates`)}
                style={{ justifyContent: 'flex-start' }}
              >
                <Users size={16} style={{ marginRight: '8px' }} />
                Кандидаты
              </button>
              <button 
                className="secondary-button"
                onClick={() => navigate(`/analytics`)}
                style={{ justifyContent: 'flex-start' }}
              >
                <Briefcase size={16} style={{ marginRight: '8px' }} />
                Статистика
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
