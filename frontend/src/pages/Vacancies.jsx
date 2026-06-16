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
            <div key={v.id} className="card vacancy-card">
              <div className="card-header">
                <h3>{v.title}</h3>
                <span className={`status-badge ${v.status}`}>{v.status === 'open' ? 'Открыта' : 'Закрыта'}</span>
              </div>
              <div className="card-body">
                <p className="department"><strong>Отдел:</strong> {v.department}</p>
                <p className="description">{v.description}</p>
                {(v.salary_from || v.salary_to) && (
                  <p className="salary">
                    {v.salary_from && `${v.salary_from.toLocaleString()} ₽`}
                    {v.salary_to && ` - ${v.salary_to.toLocaleString()} ₽`}
                  </p>
                )}
                {v.required_skills?.length > 0 && (
                  <div className="skills">
                    {v.required_skills.map((skill) => (
                      <span key={skill} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="card-actions">
                <button className="icon-button" onClick={() => handleEdit(v)} title="Редактировать">
                  <Edit2 size={16} />
                </button>
                <button className="icon-button danger" onClick={() => handleDelete(v.id)} title="Удалить">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
