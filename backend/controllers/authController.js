import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const generateToken = (id, role) => jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });

export const signupUser = async (req, res) => {
    const { email, password, role } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ email, password, role: role || 'MEMBER' });
    if (user) {
        res.status(201).json({ _id: user._id, email: user.email, role: user.role, token: generateToken(user._id, user.role) });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
        res.json({ _id: user._id, email: user.email, role: user.role, token: generateToken(user._id, user.role) });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};
