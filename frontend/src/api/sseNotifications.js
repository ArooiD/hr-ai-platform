/**
 * React Hook для работы с SSE уведомлениями
 * 
 * @example
 * ```jsx
 * function Notifications() {
 *   const { notifications, unreadCount, markAsRead } = useSSENotifications();
 *   
 *   return (
 *     <div>
 *       <span>{unreadCount} новых уведомлений</span>
 *       {notifications.map(n => <Notification key={n.id} data={n} />)}
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import AdvancedSSEClient from './sse';

// Singleton instance
let sseClient = null;

/**
 * Инициализировать SSE client глобально
 */
export function initSSEClient(authToken) {
  if (sseClient) {
    sseClient.disconnect();
  }
  
  sseClient = new AdvancedSSEClient(authToken, {
    baseUrl: import.meta.env.VITE_API_URL + '/api/sse/notifications',
    heartbeatTimeout: 30000,
  });
  
  return sseClient;
}

/**
 * Hook для подписки на SSE события
 */
export function useSSEEvents(eventTypes = []) {
  const [events, setEvents] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const statsRef = useRef(null);
  const initializedRef = useRef(false);
  
  useEffect(() => {
    if (!sseClient) {
      // Client еще не инициализирован (пользователь не вошел)
      // Это нормально, будет инициализирован после входа
      if (!initializedRef.current) {
        console.debug('[SSE] Client not initialized yet, waiting...');
        initializedRef.current = true;
      }
      return;
    }
    
    // Сброс флага инициализации при наличии client
    initializedRef.current = true;
    
    // Setup listeners for requested event types
    const unsubscribeFns = [];
    
    eventTypes.forEach(eventType => {
      const unsubscribe = sseClient.on(eventType, (event) => {
        setEvents(prev => [...prev, event]);
      });
      unsubscribeFns.push(unsubscribe);
    });
    
    // Listen to all messages
    const unsubscribeAll = sseClient.on('message', (event) => {
      // Update connection status
      setIsConnected(sseClient.isConnected);
    });
    unsubscribeFns.push(unsubscribeAll);
    
    // Connect if not connected
    if (!sseClient.isConnected) {
      console.log('[SSE] Connecting from useSSEEvents...');
      sseClient.connect();
    }
    
    // Update connection status periodically
    const statusInterval = setInterval(() => {
      setIsConnected(sseClient.isConnected);
      statsRef.current = sseClient.getStats();
    }, 1000);
    
    return () => {
      clearInterval(statusInterval);
      unsubscribeFns.forEach(fn => fn());
    };
  }, [eventTypes.join(',')]);
  
  return {
    events,
    isConnected,
    stats: statsRef.current,
    clearEvents: () => setEvents([]),
  };
}

/**
 * Hook для уведомлений с SSE
 */
export function useSSENotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  
  // Подписываемся на события уведомлений
  const { events } = useSSEEvents([
    'notification_new',
    'notification_read',
    'notification_read_all',
  ]);
  
  // Обработка событий
  useEffect(() => {
    events.forEach(event => {
      const { type, data } = event;
      
      switch (type) {
        case 'notification_new':
          setNotifications(prev => [data, ...prev]);
          setUnreadCount(prev => prev + 1);
          break;
          
        case 'notification_read':
          setNotifications(prev => 
            prev.map(n => 
              n.id === data.id ? { ...n, is_read: true } : n
            )
          );
          setUnreadCount(prev => Math.max(0, prev - 1));
          break;
          
        case 'notification_read_all':
          setNotifications(prev => 
            prev.map(n => ({ ...n, is_read: true }))
          );
          setUnreadCount(0);
          break;
      }
    });
  }, [events]);
  
  // Загрузка начальных уведомлений
  const loadNotifications = useCallback(async (limit = 20) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/notifications?limit=${limit}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    } catch (error) {
      console.error('[SSE] Failed to load notifications:', error);
    }
  }, []);
  
  // Пометить как прочитанное
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/notifications/${notificationId}/read`,
        {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (response.ok) {
        // SSE событие автоматически обновит состояние
      }
    } catch (error) {
      console.error('[SSE] Failed to mark notification as read:', error);
    }
  }, []);
  
  // Пометить все как прочитанные
  const markAllAsRead = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/notifications/read-all`,
        {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (response.ok) {
        // SSE событие автоматически обновит состояние
      }
    } catch (error) {
      console.error('[SSE] Failed to mark all as read:', error);
    }
  }, []);
  
  // Удалить уведомление
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/notifications/${notificationId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );
      
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }
    } catch (error) {
      console.error('[SSE] Failed to delete notification:', error);
    }
  }, []);
  
  return {
    notifications,
    unreadCount,
    isConnected,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}

/**
 * Hook для получения статуса подключения SSE
 */
export function useSSEStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    if (!sseClient) return;
    
    const updateStatus = () => {
      setIsConnected(sseClient.isConnected);
      setStats(sseClient.getStats());
    };
    
    // Initial update
    updateStatus();
    
    // Periodic update
    const interval = setInterval(updateStatus, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  return { isConnected, stats };
}
