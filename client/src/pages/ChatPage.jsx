import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Row, Col, ListGroup, Form, Button, Card } from 'react-bootstrap';
import { format } from 'date-fns';
import { useSocket } from '../context/SocketContext';
import { toast } from 'react-toastify';
import { BsCheck, BsCheckAll, BsPaperclip } from 'react-icons/bs';

const ChatPage = () => {
    const { user } = useAuth();
    const { socket, onlineUsers, setChattingWith } = useSocket();
    
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [file, setFile] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [isReceiverTyping, setIsReceiverTyping] = useState(false);
    
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const fileInputRef = useRef(null);

    // 1. Fetch Users
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const { data } = await api.get('/api/users');
                setUsers(data.filter((u) => u._id !== user._id));
            } catch (err) { console.error(err); }
        };
        fetchUsers();
    }, [user._id]);

    // 2. Load Chat & Mark as Seen (Initial Load)
    useEffect(() => {
        if (selectedUser) {
            setChattingWith(selectedUser._id);
            const fetchMessages = async () => {
                try {
                    const { data } = await api.get(`/api/messages/${selectedUser._id}`);
                    setMessages(data);
                    
                    // Mark messages as seen immediately upon opening
                    await api.put('/api/messages/status', {
                        conversationId: data.length > 0 ? data[0].conversationId : null,
                        status: 'seen'
                    });
                } catch (err) { console.error(err); }
            };
            fetchMessages();
        }
        return () => { setChattingWith(null); setIsReceiverTyping(false); };
    }, [selectedUser, setChattingWith]);

    // 3. Socket Listeners (The Real-Time Magic)
    useEffect(() => {
        if (!socket) return;

        // A. Handle Incoming Message
        const handleNewMessage = (message) => {
            // Only add message if it belongs to the current conversation
            if (selectedUser && message.sender._id === selectedUser._id) {
                setMessages((prev) => [...prev, message]);
                
                // If I'm looking at this chat, tell backend I saw it immediately
                api.put('/api/messages/status', {
                    conversationId: message.conversationId,
                    status: 'seen'
                });
            }
        };

        // B. Handle Status Update (Blue Ticks)
        const handleStatusUpdate = ({ status, updatedBy }) => {
            // If the person I'm chatting with (selectedUser) triggered this update
            if (selectedUser && updatedBy === selectedUser._id) {
                setMessages((prev) => 
                    prev.map((msg) => {
                        // Update MY messages that are not yet 'seen'
                        if (msg.sender._id === user._id && msg.status !== 'seen') {
                            return { ...msg, status: status };
                        }
                        return msg;
                    })
                );
            }
        };

        // C. Typing Indicators
        const handleTyping = ({ senderId }) => {
            if (selectedUser && senderId === selectedUser._id) setIsReceiverTyping(true);
        };
        const handleStopTyping = ({ senderId }) => {
            if (selectedUser && senderId === selectedUser._id) setIsReceiverTyping(false);
        };

        socket.on('newMessage', handleNewMessage);
        socket.on('messageStatusUpdate', handleStatusUpdate);
        socket.on('userTyping', handleTyping);
        socket.on('userStoppedTyping', handleStopTyping);

        return () => {
            socket.off('newMessage', handleNewMessage);
            socket.off('messageStatusUpdate', handleStatusUpdate);
            socket.off('userTyping', handleTyping);
            socket.off('userStoppedTyping', handleStopTyping);
        };
    }, [socket, selectedUser, user]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isReceiverTyping]);

    // 4. Send Message
    const handleSubmit = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !file) || !selectedUser) return;

        const formData = new FormData();
        formData.append('content', newMessage);
        if (file) formData.append('file', file);

        try {
            const { data } = await api.post(`/api/messages/${selectedUser._id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setMessages((prev) => [...prev, data]);
            setNewMessage('');
            setFile(null);
            
            socket.emit('stopTyping', { receiverId: selectedUser._id });
        } catch (err) { toast.error('Failed to send'); }
    };

    // 5. Handle Typing Input
    const handleInputChange = (e) => {
        setNewMessage(e.target.value);

        if (!socket || !selectedUser) return;

        if (!isTyping) {
            setIsTyping(true);
            socket.emit('typing', { receiverId: selectedUser._id });
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            socket.emit('stopTyping', { receiverId: selectedUser._id });
        }, 2000);
    };

    const renderTicks = (msg) => {
        if (msg.sender._id !== user._id) return null;
        if (msg.status === 'sent') return <BsCheck className="text-secondary" title="Sent" />;
        if (msg.status === 'delivered') return <BsCheckAll className="text-secondary" title="Delivered" />;
        if (msg.status === 'seen') return <BsCheckAll className="text-primary" title="Seen" />;
        return <BsCheck className="text-secondary" />;
    };

    return (
        <Row className="chat-page-row h-100">
            <Col md={4} className="chat-sidebar border-end">
                <ListGroup variant="flush">
                    {users.map((u) => (
                        <ListGroup.Item 
                            key={u._id} 
                            action 
                            active={selectedUser?._id === u._id}
                            onClick={() => setSelectedUser(u)}
                        >
                            <div className="d-flex justify-content-between align-items-center">
                                <div>{u.email}</div>
                                <span className={`badge rounded-pill ${onlineUsers.includes(u._id) ? 'bg-success' : 'bg-secondary'}`}>
                                    {onlineUsers.includes(u._id) ? 'Online' : 'Offline'}
                                </span>
                            </div>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            </Col>

            <Col md={8} className="chat-window p-0">
                {selectedUser ? (
                    <Card className="h-100 border-0 rounded-0">
                        <Card.Header className="bg-white border-bottom d-flex align-items-center">
                            <div>
                                <h6 className="mb-0">{selectedUser.email}</h6>
                                <small className="text-success">
                                    {isReceiverTyping ? 'Typing...' : (onlineUsers.includes(selectedUser._id) ? 'Online' : 'Offline')}
                                </small>
                            </div>
                        </Card.Header>

                        <Card.Body className="chat-body overflow-auto" style={{ backgroundColor: '#e5ddd5' }}>
                            {messages.map((msg, idx) => {
                                const isOwn = msg.sender._id === user._id;
                                return (
                                    <div key={idx} className={`d-flex mb-2 ${isOwn ? 'justify-content-end' : 'justify-content-start'}`}>
                                        <div className={`p-2 rounded shadow-sm ${isOwn ? 'bg-success text-white' : 'bg-white'}`} style={{ maxWidth: '70%' }}>
                                            
                                            {msg.fileUrl && (
                                                <div className="mb-2">
                                                    {msg.fileType === 'image' || msg.fileType === 'video' ? (
                                                        <img src={`http://localhost:5001${msg.fileUrl}`} alt="attachment" className="img-fluid rounded" />
                                                    ) : (
                                                        <a href={`http://localhost:5001${msg.fileUrl}`} target="_blank" rel="noreferrer" className="text-decoration-none text-reset">
                                                            📄 Attachment
                                                        </a>
                                                    )}
                                                </div>
                                            )}

                                            {msg.content && <p className="mb-1">{msg.content}</p>}
                                            
                                            <div className={`d-flex align-items-center justify-content-end small ${isOwn ? 'text-white-50' : 'text-muted'}`}>
                                                <span className="me-1">{format(new Date(msg.createdAt), 'HH:mm')}</span>
                                                {isOwn && <span className="fs-5 lh-1">{renderTicks(msg)}</span>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </Card.Body>

                        <Card.Footer className="bg-white border-top">
                            {file && (
                                <div className="mb-2 p-2 bg-light border rounded position-relative">
                                    <small>Selected: {file.name}</small>
                                    <Button variant="close" size="sm" className="position-absolute top-0 end-0" onClick={() => setFile(null)} />
                                </div>
                            )}
                            <Form onSubmit={handleSubmit} className="d-flex align-items-center">
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    style={{ display: 'none' }} 
                                    onChange={(e) => setFile(e.target.files[0])} 
                                />
                                <Button variant="light" className="me-2 text-secondary" onClick={() => fileInputRef.current.click()}>
                                    <BsPaperclip size={20} />
                                </Button>

                                <Form.Control
                                    type="text"
                                    placeholder="Type a message..."
                                    value={newMessage}
                                    onChange={handleInputChange}
                                    className="rounded-pill border-0 bg-light me-2"
                                />
                                <Button type="submit" variant="success" className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                    {/* Send Icon (SVG) */}
                                    <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
                                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
                                    </svg>
                                </Button>
                            </Form>
                        </Card.Footer>
                    </Card>
                ) : (
                    <div className="d-flex h-100 justify-content-center align-items-center text-muted">Select a chat to start messaging</div>
                )}
            </Col>
        </Row>
    );
};

export default ChatPage;