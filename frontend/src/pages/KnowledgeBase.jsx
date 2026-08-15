// frontend/src/pages/KnowledgeBase.jsx
import { useState, useEffect } from 'react';
import { hrApi } from '../api/client';
import { FileText, Search, Plus } from 'lucide-react';

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
      
      const response = await hrApi.get(`/api/documents?${params}`);
      setDocuments(response.data);
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
      await hrApi.post('/api/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowUploadModal(false);
      fetchDocuments();
    } catch (error) {
      alert('Ошибка загрузки: ' + (error.response?.data?.detail || error.message));
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

// Компонент модалки
function UploadModal({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    doc_type: 'guide',
    department: '',
    role: '',
    file: null
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== '') {
        data.append(key, formData[key]);
      }
    });
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Загрузить документ</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Название"
            required
            className="w-full px-3 py-2 border rounded"
            value={formData.title}
            onChange={e => setFormData({...formData, title: e.target.value})}
          />
          <textarea
            placeholder="Описание"
            className="w-full px-3 py-2 border rounded"
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
          />
          <select
            className="w-full px-3 py-2 border rounded"
            value={formData.doc_type}
            onChange={e => setFormData({...formData, doc_type: e.target.value})}
          >
            <option value="guide">Руководство</option>
            <option value="policy">Политика</option>
            <option value="role_profile">Профиль должности</option>
            <option value="procedure">Процедура</option>
            <option value="template">Шаблон</option>
          </select>
          <input
            type="text"
            placeholder="Отдел (например: IT, HR)"
            className="w-full px-3 py-2 border rounded"
            value={formData.department}
            onChange={e => setFormData({...formData, department: e.target.value})}
          />
          <input
            type="text"
            placeholder="Должность (для профиля)"
            className="w-full px-3 py-2 border rounded"
            value={formData.role}
            onChange={e => setFormData({...formData, role: e.target.value})}
          />
          <input
            type="file"
            className="w-full px-3 py-2 border rounded"
            onChange={e => setFormData({...formData, file: e.target.files[0]})}
          />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Отмена</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Загрузить</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default KnowledgeBase;
