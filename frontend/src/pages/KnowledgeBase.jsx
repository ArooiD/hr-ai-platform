// frontend/src/pages/KnowledgeBase.jsx
import { useState, useEffect, useRef } from 'react';
import { documentsApi } from '../api/client';
import { FileText, Search, Plus, Upload, X, Check, ArrowLeft } from 'lucide-react';

function KnowledgeBase() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    doc_type: '',
    department: '',
    search: ''
  });
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Загрузка документов
  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.doc_type) params.append('doc_type', filters.doc_type);
      if (filters.department) params.append('department', filters.department);
      if (filters.search) params.append('search', filters.search);
      
      const response = await documentsApi.getDocuments(params);
      setDocuments(response);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [filters]);

  const handleUpload = async (formData) => {
    try {
      await documentsApi.uploadDocument(formData);
      setShowUploadModal(false);
      fetchDocuments();
    } catch (error) {
      alert('Ошибка загрузки: ' + (error.message || 'Неизвестная ошибка'));
    }
  };

  return (
    <div className="page-container">
      {/* Заголовок */}
      <div className="page-header">
        <div>
          <h1><FileText size={24} /> База знаний</h1>
          <p>Локальные документы, профили должностей и инструкции</p>
        </div>
        <button className="primary-button" onClick={() => setShowUploadModal(true)}>
          <Plus size={18} /> Добавить документ
        </button>
      </div>

      {/* Фильтры */}
      <div className="search-bar">
        <div className="filters-grid">
          <div className="search-input-wrapper">
            <Search size={18} />
            <input
              type="text"
              placeholder="Поиск по документам..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
          </div>
          
          <select
            value={filters.doc_type}
            onChange={(e) => setFilters({...filters, doc_type: e.target.value})}
          >
            <option value="">Все типы</option>
            <option value="policy">Политика</option>
            <option value="procedure">Процедура</option>
            <option value="role_profile">Профиль должности</option>
            <option value="template">Шаблон</option>
            <option value="guide">Руководство</option>
          </select>
          
          <select
            value={filters.department}
            onChange={(e) => setFilters({...filters, department: e.target.value})}
          >
            <option value="">Все отделы</option>
            <option value="HR">HR</option>
            <option value="IT">IT</option>
            <option value="Finance">Финансы</option>
            <option value="Legal">Юридический</option>
          </select>
        </div>
      </div>

      {/* Список документов */}
      {loading ? (
        <div className="loading-state">Загрузка...</div>
      ) : documents.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} />
          <p>Документов нет. Загрузите первый документ или создайте профиль должности.</p>
        </div>
      ) : (
        <div className="data-list">
          {documents.map((doc) => (
            <div key={doc.id} className="data-card">
              <div className="data-card-header">
                <div className="data-card-title">
                  <h3>{doc.title}</h3>
                  <div className="data-card-badges">
                    <span className={`badge badge-${
                      doc.doc_type === 'role_profile' ? 'purple' :
                      doc.doc_type === 'policy' ? 'blue' :
                      'gray'
                    }`}>
                      {doc.doc_type}
                    </span>
                    {doc.department && (
                      <span className="badge badge-gray">
                        {doc.department}
                      </span>
                    )}
                    {doc.role && (
                      <span className="badge badge-indigo">
                        {doc.role}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {doc.description && (
                <p className="data-card-description">{doc.description}</p>
              )}
              
              <div className="data-card-footer">
                <span className="text-muted">📅 {new Date(doc.created_at).toLocaleDateString()}</span>
                <span className="text-muted">📄 {doc.file_name || 'Без файла'}</span>
                <span className={`badge badge-${doc.status === 'published' ? 'green' : 'yellow'}`}>
                  {doc.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно загрузки */}
      {showUploadModal && (
        <UploadModal onClose={() => setShowUploadModal(false)} onSubmit={handleUpload} />
      )}
    </div>
  );
}

// Компонент модалки с wizard
function UploadModal({ onClose, onSubmit }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    doc_type: 'guide',
    department: '',
    role: '',
    file: null
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.file) {
      alert('Пожалуйста, заполните название и выберите файл');
      return;
    }

    setUploading(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          data.append(key, formData[key]);
        }
      });
      await onSubmit(data);
      setStep(3);
    } catch (error) {
      alert('Ошибка загрузки: ' + (error.message || 'Неизвестная ошибка'));
    } finally {
      setUploading(false);
    }
  };

  const getDocTypeLabel = (type) => {
    const labels = {
      policy: 'Политика',
      procedure: 'Процедура',
      role_profile: 'Профиль должности',
      template: 'Шаблон',
      guide: 'Руководство'
    };
    return labels[type] || type;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2><FileText size={24} style={{ marginRight: '8px', verticalAlign: 'middle' }} />Загрузить документ</h2>
          <button className="icon-button" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Progress Steps */}
        <div style={{ padding: '20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {['Файл', 'Данные', 'Готово'].map((label, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: step > idx + 1 ? '#166534' : step === idx + 1 ? '#0b73ff' : '#e2e8f0',
                  color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 'bold'
                }}>
                  {step > idx + 1 ? <Check size={16} /> : idx + 1}
                </div>
                <span style={{ fontSize: '14px', color: step === idx + 1 ? '#0b73ff' : '#64748b' }}>{label}</span>
                {idx < 2 && <div style={{ width: '30px', height: '2px', background: step > idx + 1 ? '#166534' : '#e2e8f0' }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: File Upload */}
        {step === 1 && (
          <div style={{ padding: '32px' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '8px' }}>Загрузите документ</h3>
              <p style={{ color: '#64748b', fontSize: '14px' }}>Поддерживаемые форматы: PDF, DOC, DOCX, TXT</p>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed #cbd5e1',
                borderRadius: '12px', padding: '48px 24px', textAlign: 'center',
                background: '#f8fafc', cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <input 
                ref={fileInputRef} 
                type="file" 
                accept=".pdf,.doc,.docx,.txt" 
                onChange={e => {
                  if (e.target.files?.[0]) {
                    setFormData(prev => ({ ...prev, file: e.target.files[0] }));
                  }
                }} 
                style={{ display: 'none' }} 
              />
              
              {formData.file ? (
                <div style={{ padding: '20px' }}>
                  <div style={{ 
                    width: '64px', height: '64px', 
                    background: '#d1fae5', borderRadius: '12px', 
                    display: 'grid', placeItems: 'center', 
                    margin: '0 auto 16px' 
                  }}>
                    <FileText size={32} color="#166534" />
                  </div>
                  <p style={{ margin: '0 0 8px 0', fontWeight: '600', fontSize: '16px' }}>{formData.file.name}</p>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                    {(formData.file.size / 1024).toFixed(1)} KB
                  </p>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormData(prev => ({ ...prev, file: null }));
                    }}
                    style={{
                      marginTop: '16px', padding: '8px 16px',
                      background: '#fee2e2', color: '#dc2626',
                      border: 'none', borderRadius: '6px',
                      cursor: 'pointer', fontSize: '14px', fontWeight: '500'
                    }}
                  >
                    Изменить файл
                  </button>
                </div>
              ) : (
                <div>
                  <Upload size={48} color="#0b73ff" style={{ marginBottom: '16px' }} />
                  <p style={{ margin: '0 0 8px 0', fontWeight: '600', fontSize: '16px' }}>
                    Кликните для выбора файла
                  </p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                    или перетащите сюда
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Document Details */}
        {step === 2 && (
          <div style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '20px' }}>Данные документа</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Название *</label>
                <input
                  type="text"
                  placeholder="Например: Инструкция по онбордингу"
                  required
                  className="w-full px-3 py-2 border rounded"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Тип документа *</label>
                <select
                  className="w-full px-3 py-2 border rounded"
                  value={formData.doc_type}
                  onChange={e => setFormData({...formData, doc_type: e.target.value})}
                  style={{ background: 'white' }}
                >
                  <option value="guide">Руководство</option>
                  <option value="policy">Политика</option>
                  <option value="role_profile">Профиль должности</option>
                  <option value="procedure">Процедура</option>
                  <option value="template">Шаблон</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Описание</label>
                <textarea
                  placeholder="Краткое описание документа..."
                  className="w-full px-3 py-2 border rounded"
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Отдел</label>
                  <input
                    type="text"
                    placeholder="Например: IT, HR"
                    className="w-full px-3 py-2 border rounded"
                    value={formData.department}
                    onChange={e => setFormData({...formData, department: e.target.value})}
                  />
                </div>

                {formData.doc_type === 'role_profile' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Должность</label>
                    <input
                      type="text"
                      placeholder="Например: Python Developer"
                      className="w-full px-3 py-2 border rounded"
                      value={formData.role}
                      onChange={e => setFormData({...formData, role: e.target.value})}
                    />
                  </div>
                )}
              </div>

              {/* File Preview */}
              {formData.file && (
                <div style={{ 
                  padding: '12px', background: '#f1f5f9', borderRadius: '8px',
                  display: 'flex', alignItems: 'center', gap: '12px'
                }}>
                  <FileText size={20} color="#0b73ff" />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: '500', fontSize: '14px' }}>{formData.file.name}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                      {(formData.file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end" style={{ marginTop: '24px' }}>
                <button 
                  type="button" 
                  onClick={() => setStep(1)} 
                  className="secondary-button"
                >
                  <ArrowLeft size={18} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Назад
                </button>
                <button 
                  type="submit" 
                  className="primary-button" 
                  disabled={uploading}
                  style={{ background: uploading ? '#94a3b8' : '#166534' }}
                >
                  {uploading ? 'Загрузка...' : <><Check size={18} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Загрузить</>}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ 
              width: '80px', height: '80px', background: '#d1fae5', 
              borderRadius: '50%', display: 'grid', placeItems: 'center', 
              margin: '0 auto 24px' 
            }}>
              <Check size={40} color="#166534" />
            </div>
            <h2 style={{ marginBottom: '12px' }}>Документ загружен!</h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>
              {formData.title} успешно добавлен в базу знаний
            </p>
            <button onClick={onClose} className="primary-button" style={{ background: '#166534' }}>
              <Check size={18} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Готово
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default KnowledgeBase;
