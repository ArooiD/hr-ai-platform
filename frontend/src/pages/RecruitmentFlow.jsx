import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Award, Brain, BriefcaseBusiness, Calendar, CheckCircle2, FileQuestion, Plus, Sparkles, Target, UserPlus, UsersRound } from 'lucide-react';
import { hrApi } from '../api/client';
import { stages, stageLabels } from '../data/constants';

const stageView = {
  new: { color: '#2563eb', bg: '#dbeafe', border: '#bfdbfe', label: 'новый поток' },
  screening: { color: '#7c3aed', bg: '#ede9fe', border: '#ddd6fe', label: 'первичный отбор' },
  interview: { color: '#d97706', bg: '#fef3c7', border: '#fde68a', label: 'требует встречи' },
  offer: { color: '#c2410c', bg: '#ffedd5', border: '#fed7aa', label: 'согласование' },
  hired: { color: '#15803d', bg: '#dcfce7', border: '#bbf7d0', label: 'закрытие' },
  rejected: { color: '#b91c1c', bg: '#fee2e2', border: '#fecaca', label: 'выбыл' },
};

const vacancyStatuses = {
  open: { label: 'открыта', color: '#15803d', bg: '#dcfce7' },
  closed: { label: 'закрыта', color: '#64748b', bg: '#f1f5f9' },
};

const normalize = (value) => String(value || '').trim().toLowerCase();
const initials = (name = '') => name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();

function calculateCandidateMatch(candidate, vacancy) {
  if (!candidate || !vacancy) return { score: 0, matchedSkills: [], missedSkills: [], reason: 'Выберите объект подбора' };
  const requiredSkills = vacancy.required_skills || [];
  const candidateSkills = candidate.skills || [];
  const candidateSkillSet = new Set(candidateSkills.map(normalize));
  const matchedSkills = requiredSkills.filter(skill => candidateSkillSet.has(normalize(skill)));
  const missedSkills = requiredSkills.filter(skill => !candidateSkillSet.has(normalize(skill)));
  const skillScore = requiredSkills.length ? Math.round((matchedSkills.length / requiredSkills.length) * 70) : 45;
  const experienceScore = Math.min(25, Number(candidate.experience_years || 0) * 5);
  const resumeText = normalize(candidate.resume_text);
  const titleTokens = normalize(vacancy.title).split(/\s+/).filter(token => token.length > 3);
  const contextScore = titleTokens.some(token => resumeText.includes(token)) ? 5 : 0;
  const score = Math.min(100, skillScore + experienceScore + contextScore);
  let reason = 'Слабое соответствие: лучше оставить в резерве.';
  if (score >= 80) reason = 'Высокое соответствие: стоит сразу создать отклик и перевести на скрининг.';
  else if (score >= 55) reason = 'Среднее соответствие: можно создать отклик и проверить на первичном интервью.';
  return { score, matchedSkills, missedSkills, reason };
}

function getScoreView(score) {
  if (score >= 80) return { color: '#15803d', bg: '#dcfce7', border: '#bbf7d0', label: 'сильное соответствие' };
  if (score >= 55) return { color: '#d97706', bg: '#fef3c7', border: '#fde68a', label: 'нужно проверить' };
  return { color: '#b91c1c', bg: '#fee2e2', border: '#fecaca', label: 'резерв' };
}

export default function RecruitmentPage() {
  const [vacancies, setVacancies] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedVacancy, setSelectedVacancy] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [selectedVacancyFilter, setSelectedVacancyFilter] = useState('all');
  const [selectedCandidateCenter, setSelectedCandidateCenter] = useState('');
  const [matchingMode, setMatchingMode] = useState('vacancy');
  const [questions, setQuestions] = useState([]);
  const [message, setMessage] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [filterStage, setFilterStage] = useState('all');
  const [activeTab, setActiveTab] = useState('matching');

  const load = async () => {
    try {
      const [vacancyData, candidateData, applicationData] = await Promise.all([
        hrApi.vacancies(), hrApi.candidates(), hrApi.applications(),
      ]);
      setVacancies(vacancyData);
      setCandidates(candidateData);
      setApplications(applicationData);
      if ((!selectedVacancyFilter || selectedVacancyFilter === 'all') && vacancyData.length) {
        const firstOpenVacancy = vacancyData.find(v => v.status !== 'closed') || vacancyData[0];
        setSelectedVacancyFilter(String(firstOpenVacancy.id));
      }
      if (!selectedCandidateCenter && candidateData.length) setSelectedCandidateCenter(String(candidateData[0].id));
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

  const createApplicationForCandidate = async (candidateId) => {
    if (selectedVacancyFilter === 'all') return setMessage('Сначала выберите конкретную вакансию');
    await hrApi.createApplication({ candidate_id: Number(candidateId), vacancy_id: Number(selectedVacancyFilter) });
    setMessage('Отклик создан из подбора кандидатов');
    setActiveTab('pipeline');
    await load();
  };

  const createApplicationForVacancy = async (vacancyId) => {
    if (!selectedCandidateCenter) return setMessage('Сначала выберите кандидата');
    await hrApi.createApplication({ candidate_id: Number(selectedCandidateCenter), vacancy_id: Number(vacancyId) });
    setSelectedVacancyFilter(String(vacancyId));
    setMessage('Отклик создан из подбора вакансий для кандидата');
    setActiveTab('pipeline');
    await load();
  };

  const analyze = async (id) => { await hrApi.analyzeApplication(id); setMessage('AI-анализ выполнен'); await load(); };
  const updateStage = async (id, stage) => { await hrApi.updateApplicationStage(id, stage); setMessage(`Кандидат переведён на этап: ${stageLabels[stage]}`); await load(); };
  const loadQuestions = async (id) => { const data = await hrApi.interviewQuestions(id); setQuestions(data.questions || []); setActiveTab('questions'); };

  const selectedVacancyObject = useMemo(() => selectedVacancyFilter === 'all' ? null : vacancies.find(v => v.id === Number(selectedVacancyFilter)), [vacancies, selectedVacancyFilter]);
  const selectedCandidateObject = useMemo(() => candidates.find(c => c.id === Number(selectedCandidateCenter)), [candidates, selectedCandidateCenter]);

  const vacancyStats = useMemo(() => vacancies.map((vacancy) => {
    const vacancyApplications = applications.filter(app => app.vacancy_id === vacancy.id);
    const active = vacancyApplications.filter(app => !['hired', 'rejected'].includes(app.stage));
    const hired = vacancyApplications.filter(app => app.stage === 'hired');
    return { vacancy, total: vacancyApplications.length, active: active.length, hired: hired.length };
  }), [vacancies, applications]);

  const visibleApplications = useMemo(() => applications.filter((app) => {
    const stageOk = filterStage === 'all' || app.stage === filterStage;
    const vacancyOk = selectedVacancyFilter === 'all' || app.vacancy_id === Number(selectedVacancyFilter);
    return stageOk && vacancyOk;
  }), [applications, filterStage, selectedVacancyFilter]);

  const matchedCandidates = useMemo(() => {
    if (!selectedVacancyObject) return [];
    return candidates.map(candidate => ({
      candidate,
      existingApplication: applications.find(app => app.candidate_id === candidate.id && app.vacancy_id === selectedVacancyObject.id),
      match: calculateCandidateMatch(candidate, selectedVacancyObject),
    })).sort((a, b) => b.match.score - a.match.score);
  }, [candidates, applications, selectedVacancyObject]);

  const matchedVacancies = useMemo(() => {
    if (!selectedCandidateObject) return [];
    return vacancies.map(vacancy => ({
      vacancy,
      existingApplication: applications.find(app => app.candidate_id === selectedCandidateObject.id && app.vacancy_id === vacancy.id),
      match: calculateCandidateMatch(selectedCandidateObject, vacancy),
    })).sort((a, b) => b.match.score - a.match.score);
  }, [vacancies, applications, selectedCandidateObject]);

  const stats = useMemo(() => {
    const byStage = { new: 0, screening: 0, interview: 0, offer: 0, hired: 0, rejected: 0 };
    visibleApplications.forEach(app => { byStage[app.stage] = (byStage[app.stage] || 0) + 1; });
    return byStage;
  }, [visibleApplications]);

  const openVacancies = vacancyStats.filter(item => item.vacancy.status !== 'closed');
  const vacanciesWithoutCandidates = openVacancies.filter(item => item.active === 0 && item.hired === 0);
  const candidatesInWork = applications.filter(app => !['hired', 'rejected'].includes(app.stage)).length;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Подбор</h1>
          <p>Двусторонний AI matching: вакансия → кандидаты и кандидат → вакансии</p>
        </div>
        <button className="primary-button" onClick={() => setShowLinkModal(true)}><Plus size={18} /> Создать отклик</button>
      </div>

      {message && <div style={{ marginBottom: '20px', padding: '12px 16px', borderRadius: '12px', background: '#d1fae5', color: '#065f46' }}>{message}</div>}

      <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '18px' }}>
        <div className="card" style={{ borderLeft: '5px solid #2563eb' }}><div style={{ display: 'flex', gap: 10, color: '#2563eb', fontWeight: 900 }}><BriefcaseBusiness size={20} /> Открытые вакансии</div><div style={{ marginTop: 10, fontSize: 30, fontWeight: 900 }}>{openVacancies.length}</div><div style={{ color: '#64748b', fontSize: 13 }}>позиции требуют управления подбором</div></div>
        <div className="card" style={{ borderLeft: '5px solid #d97706' }}><div style={{ display: 'flex', gap: 10, color: '#d97706', fontWeight: 900 }}><AlertTriangle size={20} /> Без активных кандидатов</div><div style={{ marginTop: 10, fontSize: 30, fontWeight: 900 }}>{vacanciesWithoutCandidates.length}</div><div style={{ color: '#64748b', fontSize: 13 }}>нужно добавить кандидатов или закрыть вакансию</div></div>
        <div className="card" style={{ borderLeft: '5px solid #15803d' }}><div style={{ display: 'flex', gap: 10, color: '#15803d', fontWeight: 900 }}><UsersRound size={20} /> Кандидаты в работе</div><div style={{ marginTop: 10, fontSize: 30, fontWeight: 900 }}>{candidatesInWork}</div><div style={{ color: '#64748b', fontSize: 13 }}>не наняты и не отклонены</div></div>
      </div>

      <div className="card" style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button className={matchingMode === 'vacancy' ? 'primary-button' : 'secondary-button'} onClick={() => { setMatchingMode('vacancy'); setActiveTab('matching'); }}>Вакансия как центр</button>
          <button className={matchingMode === 'candidate' ? 'primary-button' : 'secondary-button'} onClick={() => { setMatchingMode('candidate'); setActiveTab('matching'); }}>Кандидат как центр</button>
        </div>

        {matchingMode === 'vacancy' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}><div><h2 style={{ margin: 0, fontSize: 20 }}>Вакансия как центр подбора</h2><p style={{ margin: '4px 0 0', color: '#64748b' }}>Выберите вакансию — ниже появятся кандидаты из базы, отсортированные по релевантности.</p></div><button className="secondary-button" onClick={() => { setSelectedVacancyFilter('all'); setActiveTab('pipeline'); }}>Все вакансии</button></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 12 }}>
              {vacancyStats.map(({ vacancy, total, active, hired }) => {
                const status = vacancyStatuses[vacancy.status] || vacancyStatuses.open;
                const selected = selectedVacancyFilter === String(vacancy.id);
                return <button key={vacancy.id} type="button" onClick={() => { setSelectedVacancyFilter(String(vacancy.id)); setActiveTab('matching'); }} style={{ textAlign: 'left', border: selected ? '2px solid #0b73ff' : '1px solid var(--line)', borderRadius: 16, background: selected ? '#eff6ff' : '#fff', padding: 14, cursor: 'pointer' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><strong>{vacancy.title}</strong><span style={{ borderRadius: 999, padding: '4px 10px', background: status.bg, color: status.color, fontSize: 12, fontWeight: 900 }}>{status.label}</span></div><div style={{ marginTop: 5, color: '#64748b', fontSize: 13 }}>{vacancy.department}</div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}><span><b>{total}</b><small style={{ display: 'block', color: '#64748b' }}>всего</small></span><span><b>{active}</b><small style={{ display: 'block', color: '#64748b' }}>в работе</small></span><span><b>{hired}</b><small style={{ display: 'block', color: '#64748b' }}>нанято</small></span></div></button>;
              })}
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}><div><h2 style={{ margin: 0, fontSize: 20 }}>Кандидат как центр подбора</h2><p style={{ margin: '4px 0 0', color: '#64748b' }}>Выберите кандидата — ниже появятся подходящие вакансии, чтобы не терять людей из резерва.</p></div></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 12 }}>
              {candidates.map(candidate => {
                const selected = selectedCandidateCenter === String(candidate.id);
                const activeApps = applications.filter(app => app.candidate_id === candidate.id && !['hired', 'rejected'].includes(app.stage));
                return <button key={candidate.id} type="button" onClick={() => { setSelectedCandidateCenter(String(candidate.id)); setActiveTab('matching'); }} style={{ textAlign: 'left', border: selected ? '2px solid #0b73ff' : '1px solid var(--line)', borderRadius: 16, background: selected ? '#eff6ff' : '#fff', padding: 14, cursor: 'pointer' }}><div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><div className="candidate-avatar" style={{ width: 42, height: 42, margin: 0, fontSize: 14 }}>{initials(candidate.full_name)}</div><div><strong>{candidate.full_name}</strong><div style={{ color: '#64748b', fontSize: 13 }}>{candidate.experience_years || 0} лет опыта · {activeApps.length} в работе</div></div></div><div className="skills" style={{ marginTop: 10 }}>{(candidate.skills || []).slice(0, 4).map(skill => <span key={skill} className="skill-tag">{skill}</span>)}</div></button>;
              })}
            </div>
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--line)', paddingBottom: 12 }}>
        <button className={activeTab === 'matching' ? 'primary-button' : 'secondary-button'} onClick={() => setActiveTab('matching')} style={{ padding: '8px 16px' }}>{matchingMode === 'candidate' ? 'Подобрать вакансии' : 'Подобрать кандидатов'}</button>
        <button className={activeTab === 'pipeline' ? 'primary-button' : 'secondary-button'} onClick={() => setActiveTab('pipeline')} style={{ padding: '8px 16px' }}>Pipeline откликов</button>
        <button className={activeTab === 'questions' ? 'primary-button' : 'secondary-button'} onClick={() => setActiveTab('questions')} style={{ padding: '8px 16px' }}>Вопросы интервью</button>
      </div>

      {activeTab === 'matching' && matchingMode === 'vacancy' && (
        <div className="card" style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 18 }}><div><h2 style={{ display: 'flex', gap: 10, margin: 0 }}><Sparkles size={22} /> Подбор кандидатов под вакансию</h2><p style={{ margin: '6px 0 0', color: '#64748b' }}>{selectedVacancyObject ? `${selectedVacancyObject.title} · ${selectedVacancyObject.department}` : 'Выберите конкретную вакансию выше'}</p></div>{selectedVacancyObject && <div style={{ minWidth: 260, border: '1px solid var(--line)', borderRadius: 14, padding: 12, background: '#f8fafc' }}><strong>Требуемые навыки</strong><div className="skills" style={{ marginTop: 8 }}>{(selectedVacancyObject.required_skills || []).map(skill => <span key={skill} className="skill-tag">{skill}</span>)}</div></div>}</div>
          {!selectedVacancyObject ? <div className="empty-state"><BriefcaseBusiness size={42} /><p>Выберите вакансию, чтобы увидеть релевантных кандидатов</p></div> : <div style={{ display: 'grid', gap: 14 }}>{matchedCandidates.map(({ candidate, existingApplication, match }) => <MatchCandidateRow key={candidate.id} candidate={candidate} existingApplication={existingApplication} match={match} vacancyClosed={selectedVacancyObject.status === 'closed'} onCreate={() => createApplicationForCandidate(candidate.id)} onOpen={() => { setActiveTab('pipeline'); setFilterStage(existingApplication.stage); }} />)}</div>}
        </div>
      )}

      {activeTab === 'matching' && matchingMode === 'candidate' && (
        <div className="card" style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 18 }}><div><h2 style={{ display: 'flex', gap: 10, margin: 0 }}><Sparkles size={22} /> Подбор вакансий под кандидата</h2><p style={{ margin: '6px 0 0', color: '#64748b' }}>{selectedCandidateObject ? `${selectedCandidateObject.full_name} · ${selectedCandidateObject.experience_years || 0} лет опыта` : 'Выберите кандидата выше'}</p></div>{selectedCandidateObject && <div style={{ minWidth: 260, border: '1px solid var(--line)', borderRadius: 14, padding: 12, background: '#f8fafc' }}><strong>Навыки кандидата</strong><div className="skills" style={{ marginTop: 8 }}>{(selectedCandidateObject.skills || []).map(skill => <span key={skill} className="skill-tag">{skill}</span>)}</div></div>}</div>
          {!selectedCandidateObject ? <div className="empty-state"><UserPlus size={42} /><p>Выберите кандидата, чтобы увидеть подходящие вакансии</p></div> : <div style={{ display: 'grid', gap: 14 }}>{matchedVacancies.map(({ vacancy, existingApplication, match }) => <MatchVacancyRow key={vacancy.id} vacancy={vacancy} existingApplication={existingApplication} match={match} onCreate={() => createApplicationForVacancy(vacancy.id)} onOpen={() => { setSelectedVacancyFilter(String(vacancy.id)); setActiveTab('pipeline'); setFilterStage(existingApplication.stage); }} />)}</div>}
        </div>
      )}

      {activeTab === 'pipeline' && (
        <>
          <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)', marginBottom: 20 }}>{stages.map(stage => { const view = stageView[stage]; return <button key={stage} type="button" onClick={() => setFilterStage(stage)} className="card" style={{ padding: 16, textAlign: 'center', borderColor: filterStage === stage ? view.color : view.border, background: filterStage === stage ? view.bg : '#fff' }}><div style={{ fontSize: 24, fontWeight: 900, color: view.color }}>{stats[stage] || 0}</div><div style={{ fontSize: 12, color: view.color, marginTop: 4, fontWeight: 900 }}>{stageLabels[stage]}</div><div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{view.label}</div></button>; })}</div>
          <div className="filters-bar"><div className="filter-group"><label>Этап</label><select value={filterStage} onChange={(e) => setFilterStage(e.target.value)}><option value="all">Все этапы</option>{stages.map(stage => <option key={stage} value={stage}>{stageLabels[stage]}</option>)}</select></div><div className="filter-group"><label>Вакансия</label><select value={selectedVacancyFilter} onChange={(e) => setSelectedVacancyFilter(e.target.value)}><option value="all">Все вакансии</option>{vacancies.map(v => <option key={v.id} value={v.id}>{v.title}</option>)}</select></div></div>
          <div className="card"><div style={{ display: 'grid', gap: 16 }}>{visibleApplications.map(application => { const vacancy = vacancies.find(v => v.id === application.vacancy_id); const candidate = candidates.find(c => c.id === application.candidate_id); const view = stageView[application.stage] || stageView.new; return <div key={application.id} style={{ padding: 16, borderRadius: 14, border: `1px solid ${view.border}`, background: '#fff', boxShadow: '0 8px 24px rgba(15,23,42,.04)' }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}><div><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><b>Отклик #{application.id}</b><span className="status-badge" style={{ background: view.bg, color: view.color }}>{stageLabels[application.stage]}</span></div><div style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>{candidate?.full_name || 'Кандидат'} → {vacancy?.title || 'Вакансия'}</div></div><div style={{ display: 'flex', gap: 8 }}><button className="icon-button" onClick={() => analyze(application.id)} title="AI-анализ"><Brain size={16} /></button><button className="icon-button" onClick={() => loadQuestions(application.id)} title="Вопросы интервью"><FileQuestion size={16} /></button><select value={application.stage} onChange={(e) => updateStage(application.id, e.target.value)} style={{ padding: 8, borderRadius: 8, border: `1px solid ${view.border}`, fontSize: 13, background: view.bg, color: view.color, fontWeight: 800 }}>{stages.map(stage => <option key={stage} value={stage}>{stageLabels[stage]}</option>)}</select></div></div>{application.ai_analysis && <div style={{ padding: 12, borderRadius: 10, background: application.ai_analysis.score >= 70 ? '#dcfce7' : application.ai_analysis.score >= 45 ? '#fef3c7' : '#fee2e2', marginTop: 12 }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, color: application.ai_analysis.score >= 70 ? '#166534' : application.ai_analysis.score >= 45 ? '#92400e' : '#991b1b' }}><Award size={16} /><strong>AI Score: {application.ai_analysis.score}%</strong></div><div style={{ fontSize: 13, color: '#334155', marginTop: 4 }}>{application.ai_analysis.recommendation}</div></div>}</div>; })}{!visibleApplications.length && <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}><Target size={48} style={{ marginBottom: 12, opacity: 0.5 }} /><p>Нет откликов под выбранные фильтры</p><button className="primary-button" onClick={() => setActiveTab('matching')} style={{ marginTop: 12 }}><Sparkles size={18} /> Вернуться к подбору</button></div>}</div></div>
        </>
      )}

      {activeTab === 'questions' && <div className="card"><h2 style={{ marginBottom: 16 }}><FileQuestion size={20} style={{ marginRight: 8 }} /> Вопросы для интервью</h2><div className="question-list">{questions.map((question, idx) => <div key={idx}>{idx + 1}. {question}</div>)}{!questions.length && <p style={{ color: '#9ca3af', textAlign: 'center', padding: 40 }}>Нажмите "Вопросы интервью" у отклика, чтобы получить AI-план интервью</p>}</div></div>}

      {showLinkModal && <div className="modal-overlay" onClick={() => setShowLinkModal(false)}><div className="modal-content" onClick={(e) => e.stopPropagation()}><div className="modal-header"><h2><CheckCircle2 size={20} style={{ marginRight: 8 }} /> Создать отклик</h2><button className="icon-button" onClick={() => setShowLinkModal(false)}>✕</button></div><div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}><div className="form-group"><label>Вакансия</label><select value={selectedVacancy} onChange={(e) => setSelectedVacancy(e.target.value)}><option value="">Выберите вакансию</option>{vacancies.filter(v => v.status !== 'closed').map(v => <option key={v.id} value={v.id}>{v.title}</option>)}</select></div><div className="form-group"><label>Кандидат</label><select value={selectedCandidate} onChange={(e) => setSelectedCandidate(e.target.value)}><option value="">Выберите кандидата</option>{candidates.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}</select></div><div className="form-actions"><button type="button" className="secondary-button" onClick={() => setShowLinkModal(false)}>Отмена</button><button type="button" className="primary-button" onClick={createApplication} disabled={!selectedVacancy || !selectedCandidate} style={{ opacity: (!selectedVacancy || !selectedCandidate) ? 0.5 : 1 }}>Создать отклик</button></div></div></div></div>}
    </div>
  );
}

function MatchCandidateRow({ candidate, existingApplication, match, vacancyClosed, onCreate, onOpen }) {
  const view = getScoreView(match.score);
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px 190px', gap: 16, alignItems: 'center', border: `1px solid ${view.border}`, borderRadius: 16, padding: 16, background: '#fff' }}><div><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div className="candidate-avatar" style={{ width: 42, height: 42, margin: 0, fontSize: 14 }}>{initials(candidate.full_name)}</div><div><strong>{candidate.full_name}</strong><div style={{ display: 'flex', gap: 12, color: '#64748b', fontSize: 13, marginTop: 3 }}><span><Calendar size={13} /> {candidate.experience_years || 0} лет опыта</span><span>{candidate.email}</span></div></div></div><div className="skills" style={{ marginTop: 12 }}>{(candidate.skills || []).slice(0, 7).map(skill => { const matched = match.matchedSkills.map(normalize).includes(normalize(skill)); return <span key={skill} className="skill-tag" style={{ background: matched ? '#dcfce7' : '#f1f5f9', color: matched ? '#166534' : '#64748b' }}>{skill}</span>; })}</div><p style={{ margin: '10px 0 0', color: '#475569', fontSize: 13 }}>{match.reason}</p>{!!match.missedSkills.length && <p style={{ margin: '6px 0 0', color: '#b91c1c', fontSize: 12 }}>Не хватает: {match.missedSkills.join(', ')}</p>}</div><ScoreCard match={match} view={view} /><div style={{ display: 'grid', gap: 8 }}>{existingApplication ? <><span className="status-badge" style={{ justifySelf: 'start', background: stageView[existingApplication.stage]?.bg, color: stageView[existingApplication.stage]?.color }}>уже в pipeline: {stageLabels[existingApplication.stage]}</span><button className="secondary-button" onClick={onOpen}>Открыть отклик</button></> : <button className="primary-button" onClick={onCreate} disabled={vacancyClosed} style={{ opacity: vacancyClosed ? 0.55 : 1 }}><UserPlus size={16} /> Создать отклик</button>}</div></div>;
}

function MatchVacancyRow({ vacancy, existingApplication, match, onCreate, onOpen }) {
  const view = getScoreView(match.score);
  const status = vacancyStatuses[vacancy.status] || vacancyStatuses.open;
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px 190px', gap: 16, alignItems: 'center', border: `1px solid ${view.border}`, borderRadius: 16, padding: 16, background: '#fff' }}><div><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}><div><strong>{vacancy.title}</strong><div style={{ color: '#64748b', fontSize: 13, marginTop: 3 }}>{vacancy.department}</div></div><span style={{ borderRadius: 999, padding: '4px 10px', background: status.bg, color: status.color, fontSize: 12, fontWeight: 900 }}>{status.label}</span></div><div className="skills" style={{ marginTop: 12 }}>{(vacancy.required_skills || []).slice(0, 7).map(skill => { const matched = match.matchedSkills.map(normalize).includes(normalize(skill)); return <span key={skill} className="skill-tag" style={{ background: matched ? '#dcfce7' : '#f1f5f9', color: matched ? '#166534' : '#64748b' }}>{skill}</span>; })}</div><p style={{ margin: '10px 0 0', color: '#475569', fontSize: 13 }}>{match.reason}</p>{!!match.missedSkills.length && <p style={{ margin: '6px 0 0', color: '#b91c1c', fontSize: 12 }}>Не хватает у кандидата: {match.missedSkills.join(', ')}</p>}</div><ScoreCard match={match} view={view} /><div style={{ display: 'grid', gap: 8 }}>{existingApplication ? <><span className="status-badge" style={{ justifySelf: 'start', background: stageView[existingApplication.stage]?.bg, color: stageView[existingApplication.stage]?.color }}>уже в pipeline: {stageLabels[existingApplication.stage]}</span><button className="secondary-button" onClick={onOpen}>Открыть отклик</button></> : <button className="primary-button" onClick={onCreate} disabled={vacancy.status === 'closed'} style={{ opacity: vacancy.status === 'closed' ? 0.55 : 1 }}><Plus size={16} /> Создать отклик</button>}</div></div>;
}

function ScoreCard({ match, view }) {
  return <div style={{ textAlign: 'center', borderRadius: 14, background: view.bg, color: view.color, padding: 12 }}><div style={{ fontSize: 28, fontWeight: 900 }}>{match.score}%</div><div style={{ fontSize: 12, fontWeight: 900 }}>{view.label}</div></div>;
}
