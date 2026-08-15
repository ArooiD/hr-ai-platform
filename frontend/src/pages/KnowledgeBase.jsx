// frontend/src/pages/KnowledgeBase.jsx
import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
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
      
      const response = await apiClient.get(`/api/documents?${params}`);
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
      await apiClient.post('/api/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowUploadModal(false);
      fetchDocuments();
    } catch (error) {
      alert('Ошибка загрузки: ' + (error.response?.data?.detail || error.message));
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Заголовок */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📚 База знаний</h1>
          <p className="text-gray-600 mt-1">Локальные документы, профили должностей и инструкции</p>
        </div>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          <span>Добавить документ</span>
        </button>
      </div>

      {/* Фильтры */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="col-span-1 md:col-span-2 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Поиск по документам..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
          </div>
          
          <select
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
        <div className="text-center py-12 text-gray-500">Загрузка...</div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Документов нет</h3>
          <p className="mt-1 text-sm text-gray-500">Загрузите первый документ или создайте профиль должности.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <div key={doc.id} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">{doc.title}</h3>
                    <span className={`px-2 py-0.5 text-xs rounded-full uppercase font-medium ${
                      doc.doc_type === 'role_profile' ? 'bg-purple-100 text-purple-800' :
                      doc.doc_type === 'policy' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {doc.doc_type}
                    </span>
                    {doc.department && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {doc.department}
                      </span>
                    )}
                    {doc.role && (
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full">
                        {doc.role}
                      </span>
                    )}
                  </div>
                  
                  {doc.description && (
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">{doc.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>📅 {new Date(doc.created_at).toLocaleDateString()}</span>
                    <span>📄 {doc.file_name || 'Без файла'}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      doc.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                </div>
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
