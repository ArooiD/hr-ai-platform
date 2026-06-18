import { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCircle2, Clock, UserPlus, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '../../api/client';
import { useSSENotifications } from '../../api/sseNotifications';

export default function TopbarNotifications() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  
  // SSE notifications with real-time updates
  const { 
    notifications: sseNotifications, 
    unreadCount: sseUnreadCount, 
    isConnected: sseConnected,
    loadNotifications: loadSSENotifications,
    markAsRead: sseMarkAsRead,
    markAllAsRead: sseMarkAllAsRead,
  } = useSSENotifications();
  
  useEffect(() => {
    setIsConnected(sseConnected);
  }, [sseConnected]);
  
  // Load initial notifications on mount
  useEffect(() => {
    if (sseNotifications.length > 0) {
      // SSE уже загрузила уведомления
      processNotifications(sseNotifications);
      setUnreadCount(sseUnreadCount);
      setLoading(false);
    } else {
      // Загружаем через REST API
      loadInitialNotifications();
    }
  }, []);
  
  // Обновляем уведомления при получении новых через SSE
  useEffect(() => {
    if (sseNotifications.length > 0) {
      processNotifications(sseNotifications);
      setUnreadCount(sseUnreadCount);
    }
  }, [sseNotifications, sseUnreadCount]);
  
  const loadInitialNotifications = async () => {
    try {
      const [notifsData, countData] = await Promise.all([
        notificationsApi.getNotifications(20, false),
        notificationsApi.getUnreadCount()
      ]);
      
      const notifs = notifsData.map(n => convertNotification(n));
      setNotifications(notifs.slice(0, 10));
      setUnreadCount(countData.count);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };
  
  const processNotifications = (notifsData) => {
    const notifs = notifsData.map(n => convertNotification(n));
    setNotifications(notifs.slice(0, 10));
  };
  
  const convertNotification = (n) => {
    let icon = UserPlus;
    let color = '#0b73ff';
    
    switch (n.type) {
      case 'application_new':
        icon = UserPlus;
        color = '#0b73ff';
        break;
      case 'vacancy_closed':
        icon = CheckCircle2;
        color = '#16a34a';
        break;
      case 'application_stage_changed':
        icon = Briefcase;
        color = '#f59e0b';
        break;
      default:
        icon = UserPlus;
        color = '#0b73ff';
    }
    
    return {
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      time: new Date(n.created_at),
      unread: !n.is_read,
      icon,
      color,
      action: () => {
        if (n.entity_type === 'vacancy' && n.entity_id) {
          navigate(`/vacancies/${n.entity_id}`);
        } else if (n.entity_type === 'application' && n.entity_id) {
          navigate(`/recruitment`);
        }
      },
      actionLabel: 'Открыть'
    };
  };

  // Закрытие при клике вне
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Загрузка уведомлений при открытии
  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      loadInitialNotifications();
    }
  }, [isOpen]);

  const markAsRead = async (id) => {
    await sseMarkAsRead(id);
    // Состояние автоматически обновится через SSE
  };
  
  const markAllAsRead = async () => {
    await sseMarkAllAsRead();
    // Состояние автоматически обновится через SSE
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'только что';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} мин. назад`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч. назад`;
    return `${Math.floor(diff / 86400000)} д. назад`;
  };

  const handleNotificationClick = (notification) => {
    if (notification.unread) {
      markAsRead(notification.id);
    }
    if (notification.action) {
      notification.action();
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        className="notifications-trigger" 
        onClick={() => setIsOpen(true)}
        title="Уведомления"
        style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '8px', 
          padding: '8px 12px',
          border: '1px solid var(--line)',
          borderRadius: '10px',
          background: '#fff',
          color: '#64748b',
          cursor: 'pointer',
          position: 'relative'
        }}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '18px',
            height: '18px',
            padding: '0 4px',
            fontSize: '11px',
            fontWeight: '700',
            color: '#fff',
            background: '#ef4444',
            borderRadius: '9px'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        <span style={{ fontSize: '13px', fontWeight: '600' }}>
          {unreadCount > 0 ? `${unreadCount} новых` : 'уведомления'}
        </span>
        {/* Connection status indicator */}
        {isConnected && (
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#16a34a',
            marginLeft: '4px'
          }} title="Подключено к real-time уведомлениям" />
        )}
      </button>
    );
  }

  return (
    <div 
      ref={dropdownRef}
      className="topbar-notifications-dropdown"
      style={{
        position: 'absolute',
        right: '60px',
        top: '60px',
        width: '420px',
        maxHeight: '500px',
        background: '#fff',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(15, 23, 42, 0.2)',
        border: '1px solid var(--line)',
        zIndex: 1000,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '14px 16px',
        borderBottom: '1px solid var(--line)',
        background: '#f8fafc'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={18} color="#64748b" />
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>
            Уведомления
          </h3>
          {unreadCount > 0 && (
            <span style={{
              fontSize: '12px',
              fontWeight: '700',
              color: '#0b73ff',
              background: '#eaf4ff',
              padding: '2px 8px',
              borderRadius: '10px'
            }}>
              {unreadCount} новых
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                border: 'none',
                background: '#eaf4ff',
                color: '#0b73ff',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <CheckCircle2 size={14} />
              Все прочитано
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
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
      </div>

      {/* Notifications list */}
      <div style={{ overflowY: 'auto', maxHeight: '380px' }}>
        {loading ? (
          <div style={{ 
            padding: '32px', 
            textAlign: 'center', 
            color: '#94a3b8',
            fontSize: '14px'
          }}>
            Загрузка...
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ 
            padding: '48px 24px', 
            textAlign: 'center',
            color: '#94a3b8'
          }}>
            <Bell size={48} style={{ 
              margin: '0 auto 16px', 
              color: '#e2e8f0' 
            }} />
            <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>
              Нет уведомлений
            </div>
            <div style={{ fontSize: '13px' }}>
              Когда появятся новые события, они появятся здесь
            </div>
          </div>
        ) : (
          <div>
            {notifications.map((notification) => {
              const Icon = notification.icon;
              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '14px 16px',
                    borderBottom: '1px solid var(--line)',
                    background: notification.unread ? '#f5f9ff' : '#fff',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.background = notification.unread ? '#f5f9ff' : '#fff'}
                >
                  {/* Icon */}
                  <div style={{
                    display: 'grid',
                    placeItems: 'center',
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: `${notification.color}20`,
                    color: notification.color,
                    flexShrink: 0
                  }}>
                    <Icon size={18} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ 
                        fontSize: '14px', 
                        fontWeight: '600',
                        color: '#111318'
                      }}>
                        {notification.title}
                      </span>
                      {notification.unread && (
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#0b73ff'
                        }} />
                      )}
                    </div>
                    <div style={{ 
                      fontSize: '13px', 
                      color: '#64748b',
                      marginBottom: '4px',
                      lineHeight: '1.4'
                    }}>
                      {notification.message}
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      fontSize: '11px',
                      color: '#94a3b8'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        {formatTime(notification.time)}
                      </span>
                      {notification.actionLabel && (
                        <span style={{ 
                          color: notification.color,
                          fontWeight: '600'
                        }}>
                          {notification.actionLabel} →
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div style={{ 
          padding: '12px 16px',
          borderTop: '1px solid var(--line)',
          background: '#f8fafc',
          textAlign: 'center',
          fontSize: '12px',
          color: '#94a3b8'
        }}>
          Показано {notifications.length} последних уведомлений
        </div>
      )}
    </div>
  );
}
