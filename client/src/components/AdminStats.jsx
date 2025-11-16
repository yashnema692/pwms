import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Card, Row, Col, Spinner } from 'react-bootstrap';

const AdminStats = () => {
    const { user } = useAuth();
    const { onlineUsers } = useSocket();
    const [totalUsers, setTotalUsers] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTotalUsers = async () => {
            setLoading(true);
            try {
                const { data } = await api.get('/api/users');
                setTotalUsers(data.length);
            } catch (err) {
                console.error("Failed to fetch total users", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTotalUsers();
    }, [user]);

    return (
        <Card className="mb-4 admin-stats-card">
            <Card.Header as="h5" className="admin-stats-header">
                Admin Overview
            </Card.Header>
            <Card.Body>
                <Row className="g-3">
                    <Col xs={6} md={6}>
                        <div className="admin-stat-tile">
                            <div className="admin-stat-label">Online Users</div>
                            <div className="admin-stat-value">{onlineUsers.length}</div>
                        </div>
                    </Col>
                    <Col xs={6} md={6}>
                        <div className="admin-stat-tile">
                            <div className="admin-stat-label">Total Users</div>
                            <div className="admin-stat-value">
                                {loading ? (
                                    <Spinner animation="border" size="sm" />
                                ) : (
                                    totalUsers
                                )}
                            </div>
                        </div>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
};

export default AdminStats;
