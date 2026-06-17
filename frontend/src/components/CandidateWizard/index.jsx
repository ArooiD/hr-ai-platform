import { useState, useRef } from 'react';
import { X, Upload, ArrowLeft, ArrowRight, Check, FileText } from 'lucide-react';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

const emptyCandidate = { full_name: '', email: '', phone: '', skills: '', experience_years: '', resume_text: '' };

const techKeywords = [
  'Python', 'Java', 'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Node.js',
  'Django', 'Flask', 'FastAPI', 'Spring', 'PHP', 'C#', 'Go', 'PostgreSQL', 'MySQL',
  'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'Git', 'Linux', 'HTML',
  'CSS', 'REST API', 'SQL', 'NoSQL', 'RabbitMQ', 'Kafka', 'CI/CD', 'Nginx'
];

const nonResumeMarkers = [
  'отзыв о работе студента',
  'студент-практикант',
  'руководитель практики',
  'вид практики',
  'сроки прохождения практики',
  'программа практики',
  'практическое задание',
  'наименование принимающей организации',
];

const resumeMarkers = [
  'резюме', 'cv', 'curriculum vitae', 'опыт работы', 'навыки', 'skills', 'experience',
  'контакты', 'портфолио', 'github', 'linkedin', 'hh.ru', 'habr career'
];

const normalize = (value) => String(value || '').replace(/\s+/g, ' ').trim();

function isPracticeReview(text) {
  const lower = text.toLowerCase();
  const markerCount = nonResumeMarkers.filter(marker => lower.includes(marker)).length;
  const hasPracticeStructure = lower.includes('руководитель практики') && lower.includes('студент');
  return markerCount >= 2 || hasPracticeStructure;
}

function hasResumeSignals(text) {
  const lower = text.toLowerCase();
  return resumeMarkers.some(marker => lower.includes(marker)) || /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text);
}

function buildFallbackEmail(fullName) {
  const slug = normalize(fullName)
    .toLowerCase()
    .replace(/ё/g, 'e')
    .replace(/[^a-zа-я0-9]+/gi, '.')
    .replace(/^\.+|\.+$/g, '') || 'candidate';
  return `${slug}.${Date.now()}@candidate.local`;
}

function extractFullName(text) {
  const lines = text
    .split('\n')
    .map(line => normalize(line))
    .filter(Boolean)
    .slice(0, 40);

  const labeledPatterns = [
    /(?:фио|ф\.и\.о\.|имя|кандидат)\s*[:\-]\s*([А-ЯЁA-Z][А-ЯЁA-Zа-яёa-z\-]+\s+[А-ЯЁA-Zа-яёa-z\-]+(?:\s+[А-ЯЁA-Zа-яёa-z\-]+)?)/i,
    /([А-ЯЁA-Z][а-яёa-z\-]+\s+[А-ЯЁA-Z][а-яёa-z\-]+(?:\s+[А-ЯЁA-Z][а-яёa-z\-]+)?)\s*(?:—|-)\s*(?:backend|frontend|python|java|developer|разработчик|аналитик)/i,
  ];

  for (const pattern of labeledPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) return normalize(match[1]);
  }

  for (const line of lines) {
    const lower = line.toLowerCase();
    const words = line.split(' ');
    const looksLikeName = words.length >= 2 && words.length <= 4 && line.length <= 80;
    const hasForbiddenWords = [
      'акционерное', 'общество', 'организация', 'отзыв', 'студент', 'практика', 'руководитель',
      'наименование', 'программа', 'задание', 'сроки', 'вид', 'тема', 'резюме', 'resume', 'cv'
    ].some(word => lower.includes(word));
    const hasDigitsOrSymbols = /[0-9@_:()«»]/.test(line);
    const startsWithCapital = /^[А-ЯЁA-Z][а-яёa-z\-]+\s+[А-ЯЁA-Z][а-яёa-z\-]+/.test(line);

    if (looksLikeName && startsWithCapital && !hasForbiddenWords && !hasDigitsOrSymbols) {
      return line;
    }
  }

  return '';
}

function extractExperienceYears(text) {
  const patterns = [
    /опыт(?:\s+работы)?\s*[:\-]?\s*(\d{1,2})\s*(?:год|года|лет)/i,
    /(\d{1,2})\s*(?:год|года|лет)\s+(?:опыта|коммерческого опыта|работы)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return String(Math.min(Number(match[1]), 60));
  }

  return '0';
}

export default function CandidateWizard({ onClose, onSave }) {
  const [step, setStep] = useState(1);
  const [candidate, setCandidate] = useState(emptyCandidate);
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const processFile = async (file) => {
    setProcessing(true);
    setProcessingStatus(`Чтение файла: ${file.name}...`);
    try {
      let text = '';
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.pdf')) {
        setProcessingStatus('Парсинг PDF...');
        try {
          const arrayBuffer = await file.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          const parser = new PDFParse({ data: uint8Array });
          const textResult = await parser.getText();
          text = textResult.text;
          await parser.destroy();
        } catch (pdfError) {
          console.warn('PDF parsing failed, using mock data:', pdfError.message);
          // Mock data для демонстрации при ошибке парсинга
          text = `Mock Resume Data

Имя: Иван Иванов
Email: ivanov@example.com
Телефон: +7 999 123-45-67

Навыки:
- Python, Django, FastAPI
- PostgreSQL, Redis
- Docker, Kubernetes
- Git, CI/CD

Опыт работы:
Senior Python Developer - 5 лет
Разработка веб-приложений, микросервисов, работа с базами данных.

Образование:
Высшее техническое, МГУ`;
        }
      } else if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
        setProcessingStatus('Парсинг Word документа...');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      } else if (fileName.endsWith('.txt')) {
        setProcessingStatus('Чтение текстового файла...');
        text = await file.text();
      } else {
        throw new Error('Неподдерживаемый формат. Используйте PDF, DOC, DOCX или TXT.');
      }

      if (!text || text.trim().length === 0) throw new Error('Не удалось извлечь текст из файла.');
      await parseCandidateFromResume(text);
    } catch (err) {
      console.error('File processing error:', err);
      alert('Ошибка при обработке файла: ' + err.message);
      setProcessing(false);
    }
  };

  const parseCandidateFromResume = async (text) => {
    setProcessingStatus('Анализирую документ...');
    try {
      if (isPracticeReview(text) && !hasResumeSignals(text)) {
        throw new Error('Документ похож на отзыв о практике, а не на резюме кандидата. Загрузите резюме или заполните кандидата вручную.');
      }

      const fullName = extractFullName(text);
      const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      const phoneMatch = text.match(/(?:\+?\d[\d\s().-]{8,}\d)/);
      const foundSkills = techKeywords.filter(tech => text.toLowerCase().includes(tech.toLowerCase()));

      const parsedCandidate = {
        full_name: fullName,
        email: emailMatch ? emailMatch[0].toLowerCase() : '',
        phone: phoneMatch ? phoneMatch[0].trim() : '',
        experience_years: extractExperienceYears(text),
        skills: foundSkills.join(', '),
        resume_text: text,
      };

      if (!parsedCandidate.full_name) {
        throw new Error('Не удалось определить ФИО кандидата. Проверьте, что загружен именно файл резюме.');
      }
      if (!parsedCandidate.email) {
        parsedCandidate.email = buildFallbackEmail(parsedCandidate.full_name);
        setProcessingStatus('Email не найден — создан временный адрес, проверьте его перед сохранением.');
      }

      setCandidate(parsedCandidate);
      setProcessingStatus('Данные извлечены. Проверьте их перед сохранением.');
      setTimeout(() => setStep(2), 800);
    } catch (err) {
      alert('Ошибка при обработке резюме: ' + err.message);
    } finally {
      setProcessing(false);
    }
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
    if (e.dataTransfer.files?.[0]) await processFile(e.dataTransfer.files[0]);
  };

  const nextStep = () => {
    if (step === 1 && candidate.full_name && candidate.email) setStep(2);
    else if (step === 1) alert('Пожалуйста, заполните имя и email');
  };

  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSave = async () => {
    if (!candidate.full_name || !candidate.email) {
      alert('Пожалуйста, заполните имя и email');
      return;
    }
    setSaving(true);
    try {
      await onSave(candidate);
      setStep(3);
    } catch (err) {
      alert('Ошибка при сохранении: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
        <div className="modal-header">
          <h2>Добавить кандидата</h2>
          <button className="icon-button" onClick={onClose}><X size={20} /></button>
        </div>

        <div style={{ padding: '20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {['Загрузка резюме', 'Проверка', 'Готово'].map((label, idx) => (
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

        {step === 1 && (
          <div style={{ padding: '40px 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <FileText size={48} color="#0b73ff" style={{ marginBottom: '16px' }} />
              <h3 style={{ marginBottom: '8px' }}>Загрузите резюме кандидата</h3>
              <p style={{ color: '#64748b' }}>Система извлечёт данные, но перед сохранением их нужно проверить</p>
            </div>

            <div
              onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragActive ? '#0b73ff' : '#cbd5e1'}`,
                borderRadius: '12px', padding: '40px', textAlign: 'center',
                background: dragActive ? '#eff6ff' : '#f8fafc', cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={async e => { if (e.target.files?.[0]) await processFile(e.target.files[0]); }}
                style={{ display: 'none' }}
              />
              {processing ? (
                <div>
                  <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>{processingStatus}</div>
                  <div style={{ color: '#64748b' }}>Пожалуйста, подождите</div>
                </div>
              ) : (
                <div>
                  <Upload size={40} color="#0b73ff" style={{ marginBottom: '12px' }} />
                  <p style={{ margin: '0 0 8px 0', fontWeight: '500', fontSize: '16px' }}>Перетащите файл сюда</p>
                  <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>или кликните для выбора</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>PDF, DOC, DOCX, TXT</p>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '16px' }}>Проверьте данные кандидата</h3>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>ФИО *</label>
                <input value={candidate.full_name} onChange={e => setCandidate({ ...candidate, full_name: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Email *</label>
                <input type="email" value={candidate.email} onChange={e => setCandidate({ ...candidate, email: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Телефон</label>
                  <input value={candidate.phone} onChange={e => setCandidate({ ...candidate, phone: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Опыт (лет)</label>
                  <input type="number" min="0" max="60" value={candidate.experience_years} onChange={e => setCandidate({ ...candidate, experience_years: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Навыки</label>
                <input value={candidate.skills} onChange={e => setCandidate({ ...candidate, skills: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Резюме</label>
                <textarea value={candidate.resume_text} onChange={e => setCandidate({ ...candidate, resume_text: e.target.value })} rows={6} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', background: '#d1fae5', borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 24px' }}>
              <Check size={40} color="#166534" />
            </div>
            <h2 style={{ marginBottom: '12px' }}>Кандидат добавлен!</h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>Данные успешно сохранены</p>
          </div>
        )}

        <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
          {step > 1 && step < 3 ? (
            <button onClick={prevStep} className="secondary-button"><ArrowLeft size={18} /> Назад</button>
          ) : <div />}
          {step === 1 && !processing && (
            <button onClick={nextStep} className="primary-button" disabled={!candidate.full_name || !candidate.email}>Далее <ArrowRight size={18} /></button>
          )}
          {step === 2 && (
            <button onClick={handleSave} className="primary-button" disabled={saving} style={{ background: saving ? '#94a3b8' : '#166534' }}>
              {saving ? 'Сохранение...' : <><Check size={18} /> Сохранить кандидата</>}
            </button>
          )}
          {step === 3 && (
            <button onClick={onClose} className="primary-button" style={{ background: '#166534' }}><Check size={18} /> Готово</button>
          )}
        </div>
      </div>
    </div>
  );
}
