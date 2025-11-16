import React, { useState, useEffect } from 'react';
import api from '../api';
import { Table, Button, Alert, Form, Card, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

const AdminUserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/api/users');
            setUsers(data);
        } catch (err) {
            setError('Failed to fetch users.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [user]);

    const handleDelete = async (id) => {
        if (id === user._id) return alert('You cannot delete your own account.');
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await api.delete(`/api/users/${id}`);
                fetchUsers();
            } catch (err) {
                setError('Failed to delete user.');
            }
        }
    };

    const handleRoleChange = async (id, newRole) => {
        try {
            await api.put(`/api/users/${id}/role`, { role: newRole });
            fetchUsers();
        } catch (err) {
            setError('Failed to update role.');
        }
    };

    return (
        <>
            <div className="page-toolbar">
                <h1>User Management</h1>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            {loading ? (
                <div className="text-center my-4">
                    <Spinner animation="border" />
                </div>
            ) : (
                <Card>
                    <div className="table-responsive mb-0">
                        <Table striped bordered hover responsive className="align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u._id}>
                                        <td>{u.email}</td>
                                        <td>
                                            <Form.Select
                                                value={u.role}
                                                onChange={(e) =>
                                                    handleRoleChange(u._id, e.target.value)
                                                }
                                                disabled={u._id === user._id}
                                                size="sm"
                                            >
                                                <option value="MEMBER">MEMBER</option>
                                                <option value="ADMIN">ADMIN</option>
                                            </Form.Select>
                                        </td>
                                        <td className="text-center">
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => handleDelete(u._id)}
                                                disabled={u._id === user._id}
                                            >
                                                Delete
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </Card>
            )}
        </>
    );
};

export default AdminUserManagement;
