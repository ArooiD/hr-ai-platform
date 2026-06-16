import { useEffect, useState } from 'react';
import { BriefcaseBusiness, Plus, Trash2, Edit2, X, Check, Search } from 'lucide-react';
import { hrApi } from '../api/client';

const emptyVacancy = { title: '', department: '', description: '', required_skills: '', salary_from: '', salary_to: '' };

export default function VacanciesPage() {
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
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

  const resetForm = () => {
    setVacancy(emptyVacancy);
    setEditingId(null);
    setShowForm(false);
  };

  const handleCreate = () => {
    setVacancy(emptyVacancy);
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (v) => {
    setVacancy({
      ...v,
      salary_from: v.salary_from || '',
      salary_to: v.salary_to || '',
      required_skills: v.required_skills.join(', '),
    });
    setEditingId(v.id);
    setShowForm(true);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      title: vacancy.title,
      department: vacancy.department,
      description: vacancy.description,
      required_skills: vacancy.required_skills.split(',').map(s => s.trim()).filter(Boolean),
      salary_from: vacancy.salary_from ? Number(vacancy.salary_from) : null,
      salary_to: vacancy.salary_to ? Number(vacancy.salary_to) : null,
    };

    try {
      if (editingId) {
        await hrApi.updateVacancy(editingId, payload);
      } else {
        await hrApi.createVacancy(payload);
      }
      resetForm();
      await loadVacancies();
    } catch (err) {
      alert('Ошибка при сохранении вакансии');
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

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Редактировать вакансию' : 'Новая вакансия'}</h2>
              <button className="icon-button" onClick={resetForm}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="vacancy-form">
              <div className="form-group">
                <label>Название вакансии *</label>
                <input
                  type="text"
                  value={vacancy.title}
                  onChange={(e) => setVacancy({ ...vacancy, title: e.target.value })}
                  required
                  placeholder="Например: Middle Python Developer"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Отдел *</label>
                  <input
                    type="text"
                    value={vacancy.department}
                    onChange={(e) => setVacancy({ ...vacancy, department: e.target.value })}
                    required
                    placeholder="Например: IT"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Описание *</label>
                <textarea
                  value={vacancy.description}
                  onChange={(e) => setVacancy({ ...vacancy, description: e.target.value })}
                  required
                  placeholder="Описание обязанностей и требований..."
                  rows={4}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Зарплата от (руб.)</label>
                  <input
                    type="number"
                    value={vacancy.salary_from}
                    onChange={(e) => setVacancy({ ...vacancy, salary_from: e.target.value })}
                    placeholder="180000"
                  />
                </div>
                <div className="form-group">
                  <label>Зарплата до (руб.)</label>
                  <input
                    type="number"
                    value={vacancy.salary_to}
                    onChange={(e) => setVacancy({ ...vacancy, salary_to: e.target.value })}
                    placeholder="260000"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Навыки (через запятую)</label>
                <input
                  type="text"
                  value={vacancy.required_skills}
                  onChange={(e) => setVacancy({ ...vacancy, required_skills: e.target.value })}
                  placeholder="Python, FastAPI, Docker, SQL"
                />
              </div>

              <div className="form-actions">
                <button type="button" className="secondary-button" onClick={resetForm}>
                  Отмена
                </button>
                <button type="submit" className="primary-button">
                  <Check size={18} /> Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-state">Загрузка...</div>
      ) : filteredVacancies.length === 0 ? (
        <div className="empty-state">
          <BriefcaseBusiness size={48} />
          <p>Вакансий не найдено</p>
          {!searchQuery && <button onClick={handleCreate}>Создать первую вакансию</button>}
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
