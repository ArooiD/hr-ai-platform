/**
 * Advanced SSE Client с автоматическим переподключением
 * 
 * Фичи:
 * - Automatic reconnection с exponential backoff
 * - Session resumption по lastEventId
 * - Event filtering по типу
 * - Priority-based обработка
 * - Heartbeat monitoring
 * - Statistics tracking
 * 
 * @example
 * ```javascript
 * const sse = new AdvancedSSEClient('token-xxx');
 * 
 * sse.on('notification_new', (event) => {
 *   console.log('Новое уведомление:', event.data);
 * });
 * 
 * await sse.connect();
 * ```
 */

class AdvancedSSEClient {
  constructor(authToken, options = {}) {
    this.authToken = authToken;
    this.baseUrl = options.baseUrl || '/api/sse/notifications';
    
    // Configuration
    this.config = {
      maxReconnectDelay: 30000,  // 30 секунд
      initialReconnectDelay: 1000,  // 1 секунда
      reconnectMultiplier: 1.5,  // Экспоненциальный рост
      heartbeatTimeout: 30000,  // 30 секунд
      ...options
    };
    
    // State
    this.eventSource = null;
    this.isConnected = false;
    this.lastEventId = null;
    this.reconnectDelay = this.config.initialReconnectDelay;
    this.reconnectAttempts = 0;
    this.listeners = new Map();
    this.heartbeatTimer = null;
    this.stats = {
      connected: 0,
      disconnected: 0,
      messagesReceived: 0,
      errors: 0,
      reconnects: 0
    };
    
    // Handlers
    this.handleMessage = this.handleMessage.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleOpen = this.handleOpen.bind(this);
  }
  
  /**
   * Подключиться к SSE потоку
   */
  async connect() {
    if (this.eventSource) {
      console.warn('[SSE] Already connected or connecting');
      return;
    }
    
    try {
      // Build URL with lastEventId for session resumption
      const url = new URL(this.baseUrl, window.location.origin);
      url.searchParams.set('token', this.authToken);
      
      if (this.lastEventId) {
        url.searchParams.set('last_event_id', this.lastEventId);
        console.log('[SSE] Resuming from event:', this.lastEventId);
      }
      
      // Create EventSource
      this.eventSource = new EventSource(url.toString());
      
      // Setup handlers
      this.eventSource.onopen = this.handleOpen;
      this.eventSource.onmessage = this.handleMessage;
      this.eventSource.onerror = this.handleError;
      
      // Setup event type listeners
      this.eventSource.addEventListener('notification_new', this.handleMessage);
      this.eventSource.addEventListener('notification_read', this.handleMessage);
      this.eventSource.addEventListener('notification_read_all', this.handleMessage);
      this.eventSource.addEventListener('heartbeat', this.handleMessage);
      this.eventSource.addEventListener('error', this.handleError);
      
    } catch (error) {
      console.error('[SSE] Connection error:', error);
      this.scheduleReconnect();
    }
  }
  
  /**
   * Отключиться от SSE потока
   */
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.isConnected = false;
      this.clearHeartbeat();
      this.stats.disconnected++;
      console.log('[SSE] Disconnected');
    }
  }
  
  /**
   * Добавить слушатель событий
   */
  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(callback);
    
    return () => this.off(eventType, callback);
  }
  
  /**
   * Удалить слушатель событий
   */
  off(eventType, callback) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).delete(callback);
    }
  }
  
  /**
   * Обработка входящего сообщения
   */
  handleMessage(event) {
    // Update last event ID for session resumption
    if (event.lastEventId) {
      this.lastEventId = event.lastEventId;
    }
    
    // Parse data
    let data;
    try {
      data = JSON.parse(event.data);
    } catch (e) {
      console.error('[SSE] Failed to parse event data:', event.data);
      return;
    }
    
    // Update stats
    this.stats.messagesReceived++;
    
    // Handle heartbeat
    if (event.type === 'heartbeat' || data.type === 'heartbeat') {
      this.resetHeartbeat();
      return;
    }
    
    // Get event type
    const eventType = event.type || data.type || 'message';
    
    // Call listeners
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).forEach(callback => {
        try {
          callback({
            id: event.lastEventId,
            type: eventType,
            data: data,
            priority: event.priority || 'normal',
            timestamp: event.timestamp || new Date().toISOString()
          });
        } catch (error) {
          console.error('[SSE] Listener error:', error);
        }
      });
    }
    
    // Call generic message listener
    if (this.listeners.has('message')) {
      this.listeners.get('message').forEach(callback => {
        callback({
          id: event.lastEventId,
          type: eventType,
          data: data,
          priority: event.priority || 'normal'
        });
      });
    }
  }
  
  /**
   * Обработка ошибки
   */
  handleError(error) {
    this.stats.errors++;
    console.error('[SSE] Error:', error);
    
    // EventSource автоматически пытается переподключиться
    // Но мы можем контролировать это
    this.eventSource.close();
    this.eventSource = null;
    this.isConnected = false;
    
    // Schedule reconnect with exponential backoff
    this.scheduleReconnect();
  }
  
  /**
   * Обработка успешного подключения
   */
  handleOpen() {
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.reconnectDelay = this.config.initialReconnectDelay;
    this.stats.connected++;
    this.resetHeartbeat();
    console.log('[SSE] Connected');
  }
  
  /**
   * Планировать переподключение с exponential backoff
   */
  scheduleReconnect() {
    // Stop any existing reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.reconnectDelay,
      this.config.maxReconnectDelay
    );
    
    this.reconnectAttempts++;
    this.reconnectDelay *= this.config.reconnectMultiplier;
    
    console.log(`[SSE] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.stats.reconnects++;
      this.connect();
    }, delay);
  }
  
  /**
   * Setup heartbeat monitoring
   */
  resetHeartbeat() {
    this.clearHeartbeat();
    
    this.heartbeatTimer = setTimeout(() => {
      console.warn('[SSE] Heartbeat timeout, reconnecting...');
      this.stats.disconnected++;
      this.eventSource?.close();
      this.eventSource = null;
      this.isConnected = false;
      this.scheduleReconnect();
    }, this.config.heartbeatTimeout);
  }
  
  /**
   * Clear heartbeat timer
   */
  clearHeartbeat() {
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
  
  /**
   * Get connection statistics
   */
  getStats() {
    return {
      ...this.stats,
      isConnected: this.isConnected,
      lastEventId: this.lastEventId,
      reconnectAttempts: this.reconnectAttempts
    };
  }
  
  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      connected: 0,
      disconnected: 0,
      messagesReceived: 0,
      errors: 0,
      reconnects: 0
    };
  }
}

// Export as module
export default AdvancedSSEClient;
