import { useEffect, useState } from 'react';
import { BriefcaseBusiness, Plus, Trash2, Edit2, X, Check, Search } from 'lucide-react';
import { hrApi } from '../api/client';
import VacancyWizard from '../components/VacancyWizard';

const emptyVacancy = { title: '', department: '', description: '', required_skills: '', salary_from: '', salary_to: '' };

export default function VacanciesPage() {
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [vacancy, setVacancy] = useState(emptyVacancy);
  const [searchQuery, setSearchQuery] = useState('');

  const loadVacancies = async () => {
    try {
      const data = await hrApi.vacancies();
      setVacancies(data);
    } catch (err) {
      console.error('Failed to load vacancies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVacancies();
  }, []);

  const handleCreate = () => {
    setEditingId(null);
    setVacancy(emptyVacancy);
    setShowWizard(true);
  };

  const handleEdit = (v) => {
    setVacancy({
      ...v,
      salary_from: v.salary_from || '',
      salary_to: v.salary_to || '',
      required_skills: v.required_skills.join(', '),
    });
    setEditingId(v.id);
    setShowWizard(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Вы уверены, что хотите удалить эту вакансию?')) return;
    try {
      await hrApi.deleteVacancy(id);
      await loadVacancies();
    } catch (err) {
      alert('Ошибка при удалении вакансии');
    }
  };

  const handleSaveVacancy = async (vacancyData) => {
    const payload = {
      title: vacancyData.title,
      department: vacancyData.department,
      description: vacancyData.description,
      required_skills: vacancyData.required_skills.split(',').map(s => s.trim()).filter(Boolean),
      salary_from: vacancyData.salary_from ? Number(vacancyData.salary_from) : null,
      salary_to: vacancyData.salary_to ? Number(vacancyData.salary_to) : null,
    };

    try {
      if (editingId) {
        await hrApi.updateVacancy(editingId, payload);
      } else {
        await hrApi.createVacancy(payload);
      }
      await loadVacancies();
    } catch (err) {
      throw new Error('Ошибка при сохранении вакансии');
    }
  };

  const filteredVacancies = vacancies.filter(v =>
    v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1><BriefcaseBusiness size={24} /> Вакансии</h1>
          <p>Управление вакансиями компании</p>
        </div>
        <button className="primary-button" onClick={handleCreate}>
          <Plus size={18} /> Добавить вакансию
        </button>
      </div>

      <div className="search-bar">
        <Search size={18} />
        <input
          type="text"
          placeholder="Поиск по названию или отделу..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {showWizard && (
        <VacancyWizard 
          onClose={() => setShowWizard(false)}
          onSave={handleSaveVacancy}
        />
      )}

      {loading ? (
        <div className="loading-state">Загрузка...</div>
      ) : filteredVacancies.length === 0 ? (
        <div className="empty-state">
          <BriefcaseBusiness size={48} />
          <p>Вакансий не найдено</p>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>Нажмите кнопку выше, чтобы создать первую вакансию</p>
        </div>
      ) : (
        <div className="cards-grid">
          {filteredVacancies.map((v) => (
            <div 
              key={v.id} 
              className="card vacancy-card"
              style={{ cursor: 'pointer' }}
              onClick={() => (window.location.hash = `#/vacancies/${v.id}`)}
            >
              <div className="card-header">
                <h3 style={{ marginBottom: '8px' }}>{v.title}</h3>
                <span className={`status-badge ${v.status}`}>{v.status === 'open' ? 'Открыта' : 'Закрыта'}</span>
              </div>
              <div className="card-body">
                <p className="department" style={{ marginBottom: '8px' }}>
                  <strong>Отдел:</strong> {v.department}
                </p>
                {(v.salary_from || v.salary_to) && (
                  <p className="salary" style={{ marginBottom: '8px', color: '#166534', fontWeight: '500' }}>
                    {v.salary_from && `${Number(v.salary_from).toLocaleString()} ₽`}
                    {v.salary_to && ` - ${Number(v.salary_to).toLocaleString()} ₽`}
                  </p>
                )}
                {v.required_skills?.length > 0 && (
                  <div className="skills" style={{ marginTop: '8px' }}>
                    {v.required_skills.slice(0, 3).map((skill) => (
                      <span key={skill} className="skill-tag">{skill}</span>
                    ))}
                    {v.required_skills.length > 3 && (
                      <span className="skill-tag" style={{ background: '#f1f5f9', color: '#64748b' }}>
                        +{v.required_skills.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="card-footer" style={{ 
                marginTop: '12px', 
                paddingTop: '12px', 
                borderTop: '1px solid #e2e8f0',
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Подробнее →
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button 
                    className="icon-button" 
                    onClick={(e) => { e.stopPropagation(); handleEdit(v); }} 
                    title="Редактировать"
                    style={{ padding: '4px' }}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    className="icon-button danger" 
                    onClick={(e) => { e.stopPropagation(); handleDelete(v.id); }} 
                    title="Удалить"
                    style={{ padding: '4px' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
