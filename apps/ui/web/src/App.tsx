import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ChatLayout from './layouts/ChatLayout';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import LandingPage from './pages/LandingPage';
import Garage from './pages/Garage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { queryClient } from './lib/query-client';
import Profile from './pages/Profile';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <div className='min-h-screen'>
              <Routes>
                <Route path='/login' element={<Login />} />
                <Route path='/signup' element={<SignUp />} />
                <Route path='/welcome' element={<LandingPage />} />
                <Route
                  path='/'
                  element={
                    <ProtectedRoute>
                      <ChatLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Garage />} />
                  <Route path='profile' element={<Profile />} />
                </Route>
                <Route path='*' element={<Navigate to='/welcome' replace />} />
              </Routes>
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
