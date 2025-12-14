import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
// 1. ADD 'Alert' TO THIS IMPORT LIST
import { Container, Row, Col, Card, Button, Spinner, Table, Badge, Form, Tabs, Tab, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const AttendancePage = () => {
    const { user } = useAuth();
    const webcamRef = useRef(null);
    
    // State
    const [loading, setLoading] = useState(false);
    const [location, setLocation] = useState(null);
    const [address, setAddress] = useState('Fetching address...'); 
    const [todayRecord, setTodayRecord] = useState(null);
    const [history, setHistory] = useState([]);
    
    // Admin State
    const [allRecords, setAllRecords] = useState([]);
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [key, setKey] = useState('mark');

    // Auto-Capture State
    const [isScanning, setIsScanning] = useState(false);
    const [countdown, setCountdown] = useState(null);

    // Webcam Config
    const videoConstraints = { width: 400, height: 400, facingMode: "user" };

    useEffect(() => {
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
                    } catch (err) {
                        setAddress("Location found, but address unavailable");
                    }
                },
                (error) => {
                    toast.error("Location Permission Denied");
                    setAddress("Location Permission Denied");
                }
            );
        }

        fetchMyHistory();
        if(user.role === 'ADMIN') fetchAllRecords(filterDate);
    }, []);

    useEffect(() => {
        if(user.role === 'ADMIN') fetchAllRecords(filterDate);
    }, [filterDate]);

    const fetchMyHistory = async () => {
        try {
            const { data } = await api.get('/api/attendance/my-history');
            setHistory(data);
            const todayStr = new Date().toISOString().split('T')[0];
            setTodayRecord(data.find(r => r.date === todayStr));
        } catch (error) { console.error(error); }
    };

    const fetchAllRecords = async (date) => {
        try {
            const { data } = await api.get(`/api/attendance/all?date=${date}`);
            setAllRecords(data);
        } catch (error) { console.error(error); }
    };

    const processAttendance = async (type) => {
        if (!location) return toast.warning("Waiting for location...");
        if (!webcamRef.current) return;

        setLoading(true);
        const imageSrc = webcamRef.current.getScreenshot();

        try {
            const { data } = await api.post('/api/attendance/mark', {
                image: imageSrc,
                location: location,
                address: address, 
                type: type
            });
            toast.success(data.message);
            fetchMyHistory();
        } catch (error) {
            toast.error(error.response?.data?.message || "Action Failed");
        } finally {
            setLoading(false);
            setIsScanning(false);
            setCountdown(null);
        }
    };

    const startSmartScan = (type) => {
        if (!webcamRef.current) return;
        setIsScanning(true);
        setCountdown(3);

        let count = 3;
        const timer = setInterval(() => {
            count--;
            setCountdown(count);
            if (count === 0) {
                clearInterval(timer);
                processAttendance(type);
            }
        }, 1000);
    };

    return (
        <Container fluid className="py-4" style={{ backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
            <h2 className="mb-4 fw-bold text-dark text-center">🏢 Smart Attendance Portal</h2>

            <Tabs activeKey={key} onSelect={(k) => setKey(k)} className="mb-4 justify-content-center">
                
                <Tab eventKey="mark" title="Mark Attendance">
                    <Row className="justify-content-center">
                        <Col md={6}>
                            <Card className="shadow-lg border-0 rounded-4">
                                <Card.Header className="bg-primary text-white text-center py-3">
                                    <h5 className="mb-0">Face Verification Panel</h5>
                                </Card.Header>
                                <Card.Body className="text-center bg-dark p-4">
                                    
                                    <div className="position-relative mx-auto rounded overflow-hidden border border-4 border-secondary" style={{ width: '320px', height: '320px' }}>
                                        <Webcam
                                            audio={false}
                                            ref={webcamRef}
                                            screenshotFormat="image/jpeg"
                                            videoConstraints={videoConstraints}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                        
                                        {isScanning && (
                                            <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50">
                                                <div className="text-white display-1 fw-bold">{countdown}</div>
                                            </div>
                                        )}
                                        
                                        {!isScanning && (
                                            <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center">
                                                <div style={{ width: '180px', height: '220px', border: '2px dashed rgba(0,255,0,0.6)', borderRadius: '20px' }}></div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-3 text-white">
                                        <div className="fw-bold"><i className="bi bi-geo-alt"></i> Current Location:</div>
                                        <small className={location ? "text-info" : "text-warning"}>
                                            {address}
                                        </small>
                                    </div>

                                    <div className="d-grid gap-3 mt-4">
                                        {!todayRecord && (
                                            <Button 
                                                variant="success" 
                                                size="lg" 
                                                onClick={() => startSmartScan('MORNING')}
                                                disabled={isScanning || loading || !location}
                                            >
                                                {isScanning ? "Scanning..." : "🌅 Morning Check-In (Auto Scan)"}
                                            </Button>
                                        )}

                                        {todayRecord && !todayRecord.checkOut?.time && (
                                            <Button 
                                                variant="warning" 
                                                size="lg" 
                                                onClick={() => startSmartScan('EVENING')}
                                                disabled={isScanning || loading || !location}
                                            >
                                                {isScanning ? "Scanning..." : "🌆 Evening Check-Out (Auto Scan)"}
                                            </Button>
                                        )}

                                        {todayRecord && todayRecord.checkOut?.time && (
                                            <Alert variant="success" className="m-0">
                                                <i className="bi bi-check-circle-fill"></i> You have completed attendance for today.
                                            </Alert>
                                        )}
                                    </div>

                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Tab>

                <Tab eventKey="history" title="My History">
                    <Card className="shadow-sm border-0">
                        <Card.Body>
                            <Table responsive hover>
                                <thead className="bg-light">
                                    <tr>
                                        <th>Date</th>
                                        <th>Morning (In)</th>
                                        <th>Evening (Out)</th>
                                        <th>Location</th>
                                        <th>Duration</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((rec) => (
                                        <tr key={rec._id}>
                                            <td>{rec.date}</td>
                                            <td>
                                                {rec.checkIn?.time ? (
                                                    <Badge bg="success">{new Date(rec.checkIn.time).toLocaleTimeString()}</Badge>
                                                ) : '-'}
                                            </td>
                                            <td>
                                                {rec.checkOut?.time ? (
                                                    <Badge bg="danger">{new Date(rec.checkOut.time).toLocaleTimeString()}</Badge>
                                                ) : <Badge bg="warning" text="dark">Working...</Badge>}
                                            </td>
                                            <td style={{ maxWidth: '200px', fontSize: '0.85rem' }}>
                                                {rec.checkIn?.location?.address || "GPS Coordinates only"}
                                            </td>
                                            <td>{rec.duration ? `${(rec.duration / 60).toFixed(1)} hrs` : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Tab>

                {user.role === 'ADMIN' && (
                    <Tab eventKey="admin" title="Admin Dashboard">
                        <Card className="shadow-sm border-0">
                            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">Daily Attendance Report</h5>
                                <div className="d-flex align-items-center">
                                    <span className="me-2">Filter Date:</span>
                                    <Form.Control 
                                        type="date" 
                                        value={filterDate} 
                                        onChange={(e) => setFilterDate(e.target.value)} 
                                        style={{ width: 'auto' }}
                                    />
                                </div>
                            </Card.Header>
                            <Card.Body>
                                <Table responsive bordered hover>
                                    <thead className="table-dark">
                                        <tr>
                                            <th>Employee</th>
                                            <th>Date</th>
                                            <th>Morning In</th>
                                            <th>In Location</th>
                                            <th>Evening Out</th>
                                            <th>Out Location</th>
                                            <th>Proof</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allRecords.length > 0 ? (
                                            allRecords.map((rec) => (
                                                <tr key={rec._id}>
                                                    <td className="fw-bold">{rec.user?.email}</td>
                                                    <td>{rec.date}</td>
                                                    <td>{rec.checkIn?.time ? new Date(rec.checkIn.time).toLocaleTimeString() : '-'}</td>
                                                    <td className="small">{rec.checkIn?.location?.address || 'N/A'}</td>
                                                    <td>{rec.checkOut?.time ? new Date(rec.checkOut.time).toLocaleTimeString() : '-'}</td>
                                                    <td className="small">{rec.checkOut?.location?.address || 'N/A'}</td>
                                                    <td>
                                                        <Button 
                                                            variant="outline-primary" 
                                                            size="sm" 
                                                            onClick={() => window.open(`http://localhost:5001${rec.checkIn?.photoUrl}`, '_blank')}
                                                        >
                                                            View
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="7" className="text-center py-4">No records found for this date.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </Tab>
                )}
            </Tabs>
        </Container>
    );
};

export default AttendancePage;