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
import Layout from './components/Layout';

function App() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100 text-muted">
                Loading...
            </div>
        );
    }

    return (
        <>
            <ToastContainer
                position="bottom-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
            <Routes>
                <Route
                    path="/login"
                    element={user ? <Navigate to="/dashboard" /> : <LoginPage />}
                />
                <Route
                    path="/signup"
                    element={user ? <Navigate to="/dashboard" /> : <SignupPage />}
                />

                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <Layout />
                        </ProtectedRoute>
                    }
                >
                    <Route path="dashboard" element={<ProjectsDashboard />} />

                    <Route
                        path="chat"
                        element={
                            <ProtectedRoute>
                                <ChatPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="audit-log"
                        element={
                            <ProtectedRoute adminOnly={true}>
                                <AuditLogPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="admin/users"
                        element={
                            <ProtectedRoute adminOnly={true}>
                                <AdminUserManagement />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="admin/teams"
                        element={
                            <ProtectedRoute adminOnly={true}>
                                <AdminTeamManagement />
                            </ProtectedRoute>
                        }
                    />

                    <Route index element={<Navigate to="/dashboard" replace />} />
                </Route>

                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </>
    );
}

export default App;
