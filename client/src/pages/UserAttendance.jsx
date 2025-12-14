import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Container, Row, Col, Card, Button, Table, Badge, Alert, OverlayTrigger, Popover, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../api';

const UserAttendance = () => {
    const webcamRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [location, setLocation] = useState(null);
    const [address, setAddress] = useState('Fetching location...');
    
    const [history, setHistory] = useState([]);
    const [todayRecord, setTodayRecord] = useState(null);
    
    // Auto-Capture States
    const [activeScanMode, setActiveScanMode] = useState(null); 
    const [scanStatus, setScanStatus] = useState(''); 

    useEffect(() => {
        getCurrentLocation();
        fetchMyHistory();
    }, []);

    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    setLocation({ lat, lng });

                    // Reverse Geocoding
                    try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                        const data = await res.json();
                        setAddress(data.display_name || "Unknown Location");
                    } catch {
                        setAddress("Location detected (Address unavailable)");
                    }
                },
                () => setAddress("Location Access Denied")
            );
        } else {
            setAddress("Geolocation not supported");
        }
    };

    const fetchMyHistory = async () => {
        try {
            const { data } = await api.get('/api/attendance/my-history');
            setHistory(data);
            const todayStr = new Date().toISOString().split('T')[0];
            setTodayRecord(data.find(r => r.date === todayStr));
        } catch (err) { console.error(err); }
    };

    const startAutoCapture = (mode) => {
        // Refresh location right before scanning
        getCurrentLocation(); 
        
        setActiveScanMode(mode);
        setScanStatus('Initializing...');

        setTimeout(() => {
            setScanStatus('Detecting Face...');
            setTimeout(() => {
                setScanStatus('👁️ Blink Detected! Capturing...');
                setTimeout(() => {
                    captureAndMark(mode);
                }, 1000);
            }, 2000);
        }, 1500);
    };

    const captureAndMark = async (type) => {
        if (!webcamRef.current || !location) return;
        setLoading(true);
        const imageSrc = webcamRef.current.getScreenshot();

        try {
            const { data } = await api.post('/api/attendance/mark', {
                image: imageSrc,
                location,
                address, 
                type
            });
            toast.success(data.message);
            fetchMyHistory();
            setActiveScanMode(null);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to mark attendance");
            setActiveScanMode(null);
        } finally {
            setLoading(false);
        }
    };

    const renderThumbnail = (url, label) => (
        <OverlayTrigger
            trigger="click"
            placement="left"
            overlay={
                <Popover>
                    <Popover.Header as="h3">{label}</Popover.Header>
                    <Popover.Body className="p-0">
                        <img src={`http://localhost:5001${url}`} alt={label} style={{width: '200px'}} />
                    </Popover.Body>
                </Popover>
            }
        >
            <img 
                src={`http://localhost:5001${url}`} 
                alt="thumb" 
                className="rounded-circle border border-2 border-white shadow-sm"
                style={{width: '40px', height: '40px', objectFit: 'cover', cursor: 'pointer'}}
            />
        </OverlayTrigger>
    );

    return (
        <Container fluid className="py-4 bg-light" style={{ minHeight: '100vh' }}>
            <h2 className="text-center fw-bold mb-4 text-dark">👋 My Attendance</h2>

            <Row className="justify-content-center mb-5">
                <Col md={6} lg={5}>
                    <Card className="shadow border-0 rounded-4 overflow-hidden">
                        <Card.Header className="bg-gradient bg-primary text-white text-center py-3">
                            <h5 className="mb-0">Smart Verification</h5>
                        </Card.Header>
                        <Card.Body className="text-center bg-dark p-4">
                            
                            {activeScanMode ? (
                                <div className="position-relative mx-auto rounded overflow-hidden border border-4 border-success mb-3" style={{ width: '280px', height: '280px' }}>
                                    <Webcam
                                        audio={false}
                                        ref={webcamRef}
                                        screenshotFormat="image/jpeg"
                                        videoConstraints={{ facingMode: "user" }}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    <div className="position-absolute bottom-0 start-0 w-100 bg-dark bg-opacity-75 text-white py-2 fw-bold small">
                                        {scanStatus}
                                    </div>
                                    <div className="position-absolute top-50 start-50 translate-middle" style={{ width: '160px', height: '200px', border: '2px dashed rgba(255,255,255,0.7)', borderRadius: '50%' }}></div>
                                </div>
                            ) : (
                                <div className="text-white mb-4 py-4">
                                    <div className="display-4 mb-2">📸</div>
                                    <p className="text-white-50">Camera is ready</p>
                                </div>
                            )}

                            <div className="text-white mb-4">
                                <small className="d-block text-white-50 text-uppercase" style={{fontSize: '0.7rem'}}>Detected Location</small>
                                <div className={location ? "text-info small fw-bold" : "text-warning small"}>
                                    {address}
                                </div>
                            </div>

                            {!activeScanMode && (
                                <div className="d-grid gap-3">
                                    {!todayRecord && (
                                        <Button variant="success" size="lg" disabled={!location || loading} onClick={() => startAutoCapture('MORNING')}>
                                            🌅 Start Morning Scan
                                        </Button>
                                    )}
                                    {todayRecord && !todayRecord.checkOut?.time && (
                                        <Button variant="warning" size="lg" disabled={!location || loading} onClick={() => startAutoCapture('EVENING')}>
                                            🌙 Start Evening Scan
                                        </Button>
                                    )}
                                    {todayRecord && todayRecord.checkOut?.time && (
                                        <Alert variant="success" className="m-0 border-0 py-2 small">
                                            ✅ Attendance Completed
                                        </Alert>
                                    )}
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Card className="shadow-sm border-0">
                <Card.Header className="bg-white fw-bold py-3">My Recent History</Card.Header>
                <Card.Body className="p-0">
                    <Table hover responsive className="align-middle mb-0">
                        <thead className="bg-light text-secondary small text-uppercase">
                            <tr>
                                <th className="ps-4">Date</th>
                                <th>Morning In</th>
                                <th>Morning Loc</th>
                                <th>Photo</th>
                                <th>Evening Out</th>
                                <th>Evening Loc</th>
                                <th>Photo</th>
                                <th>Hrs</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((rec) => (
                                <tr key={rec._id}>
                                    <td className="ps-4 fw-medium">{rec.date}</td>
                                    
                                    {/* MORNING */}
                                    <td>
                                        {rec.checkIn?.time ? <Badge bg="success" className="fw-normal">{new Date(rec.checkIn.time).toLocaleTimeString()}</Badge> : '-'}
                                    </td>
                                    <td>
                                        <div className="text-truncate text-muted small" style={{maxWidth: '150px'}} title={rec.checkIn?.location?.address}>
                                            {rec.checkIn?.location?.address || '-'}
                                        </div>
                                    </td>
                                    <td>{rec.checkIn?.photoUrl && renderThumbnail(rec.checkIn.photoUrl, 'Morning')}</td>
                                    
                                    {/* EVENING */}
                                    <td>
                                        {rec.checkOut?.time ? <Badge bg="danger" className="fw-normal">{new Date(rec.checkOut.time).toLocaleTimeString()}</Badge> : <Badge bg="warning" text="dark" className="fw-normal">Active</Badge>}
                                    </td>
                                    <td>
                                        <div className="text-truncate text-muted small" style={{maxWidth: '150px'}} title={rec.checkOut?.location?.address}>
                                            {rec.checkOut?.location?.address || '-'}
                                        </div>
                                    </td>
                                    <td>{rec.checkOut?.photoUrl && renderThumbnail(rec.checkOut.photoUrl, 'Evening')}</td>
                                    
                                    {/* DURATION */}
                                    <td className="fw-bold text-dark">{rec.duration ? (rec.duration/60).toFixed(1) + ' hrs' : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default UserAttendance;