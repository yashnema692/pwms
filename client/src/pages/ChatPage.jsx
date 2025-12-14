import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Row, Col, ListGroup, Form, Button, Card, Dropdown, Modal } from 'react-bootstrap';
import { format } from 'date-fns';
import { useSocket } from '../context/SocketContext';
import { toast } from 'react-toastify';
import { 
    BsCheck, 
    BsCheckAll, 
    BsPaperclip, 
    BsThreeDotsVertical, 
    BsPencil, 
    BsTrash 
} from 'react-icons/bs';

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
    
    // --- NEW STATE FOR EDITING ---
    const [showEditModal, setShowEditModal] = useState(false);
    const [msgToEdit, setMsgToEdit] = useState(null);
    const [editContent, setEditContent] = useState('');

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

    // 2. Load Chat & Mark as Seen
    useEffect(() => {
        if (selectedUser) {
            setChattingWith(selectedUser._id);
            const fetchMessages = async () => {
                try {
                    const { data } = await api.get(`/api/messages/${selectedUser._id}`);
                    setMessages(data);
                    
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

    // 3. Socket Listeners
    useEffect(() => {
        if (!socket) return;

        // A. Incoming Message
        const handleNewMessage = (message) => {
            if (selectedUser && message.sender._id === selectedUser._id) {
                setMessages((prev) => [...prev, message]);
                api.put('/api/messages/status', {
                    conversationId: message.conversationId,
                    status: 'seen'
                });
            }
        };

        // B. Status Updates
        const handleStatusUpdate = ({ status, updatedBy }) => {
            if (selectedUser && updatedBy === selectedUser._id) {
                setMessages((prev) => 
                    prev.map((msg) => {
                        if (msg.sender._id === user._id && msg.status !== 'seen') {
                            return { ...msg, status: status };
                        }
                        return msg;
                    })
                );
            }
        };

        // C. Typing
        const handleTyping = ({ senderId }) => {
            if (selectedUser && senderId === selectedUser._id) setIsReceiverTyping(true);
        };
        const handleStopTyping = ({ senderId }) => {
            if (selectedUser && senderId === selectedUser._id) setIsReceiverTyping(false);
        };

        // D. Handle Message Deletion (NEW)
        const handleMessageDeleted = ({ messageId }) => {
            setMessages((prev) => prev.map(msg => 
                msg._id === messageId 
                ? { ...msg, isDeleted: true, content: "This message was deleted", fileUrl: "" } 
                : msg
            ));
        };

        // E. Handle Message Edit (NEW)
        const handleMessageEdited = ({ messageId, newContent }) => {
            setMessages((prev) => prev.map(msg => 
                msg._id === messageId 
                ? { ...msg, isEdited: true, content: newContent } 
                : msg
            ));
        };

        socket.on('newMessage', handleNewMessage);
        socket.on('messageStatusUpdate', handleStatusUpdate);
        socket.on('userTyping', handleTyping);
        socket.on('userStoppedTyping', handleStopTyping);
        socket.on('messageDeleted', handleMessageDeleted); // Listen
        socket.on('messageEdited', handleMessageEdited);   // Listen

        return () => {
            socket.off('newMessage', handleNewMessage);
            socket.off('messageStatusUpdate', handleStatusUpdate);
            socket.off('userTyping', handleTyping);
            socket.off('userStoppedTyping', handleStopTyping);
            socket.off('messageDeleted', handleMessageDeleted);
            socket.off('messageEdited', handleMessageEdited);
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

    // 5. Typing Input Handler
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

    // --- NEW: EDIT/DELETE HANDLERS ---
    
    // Check if message is within 1 hour limit (3600000 ms)
    const isWithinTimeLimit = (createdAt) => {
        return (new Date() - new Date(createdAt)) < 3600000;
    };

    const handleDeleteMessage = async (msgId) => {
        if (!window.confirm("Delete this message for everyone?")) return;
        try {
            await api.delete(`/api/messages/${msgId}`);
            // Optimistic update
            setMessages(prev => prev.map(m => m._id === msgId ? { ...m, isDeleted: true, content: "This message was deleted", fileUrl: "" } : m));
            toast.success("Message deleted");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete");
        }
    };

    const openEditModal = (msg) => {
        setMsgToEdit(msg);
        setEditContent(msg.content);
        setShowEditModal(true);
    };

    const handleSaveEdit = async () => {
        if (!msgToEdit) return;
        try {
            await api.put(`/api/messages/${msgToEdit._id}`, { newContent: editContent });
            // Optimistic update
            setMessages(prev => prev.map(m => m._id === msgToEdit._id ? { ...m, isEdited: true, content: editContent } : m));
            setShowEditModal(false);
            toast.success("Message edited");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to edit");
        }
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
            {/* Sidebar */}
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

            {/* Chat Window */}
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
                                const canEdit = isOwn && !msg.isDeleted && isWithinTimeLimit(msg.createdAt);

                                return (
                                    <div key={idx} className={`d-flex mb-2 ${isOwn ? 'justify-content-end' : 'justify-content-start'}`}>
                                        <div 
                                            className={`p-2 rounded shadow-sm position-relative ${isOwn ? 'bg-success text-white' : 'bg-white'}`} 
                                            style={{ maxWidth: '70%', minWidth: '120px' }}
                                        >
                                            
                                            {/* CONTENT LOGIC */}
                                            {msg.isDeleted ? (
                                                <div className="fst-italic opacity-75">
                                                    <BsTrash className="me-1" size={12}/> This message was deleted
                                                </div>
                                            ) : (
                                                <>
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
                                                    <p className="mb-1">{msg.content}</p>
                                                </>
                                            )}

                                            {/* FOOTER INFO */}
                                            <div className={`d-flex align-items-center justify-content-end small ${isOwn ? 'text-white-50' : 'text-muted'}`}>
                                                {msg.isEdited && !msg.isDeleted && (
                                                    <span className="me-2 fst-italic" style={{fontSize: '0.75rem'}}>Edited</span>
                                                )}
                                                <span className="me-1">{format(new Date(msg.createdAt), 'HH:mm')}</span>
                                                {isOwn && <span className="fs-5 lh-1">{renderTicks(msg)}</span>}
                                            </div>

                                            {/* DROPDOWN MENU (Only for own messages, not deleted, within time limit) */}
                                            {canEdit && (
                                                <div className="position-absolute top-0 end-0 m-1">
                                                    <Dropdown align="end">
                                                        <Dropdown.Toggle 
                                                            as="div" 
                                                            className="px-1"
                                                            style={{ cursor: 'pointer', opacity: 0.7 }}
                                                        >
                                                            <BsThreeDotsVertical size={14} color={isOwn ? 'white' : 'black'} />
                                                        </Dropdown.Toggle>

                                                        <Dropdown.Menu size="sm">
                                                            <Dropdown.Item onClick={() => openEditModal(msg)}>
                                                                <BsPencil className="me-2"/> Edit
                                                            </Dropdown.Item>
                                                            <Dropdown.Item onClick={() => handleDeleteMessage(msg._id)} className="text-danger">
                                                                <BsTrash className="me-2"/> Delete
                                                            </Dropdown.Item>
                                                        </Dropdown.Menu>
                                                    </Dropdown>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </Card.Body>

                        {/* Input Footer */}
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

            {/* EDIT MODAL */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Message</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Control 
                        as="textarea"
                        rows={3}
                        value={editContent} 
                        onChange={(e) => setEditContent(e.target.value)} 
                    />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleSaveEdit}>Save Changes</Button>
                </Modal.Footer>
            </Modal>
        </Row>
    );
};

export default ChatPage;