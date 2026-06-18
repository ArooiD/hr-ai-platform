import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Award, Brain, Briefcase, Calendar, CheckCircle2, FileQuestion, Plus, Search, Sparkles, Target, UserPlus, UsersRound } from 'lucide-react';
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

// Правила для каждого этапа: что нужно сделать для перехода дальше
const stageRules = {
  new: {
    title: 'Новый отклик',
    description: 'Первичная обработка',
    requiredActions: ['ai_analysis'],
    nextStage: 'screening',
    allowedTransitions: ['screening', 'rejected'],
    blockedActions: ['schedule_interview', 'make_offer'],
    helpText: 'Проведите AI-анализ и примите решение о прохождении скрининга',
    icon: Sparkles,
  },
  screening: {
    title: 'Скрининг',
    description: 'Первичный отбор кандидатов',
    requiredActions: ['hr_decision'],
    nextStage: 'interview',
    allowedTransitions: ['interview', 'rejected'],
    blockedActions: ['schedule_interview', 'make_offer'],
    helpText: 'Оцените резюме и решите: приглашать на интервью или отклонить',
    icon: Target,
  },
  interview: {
    title: 'Интервью',
    description: 'Проведение встреч',
    requiredActions: ['interview_scheduled', 'interview_feedback'],
    nextStage: 'offer',
    allowedTransitions: ['offer', 'rejected'],
    blockedActions: ['make_offer'],
    helpText: 'Назначьте дату интервью, получите обратную связь от интервьюера',
    icon: Calendar,
  },
  offer: {
    title: 'Оффер',
    description: 'Согласование условий',
    requiredActions: ['offer_prepared', 'offer_approved'],
    nextStage: 'hired',
    allowedTransitions: ['hired', 'rejected'],
    blockedActions: [],
    helpText: 'Подготовьте оффер, согласуйте зарплату и условия',
    icon: Award,
  },
  hired: {
    title: 'Нанят',
    description: 'Завершение процесса',
    requiredActions: [],
    nextStage: null,
    allowedTransitions: [],
    blockedActions: ['all'],
    helpText: 'Кандидат принят в команду',
    icon: CheckCircle2,
  },
  rejected: {
    title: 'Отклонён',
    description: 'Кандидат не прошел отбор',
    requiredActions: [],
    nextStage: null,
    allowedTransitions: [],
    blockedActions: ['all'],
    helpText: 'Кандидат не подошел по требованиям',
    icon: AlertTriangle,
  },
};

const vacancyStatuses = {
  open: { label: 'открыта', color: '#15803d', bg: '#dcfce7' },
  closed: { label: 'закрыта', color: '#64748b', bg: '#f1f5f9' },
};

const normalize = (value) => String(value || '').trim().toLowerCase();
const initials = (name = '') => name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();
const compactListStyle = { display: 'grid', gap: 8, maxHeight: 420, overflowY: 'auto', paddingRight: 6 };
const selectorLayoutStyle = { display: 'grid', gridTemplateColumns: '330px minmax(0, 1fr)', gap: 18, alignItems: 'start' };

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
  const [vacancySearch, setVacancySearch] = useState('');
  const [candidateSearch, setCandidateSearch] = useState('');
  const [questions, setQuestions] = useState([]);
  const [message, setMessage] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showCloseVacancyModal, setShowCloseVacancyModal] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [filterStage, setFilterStage] = useState('all');
  const [activeTab, setActiveTab] = useState('matching');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'kanban'
  const [draggedApp, setDraggedApp] = useState(null);

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
      if ((!selectedVacancyFilter || selectedVacancyFilter === 'all') && vacancyData.length) {
        const firstOpenVacancy = vacancyData.find(v => v.status !== 'closed') || vacancyData[0];
        setSelectedVacancyFilter(String(firstOpenVacancy.id));
      }
      if (!selectedCandidateCenter && candidateData.length) {
        setSelectedCandidateCenter(String(candidateData[0].id));
      }
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

  const openStageModal = (application) => {
    setSelectedApplication(application);
    setShowStageModal(true);
  };

  // Проверка: разрешён ли переход на этот этап
  const isTransitionAllowed = (currentStage, targetStage) => {
    if (currentStage === targetStage) return false;
    const rules = stageRules[currentStage];
    if (!rules) return false;
    
    // Если blockedActions = ['all'], переходы запрещены
    if (rules.blockedActions.includes('all')) return false;
    
    // Проверяем, разрешён ли переход
    return rules.allowedTransitions.includes(targetStage);
  };

  // Получить список доступных этапов для перехода
  const getAvailableStages = (currentStage) => {
    const rules = stageRules[currentStage];
    if (!rules || rules.blockedActions.includes('all')) return [];
    return rules.allowedTransitions;
  };

  // Получить информацию о требуемых действиях
  const getRequiredActions = (currentStage) => {
    const rules = stageRules[currentStage];
    return rules?.requiredActions || [];
  };

  const confirmStageChange = async (newStage) => {
    if (!selectedApplication) return;
    
    // Проверка разрешения перехода
    if (!isTransitionAllowed(selectedApplication.stage, newStage)) {
      setMessage(`Переход с "${stageLabels[selectedApplication.stage]}" на "${stageLabels[newStage]}" не разрешён`);
      return;
    }
    
    try {
      await hrApi.updateApplicationStage(selectedApplication.id, newStage);
      setMessage(`Кандидат ${candidates.find(c => c.id === selectedApplication.candidate_id)?.full_name} переведён на этап: ${stageLabels[newStage]}`);
      setShowStageModal(false);
      setSelectedApplication(null);
      await load();
    } catch (err) {
      console.error('Ошибка при смене этапа:', err);
      setMessage('Ошибка при изменении этапа');
    }
  };

  // Drag-and-drop handlers для Kanban
  const handleDragStart = (e, application) => {
    setDraggedApp(application);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetStage) => {
    e.preventDefault();
    
    if (!draggedApp) return;
    
    // Проверка разрешения перехода
    if (!isTransitionAllowed(draggedApp.stage, targetStage)) {
      setMessage(`Переход с "${stageLabels[draggedApp.stage]}" на "${stageLabels[targetStage]}" не разрешён`);
      setDraggedApp(null);
      return;
    }
    
    try {
      await hrApi.updateApplicationStage(draggedApp.id, targetStage);
      setMessage(`Кандидат перемещён на этап: ${stageLabels[targetStage]}`);
      await load();
    } catch (err) {
      console.error('Ошибка при перемещении:', err);
      setMessage('Ошибка при перемещении кандидата');
    } finally {
      setDraggedApp(null);
    }
  };

  const closeVacancy = async () => {
    if (!selectedVacancyObject) return;
    try {
      await hrApi.closeVacancy(selectedVacancyObject.id);
      setMessage(`Вакансия "${selectedVacancyObject.title}" закрыта`);
      setShowCloseVacancyModal(false);
      await load();
    } catch (err) {
      console.error('Ошибка при закрытии вакансии:', err);
      setMessage('Ошибка при закрытии вакансии');
    }
  };

  const loadQuestions = async (id) => {
    const data = await hrApi.interviewQuestions(id);
    setQuestions(data.questions || []);
    setActiveTab('questions');
  };

  const selectedVacancyObject = useMemo(() => selectedVacancyFilter === 'all' ? null : vacancies.find(v => v.id === Number(selectedVacancyFilter)), [vacancies, selectedVacancyFilter]);
  const selectedCandidateObject = useMemo(() => candidates.find(c => c.id === Number(selectedCandidateCenter)), [candidates, selectedCandidateCenter]);

  const vacancyStats = useMemo(() => vacancies.map((vacancy) => {
    const vacancyApplications = applications.filter(app => app.vacancy_id === vacancy.id);
    const active = vacancyApplications.filter(app => !['hired', 'rejected'].includes(app.stage));
    const hired = vacancyApplications.filter(app => app.stage === 'hired');
    return { vacancy, total: vacancyApplications.length, active: active.length, hired: hired.length };
  }), [vacancies, applications]);

  const candidateStats = useMemo(() => candidates.map((candidate) => {
    const candidateApplications = applications.filter(app => app.candidate_id === candidate.id);
    const active = candidateApplications.filter(app => !['hired', 'rejected'].includes(app.stage));
    const interviews = candidateApplications.filter(app => app.stage === 'interview');
    const offers = candidateApplications.filter(app => app.stage === 'offer');
    return { candidate, total: candidateApplications.length, active: active.length, interviews: interviews.length, offers: offers.length };
  }), [candidates, applications]);

  const selectedVacancyStats = useMemo(() => vacancyStats.find(item => item.vacancy.id === selectedVacancyObject?.id), [vacancyStats, selectedVacancyObject]);
  const selectedCandidateStats = useMemo(() => candidateStats.find(item => item.candidate.id === selectedCandidateObject?.id), [candidateStats, selectedCandidateObject]);

  const filteredVacancyStats = useMemo(() => {
    const q = normalize(vacancySearch);
    if (!q) return vacancyStats;
    return vacancyStats.filter(({ vacancy }) => normalize(`${vacancy.title} ${vacancy.department} ${(vacancy.required_skills || []).join(' ')}`).includes(q));
  }, [vacancyStats, vacancySearch]);

  const filteredCandidateStats = useMemo(() => {
    const q = normalize(candidateSearch);
    if (!q) return candidateStats;
    return candidateStats.filter(({ candidate }) => normalize(`${candidate.full_name} ${candidate.email} ${(candidate.skills || []).join(' ')}`).includes(q));
  }, [candidateStats, candidateSearch]);

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
          <h1><Calendar size={26} style={{ marginRight: 12, verticalAlign: 'middle' }} /> Подбор</h1>
          <p>Двусторонний AI matching: вакансия → кандидаты и кандидат → вакансии</p>
        </div>
        <button className="primary-button" onClick={() => setShowLinkModal(true)}><Plus size={18} /> Создать отклик</button>
      </div>

      {message && <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 12, background: '#d1fae5', color: '#065f46' }}>{message}</div>}

      <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 18 }}>
        <SummaryCard color="#2563eb" icon={<Briefcase size={20} />} title="Открытые вакансии" value={openVacancies.length} text="позиции требуют управления подбором" />
        <SummaryCard color="#d97706" icon={<AlertTriangle size={20} />} title="Без активных кандидатов" value={vacanciesWithoutCandidates.length} text="нужно добавить кандидатов или закрыть вакансию" />
        <SummaryCard color="#15803d" icon={<UsersRound size={20} />} title="Кандидаты в работе" value={candidatesInWork} text="не наняты и не отклонены" />
      </div>

      <div className="card" style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button className={matchingMode === 'vacancy' ? 'primary-button' : 'secondary-button'} onClick={() => { setMatchingMode('vacancy'); setActiveTab('matching'); }}>Вакансия как центр</button>
          <button className={matchingMode === 'candidate' ? 'primary-button' : 'secondary-button'} onClick={() => { setMatchingMode('candidate'); setActiveTab('matching'); }}>Кандидат как центр</button>
        </div>

        <div style={selectorLayoutStyle}>
          {matchingMode === 'vacancy' ? (
            <VacancySelector vacancyStats={filteredVacancyStats} selectedVacancyFilter={selectedVacancyFilter} search={vacancySearch} setSearch={setVacancySearch} onSelect={(id) => { setSelectedVacancyFilter(String(id)); setActiveTab('matching'); }} />
          ) : (
            <CandidateSelector candidateStats={filteredCandidateStats} selectedCandidateCenter={selectedCandidateCenter} search={candidateSearch} setSearch={setCandidateSearch} onSelect={(id) => { setSelectedCandidateCenter(String(id)); setActiveTab('matching'); }} />
          )}

          <div style={{ border: '1px solid var(--line)', borderRadius: 18, background: '#fff', padding: 18, minHeight: 150 }}>
            {matchingMode === 'vacancy' ? (
              <SelectedVacancyPanel 
                vacancy={selectedVacancyObject} 
                stats={selectedVacancyStats}
                onCloseClick={() => setShowCloseVacancyModal(true)}
              />
            ) : (
              <SelectedCandidatePanel candidate={selectedCandidateObject} stats={selectedCandidateStats} />
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--line)', paddingBottom: 12 }}>
        <button className={activeTab === 'matching' ? 'primary-button' : 'secondary-button'} onClick={() => setActiveTab('matching')} style={{ padding: '8px 16px' }}>{matchingMode === 'candidate' ? 'Подобрать вакансии' : 'Подобрать кандидатов'}</button>
        <button className={activeTab === 'pipeline' ? 'primary-button' : 'secondary-button'} onClick={() => setActiveTab('pipeline')} style={{ padding: '8px 16px' }}>Pipeline откликов</button>
        <button className={activeTab === 'questions' ? 'primary-button' : 'secondary-button'} onClick={() => setActiveTab('questions')} style={{ padding: '8px 16px' }}>Вопросы интервью</button>
      </div>

      {activeTab === 'matching' && matchingMode === 'vacancy' && (
        <div className="card" style={{ marginBottom: 22 }}>
          <SectionHeader icon={<Sparkles size={22} />} title="Подбор кандидатов под вакансию" subtitle={selectedVacancyObject ? `${selectedVacancyObject.title} · ${selectedVacancyObject.department}` : 'Выберите конкретную вакансию выше'} />
          {!selectedVacancyObject ? <Empty icon={<Briefcase size={42} />} text="Выберите вакансию, чтобы увидеть релевантных кандидатов" /> : <div style={{ display: 'grid', gap: 14 }}>{matchedCandidates.map(({ candidate, existingApplication, match }) => <MatchCandidateRow key={candidate.id} candidate={candidate} existingApplication={existingApplication} match={match} vacancyClosed={selectedVacancyObject.status === 'closed'} onCreate={() => createApplicationForCandidate(candidate.id)} onOpen={() => { setActiveTab('pipeline'); setFilterStage(existingApplication.stage); }} />)}</div>}
        </div>
      )}

      {activeTab === 'matching' && matchingMode === 'candidate' && (
        <div className="card" style={{ marginBottom: 22 }}>
          <SectionHeader icon={<Sparkles size={22} />} title="Подбор вакансий под кандидата" subtitle={selectedCandidateObject ? `${selectedCandidateObject.full_name} · ${selectedCandidateObject.experience_years || 0} лет опыта` : 'Выберите кандидата выше'} />
          {!selectedCandidateObject ? <Empty icon={<UserPlus size={42} />} text="Выберите кандидата, чтобы увидеть подходящие вакансии" /> : <div style={{ display: 'grid', gap: 14 }}>{matchedVacancies.map(({ vacancy, existingApplication, match }) => <MatchVacancyRow key={vacancy.id} vacancy={vacancy} existingApplication={existingApplication} match={match} onCreate={() => createApplicationForVacancy(vacancy.id)} onOpen={() => { setSelectedVacancyFilter(String(vacancy.id)); setActiveTab('pipeline'); setFilterStage(existingApplication.stage); }} />)}</div>}
        </div>
      )}

      {activeTab === 'pipeline' && (
        <>
          {/* Переключатель режимов */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                className={viewMode === 'list' ? 'primary-button' : 'secondary-button'}
                onClick={() => setViewMode('list')}
                style={{ padding: '8px 16px' }}
              >
                📋 Список
              </button>
              <button 
                className={viewMode === 'kanban' ? 'primary-button' : 'secondary-button'}
                onClick={() => setViewMode('kanban')}
                style={{ padding: '8px 16px' }}
              >
                🗂️ Kanban
              </button>
            </div>
            {viewMode === 'list' && (
              <div className="filters-bar" style={{ marginBottom: 0 }}>
                <div className="filter-group"><label>Этап</label><select value={filterStage} onChange={(e) => setFilterStage(e.target.value)}><option value="all">Все этапы</option>{stages.map(stage => <option key={stage} value={stage}>{stageLabels[stage]}</option>)}</select></div>
                <div className="filter-group"><label>Вакансия</label><select value={selectedVacancyFilter} onChange={(e) => setSelectedVacancyFilter(e.target.value)}><option value="all">Все вакансии</option>{vacancies.map(v => <option key={v.id} value={v.id}>{v.title}</option>)}</select></div>
              </div>
            )}
          </div>

          {viewMode === 'list' ? (
            <>
              <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)', marginBottom: 20 }}>{stages.map(stage => { const view = stageView[stage]; return <button key={stage} type="button" onClick={() => setFilterStage(stage)} className="card" style={{ padding: 16, textAlign: 'center', borderColor: filterStage === stage ? view.color : view.border, background: filterStage === stage ? view.bg : '#fff' }}><div style={{ fontSize: 24, fontWeight: 900, color: view.color }}>{stats[stage] || 0}</div><div style={{ fontSize: 12, color: view.color, marginTop: 4, fontWeight: 900 }}>{stageLabels[stage]}</div><div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{view.label}</div></button>; })}</div>
              <div className="card"><div style={{ display: 'grid', gap: 16 }}>{visibleApplications.map(application => <PipelineRow key={application.id} application={application} vacancies={vacancies} candidates={candidates} analyze={analyze} loadQuestions={loadQuestions} updateStage={updateStage} openStageModal={openStageModal} />)}{!visibleApplications.length && <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}><Target size={48} style={{ marginBottom: 12, opacity: 0.5 }} /><p>Нет откликов под выбранные фильтры</p><button className="primary-button" onClick={() => setActiveTab('matching')} style={{ marginTop: 12 }}><Sparkles size={18} /> Вернуться к подбору</button></div>}</div></div>
            </>
          ) : (
            /* Kanban доска */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16, minHeight: '600px' }}>
              {stages.map(stage => {
                const view = stageView[stage];
                const stageApps = applications.filter(app => app.stage === stage);
                const rules = stageRules[stage];
                const StageIcon = rules?.icon || Target;
                
                return (
                  <div
                    key={stage}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, stage)}
                    style={{
                      background: '#f8fafc',
                      borderRadius: 16,
                      padding: 16,
                      border: `2px dashed ${view.border}`,
                      minHeight: '500px',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    {/* Заголовок колонки */}
                    <div style={{ 
                      padding: '8px 12px', 
                      background: view.bg, 
                      borderRadius: 10,
                      marginBottom: 16,
                      border: `2px solid ${view.border}`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <StageIcon size={18} style={{ color: view.color }} />
                        <span style={{ fontWeight: 800, color: view.color, fontSize: 14 }}>
                          {rules?.title || stageLabels[stage]}
                        </span>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        fontSize: 12,
                        color: view.color,
                        opacity: 0.9
                      }}>
                        <span>{rules?.description}</span>
                        <span style={{ 
                          background: view.color, 
                          color: '#fff',
                          padding: '2px 8px',
                          borderRadius: 12,
                          fontWeight: 700
                        }}>
                          {stageApps.length}
                        </span>
                      </div>
                    </div>

                    {/* Карточки кандидатов */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                      {stageApps.map(application => {
                        const candidate = candidates.find(c => c.id === application.candidate_id);
                        const vacancy = vacancies.find(v => v.id === application.vacancy_id);
                        
                        return (
                          <div
                            key={application.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, application)}
                            onClick={() => openStageModal(application)}
                            style={{
                              background: '#fff',
                              borderRadius: 12,
                              padding: 14,
                              border: `2px solid ${view.border}`,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                              cursor: 'grab',
                              transition: 'all 0.2s',
                              opacity: draggedApp?.id === application.id ? 0.5 : 1
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                              <div className="candidate-avatar" style={{ width: 36, height: 36, fontSize: 14 }}>
                                {initials(candidate?.full_name || '?')}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: 13 }}>
                                  {candidate?.full_name || 'Кандидат'}
                                </div>
                                <div style={{ fontSize: 11, color: '#64748b' }}>
                                  #{application.id}
                                </div>
                              </div>
                            </div>
                            
                            <div style={{ 
                              padding: 8, 
                              background: '#f1f5f9', 
                              borderRadius: 8,
                              fontSize: 11,
                              color: '#475569'
                            }}>
                              {vacancy?.title || 'Вакансия'}
                            </div>
                            
                            {application.ai_analysis && (
                              <div style={{ 
                                marginTop: 8, 
                                padding: 6, 
                                background: application.ai_analysis.score >= 70 ? '#dcfce7' : application.ai_analysis.score >= 45 ? '#fef3c7' : '#fee2e2',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 700,
                                color: application.ai_analysis.score >= 70 ? '#166534' : application.ai_analysis.score >= 45 ? '#92400e' : '#991b1b',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                              }}>
                                <Award size={12} />
                                Score: {application.ai_analysis.score}%
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
                      {stageApps.length === 0 && (
                        <div style={{ 
                          padding: 20, 
                          textAlign: 'center', 
                          color: '#94a3b8',
                          fontSize: 13,
                          border: '2px dashed #e2e8f0',
                          borderRadius: 12,
                          background: 'rgba(248,250,252,0.5)'
                        }}>
                          📭 Пусто
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'questions' && <div className="card"><h2 style={{ marginBottom: 16 }}><FileQuestion size={20} style={{ marginRight: 8 }} /> Вопросы для интервью</h2><div className="question-list">{questions.map((question, idx) => <div key={idx}>{idx + 1}. {question}</div>)}{!questions.length && <p style={{ color: '#9ca3af', textAlign: 'center', padding: 40 }}>Нажмите "Вопросы интервью" у отклика, чтобы получить AI-план интервью</p>}</div></div>}

      {showLinkModal && <div className="modal-overlay" onClick={() => setShowLinkModal(false)}><div className="modal-content" onClick={(e) => e.stopPropagation()}><div className="modal-header"><h2><CheckCircle2 size={20} style={{ marginRight: 8 }} /> Создать отклик</h2><button className="icon-button" onClick={() => setShowLinkModal(false)}>✕</button></div><div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}><div className="form-group"><label>Вакансия</label><select value={selectedVacancy} onChange={(e) => setSelectedVacancy(e.target.value)}><option value="">Выберите вакансию</option>{vacancies.filter(v => v.status !== 'closed').map(v => <option key={v.id} value={v.id}>{v.title}</option>)}</select></div><div className="form-group"><label>Кандидат</label><select value={selectedCandidate} onChange={(e) => setSelectedCandidate(e.target.value)}><option value="">Выберите кандидата</option>{candidates.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}</select></div><div className="form-actions"><button type="button" className="secondary-button" onClick={() => setShowLinkModal(false)}>Отмена</button><button type="button" className="primary-button" onClick={createApplication} disabled={!selectedVacancy || !selectedCandidate} style={{ opacity: (!selectedVacancy || !selectedCandidate) ? 0.5 : 1 }}>Создать отклик</button></div></div></div></div>}

      {showCloseVacancyModal && selectedVacancyObject && (
        <div className="modal-overlay" onClick={() => setShowCloseVacancyModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2><AlertTriangle size={20} style={{ marginRight: 8, color: '#dc2626' }} /> Закрыть вакансию</h2>
              <button className="icon-button" onClick={() => setShowCloseVacancyModal(false)}>✕</button>
            </div>
            <div style={{ padding: '8px 0 20px' }}>
              <p style={{ fontSize: 15, marginBottom: 16 }}>
                Вы собираетесь закрыть вакансию <strong>"{selectedVacancyObject.title}"</strong>.
              </p>
              <div style={{ 
                padding: 16, 
                background: '#fef2f2', 
                borderRadius: 12,
                border: '1px solid #fecaca',
                marginBottom: 20
              }}>
                <p style={{ margin: 0, color: '#991b1b', fontSize: 14 }}>
                  ⚠️ После закрытия:
                </p>
                <ul style={{ 
                  margin: '10px 0 0', 
                  paddingLeft: 20, 
                  color: '#7f1d1d',
                  fontSize: 13
                }}>
                  <li>Нельзя будет создать новые отклики</li>
                  <li>Кандидаты увидят, что вакансия закрыта</li>
                  <li>Активные отклики останутся в pipeline</li>
                </ul>
              </div>
            </div>
            <div className="form-actions">
              <button 
                type="button" 
                className="secondary-button" 
                onClick={() => setShowCloseVacancyModal(false)}
              >
                Отмена
              </button>
              <button 
                type="button" 
                className="primary-button" 
                onClick={closeVacancy}
                style={{ 
                  background: '#dc2626', 
                  borderColor: '#dc2626',
                  hover: '#b91c1c'
                }}
              >
                🔒 Закрыть вакансию
              </button>
            </div>
          </div>
        </div>
      )}

      {showStageModal && selectedApplication && (
        <div className="modal-overlay" onClick={() => setShowStageModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h2><Target size={20} style={{ marginRight: 8, color: '#059669' }} /> Изменить этап</h2>
              <button className="icon-button" onClick={() => setShowStageModal(false)}>✕</button>
            </div>
            <div style={{ padding: '8px 0 20px' }}>
              <p style={{ fontSize: 15, marginBottom: 16 }}>
                Отклик #<strong>{selectedApplication.id}</strong>
              </p>
              
              {/* Информация о кандидате */}
              <div style={{ 
                padding: 16, 
                background: '#f8fafc', 
                borderRadius: 12,
                marginBottom: 20,
                border: '1px solid var(--line)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div className="candidate-avatar" style={{ width: 48, height: 48, fontSize: 18 }}>
                    {initials(candidates.find(c => c.id === selectedApplication.candidate_id)?.full_name || '?')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: 15 }}>
                      {candidates.find(c => c.id === selectedApplication.candidate_id)?.full_name || 'Кандидат'}
                    </strong>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                      {vacancies.find(v => v.id === selectedApplication.vacancy_id)?.title || 'Вакансия'}
                    </div>
                  </div>
                </div>
                
                {/* Текущий этап с правилами */}
                {(() => {
                  const currentRules = stageRules[selectedApplication.stage];
                  const CurrentIcon = currentRules?.icon || Target;
                  return (
                    <div style={{ 
                      padding: 14, 
                      background: stageView[selectedApplication.stage]?.bg, 
                      borderRadius: 10,
                      border: `2px solid ${stageView[selectedApplication.stage]?.border}`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <CurrentIcon size={18} style={{ color: stageView[selectedApplication.stage]?.color }} />
                        <span style={{ 
                          color: stageView[selectedApplication.stage]?.color,
                          fontWeight: 800,
                          fontSize: 14
                        }}>
                          {currentRules?.title || stageLabels[selectedApplication.stage]}
                        </span>
                      </div>
                      <p style={{ 
                        margin: 0, 
                        color: stageView[selectedApplication.stage]?.color,
                        fontSize: 13,
                        opacity: 0.9
                      }}>
                        {currentRules?.description}
                      </p>
                      
                      {/* Подсказка что нужно сделать */}
                      {currentRules?.helpText && (
                        <div style={{ 
                          marginTop: 10, 
                          padding: 10, 
                          background: 'rgba(255,255,255,0.7)',
                          borderRadius: 8
                        }}>
                          <p style={{ margin: 0, fontSize: 12, color: '#475569' }}>
                            💡 {currentRules.helpText}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Требуемые действия */}
              {(() => {
                const requiredActions = getRequiredActions(selectedApplication.stage);
                if (!requiredActions.length) return null;
                
                const actionLabels = {
                  ai_analysis: '🤖 Провести AI-анализ',
                  hr_decision: '📝 Принять решение HR',
                  interview_scheduled: '📅 Назначить дату интервью',
                  interview_feedback: '💬 Получить обратную связь',
                  offer_prepared: '📄 Подготовить оффер',
                  offer_approved: '✅ Согласовать условия'
                };
                
                return (
                  <div style={{ 
                    padding: 12, 
                    background: '#fef3c7', 
                    borderRadius: 10,
                    border: '1px solid #fde68a',
                    marginBottom: 20
                  }}>
                    <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 13, color: '#92400e' }}>
                      ⚠️ Перед переходом выполните:
                    </p>
                    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#78350f' }}>
                      {requiredActions.map(action => (
                        <li key={action}>{actionLabels[action] || action}</li>
                      ))}
                    </ul>
                  </div>
                );
              })()}

              {/* Доступные этапы для перехода */}
              <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
                Перевести на этап:
              </p>
              
              <div style={{ display: 'grid', gap: 10 }}>
                {getAvailableStages(selectedApplication.stage).map(stage => {
                  const view = stageView[stage];
                  const stageRulesData = stageRules[stage];
                  const NextIcon = stageRulesData?.icon || Target;
                  
                  return (
                    <button
                      key={stage}
                      type="button"
                      onClick={() => confirmStageChange(stage)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: 14,
                        border: `2px solid ${view.border}`,
                        borderRadius: 12,
                        background: '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = view.bg;
                        e.currentTarget.style.borderColor = view.color;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#fff';
                        e.currentTarget.style.borderColor = view.border;
                      }}
                    >
                      <div style={{ 
                        width: 32, 
                        height: 32, 
                        borderRadius: '50%',
                        background: view.color,
                        display: 'grid',
                        placeItems: 'center'
                      }}>
                        <NextIcon size={16} style={{ color: '#fff' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: view.color, fontSize: 14 }}>
                          {stageRulesData?.title || stageLabels[stage]}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                          {stageRulesData?.description}
                        </div>
                      </div>
                      <div style={{ 
                        color: view.color,
                        fontWeight: 700,
                        fontSize: 20
                      }}>
                        →
                      </div>
                    </button>
                  );
                })}
              </div>
              
              {getAvailableStages(selectedApplication.stage).length === 0 && (
                <div style={{ 
                  padding: 20, 
                  textAlign: 'center',
                  background: '#f1f5f9',
                  borderRadius: 12,
                  color: '#64748b'
                }}>
                  <p style={{ margin: 0, fontSize: 14 }}>
                    🚫 На этом этапе переходы недоступны
                  </p>
                  <p style={{ margin: '6px 0 0', fontSize: 12 }}>
                    {stageRules[selectedApplication.stage]?.helpText}
                  </p>
                </div>
              )}
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                className="secondary-button" 
                onClick={() => setShowStageModal(false)}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ color, icon, title, value, text }) {
  return <div className="card" style={{ borderLeft: `5px solid ${color}` }}><div style={{ display: 'flex', gap: 10, color, fontWeight: 900 }}>{icon} {title}</div><div style={{ marginTop: 10, fontSize: 30, fontWeight: 900 }}>{value}</div><div style={{ color: '#64748b', fontSize: 13 }}>{text}</div></div>;
}

function SearchBox({ value, onChange, placeholder }) {
  return <div className="search-bar" style={{ marginBottom: 12 }}><Search size={16} /><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} /></div>;
}

function VacancySelector({ vacancyStats, selectedVacancyFilter, search, setSearch, onSelect }) {
  return <div><h2 style={{ margin: '0 0 6px', fontSize: 20 }}>Вакансии</h2><p style={{ margin: '0 0 12px', color: '#64748b', fontSize: 13 }}>Список с поиском и прокруткой для больших баз.</p><SearchBox value={search} onChange={setSearch} placeholder="Поиск вакансии, отдела или навыка..." /><div style={compactListStyle}>{vacancyStats.map(({ vacancy, total, active, hired }) => { const status = vacancyStatuses[vacancy.status] || vacancyStatuses.open; const selected = selectedVacancyFilter === String(vacancy.id); return <button key={vacancy.id} type="button" onClick={() => onSelect(vacancy.id)} style={{ textAlign: 'left', border: selected ? '2px solid #0b73ff' : '1px solid var(--line)', borderRadius: 14, background: selected ? '#eff6ff' : '#fff', padding: 12, cursor: 'pointer' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><strong>{vacancy.title}</strong><span style={{ borderRadius: 999, padding: '3px 8px', background: status.bg, color: status.color, fontSize: 11, fontWeight: 900 }}>{status.label}</span></div><div style={{ marginTop: 4, color: '#64748b', fontSize: 12 }}>{vacancy.department}</div><div style={{ display: 'flex', gap: 14, marginTop: 8, color: '#64748b', fontSize: 12 }}><span><b>{total}</b> всего</span><span><b>{active}</b> в работе</span><span><b>{hired}</b> нанято</span></div></button>; })}{!vacancyStats.length && <SmallEmpty text="Ничего не найдено" />}</div></div>;
}

function CandidateSelector({ candidateStats, selectedCandidateCenter, search, setSearch, onSelect }) {
  return <div><h2 style={{ margin: '0 0 6px', fontSize: 20 }}>Кандидаты</h2><p style={{ margin: '0 0 12px', color: '#64748b', fontSize: 13 }}>Список кандидатов не раздувает страницу.</p><SearchBox value={search} onChange={setSearch} placeholder="Поиск кандидата, email или навыка..." /><div style={compactListStyle}>{candidateStats.map(({ candidate, active }) => { const selected = selectedCandidateCenter === String(candidate.id); return <button key={candidate.id} type="button" onClick={() => onSelect(candidate.id)} style={{ textAlign: 'left', border: selected ? '2px solid #0b73ff' : '1px solid var(--line)', borderRadius: 14, background: selected ? '#eff6ff' : '#fff', padding: 12, cursor: 'pointer' }}><div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><div className="candidate-avatar" style={{ width: 38, height: 38, margin: 0, fontSize: 13 }}>{initials(candidate.full_name)}</div><div><strong>{candidate.full_name}</strong><div style={{ color: '#64748b', fontSize: 12 }}>{candidate.experience_years || 0} лет опыта · {active} в работе</div></div></div><div className="skills" style={{ marginTop: 8 }}>{(candidate.skills || []).slice(0, 3).map(skill => <span key={skill} className="skill-tag">{skill}</span>)}</div></button>; })}{!candidateStats.length && <SmallEmpty text="Ничего не найдено" />}</div></div>;
}

function SelectedVacancyPanel({ vacancy, stats, onCloseClick }) {
  if (!vacancy) return <Empty icon={<Briefcase size={38} />} text="Выберите вакансию слева" />;
  const status = vacancyStatuses[vacancy.status] || vacancyStatuses.open;
  const isClosed = vacancy.status === 'closed';
  const hasHired = (stats?.hired || 0) > 0;
  const hasActive = (stats?.active || 0) > 0;
  
  return <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
      <div>
        <h2 style={{ margin: 0 }}>{vacancy.title}</h2>
        <p style={{ margin: '4px 0 0', color: '#64748b' }}>{vacancy.department}</p>
        
        {/* Подсказка о статусе вакансии */}
        {!isClosed && hasHired && !hasActive && (
          <div style={{ 
            marginTop: 8, 
            padding: 8, 
            background: '#fef3c7', 
            borderRadius: 8,
            border: '1px solid #fde68a',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12
          }}>
            <span>💡</span>
            <span style={{ color: '#92400e' }}>
              Все отклики обработаны ({stats.hired} нанято). Можно закрыть вакансию.
            </span>
          </div>
        )}
        
        {!isClosed && hasHired && hasActive && (
          <div style={{ 
            marginTop: 8, 
            padding: 8, 
            background: '#f0fdf4', 
            borderRadius: 8,
            border: '1px solid #bbf7d0',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12
          }}>
            <span>✅</span>
            <span style={{ color: '#166534' }}>
              {stats.hired} кандидат(ов) нанято, {stats.active} в процессе подбора.
            </span>
          </div>
        )}
      </div>
      <span style={{ borderRadius: 999, padding: '5px 12px', background: status.bg, color: status.color, fontSize: 12, fontWeight: 900 }}>
        {status.label}
      </span>
    </div>
    
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 14, marginBottom: 12 }}>
      <MiniStat label="откликов" value={stats?.total || 0} />
      <MiniStat label="в работе" value={stats?.active || 0} />
      <MiniStat label="нанято" value={stats?.hired || 0} />
    </div>
    
    <div className="skills">
      {(vacancy.required_skills || []).slice(0, 8).map(skill => (
        <span key={skill} className="skill-tag">{skill}</span>
      ))}
    </div>
    
    <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
      <button className="secondary-button" style={{ flex: 1 }}>Открыть карточку вакансии</button>
      {!isClosed && (
        <button 
          className="secondary-button" 
          onClick={onCloseClick}
          style={{ 
            flex: 1, 
            background: hasHired && !hasActive ? '#fef3c7' : '#fef2f2', 
            color: hasHired && !hasActive ? '#92400e' : '#dc2626',
            borderColor: hasHired && !hasActive ? '#fde68a' : '#fecaca'
          }}
        >
          {hasHired && !hasActive ? '💡 Закрыть вакансию' : '🔒 Закрыть вакансию'}
        </button>
      )}
      {isClosed && (
        <button 
          className="secondary-button" 
          disabled
          style={{ 
            flex: 1, 
            background: '#f1f5f9', 
            color: '#94a3b8',
            borderColor: '#e2e8f0',
            cursor: 'not-allowed'
          }}
        >
          Вакансия закрыта
        </button>
      )}
    </div>
  </div>;
}

function SelectedCandidatePanel({ candidate, stats }) {
  if (!candidate) return <Empty icon={<UserPlus size={38} />} text="Выберите кандидата слева" />;
  return <div><div style={{ display: 'flex', gap: 14, alignItems: 'center' }}><div className="candidate-avatar" style={{ width: 54, height: 54, margin: 0 }}>{initials(candidate.full_name)}</div><div><h2 style={{ margin: 0 }}>{candidate.full_name}</h2><p style={{ margin: '4px 0 0', color: '#64748b' }}>{candidate.email} · {candidate.experience_years || 0} лет опыта</p></div></div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 14, marginBottom: 12 }}><MiniStat label="откликов" value={stats?.total || 0} /><MiniStat label="интервью" value={stats?.interviews || 0} /><MiniStat label="офферов" value={stats?.offers || 0} /></div><div className="skills">{(candidate.skills || []).slice(0, 8).map(skill => <span key={skill} className="skill-tag">{skill}</span>)}</div><button className="secondary-button" style={{ marginTop: 14 }}>Открыть резюме</button></div>;
}

function MiniStat({ label, value }) {
  return <div style={{ border: '1px solid var(--line)', borderRadius: 12, padding: '10px 12px', background: '#f8fafc' }}><div style={{ fontSize: 18, fontWeight: 900 }}>{value}</div><div style={{ color: '#64748b', fontSize: 12 }}>{label}</div></div>;
}

function SectionHeader({ icon, title, subtitle }) {
  return <div style={{ marginBottom: 18 }}><h2 style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>{icon} {title}</h2><p style={{ margin: '6px 0 0', color: '#64748b' }}>{subtitle}</p></div>;
}

function Empty({ icon, text }) {
  return <div className="empty-state" style={{ minHeight: 120 }}>{icon}<p>{text}</p></div>;
}

function SmallEmpty({ text }) {
  return <div style={{ padding: 24, color: '#94a3b8', textAlign: 'center', border: '1px dashed var(--line)', borderRadius: 14 }}>{text}</div>;
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

function PipelineRow({ application, vacancies, candidates, analyze, loadQuestions, updateStage, openStageModal }) {
  const vacancy = vacancies.find(v => v.id === application.vacancy_id);
  const candidate = candidates.find(c => c.id === application.candidate_id);
  const view = stageView[application.stage] || stageView.new;
  
  return (
    <div style={{ 
      padding: 16, 
      borderRadius: 14, 
      border: `1px solid ${view.border}`, 
      background: '#fff', 
      boxShadow: '0 8px 24px rgba(15,23,42,.04)' 
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <b>Отклик #{application.id}</b>
            <span className="status-badge" style={{ background: view.bg, color: view.color }}>
              {stageLabels[application.stage]}
            </span>
          </div>
          <div style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
            {candidate?.full_name || 'Кандидат'} → {vacancy?.title || 'Вакансия'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button 
            className="icon-button" 
            onClick={() => analyze(application.id)} 
            title="AI-анализ"
          >
            <Brain size={16} />
          </button>
          <button 
            className="icon-button" 
            onClick={() => loadQuestions(application.id)} 
            title="Вопросы интервью"
          >
            <FileQuestion size={16} />
          </button>
          <button
            className="secondary-button"
            onClick={() => openStageModal(application)}
            style={{
              background: view.bg,
              color: view.color,
              borderColor: view.border,
              fontWeight: 700,
              fontSize: 13,
              padding: '8px 12px'
            }}
          >
            <Target size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Изменить этап
          </button>
        </div>
      </div>
      
      {application.ai_analysis && (
        <div style={{ 
          padding: 12, 
          borderRadius: 10, 
          background: application.ai_analysis.score >= 70 ? '#dcfce7' : application.ai_analysis.score >= 45 ? '#fef3c7' : '#fee2e2', 
          marginTop: 12 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: application.ai_analysis.score >= 70 ? '#166534' : application.ai_analysis.score >= 45 ? '#92400e' : '#991b1b' }}>
            <Award size={16} />
            <strong>AI Score: {application.ai_analysis.score}%</strong>
          </div>
          <div style={{ fontSize: 13, color: '#334155', marginTop: 4 }}>
            {application.ai_analysis.recommendation}
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreCard({ match, view }) {
  return <div style={{ textAlign: 'center', borderRadius: 14, background: view.bg, color: view.color, padding: 12 }}><div style={{ fontSize: 28, fontWeight: 900 }}>{match.score}%</div><div style={{ fontSize: 12, fontWeight: 900 }}>{view.label}</div></div>;
}
