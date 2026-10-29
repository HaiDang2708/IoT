import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { DashboardPage } from './pages/Dashboard';
import { SensorPage } from './pages/Sensor';
import { HistoryPage } from './pages/History';
import { ProfilePage } from './pages/Profile';
import { AlertPage } from './pages/Alert';
import { LoginPage } from './pages/Login';
import { AppProvider, useApp } from './contexts/AppContext';
import { Toast } from './components/Common/Toast';

function AppRoutes() {
  const { isAuthenticated, toastMessage, setToastMessage, toastType } = useApp();

  return (
    <>
      <Routes>
        {!isAuthenticated ? (
          <>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/sensor" element={<SensorPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/alert" element={<AlertPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/login" element={<Navigate to="/dashboard" replace />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </>
        )}
      </Routes>
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage(null)}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </HashRouter>
  );
}
