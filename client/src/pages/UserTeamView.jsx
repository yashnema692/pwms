import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Spinner, ListGroup, Alert, Button, Badge } from 'react-bootstrap';
import api from '../api';

const UserTeamView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchTeamDetails = async () => {
            try {
                const { data } = await api.get(`/api/teams/${id}`);
                setTeam(data);
            } catch (err) {
                console.error(err);
                setError('Failed to fetch team details.');
            } finally {
                setLoading(false);
            }
        };

        fetchTeamDetails();
    }, [id]);

    if (loading) {
        return (
            <div className="d-flex justify-content-center mt-5">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    if (error) return <Alert variant="danger" className="m-4">{error}</Alert>;
    if (!team) return <Alert variant="warning" className="m-4">Team not found.</Alert>;

    // Helper to safely get the Creator ID (handles if it's an object or just an ID string)
    const creatorId = typeof team.createdBy === 'object' ? team.createdBy._id : team.createdBy;

    return (
        <div className="p-4">
            {/* Back Button */}
            <Button 
                variant="outline-secondary" 
                size="sm" 
                className="mb-3" 
                onClick={() => navigate(-1)}
            >
                &larr; Back
            </Button>

            <Card className="shadow-sm border-0">
                <Card.Header className="bg-primary text-white py-3">
                    <h4 className="mb-0">{team.name}</h4>
                </Card.Header>
                
                <Card.Body className="p-0">
                    <div className="p-3 bg-light border-bottom">
                        <small className="text-muted text-uppercase fw-bold">Team Members</small>
                    </div>
                    
                    <ListGroup variant="flush">
                        {team.members && team.members.length > 0 ? (
                            team.members.map((member) => (
                                <ListGroup.Item key={member._id} className="d-flex justify-content-between align-items-center py-3">
                                    <div className="d-flex align-items-center">
                                        <div 
                                            className="rounded-circle bg-secondary text-white d-flex justify-content-center align-items-center me-3 shadow-sm"
                                            style={{ width: '35px', height: '35px', fontSize: '14px' }}
                                        >
                                            {member.email.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="fw-medium">{member.email}</span>
                                    </div>
                                    
                                    {/* Show Badge if this member is the Creator/Admin */}
                                    {member._id === creatorId && (
                                        <Badge bg="info" text="dark" className="px-3 py-2">
                                            Team Lead
                                        </Badge>
                                    )}
                                </ListGroup.Item>
                            ))
                        ) : (
                            <ListGroup.Item className="text-muted p-4 text-center">
                                No members assigned to this team.
                            </ListGroup.Item>
                        )}
                    </ListGroup>
                </Card.Body>
                
                <Card.Footer className="bg-white text-muted small p-3">
                    Team created by: <strong>{team.createdBy?.email || 'Unknown'}</strong> on {new Date(team.createdAt).toLocaleDateString()}
                </Card.Footer>
            </Card>
        </div>
    );
};

export default UserTeamView;