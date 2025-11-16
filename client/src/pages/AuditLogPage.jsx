import React, { useState, useEffect } from 'react';
import api from '../api';
import { Table, Alert, Card, Spinner } from 'react-bootstrap';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const AuditLogPage = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        const fetchLogs = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const { data } = await api.get('/api/audit');
                setLogs(data);
            } catch (err) {
                console.error(err);
                setError('Failed to fetch audit logs.');
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, [user]);

    return (
        <>
            <div className="page-toolbar">
                <h1>Audit Log</h1>
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
                                    <th>Timestamp</th>
                                    <th>User</th>
                                    <th>Action</th>
                                    <th>Project</th>
                                    <th>Changes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log._id}>
                                        <td>
                                            {format(
                                                new Date(log.at),
                                                'dd MMM yyyy, HH:mm:ss'
                                            )}
                                        </td>
                                        <td>{log.userId?.email || 'N/A'}</td>
                                        <td>{log.action}</td>
                                        <td>{log.projectId?.title || 'N/A'}</td>
                                        <td>
                                            <div className="audit-log-diff">
                                                {JSON.stringify(log.diff, null, 2)}
                                            </div>
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

export default AuditLogPage;
