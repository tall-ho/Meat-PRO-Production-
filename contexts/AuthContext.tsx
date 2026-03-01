import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { STORAGE_KEYS, DEV_CONFIG } from '../constants';
import { User } from '../types';

interface AuthContextType {
  isPaired: boolean;
  isAuthenticated: boolean;
  apiUrl: string | null;
  user: User | null;
  loading: boolean;
  pairFactory: (url: string, orgName: string, licenseKey: string) => void;
  login: (user: User) => void;
  logout: () => void;
  unpair: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isPaired, setIsPaired] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [apiUrl, setApiUrl] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage on mount
    const storedUrl = localStorage.getItem(STORAGE_KEYS.API_URL);
    const storedOrg = localStorage.getItem(STORAGE_KEYS.ORG_NAME);
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    
    if (storedUrl && storedOrg) {
        setIsPaired(true);
        setApiUrl(storedUrl);
    } else {
        setIsPaired(false);
    }

    if (storedUser) {
        try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setIsAuthenticated(true);
        } catch (e) {
            console.error('Failed to parse stored user data', e);
        }
    }
    
    setLoading(false);
  }, []);

  const pairFactory = (url: string, orgName: string, licenseKey: string) => {
    localStorage.setItem(STORAGE_KEYS.API_URL, url);
    localStorage.setItem(STORAGE_KEYS.ORG_NAME, orgName);
    localStorage.setItem(STORAGE_KEYS.LICENSE_KEY, licenseKey);
    setApiUrl(url);
    setIsPaired(true);
  };

  const login = (userData: User) => {
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    setUser(null);
    setIsAuthenticated(false);
  };

  const unpair = () => {
    localStorage.removeItem(STORAGE_KEYS.API_URL);
    localStorage.removeItem(STORAGE_KEYS.ORG_NAME);
    localStorage.removeItem(STORAGE_KEYS.LICENSE_KEY);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    setApiUrl(null);
    setIsPaired(false);
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isPaired, isAuthenticated, apiUrl, user, loading, pairFactory, login, logout, unpair }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
