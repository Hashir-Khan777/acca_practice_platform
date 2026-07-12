'use client';

import * as React from 'react';

export const AdminContext = React.createContext<{
  store: any;
  setStore: React.Dispatch<React.SetStateAction<any>>;
  updateStore: (updatedData: any) => void;
  success: string;
  setSuccess: React.Dispatch<React.SetStateAction<string>>;
  error: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
} | null>(null);

export const useAdmin = () => {
  const context = React.useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
