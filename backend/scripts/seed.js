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
    // We do NOT clear users here to prevent logging out developer accounts,
    // but we will reset component assignments just in case.
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
    const rootModules = {};

    for (const def of rootModulesDefs) {
      const module = new Component({
        name: def.name,
        type: 'Module',
        category: def.category,
        parent: null
      });
      await module.save();
      rootModules[def.name] = module;
    }
    console.log('Root Modules seeded successfully.');

    // Seed Sub-modules under Signal Processing Unit
    console.log('Seeding sub-modules under Signal Processing Unit...');
    const signalProcessingUnit = rootModules['Signal Processing Unit'];

    const adc = new Component({
      name: 'Analog-to-Digital Converter (ADC)',
      type: 'Sub-module',
      category: 'Signal Processing Components',
      parent: signalProcessingUnit._id
    });
    await adc.save();

    const dsp = new Component({
      name: 'Digital Signal Processor (DSP)',
      type: 'Sub-module',
      category: 'Signal Processing Components',
      parent: signalProcessingUnit._id
    });
    await dsp.save();

    const clutterFilters = new Component({
      name: 'Clutter Filters',
      type: 'Sub-module',
      category: 'Signal Processing Components',
      parent: signalProcessingUnit._id
    });
    await clutterFilters.save();

    // Seed Components under Digital Signal Processor (DSP)
    console.log('Seeding components under Digital Signal Processor (DSP)...');
    
    const fftModules = new Component({
      name: 'FFT Modules',
      type: 'Component',
      category: 'Software Components',
      parent: dsp._id
    });
    await fftModules.save();

    const dopplerFilter = new Component({
      name: 'Doppler Filter',
      type: 'Component',
      category: 'Signal Processing Components',
      parent: dsp._id
    });
    await dopplerFilter.save();

    const memory = new Component({
      name: 'Memory',
      type: 'Component',
      category: 'Storage Components',
      parent: dsp._id
    });
    await memory.save();

    const ioInterfaces = new Component({
      name: 'I/O Interfaces',
      type: 'Component',
      category: 'Control Components',
      parent: dsp._id
    });
    await ioInterfaces.save();

    // Let's establish some connections for BFS test
    console.log('Connecting components for BFS traversal test...');
    
    // Connect FFT Modules and Doppler Filter
    fftModules.connectedComponents.push(dopplerFilter._id);
    dopplerFilter.connectedComponents.push(fftModules._id);
    await fftModules.save();
    await dopplerFilter.save();

    // Connect DSP and Clutter Filters
    dsp.connectedComponents.push(clutterFilters._id);
    clutterFilters.connectedComponents.push(dsp._id);
    await dsp.save();
    await clutterFilters.save();

    console.log('Database Seeding Completed Successfully! 🎉');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
};

seedData();
