import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProjectsDashboard from './pages/ProjectsDashboard';
import AuditLogPage from './pages/AuditLogPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import AdminUserManagement from './pages/AdminUserManagement';
import AdminTeamManagement from './pages/AdminTeamManagement';
import ChatPage from './pages/ChatPage';
import UserTeamView from './pages/UserTeamView';
import Layout from './components/Layout';
import AnnouncementsPage from './pages/AnnouncementsPage';
// --- NEW IMPORTS ---
import UserAttendance from './pages/UserAttendance';
import AdminAttendance from './pages/AdminAttendance';

function App() {
    const { user, loading } = useAuth();

    if (loading) return <div className="text-center mt-5">Loading...</div>;

    return (
        <>
            <ToastContainer position="bottom-right" autoClose={3000} />
            <Routes>
                <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
                <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <SignupPage />} />

                <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                    <Route path="dashboard" element={<ProjectsDashboard />} />
                    <Route path="chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                    <Route path="teams/:id" element={<UserTeamView />} />
                    <Route path="announcements" element={<AnnouncementsPage />} />

                    {/* --- NEW SEPARATE ROUTES --- */}
                    {/* 1. User Route: Mark Attendance */}
                    <Route path="attendance/mark" element={<UserAttendance />} />

                    {/* 2. Admin Route: View Records (Protected) */}
                    <Route 
                        path="attendance/admin" 
                        element={
                            <ProtectedRoute adminOnly={true}>
                                <AdminAttendance />
                            </ProtectedRoute>
                        } 
                    />

                    {/* Admin Pages */}
                    <Route path="audit-log" element={<ProtectedRoute adminOnly={true}><AuditLogPage /></ProtectedRoute>} />
                    <Route path="admin/users" element={<ProtectedRoute adminOnly={true}><AdminUserManagement /></ProtectedRoute>} />
                    <Route path="admin/teams" element={<ProtectedRoute adminOnly={true}><AdminTeamManagement /></ProtectedRoute>} />

                    <Route index element={<Navigate to="/dashboard" replace />} />
                </Route>
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </>
    );
}

export default App;