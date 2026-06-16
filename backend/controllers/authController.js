const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Component = require('../models/Component');

const JWT_SECRET = process.env.JWT_SECRET || 'ipde_secret_key_12345';

// Register User
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, assignedComponentId } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, Email, Password, and Role are required' });
    }

    if (!['Manufacturer', 'Viewer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role selection' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    let assignedComponent = null;

    if (role === 'Manufacturer') {
      if (!assignedComponentId) {
        return res.status(400).json({ error: 'Manufacturers must be assigned to a component' });
      }
      assignedComponent = await Component.findById(assignedComponentId);
      if (!assignedComponent) {
        return res.status(404).json({ error: 'Assigned component not found' });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      assignedComponent: assignedComponent ? assignedComponent._id : null
    });

    await user.save();

    // Create token
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        assignedComponent
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Login User
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and Password are required' });
    }

    const user = await User.findOne({ email }).populate('assignedComponent');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Create token
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        assignedComponent: user.assignedComponent
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Me (Current authenticated user profile)
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('assignedComponent');
    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      assignedComponent: user.assignedComponent
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
