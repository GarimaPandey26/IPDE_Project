require('dotenv').config();
const mongoose = require('mongoose');
const Component = require('../models/Component');
const Data = require('../models/Data');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ipde';

const seedData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    // Clear existing data
    console.log('Clearing database tables...');
    await Component.deleteMany({});
    await Data.deleteMany({});
    // Reset component assignments for users
    await User.updateMany({}, { assignedComponent: null });
    console.log('Database tables cleared.');

    // 14 Root Modules definitions
    const rootModulesDefs = [
      { name: 'Radar Antenna System', category: 'RF & Microwave Components' },
      { name: 'Receiver Sub-system', category: 'RF & Microwave Components' },
      { name: 'Signal Processing Unit', category: 'Signal Processing Components' },
      { name: 'Transmitter Sub-system', category: 'Power Components' },
      { name: 'Data Link and Communications Sub-systems', category: 'Communication Components' },
      { name: 'Communication and Integration System', category: 'Communication Components' },
      { name: 'Power Supply Sub-systems', category: 'Power Components' },
      { name: 'Environmental Protection', category: 'Environmental Components' },
      { name: 'Mechanical / Structural Support System', category: 'Mechanical Components' },
      { name: 'Data Management and Storage System', category: 'Storage Components' },
      { name: 'Cooling System', category: 'Cooling Components' },
      { name: 'Safety and Security System', category: 'Security Components' },
      { name: 'Display and Control Unit', category: 'Control Components' },
      { name: 'Maintenance and Diagnostics System', category: 'Maintenance Components' }
    ];

    console.log('Seeding 14 Root Modules...');
    for (const def of rootModulesDefs) {
      const module = new Component({
        name: def.name,
        type: 'Module', // Since they are the root modules
        category: def.category,
        parent: null
      });
      await module.save();
    }

    console.log('Database Seeding Completed Successfully with exactly 14 modules! 🎉');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
};

seedData();
