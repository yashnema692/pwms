import React, { useEffect, useState } from 'react'; // Import useEffect and useState
import { Nav, Button, Badge } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import api from '../api'; // Import API helper

const Sidebar = ({ isSidebarOpen, toggleSidebar }) => {
    const { user, logout } = useAuth();
    const { unreadCount } = useSocket();
    const navigate = useNavigate();
    
    // State to store teams
    const [teams, setTeams] = useState([]);

    // Fetch teams when sidebar loads
    useEffect(() => {
        const fetchTeams = async () => {
            try {
                // Assuming /api/teams returns all teams created by admin
                const { data } = await api.get('/api/teams');
                setTeams(data);
            } catch (err) {
                console.error("Failed to load teams", err);
            }
        };

        if (user) {
            fetchTeams();
        }
    }, [user]);

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
                    <div className="sidebar-title">Project PWMS</div>
                    <div className="sidebar-subtitle">Internal Portal</div>
                </div>
                <Button
                    variant="link"
                    className="d-lg-none text-dark p-0 sidebar-close-btn"
                    onClick={toggleSidebar}
                >
                    &times;
                </Button>
            </div>
            {/* Place this wherever you want in the list, maybe under Chat */}
<LinkContainer to="/announcements">
    <Nav.Link className="sidebar-link" onClick={handleNavClick}>
        📢 Announcements
    </Nav.Link>
</LinkContainer>
            {/* Navigation links */}
            <div className="sidebar-links">
                <LinkContainer to="/dashboard">
                    <Nav.Link className="sidebar-link" onClick={handleNavClick}>
                        Projects
                    </Nav.Link>
                </LinkContainer>

                <LinkContainer to="/chat">
                    <Nav.Link className="sidebar-link d-flex justify-content-between align-items-center" onClick={handleNavClick}>
                        <span>Chat</span>
                        {unreadCount > 0 && (
                            <Badge pill bg="danger">
                                {unreadCount}
                            </Badge>
                        )}
                    </Nav.Link>
                </LinkContainer>

                

                {/* --- ADMIN SECTION --- */}
                {user?.role === 'ADMIN' && (
                    <>
                        <hr />
                        <div className="sidebar-heading">Admin Panel</div>

                        <LinkContainer to="/admin/users">
                            <Nav.Link className="sidebar-link" onClick={handleNavClick}>
                                User Management
                            </Nav.Link>
                        </LinkContainer>

                        <LinkContainer to="/admin/teams">
                            <Nav.Link className="sidebar-link" onClick={handleNavClick}>
                                Team Management
                            </Nav.Link>
                        </LinkContainer>

                        <LinkContainer to="/audit-log">
                            <Nav.Link className="sidebar-link" onClick={handleNavClick}>
                                Audit Log
                            </Nav.Link>
                        </LinkContainer>
                    </>
                )}


                {/* --- SHOW TEAMS SECTION FOR ALL USERS --- */}
                <hr />
                <div className="sidebar-heading">Teams</div>
                <div className="sidebar-team-list">
                    {teams.length > 0 ? (
                        teams.map((team) => (
                            <LinkContainer key={team._id} to={`/teams/${team._id}`}>
                                <Nav.Link className="sidebar-link small py-1" onClick={handleNavClick}>
                                    # {team.name}
                                </Nav.Link>
                            </LinkContainer>
                        ))
                    ) : (
                        <div className="text-muted small px-3">No teams found.</div>
                    )}
                </div>
            </div>

            {/* User info + Logout */}
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