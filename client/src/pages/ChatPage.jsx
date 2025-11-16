import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import {
    Row,
    Col,
    ListGroup,
    Form,
    Button,
    Card,
    Alert,
    Badge
} from 'react-bootstrap';
import { format } from 'date-fns';
import { useSocket } from '../context/SocketContext';
import { toast } from 'react-toastify';

const ChatPage = () => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [error, setError] = useState('');
    const { user } = useAuth();

    const {
        socket,
        onlineUsers,
        markAsRead,
        individualUnreadCounts,
        setChattingWith
    } = useSocket();

    const messagesEndRef = useRef(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const { data } = await api.get('/api/users');
                setUsers(data.filter((u) => u._id !== user._id));
            } catch (err) {
                setError('Failed to fetch users. You may not have permission.');
                console.error(err);
            }
        };
        fetchUsers();
    }, [user._id]);

    useEffect(() => {
        if (selectedUser) {
            setChattingWith(selectedUser._id);
            markAsRead(selectedUser._id);

            const fetchMessages = async () => {
                try {
                    const { data } = await api.get(
                        `/api/messages/${selectedUser._id}`
                    );
                    setMessages(data);
                } catch (err) {
                    setError('Failed to fetch messages.');
                }
            };
            fetchMessages();
        }

        return () => {
            setChattingWith(null);
        };
    }, [selectedUser, markAsRead, setChattingWith]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (!socket) return;
        const handleNewMessage = (message) => {
            if (message.sender === selectedUser?._id) {
                setMessages((prev) => [...prev, message]);
                markAsRead(selectedUser._id);
            } else if (message.sender === user._id) {
                setMessages((prev) => [...prev, message]);
            }
        };
        socket.on('newMessage', handleNewMessage);
        return () => socket.off('newMessage', handleNewMessage);
    }, [socket, selectedUser, user, markAsRead]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser) return;
        try {
            const payload = { content: newMessage };
            const { data } = await api.post(
                `/api/messages/${selectedUser._id}`,
                payload
            );
            setMessages((prev) => [...prev, data]);
            setNewMessage('');
        } catch (err) {
            setError('Failed to send message.');
        }
    };

    const handleSelectUser = (u) => {
        setSelectedUser(u);
    };

    const handleClearChat = async () => {
        if (!selectedUser) return;
        if (
            !window.confirm(
                `Are you sure you want to delete all messages with ${selectedUser.email}? This cannot be undone.`
            )
        ) {
            return;
        }

        try {
            await api.delete(`/api/messages/clear/${selectedUser._id}`);
            setMessages([]);
            toast.success('Chat history cleared!');
        } catch (err) {
            toast.error('Failed to clear chat history.');
        }
    };

    return (
        <Row className="chat-page-row">
            <Col md={4} className="chat-sidebar">
                <h3 className="mb-3 fs-5">Conversations</h3>
                {error && <Alert variant="danger">{error}</Alert>}
                <ListGroup className="chat-user-list">
                    {users.map((u) => {
                        const count = individualUnreadCounts[u._id] || 0;
                        const isOnline = onlineUsers.includes(u._id);
                        const isActive = selectedUser?._id === u._id;

                        return (
                            <ListGroup.Item
                                key={u._id}
                                action
                                active={isActive}
                                onClick={() => handleSelectUser(u)}
                                className="d-flex justify-content-between align-items-center chat-user-item"
                            >
                                <div className="chat-user-info">
                                    <div className="chat-user-email">{u.email}</div>
                                    {count > 0 && (
                                        <Badge pill bg="danger" className="ms-1">
                                            {count}
                                        </Badge>
                                    )}
                                </div>

                                <span
                                    className={`badge rounded-pill ${
                                        isOnline ? 'bg-success' : 'bg-secondary'
                                    }`}
                                >
                                    {isOnline ? 'Online' : 'Offline'}
                                </span>
                            </ListGroup.Item>
                        );
                    })}
                </ListGroup>
            </Col>

            <Col md={8} className="chat-window">
                {selectedUser ? (
                    <Card className="h-100 d-flex flex-column">
                        <Card.Header className="d-flex justify-content-between align-items-center chat-header">
                            <div>
                                <div className="fw-semibold">
                                    {selectedUser.email}
                                </div>
                                <div className="small text-muted">
                                    Direct messages
                                </div>
                            </div>
                            {user.role === 'ADMIN' && (
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={handleClearChat}
                                >
                                    Clear Chat
                                </Button>
                            )}
                        </Card.Header>

                        <Card.Body className="flex-grow-1 chat-messages-body">
                            {messages.map((msg, index) => {
                                const isOwn = msg.sender._id === user._id;
                                return (
                                    <div
                                        key={msg._id || index}
                                        className={`mb-2 d-flex ${
                                            isOwn
                                                ? 'justify-content-end'
                                                : 'justify-content-start'
                                        }`}
                                    >
                                        <div
                                            className={`chat-bubble ${
                                                isOwn
                                                    ? 'chat-bubble-own'
                                                    : 'chat-bubble-other'
                                            }`}
                                        >
                                            <div className="chat-bubble-header">
                                                <strong>
                                                    {msg.sender.email === user.email
                                                        ? 'You'
                                                        : msg.sender.email}
                                                </strong>
                                            </div>
                                            <p className="mb-1">
                                                {msg.content}
                                            </p>
                                            <small className="chat-bubble-time">
                                                {format(
                                                    new Date(msg.createdAt),
                                                    'HH:mm'
                                                )}
                                            </small>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </Card.Body>

                        <Card.Footer className="chat-input-footer">
                            <Form onSubmit={handleSubmit}>
                                <Row className="g-2">
                                    <Col xs={9} sm={10}>
                                        <Form.Control
                                            type="text"
                                            placeholder="Type a message..."
                                            value={newMessage}
                                            onChange={(e) =>
                                                setNewMessage(e.target.value)
                                            }
                                        />
                                    </Col>
                                    <Col xs={3} sm={2}>
                                        <Button
                                            type="submit"
                                            className="w-100"
                                        >
                                            Send
                                        </Button>
                                    </Col>
                                </Row>
                            </Form>
                        </Card.Footer>
                    </Card>
                ) : (
                    <div className="d-flex justify-content-center align-items-center h-100 text-muted">
                        Select a user to start chatting.
                    </div>
                )}
            </Col>
        </Row>
    );
};

export default ChatPage;
