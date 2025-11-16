import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import {
    Button,
    Alert,
    Form,
    Row,
    Col,
    Card,
    Spinner
} from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import ProjectTable from '../components/ProjectTable';
import ProjectModal from '../components/ProjectModal';
import PaginationControls from '../components/Pagination';
import AdminStats from '../components/AdminStats';

const ProjectsDashboard = () => {
    const [projects, setProjects] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1);
        }, 500);
        return () => clearTimeout(timerId);
    }, [searchQuery]);

    const fetchProjectsAndTeams = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data: projectData } = await api.get('/api/projects', {
                params: { page, search: debouncedSearch, status: statusFilter }
            });
            setProjects(projectData.projects || []);
            setPage(projectData.page || 1);
            setTotalPages(projectData.totalPages || 1);

            const { data: teamsData } = await api.get('/api/teams');
            setTeams(teamsData || []);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch data.');
        } finally {
            setLoading(false);
        }
    }, [user, page, debouncedSearch, statusFilter]);

    useEffect(() => {
        fetchProjectsAndTeams();
    }, [fetchProjectsAndTeams]);

    const handleOpenModal = (project = null) => {
        setEditingProject(project);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingProject(null);
    };

    const handleSave = async (projectData) => {
        const method = editingProject ? 'patch' : 'post';
        const url = editingProject
            ? `/api/projects/${editingProject._id}`
            : `/api/projects`;
        try {
            await api[method](url, projectData);
            fetchProjectsAndTeams();
            handleCloseModal();
        } catch (err) {
            console.error(err);
            setError(
                'Failed to save project. Please check all fields are valid.'
            );
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this project?'))
            return;
        try {
            await api.delete(`/api/projects/${id}`);
            fetchProjectsAndTeams();
        } catch (err) {
            console.error(err);
            setError('Failed to delete project.');
        }
    };

    const handleStatusFilterChange = (e) => {
        setStatusFilter(e.target.value);
        setPage(1);
    };

    return (
        <>
            {user.role === 'ADMIN' && <AdminStats />}

            <div className="page-toolbar">
                <h1>Projects</h1>
                <Button variant="primary" onClick={() => handleOpenModal()}>
                    Create New Project
                </Button>
            </div>

            <Card className="mb-4">
                <Card.Body>
                    <Form>
                        <Row className="g-3">
                            <Col xs={12} md={6}>
                                <Form.Control
                                    type="text"
                                    placeholder="Search by title or client..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                />
                            </Col>
                            <Col xs={12} md={6}>
                                <Form.Select
                                    value={statusFilter}
                                    onChange={handleStatusFilterChange}
                                >
                                    <option value="">All Statuses</option>
                                    <option value="LEAD">Lead</option>
                                    <option value="IN_PROGRESS">
                                        In Progress
                                    </option>
                                    <option value="ON_HOLD">On Hold</option>
                                    <option value="DONE">Done</option>
                                </Form.Select>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>

            {error && <Alert variant="danger">{error}</Alert>}

            {loading ? (
                <div className="text-center my-4">
                    <Spinner animation="border" />
                </div>
            ) : (
                <>
                    {projects.length > 0 ? (
                        <Card>
                            <ProjectTable
                                projects={projects}
                                onEdit={handleOpenModal}
                                onDelete={handleDelete}
                            />
                        </Card>
                    ) : (
                        <Alert
                            variant="info"
                            className="text-center mt-4 mb-0"
                        >
                            No projects match your criteria.
                        </Alert>
                    )}
                    <PaginationControls
                        page={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                    />
                </>
            )}

            <ProjectModal
                show={showModal}
                onHide={handleCloseModal}
                onSave={handleSave}
                project={editingProject}
                teams={teams}
            />
        </>
    );
};

export default ProjectsDashboard;
