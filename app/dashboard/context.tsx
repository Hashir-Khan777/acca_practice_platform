'use client';

import * as React from 'react';

export const DashboardContext = React.createContext<{
  store: any;
  setStore: React.Dispatch<React.SetStateAction<any>>;
  updateStore: (updatedData: any) => void;
  notifications: any[];
  setNotifications: React.Dispatch<React.SetStateAction<any[]>>;
  showNotificationBadge: boolean;
  setShowNotificationBadge: React.Dispatch<React.SetStateAction<boolean>>;
  showUpgradeModal: boolean;
  setShowUpgradeModal: React.Dispatch<React.SetStateAction<boolean>>;
} | null>(null);

export const useDashboard = () => {
  const context = React.useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
