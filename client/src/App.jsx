import React from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { AuthProvider } from '@context/AuthContext';
import AppRoutes from '@routes/AppRoutes';
import EmergencyPanel from '@components/safety/EmergencyPanel';
import ChatbotWidget from '@components/shared/ChatbotWidget';

function GlobalSupportWidgets() {
  const { pathname } = useLocation();
  if (pathname === '/login') return null;
  return <><EmergencyPanel /><ChatbotWidget /></>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <GlobalSupportWidgets />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
