import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h2>👑 Admin Dashboard</h2>
                 <button onClick={handleLogout}>Logout</button>
            </div>
            <p>Welcome, <strong>{user?.email}</strong>!</p>
            <p>You have full administrative privileges.</p>
        </div>
    );
};

export default AdminDashboard;