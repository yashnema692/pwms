import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Form, Button, Row, Col, Badge, Modal } from 'react-bootstrap';
import api from '../api';

const AdminAttendance = () => {
    const [records, setRecords] = useState([]);
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    
    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [modalImage, setModalImage] = useState('');
    const [modalTitle, setModalTitle] = useState('');

    useEffect(() => {
        fetchRecords(filterDate);
    }, [filterDate]);

    const fetchRecords = async (date) => {
        try {
            const { data } = await api.get(`/api/attendance/all?date=${date}`);
            setRecords(data);
        } catch (error) { console.error(error); }
    };

    const handleViewPhoto = (url, title) => {
        setModalImage(`http://localhost:5001${url}`);
        setModalTitle(title);
        setShowModal(true);
    };

    return (
        <Container fluid className="py-4 bg-light" style={{ minHeight: '100vh' }}>
            <h2 className="mb-4 fw-bold text-dark">📋 Employee Attendance Logs</h2>

            <Card className="shadow-sm border-0">
                <Card.Header className="bg-white py-3 border-bottom">
                    <Row className="align-items-center">
                        <Col md={6}>
                            <h5 className="mb-0 text-secondary">Daily Overview</h5>
                        </Col>
                        <Col md={6} className="text-md-end mt-2 mt-md-0">
                            <div className="d-inline-flex align-items-center bg-light rounded px-3 py-1 border">
                                <span className="me-2 fw-bold text-muted small">FILTER DATE:</span>
                                <Form.Control 
                                    type="date" 
                                    value={filterDate} 
                                    onChange={(e) => setFilterDate(e.target.value)} 
                                    className="border-0 bg-transparent p-0"
                                    style={{ width: '130px', fontWeight: 'bold' }}
                                />
                            </div>
                        </Col>
                    </Row>
                </Card.Header>
                <Card.Body className="p-0">
                    <Table responsive hover className="mb-0 align-middle text-nowrap">
                        <thead className="bg-light text-secondary small text-uppercase">
                            <tr>
                                <th className="ps-4">Employee</th>
                                <th>Morning (In)</th>
                                <th>Morning Loc</th>
                                <th>Morning Pic</th>
                                <th>Evening (Out)</th>
                                <th>Evening Loc</th>
                                <th>Evening Pic</th>
                                <th>Duration</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.length > 0 ? (
                                records.map((rec) => (
                                    <tr key={rec._id}>
                                        <td className="ps-4">
                                            <div className="fw-bold text-dark">{rec.user?.email}</div>
                                        </td>
                                        
                                        {/* Morning Data */}
                                        <td>
                                            {rec.checkIn?.time ? <span className="text-success fw-bold">{new Date(rec.checkIn.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span> : '-'}
                                        </td>
                                        <td>
                                            <div className="text-truncate text-muted small" style={{maxWidth: '150px'}} title={rec.checkIn?.location?.address}>
                                                {rec.checkIn?.location?.address || '-'}
                                            </div>
                                        </td>
                                        <td>
                                            {rec.checkIn?.photoUrl && (
                                                <Button variant="outline-primary" size="sm" className="py-0 px-2 rounded-pill" style={{fontSize: '0.75rem'}} onClick={() => handleViewPhoto(rec.checkIn.photoUrl, 'Morning Check-In')}>
                                                    View
                                                </Button>
                                            )}
                                        </td>

                                        {/* Evening Data */}
                                        <td>
                                            {rec.checkOut?.time ? <span className="text-danger fw-bold">{new Date(rec.checkOut.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span> : '-'}
                                        </td>
                                        <td>
                                            <div className="text-truncate text-muted small" style={{maxWidth: '150px'}} title={rec.checkOut?.location?.address}>
                                                {rec.checkOut?.location?.address || '-'}
                                            </div>
                                        </td>
                                        <td>
                                            {rec.checkOut?.photoUrl && (
                                                <Button variant="outline-danger" size="sm" className="py-0 px-2 rounded-pill" style={{fontSize: '0.75rem'}} onClick={() => handleViewPhoto(rec.checkOut.photoUrl, 'Evening Check-Out')}>
                                                    View
                                                </Button>
                                            )}
                                        </td>

                                        {/* Duration (Hrs) */}
                                        <td>
                                            <span className="fw-bold text-dark">
                                                {rec.duration ? `${(rec.duration / 60).toFixed(1)} hrs` : '-'}
                                            </span>
                                        </td>

                                        {/* Status Badge */}
                                        <td>
                                            {rec.checkOut?.time ? (
                                                <Badge bg="success" className="fw-normal px-2">Completed</Badge>
                                            ) : (
                                                <Badge bg="warning" text="dark" className="fw-normal px-2">Active</Badge>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="9" className="text-center py-5 text-muted">
                                        <div className="display-6 opacity-25">📂</div>
                                        <div>No records found for {filterDate}</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            {/* Photo Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{modalTitle}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center p-0 bg-dark">
                    <img src={modalImage} alt="Proof" style={{ width: '100%', maxHeight: '500px', objectFit: 'contain' }} />
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default AdminAttendance;