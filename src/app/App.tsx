import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { ToastProvider } from '../components/ui/Toast';
import { initDatabase } from '../persistence/db';

export const App: React.FC = () => {
  useEffect(() => {
    initDatabase();
  }, []);

  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  );
};
