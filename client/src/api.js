import axios from 'axios';

// Determine the base URL
// VITE_BACKEND_URL is from your .env.local (Netlify)
// Fallback to localhost for development
const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

const api = axios.create({
    baseURL: baseURL
});

// This is the magic: an "interceptor"
// This function will run before EVERY request
api.interceptors.request.use(
    (config) => {
        // 1. Get the user info from localStorage
        const userInfo = localStorage.getItem('userInfo');
        
        if (userInfo) {
            // 2. Parse it and get the token
            const { token } = JSON.parse(userInfo);
            
            // 3. If a token exists, add it to the Authorization header
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;