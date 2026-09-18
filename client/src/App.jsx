import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@context/AuthContext';
import AppRoutes from '@routes/AppRoutes';
import EmergencyPanel from '@components/safety/EmergencyPanel';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <EmergencyPanel />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
