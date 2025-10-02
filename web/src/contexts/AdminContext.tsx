import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '../lib/api';

interface AdminContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (adminKey: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthStatus = async () => {
    try {
      console.log('🔍 AdminContext: Checking auth status...');
      const status = await apiClient.getAdminStatus();
      console.log('📊 AdminContext: Auth status received:', status);
      setIsAuthenticated(status.isAuthenticated);
    } catch (error) {
      console.error('❌ AdminContext: Failed to check admin status:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (adminKey: string) => {
    console.log('🔐 AdminContext: Starting login...');
    await apiClient.adminLogin(adminKey);
    console.log('✅ AdminContext: API login successful, setting authenticated=true');
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await apiClient.adminLogout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <AdminContext.Provider value={{
      isAuthenticated,
      isLoading,
      login,
      logout,
      checkAuthStatus
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
