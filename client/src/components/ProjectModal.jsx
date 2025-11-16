import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const ProjectModal = ({ show, onHide, onSave, project, teams }) => {
    const [formData, setFormData] = useState({
        title: '',
        client: '',
        budget: '',
        status: 'LEAD',
        assignedTeam: ''
    });

    useEffect(() => {
        if (project) {
            setFormData({
                title: project.title,
                client: project.client,
                budget: project.budget,
                status: project.status,
                assignedTeam: project.assignedTeam?._id || ''
            });
        } else {
            setFormData({
                title: '',
                client: '',
                budget: '',
                status: 'LEAD',
                assignedTeam: ''
            });
        }
    }, [project, show]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'budget') {
            if (value === '' || /^[0-9]*$/.test(value)) {
                setFormData({
                    ...formData,
                    [name]: value
                });
            }
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const dataToSave = {
            ...formData,
            budget: Number(formData.budget) || 0
        };

        if (dataToSave.assignedTeam === '') {
            dataToSave.assignedTeam = null;
        }

        onSave(dataToSave);
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>{project ? 'Edit Project' : 'Create Project'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit} className="project-modal-form">
                    <Form.Group className="mb-3">
                        <Form.Label>Title</Form.Label>
                        <Form.Control
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            autoComplete="off"
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Client</Form.Label>
                        <Form.Control
                            type="text"
                            name="client"
                            value={formData.client}
                            onChange={handleChange}
                            required
                            autoComplete="off"
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Budget</Form.Label>
                        <Form.Control
                            type="text"
                            pattern="[0-9]*"
                            inputMode="numeric"
                            name="budget"
                            value={formData.budget}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Status</Form.Label>
                        <Form.Select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                        >
                            <option value="LEAD">Lead</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="ON_HOLD">On Hold</option>
                            <option value="DONE">Done</option>
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Assign Team</Form.Label>
                        <Form.Select
                            name="assignedTeam"
                            value={formData.assignedTeam}
                            onChange={handleChange}
                        >
                            <option value="">None</option>
                            {teams.map((team) => (
                                <option key={team._id} value={team._id}>
                                    {team.name}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>

                    <div className="d-flex justify-content-end">
                        <Button
                            variant="secondary"
                            onClick={onHide}
                            className="me-2"
                        >
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            Save
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default ProjectModal;
