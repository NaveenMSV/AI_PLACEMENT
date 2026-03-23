import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import DashboardPage from './pages/student/DashboardPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import StudentsPage from './pages/admin/StudentsPage';
import ManageCompaniesPage from './pages/admin/ManageCompaniesPage';
import ManageQuestionsPage from './pages/admin/ManageQuestionsPage';
import EditCompanyPage from './pages/admin/EditCompanyPage';
import CompanyProfilePage from './pages/interview/CompanyProfilePage';
import SimulationEnginePage from './pages/interview/SimulationEnginePage';
import CompaniesPage from './pages/student/CompaniesPage';
import ResultsPage from './pages/student/ResultsPage';
import ResumePage from './pages/student/ResumePage';
import ProfilePage from './pages/student/ProfilePage';
import CodingPracticePage from './pages/student/CodingPracticePage';
import SqlPracticePage from './pages/student/SqlPracticePage';

import { SearchContext } from './context/SearchContext';

function App() {
  const [searchQuery, setSearchQuery] = React.useState('');

  return (
    <BrowserRouter>
      <SearchContext.Provider value={{ searchQuery, setSearchQuery }}>
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />

            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin-login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/resetpassword/:token" element={<ResetPasswordPage />} />

            {/* Student Routes */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/companies" element={<CompaniesPage />} />
            <Route path="/results/:attemptId" element={<ResultsPage />} />
            <Route path="/resume" element={<ResumePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/practice/coding" element={<CodingPracticePage />} />
            <Route path="/practice/sql" element={<SqlPracticePage />} />
            <Route path="/company/:id" element={<CompanyProfilePage />} />
            <Route path="/interviews/:id" element={<CompanyProfilePage />} />
            <Route path="/interview/session/:attemptId" element={<SimulationEnginePage />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/students" element={<StudentsPage />} />
            <Route path="/admin/companies" element={<ManageCompaniesPage />} />
            <Route path="/admin/questions" element={<ManageQuestionsPage />} />
            <Route path="/admin/company/:id/edit" element={<EditCompanyPage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </SearchContext.Provider>
    </BrowserRouter>
  );
}

export default App;
