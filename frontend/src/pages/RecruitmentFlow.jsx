import { useEffect, useMemo, useState } from 'react';
import { Brain, CheckCircle2, FileQuestion, Plus, Award } from 'lucide-react';
import { hrApi } from '../api/client';
import { stages, stageLabels } from '../data/constants';

export default function RecruitmentPage() {
  const [vacancies, setVacancies] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedVacancy, setSelectedVacancy] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [questions, setQuestions] = useState([]);
  const [message, setMessage] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [filterStage, setFilterStage] = useState('all');
  const [activeTab, setActiveTab] = useState('pipeline');

  const load = async () => {
    try {
      const [vacancyData, candidateData, applicationData] = await Promise.all([
        hrApi.vacancies(),
        hrApi.candidates(),
        hrApi.applications(),
      ]);
      setVacancies(vacancyData);
      setCandidates(candidateData);
      setApplications(applicationData);
    } catch (error) {
      setMessage('Backend недоступен');
    }
  };

  useEffect(() => { load(); }, []);

  const createApplication = async () => {
    await hrApi.createApplication({ candidate_id: Number(selectedCandidate), vacancy_id: Number(selectedVacancy) });
    setShowLinkModal(false);
    setMessage('Отклик создан');
    await load();
  };

  const analyze = async (id) => {
    await hrApi.analyzeApplication(id);
    setMessage('AI-анализ выполнен');
    await load();
  };

  const updateStage = async (id, stage) => {
    await hrApi.updateApplicationStage(id, stage);
    setMessage(`Кандидат переведён на этап: ${stageLabels[stage]}`);
    await load();
  };

  const loadQuestions = async (id) => {
    const data = await hrApi.interviewQuestions(id);
    setQuestions(data.questions || []);
    setActiveTab('questions');
  };

  const filteredApplications = useMemo(() => {
    if (filterStage === 'all') return applications;
    return applications.filter(app => app.stage === filterStage);
  }, [applications, filterStage]);

  const stats = useMemo(() => {
    const byStage = { new: 0, screening: 0, interview: 0, offer: 0, hired: 0, rejected: 0 };
    applications.forEach(app => { byStage[app.stage] = (byStage[app.stage] || 0) + 1; });
    return byStage;
  }, [applications]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Подбор</h1>
          <p>Управление активными откликами и движением кандидатов по этапам</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="primary-button" onClick={() => setShowLinkModal(true)}>
            <Plus size={18} /> Создать отклик
          </button>
        </div>
      </div>

      {message && (
        <div style={{ marginBottom: '24px', padding: '12px 16px', borderRadius: '12px', background: '#d1fae5', color: '#065f46' }}>
          {message}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--line)', paddingBottom: '12px' }}>
        <button className={activeTab === 'pipeline' ? 'primary-button' : 'secondary-button'} onClick={() => setActiveTab('pipeline')} style={{ padding: '8px 16px' }}>
          Pipeline откликов
        </button>
        <button className={activeTab === 'questions' ? 'primary-button' : 'secondary-button'} onClick={() => setActiveTab('questions')} style={{ padding: '8px 16px' }}>
          Вопросы интервью
        </button>
      </div>

      {activeTab === 'pipeline' && (
        <>
          <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)', marginBottom: '24px' }}>
            {stages.map((stage) => (
              <div key={stage} className="card" style={{ padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '900', color: stage === 'hired' ? '#166534' : '#0b73ff' }}>
                  {stats[stage] || 0}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{stageLabels[stage]}</div>
              </div>
            ))}
          </div>

          <div className="filters-bar">
            <label>Фильтр по этапу:</label>
            <select value={filterStage} onChange={(e) => setFilterStage(e.target.value)}>
              <option value="all">Все отклики</option>
              {stages.map((stage) => <option key={stage} value={stage}>{stageLabels[stage]}</option>)}
            </select>
          </div>

          <div className="card">
            <div style={{ display: 'grid', gap: '16px' }}>
              {filteredApplications.map((application) => {
                const vacancy = vacancies.find(v => v.id === application.vacancy_id);
                const candidate = candidates.find(c => c.id === application.candidate_id);
                
                return (
                  <div key={application.id} style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--line)', background: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <b>Отклик #{application.id}</b>
                          <span className="status-badge" style={{ background: application.stage === 'hired' ? '#d1fae5' : '#dbeafe', color: application.stage === 'hired' ? '#065f46' : '#1e40af' }}>
                            {stageLabels[application.stage]}
                          </span>
                        </div>
                        <div style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
                          {candidate?.full_name || 'Кандидат'} → {vacancy?.title || 'Вакансия'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="icon-button" onClick={() => analyze(application.id)} title="AI-анализ">
                          <Brain size={16} />
                        </button>
                        <button className="icon-button" onClick={() => loadQuestions(application.id)} title="Вопросы интервью">
                          <FileQuestion size={16} />
                        </button>
                        <select value={application.stage} onChange={(e) => updateStage(application.id, e.target.value)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '13px' }}>
                          {stages.map((stage) => <option key={stage} value={stage}>{stageLabels[stage]}</option>)}
                        </select>
                      </div>
                    </div>

                    {application.ai_analysis && (
                      <div style={{ padding: '12px', borderRadius: '8px', background: '#f0fdf4', marginTop: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534' }}>
                          <Award size={16} />
                          <strong>AI Score: {application.ai_analysis.score}%</strong>
                        </div>
                        <div style={{ fontSize: '13px', color: '#166534', marginTop: '4px' }}>
                          {application.ai_analysis.recommendation}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {!filteredApplications.length && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                  <CheckCircle2 size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
                  <p>Нет откликов на выбранном этапе</p>
                  <button className="primary-button" onClick={() => setShowLinkModal(true)} style={{ marginTop: '12px' }}>
                    <Plus size={18} /> Создать отклик
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'questions' && (
        <div className="card">
          <h2 style={{ marginBottom: '16px' }}><FileQuestion size={20} style={{ marginRight: '8px' }} /> Вопросы для интервью</h2>
          <div className="question-list">
            {questions.map((question, idx) => (
              <div key={idx} style={{ padding: '12px', borderRadius: '8px', background: '#f9fafb', marginBottom: '8px' }}>
                {idx + 1}. {question}
              </div>
            ))}
            {!questions.length && (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: '40px' }}>
                Нажмите "Вопросы интервью" у отклика, чтобы получить AI-план интервью
              </p>
            )}
          </div>
        </div>
      )}

      {showLinkModal && (
        <div className="modal-overlay" onClick={() => setShowLinkModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><CheckCircle2 size={20} style={{ marginRight: '8px' }} /> Создать отклик</h2>
              <button className="icon-button" onClick={() => setShowLinkModal(false)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Вакансия</label>
                <select value={selectedVacancy} onChange={(e) => setSelectedVacancy(e.target.value)}>
                  <option value="">Выберите вакансию</option>
                  {vacancies.map((v) => <option key={v.id} value={v.id}>{v.title}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Кандидат</label>
                <select value={selectedCandidate} onChange={(e) => setSelectedCandidate(e.target.value)}>
                  <option value="">Выберите кандидата</option>
                  {candidates.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </select>
              </div>
              <div className="form-actions">
                <button type="button" className="secondary-button" onClick={() => setShowLinkModal(false)}>Отмена</button>
                <button type="button" className="primary-button" onClick={createApplication} disabled={!selectedVacancy || !selectedCandidate} style={{ opacity: (!selectedVacancy || !selectedCandidate) ? 0.5 : 1 }}>
                  Создать отклик
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
