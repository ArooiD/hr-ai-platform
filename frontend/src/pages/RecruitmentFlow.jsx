import { useEffect, useMemo, useState } from 'react';
import { Brain, BriefcaseBusiness, CheckCircle2, FileQuestion, UserPlus } from 'lucide-react';
import { hrApi } from '../api/client';
import { stages, stageLabels } from '../data/constants';

const emptyVacancy = { title: '', department: '', description: '', required_skills: '' };
const emptyCandidate = { full_name: '', email: '', phone: '', skills: '', experience_years: 0, resume_text: '' };

function splitTags(value) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

export default function RecruitmentFlow() {
  const [vacancy, setVacancy] = useState(emptyVacancy);
  const [candidate, setCandidate] = useState(emptyCandidate);
  const [vacancies, setVacancies] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedVacancy, setSelectedVacancy] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [questions, setQuestions] = useState([]);
  const [message, setMessage] = useState('');

  const load = async () => {
    const [vacancyData, candidateData, applicationData] = await Promise.all([
      hrApi.vacancies(),
      hrApi.candidates(),
      hrApi.applications(),
    ]);
    setVacancies(vacancyData);
    setCandidates(candidateData);
    setApplications(applicationData);
  };

  useEffect(() => { load().catch(() => setMessage('Backend недоступен')); }, []);

  const activeApplication = useMemo(() => applications[applications.length - 1], [applications]);

  const createVacancy = async (event) => {
    event.preventDefault();
    await hrApi.createVacancy({ ...vacancy, required_skills: splitTags(vacancy.required_skills) });
    setVacancy(emptyVacancy);
    setMessage('Вакансия создана');
    await load();
  };

  const createCandidate = async (event) => {
    event.preventDefault();
    await hrApi.createCandidate({ ...candidate, skills: splitTags(candidate.skills), experience_years: Number(candidate.experience_years || 0) });
    setCandidate(emptyCandidate);
    setMessage('Кандидат добавлен');
    await load();
  };

  const createApplication = async () => {
    await hrApi.createApplication({ candidate_id: Number(selectedCandidate), vacancy_id: Number(selectedVacancy) });
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
  };

  return (
    <section className="flow-page">
      <div className="flow-header">
        <div>
          <h1>основной сценарий подбора</h1>
          <p>Создайте вакансию, добавьте кандидата, запустите AI-анализ и проведите его по этапам найма.</p>
        </div>
        <button className="blue-button" onClick={async () => { await hrApi.seedDemo(); await load(); }}>demo-данные</button>
      </div>

      {message && <div className="flow-message">{message}</div>}

      <div className="flow-steps">
        <article className="flow-card">
          <h2><BriefcaseBusiness size={20} /> 1. Вакансия</h2>
          <form onSubmit={createVacancy} className="flow-form">
            <input placeholder="Название вакансии" value={vacancy.title} onChange={(e) => setVacancy({ ...vacancy, title: e.target.value })} required />
            <input placeholder="Отдел" value={vacancy.department} onChange={(e) => setVacancy({ ...vacancy, department: e.target.value })} required />
            <textarea placeholder="Описание" value={vacancy.description} onChange={(e) => setVacancy({ ...vacancy, description: e.target.value })} required />
            <input placeholder="Навыки: Python, FastAPI, SQL" value={vacancy.required_skills} onChange={(e) => setVacancy({ ...vacancy, required_skills: e.target.value })} />
            <button type="submit">создать вакансию</button>
          </form>
        </article>

        <article className="flow-card">
          <h2><UserPlus size={20} /> 2. Кандидат</h2>
          <form onSubmit={createCandidate} className="flow-form">
            <input placeholder="ФИО" value={candidate.full_name} onChange={(e) => setCandidate({ ...candidate, full_name: e.target.value })} required />
            <input placeholder="Email" value={candidate.email} onChange={(e) => setCandidate({ ...candidate, email: e.target.value })} required />
            <input placeholder="Телефон" value={candidate.phone} onChange={(e) => setCandidate({ ...candidate, phone: e.target.value })} />
            <input placeholder="Навыки: Python, Docker" value={candidate.skills} onChange={(e) => setCandidate({ ...candidate, skills: e.target.value })} />
            <input type="number" placeholder="Опыт, лет" value={candidate.experience_years} onChange={(e) => setCandidate({ ...candidate, experience_years: e.target.value })} />
            <textarea placeholder="Краткое резюме" value={candidate.resume_text} onChange={(e) => setCandidate({ ...candidate, resume_text: e.target.value })} />
            <button type="submit">добавить кандидата</button>
          </form>
        </article>

        <article className="flow-card wide">
          <h2><CheckCircle2 size={20} /> 3. Отклик и pipeline</h2>
          <div className="flow-linker">
            <select value={selectedVacancy} onChange={(e) => setSelectedVacancy(e.target.value)}>
              <option value="">выберите вакансию</option>
              {vacancies.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
            <select value={selectedCandidate} onChange={(e) => setSelectedCandidate(e.target.value)}>
              <option value="">выберите кандидата</option>
              {candidates.map((item) => <option key={item.id} value={item.id}>{item.full_name}</option>)}
            </select>
            <button onClick={createApplication} disabled={!selectedVacancy || !selectedCandidate}>создать отклик</button>
          </div>

          <div className="flow-applications">
            {applications.map((application) => (
              <div className="flow-application" key={application.id}>
                <div>
                  <b>Отклик #{application.id}</b>
                  <p>Кандидат #{application.candidate_id} · Вакансия #{application.vacancy_id}</p>
                </div>
                <select value={application.stage} onChange={(e) => updateStage(application.id, e.target.value)}>
                  {stages.map((stage) => <option key={stage} value={stage}>{stageLabels[stage]}</option>)}
                </select>
                <button onClick={() => analyze(application.id)}><Brain size={16} /> AI</button>
                <button onClick={() => loadQuestions(application.id)}><FileQuestion size={16} /> вопросы</button>
                {application.ai_analysis && <div className="flow-ai"><strong>{application.ai_analysis.score}%</strong><span>{application.ai_analysis.recommendation}</span></div>}
              </div>
            ))}
            {!applications.length && <p className="empty-state">Пока нет откликов. Создайте вакансию и кандидата, затем свяжите их.</p>}
          </div>
        </article>

        <article className="flow-card wide">
          <h2><FileQuestion size={20} /> 4. Вопросы интервью</h2>
          <div className="question-list">
            {questions.map((question) => <div key={question}>{question}</div>)}
            {!questions.length && <p className="empty-state">Нажмите «вопросы» у отклика, чтобы получить AI-план интервью.</p>}
          </div>
        </article>
      </div>
    </section>
  );
}
