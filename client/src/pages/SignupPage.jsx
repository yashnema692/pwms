import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Form, Button, Alert } from 'react-bootstrap';

const SignupPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [error, setError] = useState('');
    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await signup(email, password, isAdmin ? 'ADMIN' : 'MEMBER');
            navigate('/dashboard');
        } catch (err) {
            setError('Failed to sign up. User may already exist.');
        }
    };

    return (
        <div className="auth-page-wrapper">
            <Card className="gov-auth-card">
                <Card.Header className="gov-login-header">
                    <h2 className="gov-login-header-title">Create Account</h2>
                    <p className="gov-login-header-subtitle">
                        Register for Project PWMS
                    </p>
                </Card.Header>
                <Card.Body className="p-4">
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Email Address</Form.Label>
                            <Form.Control
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="Enter your official email"
                                autoComplete="email"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Password</Form.Label>
                            <Form.Control
                                type="password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                                required
                                placeholder="Create a strong password"
                                autoComplete="new-password"
                            />
                        </Form.Group>
                        <Form.Check
                            type="checkbox"
                            id="isAdmin"
                            label="Create as Administrator Account"
                            checked={isAdmin}
                            onChange={(e) =>
                                setIsAdmin(e.target.checked)
                            }
                            className="mb-3"
                        />
                        <Button type="submit" className="w-100 gov-login-btn">
                            Sign Up
                        </Button>
                    </Form>
                    <div className="text-center mt-3 small">
                        Already have an account?{' '}
                        <Link to="/login">Login</Link>
                    </div>
                </Card.Body>
            </Card>
            <footer className="login-page-footer">
                &copy; {new Date().getFullYear()} Project PWMS 
            </footer>
        </div>
    );
};

export default SignupPage;
