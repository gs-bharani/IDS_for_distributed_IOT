import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ScenarioBuilderPage from './pages/ScenarioBuilderPage'; 
import EducationalDashboard from './pages/EducationalDashboard'; // Import your AttackLabPage
// Import your ScenarioBuilderPage
import AttackLabPage from './pages/AttackLabPage';
// Import any other pages you create later, e.g., ScenarioBuilderPage
import { AuthProvider, useAuth } from './contexts/AuthContext';

// A private route component to protect routes that require authentication
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading application...</div>; // Show loading while auth status is being checked
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />
          {/* Add more protected routes here, e.g.: */}
          <Route
  path="/scenario-builder"
  element={
    <PrivateRoute>
      {console.log("Rendering ScenarioBuilderPage")}
      <ScenarioBuilderPage />
    </PrivateRoute>
  }
/>
<Route
  path="/educational-dashboard"
  element={
    <PrivateRoute>
      {console.log("Rendering EducationalDashboard")}
      <EducationalDashboard />
    </PrivateRoute>
  }
/>
<Route
  path="/attack-lab"
  element={
    <PrivateRoute>
      {console.log("Rendering attacklabPage")}
      <AttackLabPage />
    </PrivateRoute>
  }
/>

          {/* Default route: Redirect authenticated users to dashboard, others to login */}
          <Route
            path="*"
            element={
              <PrivateRoute>
                <Navigate to="/dashboard" replace />
              </PrivateRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;