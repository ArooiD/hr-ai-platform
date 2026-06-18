import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Calendar, Code, FileText, Edit2, Trash2 } from 'lucide-react';
import { hrApi } from '../../api/client';

export default function CandidateDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCandidate = async () => {
      try {
        // Загружаем конкретного кандидата по ID
        const candidateData = await hrApi.getCandidate(parseInt(id));
        setCandidate(candidateData);
      } catch (err) {
        if (err.message.includes('404')) {
          setError('Кандидат не найден');
        } else {
          setError('Ошибка при загрузке кандидата: ' + err.message);
        }
      } finally {
        setLoading(false);
      }
    };
    loadCandidate();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить этого кандидата?')) return;
    try {
      await hrApi.deleteCandidate(parseInt(id));
      navigate('/candidates');
    } catch (err) {
      alert('Ошибка при удалении кандидата');
    }
  };

  const handleEdit = () => {
    navigate('/candidates');
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">Загрузка...</div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p>{error || 'Кандидат не найден'}</p>
          <button className="primary-button" onClick={() => navigate('/candidates')}>
            ← Вернуться к списку
          </button>
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
            onClick={() => navigate('/candidates')}
            style={{ width: '40px', height: '40px' }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>{candidate.full_name}</h1>
            <p style={{ color: '#64748b' }}>Детали кандидата</p>
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

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Main Content */}
        <div style={{ display: 'grid', gap: '24px' }}>
          {/* Resume */}
          <div className="card">
            <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} /> Резюме
            </h2>
            <div style={{ lineHeight: '1.8', whiteSpace: 'pre-wrap', background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
              {candidate.resume_text || 'Резюме отсутствует'}
            </div>
          </div>

          {/* Skills */}
          {candidate.skills?.length > 0 && (
            <div className="card">
              <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Code size={20} /> Навыки
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {candidate.skills.map((skill) => (
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
          {/* Contact Info */}
          <div className="card">
            <h3 style={{ marginBottom: '16px' }}>Контакты</h3>
            
            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <User size={20} color="#64748b" style={{ marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>ФИО</div>
                  <div style={{ fontWeight: '500' }}>{candidate.full_name}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <Mail size={20} color="#0b73ff" style={{ marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Email</div>
                  <div style={{ fontWeight: '500' }}>{candidate.email}</div>
                </div>
              </div>

              {candidate.phone && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <Phone size={20} color="#166534" style={{ marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Телефон</div>
                    <div style={{ fontWeight: '500' }}>{candidate.phone}</div>
                  </div>
                </div>
              )}

              {candidate.experience_years && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <Calendar size={20} color="#64748b" style={{ marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Опыт работы</div>
                    <div style={{ fontWeight: '500' }}>{candidate.experience_years} лет</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 style={{ marginBottom: '16px' }}>Действия</h3>
            <div style={{ display: 'grid', gap: '8px' }}>
              <button 
                className="primary-button"
                onClick={() => navigate('/recruitment')}
                style={{ justifyContent: 'flex-start' }}
              >
                <Calendar size={16} style={{ marginRight: '8px' }} />
                Создать заявку
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
