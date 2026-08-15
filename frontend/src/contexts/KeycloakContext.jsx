/**
 * Keycloak Authentication Context
 * Provides Keycloak authentication throughout the application
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Keycloak from 'keycloak-js';

// Keycloak configuration from environment variables
const keycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080/auth',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'hr-ai',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'hr-ai-frontend',
};

// Create Keycloak instance
const keycloak = new Keycloak(keycloakConfig);

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

  // Initialize Keycloak
  useEffect(() => {
    const initKeycloak = async () => {
      try {
        const authenticated = await keycloak.init({
          flow: 'standard',
          checkLoginIframe: false,
          silentCheckSsoRedirect: false,
        });

        setAuthenticated(authenticated);
        setInitializing(false);

        if (authenticated) {
          // Get user info
          const userInfo = await keycloak.loadUserInfo();
          setUserInfo(userInfo);
          
          // Start token refresh
          startTokenRefresh();
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
  const startTokenRefresh = useCallback(() => {
    // Refresh token every 10 minutes
    setInterval(() => {
      keycloak.updateToken(70).catch((err) => {
        console.error('Failed to refresh token:', err);
        // If refresh fails, user needs to re-login
        logout();
      });
    }, 600000); // 10 minutes
  }, []);

  // Login
  const login = useCallback((options = {}) => {
    keycloak.login(options);
  }, []);

  // Logout
  const logout = useCallback((options = {}) => {
    setAuthenticated(false);
    setUserInfo(null);
    keycloak.logout(options);
  }, []);

  // Get token
  const getToken = useCallback(() => {
    return keycloak.token;
  }, []);

  // Get ID token
  const getIdToken = useCallback(() => {
    return keycloak.idToken;
  }, []);

  // Check if user has role
  const hasRole = useCallback((role) => {
    return keycloak.hasResourceRoles(role);
  }, []);

  // Update token manually
  const updateToken = useCallback(async (minValidity = 5) => {
    try {
      const refreshed = await keycloak.updateToken(minValidity);
      if (refreshed) {
        console.log('Token refreshed successfully');
      }
      return refreshed;
    } catch (err) {
      console.error('Failed to update token:', err);
      throw err;
    }
  }, []);

  const value = {
    keycloak,
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
    realm: keycloakConfig.realm,
    clientId: keycloakConfig.clientId,
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

export { keycloak };
