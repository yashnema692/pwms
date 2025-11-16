import React from 'react';
import { Navbar, Nav, Container, Button, NavDropdown, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { LinkContainer } from 'react-router-bootstrap';

const AppNavbar = ({ toggleSidebar }) => {
    const { user, logout } = useAuth();
    const { unreadCount } = useSocket();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <Navbar expand="lg" className="app-navbar" sticky="top">
            <Container fluid className="px-3 px-md-4">
                <Button
                    variant="outline-secondary"
                    className="d-lg-none me-2 sidebar-toggle-btn"
                    onClick={toggleSidebar}
                >
                    <span className="navbar-toggler-icon" />
                </Button>

                <Navbar.Brand
                    as={Link}
                    to="/dashboard"
                    className="fw-semibold app-navbar-brand"
                >
                    Project PWMS 
                </Navbar.Brand>

                <Navbar.Toggle aria-controls="basic-navbar-nav" />

                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto mt-2 mt-lg-0">
                        <LinkContainer to="/dashboard">
                            <Nav.Link>Projects</Nav.Link>
                        </LinkContainer>
                        <LinkContainer to="/chat">
                            <Nav.Link>
                                Chat
                                {unreadCount > 0 && (
                                    <Badge pill bg="danger" className="ms-2">
                                        {unreadCount}
                                    </Badge>
                                )}
                            </Nav.Link>
                        </LinkContainer>

                        {user?.role === 'ADMIN' && (
                            <NavDropdown title="Admin Panel" id="admin-nav-dropdown">
                                <LinkContainer to="/admin/users">
                                    <NavDropdown.Item>User Management</NavDropdown.Item>
                                </LinkContainer>
                                <LinkContainer to="/admin/teams">
                                    <NavDropdown.Item>Team Management</NavDropdown.Item>
                                </LinkContainer>
                                <LinkContainer to="/audit-log">
                                    <NavDropdown.Item>Audit Log</NavDropdown.Item>
                                </LinkContainer>
                            </NavDropdown>
                        )}
                    </Nav>
                    <Nav className="align-items-center">
                        <Navbar.Text className="me-3 d-none d-md-block small text-muted">
                            Signed in as: <strong>{user?.email}</strong>
                        </Navbar.Text>
                        <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={handleLogout}
                        >
                            Logout
                        </Button>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default AppNavbar;
