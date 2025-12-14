import React, { useEffect, useState, useRef } from 'react';
import { Container, Row, Col, Card, Button, Form, Spinner, Alert, Badge } from 'react-bootstrap';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const AnnouncementsPage = () => {
    const { user } = useAuth();
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Form State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [banner, setBanner] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    const fetchNotes = async () => {
        try {
            const { data } = await api.get('/api/notes');
            setNotes(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!title || !content) return toast.warning("Title and Content are required");

        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        if (banner) formData.append('banner', banner);

        setIsSubmitting(true);
        try {
            await api.post('/api/notes', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Announcement posted!');
            setTitle('');
            setContent('');
            setBanner(null);
            if(fileInputRef.current) fileInputRef.current.value = "";
            fetchNotes(); // Refresh list
        } catch (error) {
            toast.error('Failed to post announcement');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if(!window.confirm("Delete this announcement?")) return;
        try {
            await api.delete(`/api/notes/${id}`);
            setNotes(notes.filter(n => n._id !== id));
            toast.success('Deleted successfully');
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    return (
        <Container fluid className="py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            <Row className="justify-content-center">
                <Col xs={12} lg={10}>
                    <h2 className="mb-4 fw-bold text-dark border-bottom pb-2">
                        📢 News & Updates
                    </h2>

                    {/* --- ADMIN CREATE SECTION --- */}
                    {user?.role === 'ADMIN' && (
                        <Card className="mb-5 shadow-sm border-0">
                            <Card.Header className="bg-primary text-white fw-bold">
                                Post New Update
                            </Card.Header>
                            <Card.Body>
                                <Form onSubmit={handleCreate}>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Title</Form.Label>
                                                <Form.Control 
                                                    type="text" 
                                                    placeholder="Enter headline..." 
                                                    value={title}
                                                    onChange={(e) => setTitle(e.target.value)}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Banner Image (Optional)</Form.Label>
                                                <Form.Control 
                                                    type="file" 
                                                    ref={fileInputRef}
                                                    onChange={(e) => setBanner(e.target.files[0])}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Content</Form.Label>
                                        <Form.Control 
                                            as="textarea" 
                                            rows={3} 
                                            placeholder="What's happening?"
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                        />
                                    </Form.Group>
                                    <div className="text-end">
                                        <Button type="submit" disabled={isSubmitting}>
                                            {isSubmitting ? 'Posting...' : 'Post Announcement'}
                                        </Button>
                                    </div>
                                </Form>
                            </Card.Body>
                        </Card>
                    )}

                    {/* --- NEWS DISPLAY SECTION --- */}
                    {loading ? (
                        <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
                    ) : (
                        <Row>
                            {notes.length > 0 ? (
                                notes.map((note) => (
                                    <Col xs={12} key={note._id} className="mb-4">
                                        <Card className="shadow-sm border-0 h-100 overflow-hidden">
                                            <Row className="g-0">
                                                {/* Image Section (Only if banner exists) */}
                                                {note.bannerUrl && (
                                                    <Col md={4} className="bg-light d-flex align-items-center justify-content-center" style={{ minHeight: '200px' }}>
                                                        <img 
                                                            src={`http://localhost:5001${note.bannerUrl}`} 
                                                            alt="Banner" 
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                    </Col>
                                                )}
                                                
                                                {/* Content Section */}
                                                <Col md={note.bannerUrl ? 8 : 12}>
                                                    <Card.Body className="d-flex flex-column h-100">
                                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                                            <h4 className="fw-bold text-primary mb-0">{note.title}</h4>
                                                            {user?.role === 'ADMIN' && (
                                                                <Button 
                                                                    variant="outline-danger" 
                                                                    size="sm" 
                                                                    onClick={() => handleDelete(note._id)}
                                                                >
                                                                    <i className="bi bi-trash"></i> Delete
                                                                </Button>
                                                            )}
                                                        </div>
                                                        <div className="text-muted small mb-3">
                                                            Posted by {note.createdBy?.email} • {new Date(note.createdAt).toLocaleDateString()}
                                                        </div>
                                                        <Card.Text style={{ whiteSpace: 'pre-wrap' }}>
                                                            {note.content}
                                                        </Card.Text>
                                                    </Card.Body>
                                                </Col>
                                            </Row>
                                        </Card>
                                    </Col>
                                ))
                            ) : (
                                <Col>
                                    <Alert variant="info" className="text-center p-5">
                                        No announcements yet. Stay tuned!
                                    </Alert>
                                </Col>
                            )}
                        </Row>
                    )}
                </Col>
            </Row>
        </Container>
    );
};

export default AnnouncementsPage;