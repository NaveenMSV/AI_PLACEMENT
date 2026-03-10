const User = require('../models/User');
const { generateToken, hashPassword, comparePassword } = require('../utils/securityHelper');

const registerUser = async (req, res) => {
    try {
        const { name, email, password, role, college } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await hashPassword(password);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || 'student',
            college
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id, user.role),
            });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // Security check: Prevent Admin credentials from working in student login
        if (email === 'admin@simulator.com') {
            return res.status(401).json({ message: 'Admin credentials not allowed here.' });
        }

        const user = await User.findOne({ email });

        if (user && (await comparePassword(password, user.password))) {
            // Ensure no role mismatch if provided
            if (role && user.role !== role) {
                return res.status(401).json({ message: `Access denied. Selected role does not match account.` });
            }

            user.lastLogin = Date.now();
            await user.save();

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id, user.role),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (email === 'admin@simulator.com' && password === 'admin123') {
            let user = await User.findOne({ email });
            if (!user) {
                // Auto-seed system admin if not present
                user = await User.create({
                    name: 'System Admin',
                    email: 'admin@simulator.com',
                    password: await hashPassword('admin123'),
                    role: 'admin'
                });
            }

            return res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: 'admin',
                token: generateToken(user._id, 'admin'),
            });
        } else {
            return res.status(401).json({ message: 'Invalid Admin Credentials.' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { name, college } = req.body;
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = name || user.name;
            user.college = college || user.college;
            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                college: updatedUser.college,
                token: generateToken(updatedUser._id, updatedUser.role),
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    adminLogin,
    getProfile,
    updateProfile
};
