import { useState, useRef, useEffect } from 'react';
import { X, Sparkles, Upload, ArrowLeft, ArrowRight, Check, MessageSquare } from 'lucide-react';

const emptyVacancy = { title: '', department: '', description: '', required_skills: '', salary_from: '', salary_to: '' };

export default function VacancyWizard({ onClose, onSave }) {
  const [step, setStep] = useState(1);
  const [vacancy, setVacancy] = useState(emptyVacancy);
  const [dragActive, setDragActive] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { type: 'bot', text: 'Привет! Я помогу создать вакансию. Напишите описание или загрузите файл.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const parseVacancyFromText = async (text) => {
    setAiProcessing(true);
    try {
      // MOCK DATA - В реальном проекте здесь будет вызов AI API
      // Пока подставляем красивые данные для демонстрации
      const mockVacancy = {
        title: 'Middle Python Developer',
        department: 'IT Development',
        description: 'Мы ищем талантливого Python разработчика для участия в создании современных HR-технологий. \n\nОбязанности:\n- Разработка backend сервисов на FastAPI\n- Работа с PostgreSQL и Redis\n- Участие в code review\n- Написание unit и integration тестов\n\nМы предлагаем:\n- Удаленную работу\n- Интересные проекты\n- Профессиональный рост',
        required_skills: 'Python, FastAPI, PostgreSQL, Docker, Git, REST API',
        salary_from: '180000',
        salary_to: '260000'
      };

      // Если текст содержит ключевые слова, используем их для кастомизации мока
      if (text.toLowerCase().includes('java')) {
        mockVacancy.title = 'Senior Java Developer';
        mockVacancy.required_skills = 'Java, Spring Boot, Microservices, PostgreSQL, Docker, Kubernetes';
      } else if (text.toLowerCase().includes('frontend') || text.toLowerCase().includes('react')) {
        mockVacancy.title = 'Frontend Developer (React)';
        mockVacancy.required_skills = 'React, TypeScript, JavaScript, CSS, Redux, Webpack';
      } else if (text.toLowerCase().includes('manager')) {
        mockVacancy.title = 'Product Manager';
        mockVacancy.department = 'Product';
        mockVacancy.required_skills = 'Product Management, Agile, Scrum, Analytics, Jira';
      }

      setVacancy(mockVacancy);

      setChatMessages(prev => [...prev, {
        type: 'bot',
        text: '✨ Отлично! AI проанализировал ваш документ и подготовил вакансию. Проверьте данные на следующем шаге.'
      }]);

      setTimeout(() => setStep(2), 1200);
    } catch (err) {
      setChatMessages(prev => [...prev, { type: 'bot', text: 'Ошибка при обработке текста.' }]);
    } finally {
      setAiProcessing(false);
    }
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { type: 'user', text: userMsg }]);
    setChatInput('');

    if (userMsg.length > 20) {
      parseVacancyFromText(userMsg);
    }
  };

  const handleFileProcess = async (text) => {
    setChatMessages(prev => [...prev, { type: 'bot', text: '📁 Файл получен, обрабатываю...' }]);
    await parseVacancyFromText(text);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files?.[0]) {
      try {
        const text = await e.dataTransfer.files[0].text();
        handleFileProcess(text);
      } catch {
        setChatMessages(prev => [...prev, { type: 'bot', text: 'Не удалось прочитать файл.' }]);
      }
    }
  };

  const nextStep = () => {
    if (step === 1 && vacancy.title && vacancy.department) {
      setStep(2);
    } else if (step === 1) {
      alert('Пожалуйста, заполните хотя бы название и отдел');
    }
  };

  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSave = async () => {
    if (!vacancy.title || !vacancy.department) {
      alert('Пожалуйста, заполните название и отдел');
      return;
    }

    setSaving(true);
    try {
      await onSave(vacancy);
      setStep(3);
    } catch (err) {
      alert('Ошибка при сохранении: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <h2>Создание вакансии</h2>
          <button className="icon-button" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Progress Steps */}
        <div style={{ padding: '20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {['Ввод данных', 'Проверка', 'Готово'].map((label, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: step > idx + 1 ? '#166534' : step === idx + 1 ? '#0b73ff' : '#e2e8f0',
                  color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 'bold'
                }}>
                  {step > idx + 1 ? <Check size={16} /> : idx + 1}
                </div>
                <span style={{ fontSize: '14px', color: step === idx + 1 ? '#0b73ff' : '#64748b' }}>{label}</span>
                {idx < 2 && <div style={{ width: '40px', height: '2px', background: step > idx + 1 ? '#166534' : '#e2e8f0' }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Input */}
        {step === 1 && (
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Chat Interface */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: '500' }}>
                  <MessageSquare size={16} style={{ display: 'inline', marginRight: '8px' }} />Чат-помощник
                </div>
                <div style={{ flex: 1, padding: '16px', overflowY: 'auto', maxHeight: '300px' }}>
                  {chatMessages.map((msg, i) => (
                    <div key={i} style={{
                      marginBottom: '12px', padding: '10px 14px', borderRadius: '12px',
                      background: msg.type === 'bot' ? '#f1f5f9' : '#dbeafe',
                      alignSelf: msg.type === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '90%'
                    }}>
                      {msg.text}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div style={{ padding: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Напишите описание вакансии..."
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                  <button onClick={handleSendMessage} className="primary-button" disabled={aiProcessing}>
                    {aiProcessing ? '...' : '→'}
                  </button>
                </div>
              </div>

              {/* File Upload */}
              <div
                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragActive ? '#0b73ff' : '#cbd5e1'}`,
                  borderRadius: '12px', padding: '32px', textAlign: 'center',
                  background: dragActive ? '#eff6ff' : '#f8fafc', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <input ref={fileInputRef} type="file" accept=".txt,.doc,.docx" onChange={async e => {
                  if (e.target.files?.[0]) {
                    const text = await e.target.files[0].text();
                    handleFileProcess(text);
                  }
                }} style={{ display: 'none' }} />
                <Upload size={40} color="#0b73ff" style={{ marginBottom: '12px' }} />
                <p style={{ margin: '0 0 8px 0', fontWeight: '500' }}>Перетащите файл сюда</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>или кликните для выбора</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Preview & Edit */}
        {step === 2 && (
          <div style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '16px' }}>Проверьте данные вакансии</h3>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Название *</label>
                <input
                  value={vacancy.title} onChange={e => setVacancy({ ...vacancy, title: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Отдел *</label>
                  <input
                    value={vacancy.department} onChange={e => setVacancy({ ...vacancy, department: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Зарплата от - до (руб.)</label>
                  <input
                    value={`${vacancy.salary_from || ''} - ${vacancy.salary_to || ''}`}
                    onChange={e => {
                      const [from, to] = e.target.value.split(' - ');
                      setVacancy({ ...vacancy, salary_from: from, salary_to: to });
                    }}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Описание</label>
                <textarea
                  value={vacancy.description} onChange={e => setVacancy({ ...vacancy, description: e.target.value })}
                  rows={4} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Навыки (через запятую)</label>
                <input
                  value={vacancy.required_skills} onChange={e => setVacancy({ ...vacancy, required_skills: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', background: '#d1fae5', borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 24px' }}>
              <Check size={40} color="#166534" />
            </div>
            <h2 style={{ marginBottom: '12px' }}>Вакансия создана!</h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>Данные успешно сохранены в системе</p>
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
          {step > 1 && step < 3 ? (
            <button onClick={prevStep} className="secondary-button"><ArrowLeft size={18} /> Назад</button>
          ) : <div />}
          
          {step === 1 && (
            <button onClick={nextStep} className="primary-button" disabled={!vacancy.title || !vacancy.department}>
              Далее <ArrowRight size={18} />
            </button>
          )}
          
          {step === 2 && (
            <button onClick={handleSave} className="primary-button" disabled={saving} style={{ background: saving ? '#94a3b8' : '#166534' }}>
              {saving ? 'Сохранение...' : <><Check size={18} /> Сохранить вакансию</>}
            </button>
          )}
          
          {step === 3 && (
            <button onClick={onClose} className="primary-button" style={{ background: '#166534' }}>
              <Check size={18} /> Готово
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
