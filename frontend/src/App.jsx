// ==========================================
// App.jsx — Main Router
// ==========================================

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AcademicYearsPage from './pages/AcademicYearsPage';
import ClassesPage from './pages/ClassesPage';
import SubjectsPage from './pages/SubjectsPage';
import StudentsPage from './pages/StudentsPage';
import ActivitiesPage from './pages/ActivitiesPage';
import ActivityDetailPage from './pages/ActivityDetailPage';
import GradingPage from './pages/GradingPage';
import ResultsPage from './pages/ResultsPage';
import AIToolsPage from './pages/AIToolsPage';
import UsersPage from './pages/UsersPage';
import TemplatesPage from './pages/TemplatesPage';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><Spinner /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function Spinner() {
  return (
    <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="academic-years" element={<ProtectedRoute adminOnly><AcademicYearsPage /></ProtectedRoute>} />
        <Route path="classes" element={<ProtectedRoute adminOnly><ClassesPage /></ProtectedRoute>} />
        <Route path="subjects" element={<SubjectsPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="activities" element={<ActivitiesPage />} />
        <Route path="activities/:id" element={<ActivityDetailPage />} />
        <Route path="grading/:activityId" element={<GradingPage />} />
        <Route path="results/:subjectId" element={<ResultsPage />} />
        <Route path="ai-tools" element={<AIToolsPage />} />
        <Route path="users" element={<ProtectedRoute adminOnly><UsersPage /></ProtectedRoute>} />
        <Route path="templates" element={<ProtectedRoute adminOnly><TemplatesPage /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
