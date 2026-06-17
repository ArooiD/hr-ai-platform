import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Plus, Trash2, Edit2, X, Check, Search, Mail, Phone, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { hrApi } from '../api/client';
import CandidateWizard from '../components/CandidateWizard';

const emptyCandidate = { full_name: '', email: '', phone: '', skills: '', experience_years: '', resume_text: '' };
const ITEMS_PER_PAGE = 12; // Количество элементов на странице

export default function CandidatesPage() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [candidate, setCandidate] = useState(emptyCandidate);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce для поиска (задержка 300мс)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Сброс на первую страницу при поиске
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  const filteredCandidates = useMemo(() => 
    candidates.filter(c => {
      const matchesSearch =
        c.full_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        c.email.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        c.skills?.some(s => s.toLowerCase().includes(debouncedSearch.toLowerCase()));

      return matchesSearch;
    }),
    [candidates, debouncedSearch]
  );

  // Вычисляем данные для текущей страницы
  const totalPages = Math.ceil(filteredCandidates.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentCandidates = filteredCandidates.slice(startIndex, endIndex);

  // Функции навигации по страницам
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

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
        <>
          <div style={{ marginBottom: '16px', fontSize: '14px', color: '#64748b' }}>
            Показано {startIndex + 1}-{Math.min(endIndex, filteredCandidates.length)} из {filteredCandidates.length} кандидатов
          </div>
          <div className="candidates-grid">
            {currentCandidates.map((c) => (
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
        
        {/* Пагинация */}
        {totalPages > 1 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '12px', 
            marginTop: '24px',
            padding: '16px',
            background: '#f8fafc',
            borderRadius: '12px'
          }}>
            <button
              className="icon-button"
              onClick={prevPage}
              disabled={currentPage === 1}
              style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
            >
              <ChevronLeft size={20} />
            </button>
            
            <span style={{ fontSize: '14px', fontWeight: '500' }}>
              Страница {currentPage} из {totalPages}
            </span>
            
            <button
              className="icon-button"
              onClick={nextPage}
              disabled={currentPage === totalPages}
              style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </>
      )}
    </div>
  );
}
