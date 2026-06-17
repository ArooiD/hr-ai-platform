import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Plus, Trash2, Edit2, X, Check, Search, Mail, Phone, Calendar } from 'lucide-react';
import { hrApi } from '../api/client';
import CandidateWizard from '../components/CandidateWizard';

const emptyCandidate = { full_name: '', email: '', phone: '', skills: '', experience_years: '', resume_text: '' };

export default function CandidatesPage() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [candidate, setCandidate] = useState(emptyCandidate);
  const [searchQuery, setSearchQuery] = useState('');

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
    setShowWizard(false);
  };

  const handleCreate = () => {
    setCandidate(emptyCandidate);
    setEditingId(null);
    setShowWizard(true);
  };

  const handleEdit = (c) => {
    setCandidate({
      ...c,
      experience_years: c.experience_years || '',
      skills: c.skills?.join(', ') || '',
    });
    setEditingId(c.id);
    setShowWizard(true);
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

  const handleSaveCandidate = async (candidateData) => {
    const payload = {
      full_name: candidateData.full_name,
      email: candidateData.email,
      phone: candidateData.phone || null,
      skills: typeof candidateData.skills === 'string' 
        ? candidateData.skills.split(',').map(s => s.trim()).filter(Boolean)
        : candidateData.skills,
      experience_years: candidateData.experience_years ? Number(candidateData.experience_years) : 0,
      resume_text: candidateData.resume_text || '',
    };

    try {
      if (editingId) {
        await hrApi.updateCandidate(editingId, payload);
      } else {
        await hrApi.createCandidate(payload);
      }
      setShowWizard(false);
      setEditingId(null);
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

    return matchesSearch;
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

      <div className="search-bar">
        <Search size={18} />
        <input
          type="text"
          placeholder="Поиск по имени, email или навыкам..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {showWizard && (
        <CandidateWizard 
          onClose={() => setShowWizard(false)} 
          onSave={handleSaveCandidate}
          initialData={editingId ? candidate : null}
          editingId={editingId}
        />
      )}

      {loading ? (
        <div className="loading-state">Загрузка...</div>
      ) : filteredCandidates.length === 0 ? (
        <div className="empty-state">
          <UserPlus size={48} />
          <p>Кандидатов не найдено</p>
        </div>
      ) : (
        <div className="candidates-grid">
          {filteredCandidates.map((c) => (
            <div 
              key={c.id} 
              className="card candidate-card"
              onClick={() => navigate(`/candidates/${c.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className="candidate-avatar">
                {getInitials(c.full_name)}
              </div>
              <div className="card-body">
                <h3>{c.full_name}</h3>
                <div className="contact-info">
                  <span><Mail size={14} /> {c.email}</span>
                </div>
                <div className="candidate-meta">
                  <span><Calendar size={14} /> {c.experience_years} лет опыта</span>
                </div>
                {c.skills?.length > 0 && (
                  <div className="skills">
                    {c.skills.slice(0, 3).map((skill) => (
                      <span key={skill} className="skill-tag">{skill}</span>
                    ))}
                    {c.skills.length > 3 && (
                      <span className="skill-tag">+{c.skills.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="card-actions" onClick={(e) => e.stopPropagation()}>
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
