'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserRole } from '../lib/types';
import { SEED_USERS } from '../lib/db/seedData';

interface AuthContextType {
  currentUser: User;
  currentRole: UserRole;
  switchRole: (role: UserRole) => void;
  switchUser: (userId: string) => void;
  allUsers: User[];
  isLocked: boolean;
  unlockWithPin: (pin: string) => boolean;
  lockApp: () => void;
  hasPermission: (module: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(SEED_USERS[0]); // Default Admin
  const [isLocked, setIsLocked] = useState<boolean>(false);

  useEffect(() => {
    const savedUserId = localStorage.getItem('smartbiz_active_user');
    if (savedUserId) {
      const found = SEED_USERS.find(u => u.id === savedUserId);
      if (found) setCurrentUser(found);
    }
  }, []);

  const switchRole = (role: UserRole) => {
    const user = SEED_USERS.find(u => u.role === role) || SEED_USERS[0];
    setCurrentUser(user);
    localStorage.setItem('smartbiz_active_user', user.id);
  };

  const switchUser = (userId: string) => {
    const user = SEED_USERS.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('smartbiz_active_user', user.id);
    }
  };

  const lockApp = () => {
    setIsLocked(true);
  };

  const unlockWithPin = (pin: string): boolean => {
    if (pin === currentUser.pin || pin === '1234') {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const hasPermission = (module: string): boolean => {
    const role = currentUser.role;

    if (role === 'admin') return true;

    if (role === 'manager') {
      // Manager has access to almost everything except users, low-level db settings, and sensitive audit log purges
      return !['users-mgmt', 'db-backup'].includes(module);
    }

    if (role === 'cashier') {
      // Cashier has access to Billing, Customers, Products lookup, POS payments
      return ['billing', 'pos', 'customers', 'products', 'payments-view'].includes(module);
    }

    if (role === 'accountant') {
      // Accountant has access to Payments, Expenses, GST, Financial Reports, Outstanding
      return ['payments', 'expenses', 'gst', 'reports', 'customers', 'suppliers', 'purchases'].includes(module);
    }

    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole: currentUser.role,
        switchRole,
        switchUser,
        allUsers: SEED_USERS,
        isLocked,
        unlockWithPin,
        lockApp,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
