import { useState } from 'react';
import { HelpCircle, MessageSquare, Mail, Phone, BookOpen, Lightbulb, FileText, Send, CheckCircle, AlertCircle } from 'lucide-react';

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState('faq');
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: '',
    description: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const faqs = [
    {
      question: 'Как добавить нового кандидата?',
      answer: 'Нажмите кнопку "Добавить кандидата" на странице кандидатов или используйте wizard для создания карточки кандидата с резюме.'
    },
    {
      question: 'Как создать вакансию?',
      answer: 'Перейдите на страницу вакансий и нажмите "Добавить вакансию". Заполните описание, требования и навыки.'
    },
    {
      question: 'Как прикрепить резюме к кандидату?',
      answer: 'Откройте карточку кандидата, перейдите во вкладку "Резюме" и загрузите файл в формате PDF.'
    },
    {
      question: 'Как изменить статус кандидата?',
      answer: 'В карточке кандидата используйте выпадающий список "Статус" для изменения текущего этапа подбора.'
    },
    {
      question: 'Как создать вопросы для интервью?',
      answer: 'Перейдите в раздел "Подбор", выберите этап и добавьте вопросы через кнопку "Добавить вопрос".'
    },
    {
      question: 'Как связать вакансию с кандидатом?',
      answer: 'В карточке кандидата в разделе "Вакансии" нажмите "Связать вакансию" и выберите нужную из списка.'
    },
  ];

  const categories = [
    'Техническая проблема',
    'Вопрос по функционалу',
    'Предложение по улучшению',
    'Ошибка в системе',
    'Доступ и права',
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTicketForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setTicketForm({ subject: '', category: '', description: '' });
    }, 3000);
  };

  return (
    <div className="page-container" data-testid="support-page">
      <div className="page-header">
        <div>
          <h1><HelpCircle size={24} /> Поддержка</h1>
          <p>Получите помощь и найдите ответы на вопросы</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '24px' }}>
        <button
          className={`tab ${activeTab === 'faq' ? 'active' : ''}`}
          onClick={() => setActiveTab('faq')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: activeTab === 'faq' ? 'var(--blue)' : '#fff',
            color: activeTab === 'faq' ? '#fff' : '#4b5563',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontWeight: '600',
            marginRight: '4px'
          }}
        >
          <BookOpen size={16} style={{ marginRight: '8px' }} />
          FAQ
        </button>
        <button
          className={`tab ${activeTab === 'contact' ? 'active' : ''}`}
          onClick={() => setActiveTab('contact')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: activeTab === 'contact' ? 'var(--blue)' : '#fff',
            color: activeTab === 'contact' ? '#fff' : '#4b5563',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          <MessageSquare size={16} style={{ marginRight: '8px' }} />
          Создать заявку
        </button>
        <button
          className={`tab ${activeTab === 'resources' ? 'active' : ''}`}
          onClick={() => setActiveTab('resources')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: activeTab === 'resources' ? 'var(--blue)' : '#fff',
            color: activeTab === 'resources' ? '#fff' : '#4b5563',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontWeight: '600',
            marginLeft: '4px'
          }}
        >
          <FileText size={16} style={{ marginRight: '8px' }} />
          Ресурсы
        </button>
      </div>

      {/* FAQ Tab */}
      {activeTab === 'faq' && (
        <div className="faq-section">
          <h2 style={{ marginBottom: '20px', color: '#111318' }}>Часто задаваемые вопросы</h2>
          <div style={{ display: 'grid', gap: '16px' }}>
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="faq-item"
                style={{
                  border: '1px solid #dbe3ee',
                  borderRadius: '12px',
                  background: '#fff',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--blue)';
                  e.currentTarget.style.background = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#dbe3ee';
                  e.currentTarget.style.background = '#fff';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                  <Lightbulb size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h3 style={{ margin: '0 0 8px', color: '#111318', fontSize: '16px', fontWeight: '600' }}>
                      {faq.question}
                    </h3>
                    <p style={{ margin: 0, color: '#59616d', lineHeight: '1.6' }}>{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact Tab */}
      {activeTab === 'contact' && (
        <div className="contact-section">
          <h2 style={{ marginBottom: '20px', color: '#111318' }}>Создать заявку в поддержку</h2>
          
          {submitted ? (
            <div style={{
              border: '1px solid #d1fae5',
              borderRadius: '12px',
              background: '#ecfdf5',
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <CheckCircle size={24} color="#10b981" />
              <div>
                <h3 style={{ margin: '0 0 4px', color: '#065f46' }}>Заявка успешно отправлена!</h3>
                <p style={{ margin: 0, color: '#047857' }}>Мы свяжемся с вами в течение 24 часов.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{
              border: '1px solid #dbe3ee',
              borderRadius: '12px',
              background: '#fff',
              padding: '24px'
            }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                  Тема <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="subject"
                  value={ticketForm.subject}
                  onChange={handleInputChange}
                  placeholder="Краткое описание проблемы"
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #dbe3ee',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--blue)'}
                  onBlur={(e) => e.target.style.borderColor = '#dbe3ee'}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                  Категория <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  name="category"
                  value={ticketForm.category}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #dbe3ee',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    background: '#fff'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--blue)'}
                  onBlur={(e) => e.target.style.borderColor = '#dbe3ee'}
                >
                  <option value="">Выберите категорию</option>
                  {categories.map((cat, index) => (
                    <option key={index} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                  Описание <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  name="description"
                  value={ticketForm.description}
                  onChange={handleInputChange}
                  placeholder="Опишите вашу проблему или вопрос подробно..."
                  required
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #dbe3ee',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--blue)'}
                  onBlur={(e) => e.target.style.borderColor = '#dbe3ee'}
                />
              </div>

              <button
                type="submit"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--blue)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = 'var(--blue-dark)'}
                onMouseLeave={(e) => e.target.style.background = 'var(--blue)'}
              >
                <Send size={18} />
                Отправить заявку
              </button>
            </form>
          )}

          {/* Contact Info */}
          <div style={{
            marginTop: '32px',
            padding: '20px',
            background: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ margin: '0 0 16px', color: '#111318', fontSize: '16px' }}>Контактная информация</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Mail size={18} color="var(--blue)" />
                <span style={{ color: '#4b5563' }}>support@hr-ai-platform.com</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Phone size={18} color="var(--blue)" />
                <span style={{ color: '#4b5563' }}>+7 (495) 123-45-67</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <MessageSquare size={18} color="var(--blue)" />
                <span style={{ color: '#4b5563' }}>Чат поддержки (9:00 - 18:00 MSK)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resources Tab */}
      {activeTab === 'resources' && (
        <div className="resources-section">
          <h2 style={{ marginBottom: '20px', color: '#111318' }}>Полезные ресурсы</h2>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{
              border: '1px solid #dbe3ee',
              borderRadius: '12px',
              background: '#fff',
              padding: '20px',
              display: 'flex',
              alignItems: 'start',
              gap: '16px'
            }}>
              <BookOpen size={24} color="var(--blue)" />
              <div>
                <h3 style={{ margin: '0 0 8px', color: '#111318', fontSize: '16px' }}>Пользовательская документация</h3>
                <p style={{ margin: '0 0 12px', color: '#59616d', lineHeight: '1.6' }}>
                  Полное руководство по работе с платформой HR AI. Описаны все функции и возможности системы.
                </p>
                <button style={{
                  background: 'var(--blue)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}>
                  Открыть документацию
                </button>
              </div>
            </div>

            <div style={{
              border: '1px solid #dbe3ee',
              borderRadius: '12px',
              background: '#fff',
              padding: '20px',
              display: 'flex',
              alignItems: 'start',
              gap: '16px'
            }}>
              <AlertCircle size={24} color="#f59e0b" />
              <div>
                <h3 style={{ margin: '0 0 8px', color: '#111318', fontSize: '16px' }}>Видеоуроки</h3>
                <p style={{ margin: '0 0 12px', color: '#59616d', lineHeight: '1.6' }}>
                  Серия видеоуроков по основным сценариям работы: добавление кандидатов, создание вакансий, проведение интервью.
                </p>
                <button style={{
                  background: '#f59e0b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}>
                  Смотреть уроки
                </button>
              </div>
            </div>

            <div style={{
              border: '1px solid #dbe3ee',
              borderRadius: '12px',
              background: '#fff',
              padding: '20px',
              display: 'flex',
              alignItems: 'start',
              gap: '16px'
            }}>
              <FileText size={24} color="#10b981" />
              <div>
                <h3 style={{ margin: '0 0 8px', color: '#111318', fontSize: '16px' }}>База знаний</h3>
                <p style={{ margin: '0 0 12px', color: '#59616d', lineHeight: '1.6' }}>
                  Поиск по статьям, инструкциям и лучшим практикам работы с системой.
                </p>
                <button style={{
                  background: '#10b981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}>
                  Перейти в базу знаний
                </button>
              </div>
            </div>

            <div style={{
              border: '1px solid #dbe3ee',
              borderRadius: '12px',
              background: '#fff',
              padding: '20px',
              display: 'flex',
              alignItems: 'start',
              gap: '16px'
            }}>
              <HelpCircle size={24} color="#8b5cf6" />
              <div>
                <h3 style={{ margin: '0 0 8px', color: '#111318', fontSize: '16px' }}>Сообщество пользователей</h3>
                <p style={{ margin: '0 0 12px', color: '#59616d', lineHeight: '1.6' }}>
                  Обсуждайте вопросы с другими пользователями, делитесь опытом и получайте советы.
                </p>
                <button style={{
                  background: '#8b5cf6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}>
                  Вступить в сообщество
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
