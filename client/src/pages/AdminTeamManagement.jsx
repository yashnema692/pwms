import React, { useState, useEffect } from 'react';
import api from '../api';
import { Table, Button, Alert, Modal, Form, Spinner, Card } from 'react-bootstrap';
import Select from 'react-select';
import { useAuth } from '../context/AuthContext';

const TeamManagementPage = () => {
    const [teams, setTeams] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();

    const [showModal, setShowModal] = useState(false);
    const [editingTeam, setEditingTeam] = useState(null);
    const [teamName, setTeamName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]);

    const userOptions = users.map((u) => ({ value: u._id, label: u.email }));

    const fetchData = async () => {
        setLoading(true);
        try {
            const [teamsRes, usersRes] = await Promise.all([
                api.get('/api/teams'),
                api.get('/api/users')
            ]);
            setTeams(teamsRes.data);
            setUsers(usersRes.data);
        } catch (err) {
            setError('Failed to fetch data.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleOpenModal = (team = null) => {
        if (team) {
            setEditingTeam(team);
            setTeamName(team.name);
            const validMembers = team.members.filter((m) => m);
            setSelectedMembers(
                validMembers.map((m) => ({ value: m._id, label: m.email }))
            );
        } else {
            setEditingTeam(null);
            setTeamName('');
            setSelectedMembers([]);
        }
        setShowModal(true);
    };

    const handleCloseModal = () => setShowModal(false);

    const handleSave = async () => {
        const memberIds = selectedMembers.map((m) => m.value);
        const payload = { name: teamName, members: memberIds };

        try {
            if (editingTeam) {
                await api.put(`/api/teams/${editingTeam._id}`, payload);
            } else {
                await api.post('/api/teams', payload);
            }
            fetchData();
            handleCloseModal();
        } catch (err) {
            setError('Failed to save team.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this team?')) {
            try {
                await api.delete(`/api/teams/${id}`);
                fetchData();
            } catch (err) {
                setError('Failed to delete team.');
            }
        }
    };

    return (
        <>
            <div className="page-toolbar">
                <h1>Team Management</h1>
                <Button variant="primary" onClick={() => handleOpenModal()}>
                    Create New Team
                </Button>
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
                                    <th>Name</th>
                                    <th>Members</th>
                                    <th>Created By</th>
                                    <th className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teams.map((team) => (
                                    <tr key={team._id}>
                                        <td>{team.name}</td>
                                        <td>
                                            {team.members
                                                .filter((m) => m)
                                                .map((m) => m.email)
                                                .join(', ')}
                                        </td>
                                        <td>{team.createdBy?.email || 'Unknown User'}</td>
                                        <td className="text-center">
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                onClick={() => handleOpenModal(team)}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                className="ms-2"
                                                onClick={() => handleDelete(team._id)}
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

            <Modal show={showModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{editingTeam ? 'Edit Team' : 'Create Team'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Team Name</Form.Label>
                            <Form.Control
                                type="text"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Members</Form.Label>
                            <Select
                                isMulti
                                options={userOptions}
                                value={selectedMembers}
                                onChange={setSelectedMembers}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSave}>
                        Save
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default TeamManagementPage;
