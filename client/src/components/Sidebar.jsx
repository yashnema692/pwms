import React from 'react';
import { Nav, Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ isSidebarOpen, toggleSidebar }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleNavClick = () => {
        if (isSidebarOpen) {
            toggleSidebar();
        }
    };

    return (
        <nav className={`app-sidebar ${isSidebarOpen ? 'open' : ''}`}>
            {/* Top Branding */}
            <div className="d-flex justify-content-between align-items-center mb-3 sidebar-top">
                <div>
                    <div className="sidebar-title">PWMS </div>
                    <div className="sidebar-subtitle">Offical Portal</div>
                </div>
                {/* Close button only on mobile */}
                <Button
                    variant="link"
                    className="d-lg-none text-dark p-0 sidebar-close-btn"
                    onClick={toggleSidebar}
                >
                    &times;
                </Button>
            </div>

            {/* Navigation links */}
            <div className="sidebar-links">
                <LinkContainer to="/dashboard">
                    <Nav.Link className="sidebar-link" onClick={handleNavClick}>
                        Projects
                    </Nav.Link>
                </LinkContainer>

                <LinkContainer to="/chat">
                    <Nav.Link className="sidebar-link" onClick={handleNavClick}>
                        Chat
                    </Nav.Link>
                </LinkContainer>

                {user?.role === 'ADMIN' && (
                    <>
                        <hr />
                        <div className="sidebar-heading">Admin Panel</div>

                        <LinkContainer to="/admin/users">
                            <Nav.Link
                                className="sidebar-link"
                                onClick={handleNavClick}
                            >
                                User Management
                            </Nav.Link>
                        </LinkContainer>

                        <LinkContainer to="/admin/teams">
                            <Nav.Link
                                className="sidebar-link"
                                onClick={handleNavClick}
                            >
                                Team Management
                            </Nav.Link>
                        </LinkContainer>

                        <LinkContainer to="/audit-log">
                            <Nav.Link
                                className="sidebar-link"
                                onClick={handleNavClick}
                            >
                                Audit Log
                            </Nav.Link>
                        </LinkContainer>
                    </>
                )}
            </div>

            {/* User info + Logout at bottom */}
            <div className="sidebar-user-section">
                <div className="sidebar-user-label">Signed in as</div>
                <div className="sidebar-user-name">
                    {user?.email || 'User'}
                </div>
                <Button
                    variant="outline-danger"
                    size="sm"
                    className="w-100 mt-2"
                    onClick={handleLogout}
                >
                    Logout
                </Button>
            </div>
        </nav>
    );
};

export default Sidebar;
