import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Form, Button, Alert } from 'react-bootstrap';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            if (err.response && err.response.status === 401) {
                setError('Invalid email or password. Please try again.');
            } else {
                setError(
                    'Login failed. Please check your credentials or contact support.'
                );
            }
        }
    };

    return (
        <div className="login-page-wrapper">
            <Card className="gov-login-card">
                <Card.Header className="gov-login-header">
                    <h2 className="gov-login-header-title">Project PWMS Portal</h2>
                    <p className="gov-login-header-subtitle">Official User Login</p>
                </Card.Header>

                <Card.Body className="p-4">
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label htmlFor="emailInput">
                                Email Address
                            </Form.Label>
                            <Form.Control
                                id="emailInput"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="Enter your official email"
                                autoComplete="username"
                            />
                        </Form.Group>
                        <Form.Group className="mb-4">
                            <Form.Label htmlFor="passwordInput">
                                Password
                            </Form.Label>
                            <Form.Control
                                id="passwordInput"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Enter your password"
                                autoComplete="current-password"
                            />
                        </Form.Group>
                        <Button type="submit" className="w-100 gov-login-btn">
                            Login
                        </Button>
                    </Form>
                    <div className="text-center mt-3 small">
                        Don&apos;t have an account?{' '}
                        <Link to="/signup">Sign Up</Link>
                    </div>
                </Card.Body>
            </Card>

            <footer className="login-page-footer">
                &copy; {new Date().getFullYear()} Project PWMS | Managed by Yash Nema
            </footer>
        </div>
    );
};

export default LoginPage;
