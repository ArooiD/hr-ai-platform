import { useEffect, useState, useRef } from 'react';
import { BriefcaseBusiness, Plus, Trash2, Edit2, X, Check, Search, Upload, FileText, Sparkles } from 'lucide-react';
import { hrApi } from '../api/client';

const emptyVacancy = { title: '', department: '', description: '', required_skills: '', salary_from: '', salary_to: '' };

export default function VacanciesPage() {
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [vacancy, setVacancy] = useState(emptyVacancy);
  const [searchQuery, setSearchQuery] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiSource, setAiSource] = useState(null); // 'file' or 'text'
  const fileInputRef = useRef(null);

  const loadVacancies = async () => {
    try {
      const data = await hrApi.vacancies();
      setVacancies(data);
    } catch (err) {
      console.error('Failed to load vacancies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVacancies();
  }, []);

  const resetForm = () => {
    setVacancy(emptyVacancy);
    setEditingId(null);
    setShowForm(false);
    setAiSource(null);
  };

  const handleCreate = () => {
    setVacancy(emptyVacancy);
    setEditingId(null);
    setShowForm(true);
    setAiSource(null);
  };

  // Drag & Drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const extractTextFromFile = async (file) => {
    // Simple text extraction - in production use proper libraries
    if (file.type === 'text/plain') {
      return await file.text();
    }
    // For demo purposes, we'll try to read as text
    try {
      return await file.text();
    } catch (err) {
      alert('Не удалось прочитать файл. Используйте .txt файлы или введите текст вручную.');
      return null;
    }
  };

  const processWithAI = async (text) => {
    setAiProcessing(true);
    try {
      // Simple AI parsing logic (in production use real AI API)
      const lines = text.split('\n').filter(line => line.trim());
      const parsed = {
        title: '',
        department: '',
        description: '',
        required_skills: [],
        salary_from: '',
        salary_to: ''
      };

      let inDescription = false;
      let skillsFound = false;

      for (const line of lines) {
        const lowerLine = line.toLowerCase();
        
        // Detect title (first significant line)
        if (!parsed.title && (lowerLine.includes('вакансия') || lowerLine.includes('требуется') || lowerLine.includes('нужен'))) {
          parsed.title = line.replace(/вакансия|требуется|нужен/gi, '').trim();
          continue;
        }
        
        // Detect department
        if (!parsed.department && (lowerLine.includes('отдел') || lowerLine.includes('департамент'))) {
          parsed.department = line.split(':')[1]?.trim() || line.split('-')[1]?.trim() || 'IT';
          continue;
        }
        
        // Detect salary
        if (lowerLine.includes('зарплата') || lowerLine.includes('оклад') || lowerLine.includes('руб')) {
          const salaryMatch = line.match(/(\d+)\s*[-–]\s*(\d+)/);
          if (salaryMatch) {
            parsed.salary_from = salaryMatch[1];
            parsed.salary_to = salaryMatch[2];
          }
          continue;
        }
        
        // Detect skills
        if (lowerLine.includes('навыки') || lowerLine.includes('требования') || lowerLine.includes('skills')) {
          skillsFound = true;
          inDescription = false;
          const skillsText = line.split(':')[1]?.split('-')[1] || line;
          parsed.required_skills = skillsText.split(/[,,;]/).map(s => s.trim()).filter(Boolean);
          continue;
        }
        
        // Rest is description
        if (!inDescription && !skillsFound) {
          inDescription = true;
        }
        
        if (inDescription && !skillsFound && line.trim()) {
          parsed.description += line + '\n';
        }
      }

      // If no title found, use first line
      if (!parsed.title && lines[0]) {
        parsed.title = lines[0].trim();
      }
      
      // If no department found, default to IT
      if (!parsed.department) {
        parsed.department = 'IT';
      }

      parsed.description = parsed.description.trim();
      
      setVacancy({
        title: parsed.title,
        department: parsed.department,
        description: parsed.description,
        required_skills: parsed.required_skills.join(', '),
        salary_from: parsed.salary_from,
        salary_to: parsed.salary_to
      });

      setAiSource('file');
      alert('AI успешно распознал вакансию! Проверьте данные и при необходимости отредактируйте.');
      
    } catch (err) {
      console.error('AI processing error:', err);
      alert('Ошибка при обработке файла. Попробуйте ввести данные вручную.');
    } finally {
      setAiProcessing(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const text = await extractTextFromFile(file);
      if (text) {
        await processWithAI(text);
      }
    }
  };

  const handleFileSelect = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const text = await extractTextFromFile(file);
      if (text) {
        await processWithAI(text);
      }
    }
  };

  const handleTextPaste = async (e) => {
    const pastedText = e.target.value;
    if (pastedText.length > 50) { // Only process if substantial text
      // Auto-detect if it looks like a job description
      if (pastedText.includes('вакансия') || pastedText.includes('требования') || pastedText.includes('навыки')) {
        if (confirm('Похоже, вы вставили описание вакансии. Распознать структуру автоматически?')) {
          await processWithAI(pastedText);
        }
      }
    }
  };

  const handleEdit = (v) => {
    setVacancy({
      ...v,
      salary_from: v.salary_from || '',
      salary_to: v.salary_to || '',
      required_skills: v.required_skills.join(', '),
    });
    setEditingId(v.id);
    setShowForm(true);
    setAiSource(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Вы уверены, что хотите удалить эту вакансию?')) return;
    try {
      await hrApi.deleteVacancy(id);
      await loadVacancies();
    } catch (err) {
      alert('Ошибка при удалении вакансии');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      title: vacancy.title,
      department: vacancy.department,
      description: vacancy.description,
      required_skills: vacancy.required_skills.split(',').map(s => s.trim()).filter(Boolean),
      salary_from: vacancy.salary_from ? Number(vacancy.salary_from) : null,
      salary_to: vacancy.salary_to ? Number(vacancy.salary_to) : null,
    };

    try {
      if (editingId) {
        await hrApi.updateVacancy(editingId, payload);
      } else {
        await hrApi.createVacancy(payload);
      }
      resetForm();
      await loadVacancies();
    } catch (err) {
      alert('Ошибка при сохранении вакансии');
    }
  };

  const filteredVacancies = vacancies.filter(v =>
    v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1><BriefcaseBusiness size={24} /> Вакансии</h1>
          <p>Управление вакансиями компании</p>
        </div>
        <button className="primary-button" onClick={handleCreate}>
          <Plus size={18} /> Добавить вакансию
        </button>
      </div>

      <div className="search-bar">
        <Search size={18} />
        <input
          type="text"
          placeholder="Поиск по названию или отделу..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2>{editingId ? 'Редактировать вакансию' : 'Новая вакансия'}</h2>
              <button className="icon-button" onClick={resetForm}>
                <X size={20} />
              </button>
            </div>

            {/* AI Upload Zone */}
            {!editingId && !vacancy.title && (
              <div 
                className={`drag-drop-zone ${dragActive ? 'active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{ 
                  padding: '40px', 
                  textAlign: 'center', 
                  border: `2px dashed ${dragActive ? '#0b73ff' : '#d1d5db'}`,
                  borderRadius: '12px',
                  marginBottom: '20px',
                  cursor: 'pointer',
                  background: dragActive ? '#eff6ff' : '#f9fafb',
                  transition: 'all 0.3s ease'
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.doc,.docx,.pdf"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <Upload size={48} style={{ color: '#0b73ff', marginBottom: '16px' }} />
                <h3 style={{ margin: '0 0 8px 0', color: '#111318' }}>Перетащите файл сюда</h3>
                <p style={{ margin: '0 0 16px 0', color: '#6b7280', fontSize: '14px' }}>
                  или кликните для выбора файла
                </p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <span className="skill-tag">.txt</span>
                  <span className="skill-tag">.doc</span>
                  <span className="skill-tag">.docx</span>
                  <span className="skill-tag">.pdf</span>
                </div>
                <p style={{ marginTop: '16px', fontSize: '12px', color: '#9ca3af' }}>
                  <Sparkles size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  AI автоматически распознает структуру вакансии
                </p>
              </div>
            )}

            {/* AI Success Message */}
            {aiSource && (
              <div style={{ 
                padding: '12px 16px', 
                borderRadius: '8px', 
                background: '#d1fae5', 
                color: '#065f46',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Sparkles size={18} />
                <span>AI успешно распознал вакансию из {aiSource === 'file' ? 'файла' : 'текста'}. Проверьте данные ниже:</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="vacancy-form">
              <div className="form-group">
                <label>Название вакансии *</label>
                <input
                  type="text"
                  value={vacancy.title}
                  onChange={(e) => setVacancy({ ...vacancy, title: e.target.value })}
                  onPaste={handleTextPaste}
                  required
                  placeholder="Например: Middle Python Developer"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Отдел *</label>
                  <input
                    type="text"
                    value={vacancy.department}
                    onChange={(e) => setVacancy({ ...vacancy, department: e.target.value })}
                    required
                    placeholder="Например: IT"
                  />
                </div>
                <div className="form-group">
                  <label>Зарплата от (руб.)</label>
                  <input
                    type="number"
                    value={vacancy.salary_from}
                    onChange={(e) => setVacancy({ ...vacancy, salary_from: e.target.value })}
                    placeholder="180000"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Описание *</label>
                <textarea
                  value={vacancy.description}
                  onChange={(e) => setVacancy({ ...vacancy, description: e.target.value })}
                  onPaste={handleTextPaste}
                  required
                  placeholder="Описание обязанностей и требований... (можно вставить текст для AI-распознавания)"
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label>Зарплата до (руб.)</label>
                <input
                  type="number"
                  value={vacancy.salary_to}
                  onChange={(e) => setVacancy({ ...vacancy, salary_to: e.target.value })}
                  placeholder="260000"
                />
              </div>

              <div className="form-group">
                <label>Навыки (через запятую)</label>
                <input
                  type="text"
                  value={vacancy.required_skills}
                  onChange={(e) => setVacancy({ ...vacancy, required_skills: e.target.value })}
                  placeholder="Python, FastAPI, Docker, SQL"
                />
              </div>

              <div className="form-actions">
                <button type="button" className="secondary-button" onClick={resetForm}>
                  Отмена
                </button>
                <button type="submit" className="primary-button" disabled={aiProcessing}>
                  {aiProcessing ? (
                    <>Обработка...</>
                  ) : (
                    <><Check size={18} /> Сохранить</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-state">Загрузка...</div>
      ) : filteredVacancies.length === 0 ? (
        <div className="empty-state">
          <BriefcaseBusiness size={48} />
          <p>Вакансий не найдено</p>
          {!searchQuery && <button onClick={handleCreate}>Создать первую вакансию</button>}
        </div>
      ) : (
        <div className="cards-grid">
          {filteredVacancies.map((v) => (
            <div key={v.id} className="card vacancy-card">
              <div className="card-header">
                <h3>{v.title}</h3>
                <span className={`status-badge ${v.status}`}>{v.status === 'open' ? 'Открыта' : 'Закрыта'}</span>
              </div>
              <div className="card-body">
                <p className="department"><strong>Отдел:</strong> {v.department}</p>
                <p className="description">{v.description}</p>
                {(v.salary_from || v.salary_to) && (
                  <p className="salary">
                    {v.salary_from && `${v.salary_from.toLocaleString()} ₽`}
                    {v.salary_to && ` - ${v.salary_to.toLocaleString()} ₽`}
                  </p>
                )}
                {v.required_skills?.length > 0 && (
                  <div className="skills">
                    {v.required_skills.map((skill) => (
                      <span key={skill} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="card-actions">
                <button className="icon-button" onClick={() => handleEdit(v)} title="Редактировать">
                  <Edit2 size={16} />
                </button>
                <button className="icon-button danger" onClick={() => handleDelete(v.id)} title="Удалить">
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
