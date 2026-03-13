const User = require('../models/User');
const { generateToken, hashPassword, comparePassword } = require('../utils/securityHelper');
const sendEmail = require('../utils/emailService');
const crypto = require('crypto');

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

// @desc    Forgot Password
// @route   POST /api/auth/forgotpassword
// @access  Public
const forgotPassword = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            return res.status(404).json({ message: "There is no user with that email" });
        }

        // Get reset token
        const resetToken = user.getResetPasswordToken();

        await user.save({ validateBeforeSave: false });

        // Create reset url
        // In local dev, it would be http://localhost:5173/resetpassword/${resetToken}
        // Using a relative URL or configured BASE_URL
        const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
        const resetUrl = `${baseUrl}/resetpassword/${resetToken}`;

        const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a put request to: \n\n ${resetUrl}`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password reset token',
                message,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e4e8; rounded: 8px;">
                        <h2 style="color: #2563eb;">Reset Your Password</h2>
                        <p>You requested a password reset for your Campus Placement Simulator account.</p>
                        <p>Click the button below to reset your password. This link will expire in 10 minutes.</p>
                        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">Reset Password</a>
                        <p style="color: #64748b; font-size: 14px;">If you did not request this, please ignore this email.</p>
                    </div>
                `
            });

            res.status(200).json({ success: true, data: "Email sent" });
        } catch (err) {
            console.error(err);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;

            await user.save({ validateBeforeSave: false });

            return res.status(500).json({ message: "Email could not be sent" });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Reset Password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
const resetPassword = async (req, res) => {
    try {
        // Get hashed token
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.resettoken)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        // Set new password
        user.password = await hashPassword(req.body.password);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({
            success: true,
            token: generateToken(user._id, user.role),
            role: user.role
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    adminLogin,
    getProfile,
    updateProfile,
    forgotPassword,
    resetPassword
};
