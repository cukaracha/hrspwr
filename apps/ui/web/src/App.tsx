import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import Garage from './pages/Garage';
import { ProtectedRoute } from './components/utils/ProtectedRoute';
import { queryClient } from './lib/query-client';
import AppLayout from './components/layouts/appLayout/AppLayout';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <div className='min-h-screen'>
              <Routes>
                {/* Public routes */}
                <Route path='/login' element={<Login />} />
                <Route path='/signup' element={<Navigate to='/login' replace />} />

                {/* Protected routes with layout */}
                <Route
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path='/' element={<Garage />} />
                </Route>

                <Route path='*' element={<Navigate to='/login' replace />} />
              </Routes>
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
