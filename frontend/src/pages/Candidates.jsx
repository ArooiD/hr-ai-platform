import { useEffect, useState } from 'react';
import { UserPlus, Plus, Trash2, Edit2, X, Check, Search, Mail, Phone, Calendar } from 'lucide-react';
import { hrApi } from '../api/client';

const emptyCandidate = { full_name: '', email: '', phone: '', skills: '', experience_years: '', resume_text: '' };

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [candidate, setCandidate] = useState(emptyCandidate);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterExperience, setFilterExperience] = useState('');

  const loadCandidates = async () => {
    try {
      const data = await hrApi.candidates();
      setCandidates(data);
    } catch (err) {
      console.error('Failed to load candidates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, []);

  const resetForm = () => {
    setCandidate(emptyCandidate);
    setEditingId(null);
    setShowForm(false);
  };

  const handleCreate = () => {
    setCandidate(emptyCandidate);
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (c) => {
    setCandidate({
      ...c,
      experience_years: c.experience_years || '',
      skills: c.skills?.join(', ') || '',
    });
    setEditingId(c.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Вы уверены, что хотите удалить этого кандидата?')) return;
    try {
      await hrApi.deleteCandidate(id);
      await loadCandidates();
    } catch (err) {
      alert('Ошибка при удалении кандидата');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      full_name: candidate.full_name,
      email: candidate.email,
      phone: candidate.phone || null,
      skills: candidate.skills.split(',').map(s => s.trim()).filter(Boolean),
      experience_years: candidate.experience_years ? Number(candidate.experience_years) : 0,
      resume_text: candidate.resume_text || '',
    };

    try {
      if (editingId) {
        await hrApi.updateCandidate(editingId, payload);
      } else {
        await hrApi.createCandidate(payload);
      }
      resetForm();
      await loadCandidates();
    } catch (err) {
      alert('Ошибка при сохранении кандидата');
    }
  };

  const filteredCandidates = candidates.filter(c => {
    const matchesSearch =
      c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.skills?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesExperience = !filterExperience || c.experience_years >= Number(filterExperience);

    return matchesSearch && matchesExperience;
  });

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1><UserPlus size={24} /> Кандидаты</h1>
          <p>База кандидатов на вакансии</p>
        </div>
        <button className="primary-button" onClick={handleCreate}>
          <Plus size={18} /> Добавить кандидата
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Поиск по имени, email или навыкам..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Мин. опыт:</label>
          <select value={filterExperience} onChange={(e) => setFilterExperience(e.target.value)}>
            <option value="">Любой</option>
            <option value="0">От 0 лет</option>
            <option value="1">От 1 года</option>
            <option value="2">От 2 лет</option>
            <option value="3">От 3 лет</option>
            <option value="5">От 5 лет</option>
          </select>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Редактировать кандидата' : 'Новый кандидат'}</h2>
              <button className="icon-button" onClick={resetForm}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="candidate-form">
              <div className="form-group">
                <label>ФИО *</label>
                <input
                  type="text"
                  value={candidate.full_name}
                  onChange={(e) => setCandidate({ ...candidate, full_name: e.target.value })}
                  required
                  placeholder="Иванов Иван Иванович"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={candidate.email}
                    onChange={(e) => setCandidate({ ...candidate, email: e.target.value })}
                    required
                    placeholder="ivan@example.com"
                  />
                </div>
                <div className="form-group">
                  <label>Телефон</label>
                  <input
                    type="tel"
                    value={candidate.phone}
                    onChange={(e) => setCandidate({ ...candidate, phone: e.target.value })}
                    placeholder="+7 900 000-00-00"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Опыт работы (лет)</label>
                  <input
                    type="number"
                    value={candidate.experience_years}
                    onChange={(e) => setCandidate({ ...candidate, experience_years: e.target.value })}
                    min="0"
                    placeholder="3"
                  />
                </div>
                <div className="form-group">
                  <label>Навыки (через запятую)</label>
                  <input
                    type="text"
                    value={candidate.skills}
                    onChange={(e) => setCandidate({ ...candidate, skills: e.target.value })}
                    placeholder="Python, FastAPI, PostgreSQL"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Резюме (кратко)</label>
                <textarea
                  value={candidate.resume_text}
                  onChange={(e) => setCandidate({ ...candidate, resume_text: e.target.value })}
                  placeholder="Краткое описание опыта и достижений..."
                  rows={4}
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
      ) : filteredCandidates.length === 0 ? (
        <div className="empty-state">
          <UserPlus size={48} />
          <p>Кандидатов не найдено</p>
          {!searchQuery && !filterExperience && <button onClick={handleCreate}>Добавить первого кандидата</button>}
        </div>
      ) : (
        <div className="candidates-grid">
          {filteredCandidates.map((c) => (
            <div key={c.id} className="card candidate-card">
              <div className="candidate-avatar">
                {getInitials(c.full_name)}
              </div>
              <div className="card-body">
                <h3>{c.full_name}</h3>
                <div className="contact-info">
                  <span><Mail size={14} /> {c.email}</span>
                  {c.phone && <span><Phone size={14} /> {c.phone}</span>}
                </div>
                <div className="candidate-meta">
                  <span><Calendar size={14} /> {c.experience_years} лет опыта</span>
                </div>
                {c.skills?.length > 0 && (
                  <div className="skills">
                    {c.skills.map((skill) => (
                      <span key={skill} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                )}
                {c.resume_text && (
                  <p className="resume-preview">{c.resume_text}</p>
                )}
              </div>
              <div className="card-actions">
                <button className="icon-button" onClick={() => handleEdit(c)} title="Редактировать">
                  <Edit2 size={16} />
                </button>
                <button className="icon-button danger" onClick={() => handleDelete(c.id)} title="Удалить">
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
