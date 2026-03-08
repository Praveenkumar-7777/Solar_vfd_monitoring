const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');

const normalizeDeviceId = (value) => (value || '').trim().toUpperCase();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// GET /api/setup-status - Check if first-time setup is required
router.get('/setup-status', async (req, res) => {
  try {
    const usersCount = await User.countDocuments();
    const adminCount = await User.countDocuments({ role: 'admin' });

    const isSetupComplete = usersCount > 0 && adminCount > 0;

    res.json({
      success: true,
      isSetupComplete,
      message: isSetupComplete
        ? 'System is already initialized'
        : 'First-time setup required'
    });
  } catch (error) {
    console.error('Setup status error:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection failed. Check MongoDB Atlas Network Access and credentials.'
    });
  }
});

// POST /api/setup - First-time system initialization (only when no users exist)
router.post('/setup', async (req, res) => {
  try {
    const existingUsersCount = await User.countDocuments();

    if (existingUsersCount > 0) {
      return res.status(403).json({
        success: false,
        message: 'Setup is already completed. Use admin account to create users and admins.'
      });
    }

    const { admin, user } = req.body;

    if (!admin || !admin.name || !admin.email || !admin.password) {
      return res.status(400).json({
        success: false,
        message: 'Admin name, email, and password are required'
      });
    }

    const wantsFirstUser = !!(user && (user.name || user.email || user.password || user.deviceId));

    if (wantsFirstUser && (!user.name || !user.email || !user.password || !user.deviceId)) {
      return res.status(400).json({
        success: false,
        message: 'User name, email, password, and deviceId are required when creating first user'
      });
    }

    const adminUser = new User({
      name: admin.name,
      email: admin.email.toLowerCase(),
      password: admin.password,
      role: 'admin'
    });

    await adminUser.save();

    let createdUser = null;

    if (wantsFirstUser) {
      const normalizedDeviceId = normalizeDeviceId(user.deviceId);

      const firstUser = new User({
        name: user.name,
        email: user.email.toLowerCase(),
        password: user.password,
        role: 'user',
        deviceId: normalizedDeviceId
      });

      await firstUser.save();
      createdUser = {
        id: firstUser._id,
        name: firstUser.name,
        email: firstUser.email,
        role: firstUser.role,
        deviceId: firstUser.deviceId
      };
    }

    res.status(201).json({
      success: true,
      message: 'First-time setup completed successfully',
      admin: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role
      },
      user: createdUser
    });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during first-time setup'
    });
  }
});

// POST /api/login - User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        deviceId: user.deviceId
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// POST /api/create-user - Admin creates a normal user
router.post('/create-user', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, email, password, deviceId } = req.body;
    const normalizedDeviceId = normalizeDeviceId(deviceId);

    // Validate input
    if (!name || !email || !password || !normalizedDeviceId) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and device ID are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // One user should map to one ESP32 device ID.
    const existingDeviceAssignment = await User.findOne({
      role: 'user',
      deviceId: normalizedDeviceId
    });

    if (existingDeviceAssignment) {
      return res.status(409).json({
        success: false,
        message: `Device ID ${normalizedDeviceId} is already assigned to another user`
      });
    }

    // Create new user
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: 'user',
      deviceId: normalizedDeviceId
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        deviceId: newUser.deviceId
      }
    });

  } catch (error) {
    console.error('Create user error:', error);

    if (error && error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during user creation'
    });
  }
});

// POST /api/create-admin - Admin creates another admin
router.post('/create-admin', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Admin with this email already exists'
      });
    }

    const newAdmin = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: 'admin'
    });

    await newAdmin.save();

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      user: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        deviceId: newAdmin.deviceId
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);

    if (error && error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Admin with this email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during admin creation'
    });
  }
});

// GET /api/me - Get current user info
router.get('/me', authenticateToken, async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      deviceId: req.user.deviceId
    }
  });
});

// GET /api/users - Admin gets all users
router.get('/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: users.length,
      users
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
});

module.exports = router;
