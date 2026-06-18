import { useState, useEffect, useRef } from 'react';
import { Search, X, FileText, UserRound, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { hrApi } from '../../api/client';

export default function TopbarSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Закрытие при клике вне
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
        setQuery('');
        setResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Фокус на input при открытии
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Поиск с debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [vacancies, candidates] = await Promise.all([
          hrApi.vacancies(),
          hrApi.candidates()
        ]);

        const searchLower = query.toLowerCase();
        
        const vacancyResults = vacancies
          .filter(v => 
            v.title.toLowerCase().includes(searchLower) ||
            v.department.toLowerCase().includes(searchLower) ||
            v.required_skills?.some(s => s.toLowerCase().includes(searchLower))
          )
          .map(v => ({
            type: 'vacancy',
            id: v.id,
            title: v.title,
            subtitle: v.department,
            icon: Briefcase
          }));

        const candidateResults = candidates
          .filter(c => 
            c.full_name.toLowerCase().includes(searchLower) ||
            c.email.toLowerCase().includes(searchLower) ||
            c.skills?.some(s => s.toLowerCase().includes(searchLower))
          )
          .map(c => ({
            type: 'candidate',
            id: c.id,
            title: c.full_name,
            subtitle: c.email,
            icon: UserRound
          }));

        setResults([...vacancyResults, ...candidateResults].slice(0, 8));
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[activeIndex]) {
      e.preventDefault();
      handleSelect(results[activeIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
      setResults([]);
    }
  };

  const handleSelect = (result) => {
    if (result.type === 'vacancy') {
      navigate(`/vacancies/${result.id}`);
    } else if (result.type === 'candidate') {
      navigate(`/candidates/${result.id}`);
    }
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
    setActiveIndex(0);
  };

  if (!isOpen) {
    return (
      <button 
        className="search-trigger" 
        onClick={handleOpen}
        title="Поиск"
        style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '8px', 
          padding: '8px 12px',
          border: '1px solid var(--line)',
          borderRadius: '10px',
          background: '#fff',
          color: '#64748b',
          cursor: 'pointer'
        }}
      >
        <Search size={16} />
        <span style={{ fontSize: '13px', fontWeight: '600' }}>поиск</span>
        <kbd style={{ 
          marginLeft: '8px',
          padding: '2px 6px',
          fontSize: '11px',
          background: '#f1f5f9',
          borderRadius: '4px',
          color: '#94a3b8'
        }}>⌘K</kbd>
      </button>
    );
  }

  return (
    <div 
      ref={searchRef}
      className="topbar-search-dropdown"
      style={{
        position: 'absolute',
        right: '200px',
        top: '60px',
        width: '480px',
        maxHeight: '400px',
        background: '#fff',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(15, 23, 42, 0.2)',
        border: '1px solid var(--line)',
        zIndex: 1000,
        overflow: 'hidden'
      }}
    >
      {/* Search input */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        padding: '14px 16px',
        borderBottom: '1px solid var(--line)'
      }}>
        <Search size={18} color="#64748b" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Поиск вакансий, кандидатов..."
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: '15px',
            background: 'transparent'
          }}
        />
        <button
          onClick={handleClose}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: '4px',
            color: '#94a3b8'
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Results */}
      <div style={{ overflowY: 'auto', maxHeight: '320px' }}>
        {loading ? (
          <div style={{ 
            padding: '24px', 
            textAlign: 'center', 
            color: '#94a3b8',
            fontSize: '14px'
          }}>
            Поиск...
          </div>
        ) : results.length === 0 && query.trim() ? (
          <div style={{ 
            padding: '24px', 
            textAlign: 'center', 
            color: '#94a3b8',
            fontSize: '14px'
          }}>
            Ничего не найдено
          </div>
        ) : results.length === 0 ? (
          <div style={{ padding: '16px' }}>
            <div style={{ 
              fontSize: '12px', 
              fontWeight: '700', 
              color: '#94a3b8',
              marginBottom: '8px',
              textTransform: 'uppercase'
            }}>
              Быстрый доступ
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <button
                onClick={() => { navigate('/vacancies'); handleClose(); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  border: '1px solid var(--line)',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Briefcase size={16} color="#64748b" />
                <span style={{ fontSize: '14px', fontWeight: '600' }}>Все вакансии</span>
              </button>
              <button
                onClick={() => { navigate('/candidates'); handleClose(); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  border: '1px solid var(--line)',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <UserRound size={16} color="#64748b" />
                <span style={{ fontSize: '14px', fontWeight: '600' }}>Все кандидаты</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ 
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: '700',
              color: '#94a3b8',
              textTransform: 'uppercase'
            }}>
              Результаты ({results.length})
            </div>
            {results.map((result, index) => {
              const Icon = result.icon;
              return (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setActiveIndex(index)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    border: 'none',
                    background: index === activeIndex ? '#f5f9ff' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{
                    display: 'grid',
                    placeItems: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: result.type === 'vacancy' ? '#eaf4ff' : '#f0fdf4',
                    color: result.type === 'vacancy' ? '#0b73ff' : '#16a34a'
                  }}>
                    <Icon size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: '600',
                      color: '#111318'
                    }}>
                      {result.title}
                    </div>
                    {result.subtitle && (
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#64748b'
                      }}>
                        {result.subtitle}
                      </div>
                    )}
                  </div>
                  {result.type === 'vacancy' ? (
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: '700',
                      color: '#0b73ff',
                      background: '#eaf4ff',
                      padding: '4px 8px',
                      borderRadius: '6px'
                    }}>
                      Вакансия
                    </span>
                  ) : (
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: '700',
                      color: '#16a34a',
                      background: '#f0fdf4',
                      padding: '4px 8px',
                      borderRadius: '6px'
                    }}>
                      Кандидат
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer hints */}
      <div style={{ 
        padding: '8px 16px',
        borderTop: '1px solid var(--line)',
        background: '#f8fafc',
        fontSize: '11px',
        color: '#94a3b8',
        display: 'flex',
        gap: '16px'
      }}>
        <span>↑↓ навигация</span>
        <span>enter выбор</span>
        <span>esc закрыть</span>
      </div>
    </div>
  );
}
