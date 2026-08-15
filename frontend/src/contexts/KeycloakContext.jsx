/**
 * Keycloak Authentication Context
 * Provides Keycloak authentication throughout the application
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Keycloak from 'keycloak-js';

/**
 * Получить конфигурацию Keycloak от backend
 */
const fetchKeycloakConfig = async () => {
  try {
    const response = await fetch('/api/auth/keycloak-config');
    if (!response.ok) {
      throw new Error('Failed to fetch Keycloak config');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching Keycloak config:', error);
    // Fallback to default configuration
    return {
      url: 'http://localhost:8080',
      realm: 'hr-ai',
      clientId: 'hr-ai-frontend',
      isExternal: false,
      provider: 'keycloak'
    };
  }
};

// Keycloak configuration (будет загружена асинхронно)
let keycloakConfig = null;
let configLoadingPromise = null;

const getKeycloakConfig = async () => {
  if (keycloakConfig) {
    return keycloakConfig;
  }
  
  if (!configLoadingPromise) {
    configLoadingPromise = fetchKeycloakConfig().then(config => {
      keycloakConfig = config;
      configLoadingPromise = null;
      return config;
    });
  }
  
  return configLoadingPromise;
};

// Create context
const KeycloakContext = createContext(null);

/**
 * KeycloakProvider - Wraps the application and provides auth context
 */
export function KeycloakProvider({ children }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState(null);
  const [keycloakInstance, setKeycloakInstance] = useState(null);

  // Initialize Keycloak
  useEffect(() => {
    const initKeycloak = async () => {
      try {
        const config = await getKeycloakConfig();
        
        // Создаем Keycloak instance с конфигурацией от backend
        const kc = new Keycloak({
          url: config.url,
          realm: config.realm,
          clientId: config.clientId,
        });

        const authenticated = await kc.init({
          flow: 'standard',
          checkLoginIframe: false,
          silentCheckSsoRedirect: false,
        });

        setKeycloakInstance(kc);
        setAuthenticated(authenticated);
        setInitializing(false);

        if (authenticated) {
          // Get user info
          const userInfo = await kc.loadUserInfo();
          setUserInfo(userInfo);
          
          // Start token refresh
          startTokenRefresh(kc);
        }
      } catch (err) {
        console.error('Keycloak initialization failed:', err);
        setError('Ошибка инициализации аутентификации');
        setInitializing(false);
      }
    };

    initKeycloak();
  }, []);

  // Token refresh timer
  const startTokenRefresh = (kc) => {
    // Refresh token every 10 minutes
    setInterval(() => {
      kc.updateToken(70).catch((err) => {
        console.error('Failed to refresh token:', err);
        // If refresh fails, user needs to re-login
        logout();
      });
    }, 600000); // 10 minutes
  };

  // Login
  const login = useCallback((options = {}) => {
    if (keycloakInstance) {
      keycloakInstance.login(options);
    }
  }, [keycloakInstance]);

  // Logout
  const logout = useCallback((options = {}) => {
    setAuthenticated(false);
    setUserInfo(null);
    if (keycloakInstance) {
      keycloakInstance.logout(options);
    }
  }, [keycloakInstance]);

  // Get token
  const getToken = useCallback(() => {
    return keycloakInstance?.token;
  }, [keycloakInstance]);

  // Get ID token
  const getIdToken = useCallback(() => {
    return keycloakInstance?.idToken;
  }, [keycloakInstance]);

  // Check if user has role
  const hasRole = useCallback((role) => {
    return keycloakInstance?.hasResourceRoles(role) || false;
  }, [keycloakInstance]);

  // Update token manually
  const updateToken = useCallback(async (minValidity = 5) => {
    if (!keycloakInstance) {
      throw new Error('Keycloak not initialized');
    }
    try {
      const refreshed = await keycloakInstance.updateToken(minValidity);
      if (refreshed) {
        console.log('Token refreshed successfully');
      }
      return refreshed;
    } catch (err) {
      console.error('Failed to update token:', err);
      throw err;
    }
  }, [keycloakInstance]);

  const value = {
    keycloak: keycloakInstance,
    authenticated,
    initializing,
    userInfo,
    error,
    login,
    logout,
    getToken,
    getIdToken,
    hasRole,
    updateToken,
  };

  if (initializing) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>Загрузка системы...</p>
        </div>
      </div>
    );
  }

  return (
    <KeycloakContext.Provider value={value}>
      {children}
    </KeycloakContext.Provider>
  );
}

/**
 * useKeycloak - Hook to use Keycloak auth in components
 */
export function useKeycloak() {
  const context = useContext(KeycloakContext);
  if (!context) {
    throw new Error('useKeycloak must be used within a KeycloakProvider');
  }
  return context;
}

// Экспортируем функцию для получения конфигурации (если нужно где-то еще)
export { getKeycloakConfig };
