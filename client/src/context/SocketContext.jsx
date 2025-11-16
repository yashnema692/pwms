import React, { createContext, useContext, useState, useEffect } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../api'; // Use centralized api
import { toast } from 'react-toastify';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0); // Total count
    const [individualUnreadCounts, setIndividualUnreadCounts] = useState({}); // For badges
    const [chattingWith, setChattingWith] = useState(null); // Knows who you are talking to
    const { user } = useAuth();

    // Use the backendURL from the api.js file
    const backendURL = api.defaults.baseURL;
    
    // Fetch total unread count
    const fetchUnreadCount = async () => {
        if (!user?.token) return;
        try {
            const { data } = await api.get('/api/messages/unread/count');
            setUnreadCount(data.count);
        } catch (err) {
            console.error('Failed to fetch unread count', err);
        }
    };

    // Fetch individual unread counts
    const fetchIndividualUnreadCounts = async () => {
        if (!user?.token) return;
        try {
            const { data } = await api.get('/api/messages/unread/counts-by-sender');
            setIndividualUnreadCounts(data);
        } catch (err) {
            console.error('Failed to fetch individual counts', err);
        }
    };

    useEffect(() => {
        if (user) {
            // Fetch initial counts on login
            fetchUnreadCount(); 
            fetchIndividualUnreadCounts();

            const newSocket = io(backendURL, {
                query: { userId: user._id },
            });
            setSocket(newSocket);

            newSocket.on('onlineUsers', (users) => setOnlineUsers(users));

            // Listen for new message notifications
            newSocket.on('messageNotification', (notification) => {
                
                // If the new message is from the person we're actively chatting with,
                // don't show a toast or increment the counter.
                if (chattingWith === notification.from) {
                    return; 
                }

                // Otherwise, increment counts and show toast
                setUnreadCount(prevCount => prevCount + 1);
                setIndividualUnreadCounts(prevCounts => ({
                    ...prevCounts,
                    [notification.from]: (prevCounts[notification.from] || 0) + 1
                }));
                toast.info(`New message from ${notification.fromEmail}`);
            });

            return () => newSocket.close();
        } else {
            if (socket) {
                socket.close();
                setSocket(null);
            }
        }
    }, [user, backendURL, chattingWith]); // Add chattingWith dependency

    // OPTIMISTIC UPDATE: Mark as read instantly
    const markAsRead = async (senderId) => {
        if (!user?.token) return;

        // 1. Check if there's anything to update
        const countToSubtract = individualUnreadCounts[senderId] || 0;
        if (countToSubtract === 0) {
            return; // Nothing to mark as read
        }
        
        // 2. Update state immediately (This is the "instant" part)
        setUnreadCount(prev => Math.max(0, prev - countToSubtract));
        setIndividualUnreadCounts(prev => {
            const newCounts = { ...prev };
            delete newCounts[senderId]; // Remove the entry for this sender
            return newCounts;
        });

        // 3. Send API request in the background
        try {
            await api.put(`/api/messages/read/${senderId}`);
        } catch (err) {
            console.error('Failed to mark messages as read on server', err);
        }
    };

    return (
        <SocketContext.Provider value={{ 
            socket, 
            onlineUsers, 
            unreadCount, 
            markAsRead, 
            individualUnreadCounts,
            setChattingWith // Expose the setter
        }}>
            {children}
        </SocketContext.Provider>
    );
};