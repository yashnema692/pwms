import React from 'react';
import { Table, Button, Badge } from 'react-bootstrap';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const statusColors = {
    LEAD: 'primary',
    IN_PROGRESS: 'warning',
    ON_HOLD: 'secondary',
    DONE: 'success'
};

const ProjectTable = ({ projects, onEdit, onDelete }) => {
    const { user } = useAuth();

    return (
        <div className="table-responsive project-table-wrapper">
            <Table striped bordered hover responsive className="align-middle mb-0">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Client</th>
                        <th>Budget</th>
                        <th>Status</th>
                        <th>Owner</th>
                        <th>Assigned Team</th>
                        <th>Last Updated</th>
                        <th className="text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {projects.map((project) => (
                        <tr key={project._id}>
                            <td>{project.title}</td>
                            <td>{project.client}</td>
                            <td>₹{project.budget.toLocaleString()}</td>
                            <td>
                                <Badge bg={statusColors[project.status]}>
                                    {project.status.replace('_', ' ')}
                                </Badge>
                            </td>
                            <td>{project.ownerId?.email || 'Unknown User'}</td>
                            <td>{project.assignedTeam?.name || 'N/A'}</td>
                            <td>
                                {formatDistanceToNow(new Date(project.updatedAt), {
                                    addSuffix: true
                                })}
                            </td>
                            <td className="text-center">
                                {(user.role === 'ADMIN' ||
                                    user._id === project.ownerId?._id) && (
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={() => onEdit(project)}
                                    >
                                        Edit
                                    </Button>
                                )}
                                {user.role === 'ADMIN' && (
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        className="ms-2"
                                        onClick={() => onDelete(project._id)}
                                    >
                                        Delete
                                    </Button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};

export default ProjectTable;
