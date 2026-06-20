require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Component = require('../models/Component');
const Data = require('../models/Data');
const User = require('../models/User');
const Dependency = require('../models/Dependency');
const Notification = require('../models/Notification');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ipde';

const seedData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    // Clear existing data
    console.log('Clearing database collections...');
    await Component.deleteMany({});
    await Data.deleteMany({});
    await User.deleteMany({});
    await Dependency.deleteMany({});
    await Notification.deleteMany({});
    console.log('Database collections cleared.');

    // Component tree definition
    const hierarchy = [
      {
        name: 'Radar Antenna System',
        type: 'Module',
        category: 'RF & Microwave Components',
        children: [
          { name: 'Antenna Array', type: 'Sub-module', category: 'RF & Microwave Components' },
          { name: 'Waveguide', type: 'Sub-module', category: 'RF & Microwave Components' },
          { name: 'Beam Steering Unit', type: 'Sub-module', category: 'RF & Microwave Components' },
          { name: 'Rotating Mechanism', type: 'Sub-module', category: 'RF & Microwave Components' }
        ]
      },
      {
        name: 'Receiver Sub-system',
        type: 'Module',
        category: 'RF & Microwave Components',
        children: [
          { name: 'RF Receiver', type: 'Sub-module', category: 'RF & Microwave Components' },
          { name: 'Amplifier', type: 'Sub-module', category: 'RF & Microwave Components' },
          { name: 'Mixer', type: 'Sub-module', category: 'RF & Microwave Components' },
          { name: 'Signal Conditioning Unit', type: 'Sub-module', category: 'RF & Microwave Components' }
        ]
      },
      {
        name: 'Signal Processing Unit',
        type: 'Module',
        category: 'Signal Processing Components',
        children: [
          {
            name: '003-001 ADC',
            type: 'Sub-module',
            category: 'Signal Processing Components',
            children: [
              { name: 'Analog-to-Digital Converter', type: 'Component', category: 'Signal Processing Components' }
            ]
          },
          {
            name: '003-002 DSP',
            type: 'Sub-module',
            category: 'Signal Processing Components',
            children: [
              { name: 'FFT Module', type: 'Component', category: 'Signal Processing Components' },
              { name: 'Doppler Filter', type: 'Component', category: 'Signal Processing Components' },
              { name: 'Memory', type: 'Component', category: 'Signal Processing Components' },
              { name: 'I/O Interface', type: 'Component', category: 'Signal Processing Components' }
            ]
          },
          { name: '003-003 Clutter Filters', type: 'Sub-module', category: 'Signal Processing Components' }
        ]
      },
      {
        name: 'Transmitter Sub-system',
        type: 'Module',
        category: 'Power Components',
        children: [
          { name: 'Power Amplifier', type: 'Sub-module', category: 'Power Components' },
          { name: 'Exciter', type: 'Sub-module', category: 'Power Components' },
          { name: 'Frequency Generator', type: 'Sub-module', category: 'Power Components' }
        ]
      },
      {
        name: 'Data Link and Communication System',
        type: 'Module',
        category: 'Communication Components',
        children: [
          { name: 'Communication Interface', type: 'Sub-module', category: 'Communication Components' },
          { name: 'Network Controller', type: 'Sub-module', category: 'Communication Components' },
          { name: 'Ethernet Module', type: 'Sub-module', category: 'Communication Components' }
        ]
      },
      {
        name: 'Communication and Integration System',
        type: 'Module',
        category: 'Communication Components',
        children: [
          { name: 'Interface Controller', type: 'Sub-module', category: 'Communication Components' },
          { name: 'Integration Controller', type: 'Sub-module', category: 'Communication Components' },
          { name: 'System Bus', type: 'Sub-module', category: 'Communication Components' }
        ]
      },
      {
        name: 'Power Supply System',
        type: 'Module',
        category: 'Power Components',
        children: [
          { name: 'SMPS', type: 'Sub-module', category: 'Power Components' },
          { name: 'Battery Backup', type: 'Sub-module', category: 'Power Components' },
          { name: 'Voltage Regulator', type: 'Sub-module', category: 'Power Components' }
        ]
      },
      {
        name: 'Environmental Protection',
        type: 'Module',
        category: 'Environmental Components',
        children: [
          { name: 'Temperature Sensor', type: 'Sub-module', category: 'Environmental Components' },
          { name: 'Humidity Sensor', type: 'Sub-module', category: 'Environmental Components' },
          { name: 'Protective Housing', type: 'Sub-module', category: 'Environmental Components' }
        ]
      },
      {
        name: 'Mechanical / Structural Support System',
        type: 'Module',
        category: 'Mechanical Components',
        children: [
          { name: 'Mounting Structure', type: 'Sub-module', category: 'Mechanical Components' },
          { name: 'Support Frame', type: 'Sub-module', category: 'Mechanical Components' },
          { name: 'Structural Assembly', type: 'Sub-module', category: 'Mechanical Components' }
        ]
      },
      {
        name: 'Data Management and Storage System',
        type: 'Module',
        category: 'Storage Components',
        children: [
          { name: 'Database Storage', type: 'Sub-module', category: 'Storage Components' },
          { name: 'Logging Unit', type: 'Sub-module', category: 'Storage Components' },
          { name: 'Backup Unit', type: 'Sub-module', category: 'Storage Components' }
        ]
      },
      {
        name: 'Cooling System',
        type: 'Module',
        category: 'Cooling Components',
        children: [
          { name: 'Fan Unit', type: 'Sub-module', category: 'Cooling Components' },
          { name: 'Heat Sink', type: 'Sub-module', category: 'Cooling Components' },
          { name: 'Cooling Controller', type: 'Sub-module', category: 'Cooling Components' }
        ]
      },
      {
        name: 'Safety and Security System',
        type: 'Module',
        category: 'Security Components',
        children: [
          { name: 'Alarm System', type: 'Sub-module', category: 'Security Components' },
          { name: 'Security Controller', type: 'Sub-module', category: 'Security Components' },
          { name: 'Access Control', type: 'Sub-module', category: 'Security Components' }
        ]
      },
      {
        name: 'Display and Control Unit',
        type: 'Module',
        category: 'Control Components',
        children: [
          { name: 'Operator Console', type: 'Sub-module', category: 'Control Components' },
          { name: 'Display Screen', type: 'Sub-module', category: 'Control Components' },
          { name: 'Control Interface', type: 'Sub-module', category: 'Control Components' }
        ]
      },
      {
        name: 'Maintenance and Diagnostics System',
        type: 'Module',
        category: 'Maintenance Components',
        children: [
          { name: 'Fault Detection', type: 'Sub-module', category: 'Maintenance Components' },
          { name: 'Diagnostic Software', type: 'Sub-module', category: 'Maintenance Components' },
          { name: 'Maintenance Logs', type: 'Sub-module', category: 'Maintenance Components' }
        ]
      }
    ];

    console.log('Seeding Component hierarchy recursively...');
    const compMap = {}; // name -> _id

    const seedNode = async (nodeDef, parentId = null) => {
      const component = new Component({
        name: nodeDef.name,
        type: nodeDef.type,
        category: nodeDef.category,
        parent: parentId,
        status: 'Active'
      });
      await component.save();
      compMap[nodeDef.name] = component._id;

      if (nodeDef.children && nodeDef.children.length > 0) {
        for (const childDef of nodeDef.children) {
          await seedNode(childDef, component._id);
        }
      }
    };

    for (const rootDef of hierarchy) {
      await seedNode(rootDef, null);
    }
    console.log('Components successfully seeded.');

    // Seed dependencies exactly matching user's custom layout
    console.log('Seeding Dependency table...');
    const defaultDeps = [
      // 1. Radar Antenna System
      { source: 'Radar Antenna System', dependent: 'Receiver Sub-system', level: 'High' },
      { source: 'Radar Antenna System', dependent: 'Signal Processing Unit', level: 'High' },
      { source: 'Radar Antenna System', dependent: 'Transmitter Sub-system', level: 'High' },
      
      // 2. Receiver Sub-system
      { source: 'Receiver Sub-system', dependent: '003-001 ADC', level: 'High' },
      { source: 'Receiver Sub-system', dependent: '003-002 DSP', level: 'High' },
      { source: 'Receiver Sub-system', dependent: 'Data Link and Communication System', level: 'Medium' },
      { source: 'Receiver Sub-system', dependent: 'Display and Control Unit', level: 'Medium' },
      
      // 3. Analog-to-Digital Converter
      { source: '003-001 ADC', dependent: '003-002 DSP', level: 'High' },
      { source: '003-001 ADC', dependent: 'FFT Module', level: 'High' },
      { source: '003-001 ADC', dependent: 'Memory', level: 'Medium' },
      
      // 4. Digital Signal Processor
      { source: '003-002 DSP', dependent: 'FFT Module', level: 'High' },
      { source: '003-002 DSP', dependent: 'Doppler Filter', level: 'High' },
      { source: '003-002 DSP', dependent: 'Memory', level: 'High' },
      { source: '003-002 DSP', dependent: 'I/O Interface', level: 'Medium' },
      { source: '003-002 DSP', dependent: 'Display and Control Unit', level: 'High' },
      
      // 5. FFT Module
      { source: 'FFT Module', dependent: 'Doppler Filter', level: 'Medium' },
      { source: 'FFT Module', dependent: 'Memory', level: 'Medium' },
      
      // 6. Doppler Filter
      { source: 'Doppler Filter', dependent: '003-002 DSP', level: 'Medium' },
      { source: 'Doppler Filter', dependent: 'Display and Control Unit', level: 'Medium' },
      
      // 7. Memory
      { source: 'Memory', dependent: '003-002 DSP', level: 'High' },
      { source: 'Memory', dependent: 'Data Management and Storage System', level: 'Medium' },
      
      // 8. I/O Interface
      { source: 'I/O Interface', dependent: 'Data Link and Communication System', level: 'Medium' },
      { source: 'I/O Interface', dependent: 'Display and Control Unit', level: 'Medium' },
      
      // 9. Clutter Filters
      { source: '003-003 Clutter Filters', dependent: '003-002 DSP', level: 'Medium' },
      { source: '003-003 Clutter Filters', dependent: 'Display and Control Unit', level: 'Medium' },
      
      // 10. Transmitter Sub-system
      { source: 'Transmitter Sub-system', dependent: 'Radar Antenna System', level: 'High' },
      { source: 'Transmitter Sub-system', dependent: 'Receiver Sub-system', level: 'High' },
      { source: 'Transmitter Sub-system', dependent: 'Power Supply System', level: 'High' },
      
      // 11. Data Link and Communication System
      { source: 'Data Link and Communication System', dependent: 'Communication and Integration System', level: 'High' },
      { source: 'Data Link and Communication System', dependent: 'Display and Control Unit', level: 'Medium' },
      { source: 'Data Link and Communication System', dependent: 'Data Management and Storage System', level: 'Medium' },
      
      // 12. Communication and Integration System
      { source: 'Communication and Integration System', dependent: 'Radar Antenna System', level: 'High' },
      { source: 'Communication and Integration System', dependent: 'Receiver Sub-system', level: 'High' },
      { source: 'Communication and Integration System', dependent: 'Signal Processing Unit', level: 'High' },
      { source: 'Communication and Integration System', dependent: 'Display and Control Unit', level: 'High' },
      
      // 14. Environmental Protection
      { source: 'Environmental Protection', dependent: 'Cooling System', level: 'High' },
      { source: 'Environmental Protection', dependent: 'Mechanical / Structural Support System', level: 'Medium' },
      
      // 15. Mechanical Support System
      { source: 'Mechanical / Structural Support System', dependent: 'Radar Antenna System', level: 'High' },
      { source: 'Mechanical / Structural Support System', dependent: 'Transmitter Sub-system', level: 'High' },
      { source: 'Mechanical / Structural Support System', dependent: 'Cooling System', level: 'Medium' },
      
      // 16. Data Management and Storage System
      { source: 'Data Management and Storage System', dependent: 'Display and Control Unit', level: 'Medium' },
      { source: 'Data Management and Storage System', dependent: 'Maintenance and Diagnostics System', level: 'Medium' },
      
      // 17. Cooling System
      { source: 'Cooling System', dependent: 'Power Supply System', level: 'High' },
      { source: 'Cooling System', dependent: 'Transmitter Sub-system', level: 'High' },
      { source: 'Cooling System', dependent: 'Signal Processing Unit', level: 'High' },
      
      // 18. Safety and Security System
      { source: 'Safety and Security System', dependent: 'Communication and Integration System', level: 'High' },
      { source: 'Safety and Security System', dependent: 'Display and Control Unit', level: 'Medium' },
      
      // 19. Display and Control Unit
      { source: 'Display and Control Unit', dependent: 'Maintenance and Diagnostics System', level: 'Medium' }
    ];

    for (const d of defaultDeps) {
      const sourceId = compMap[d.source];
      const depId = compMap[d.dependent];
      if (sourceId && depId) {
        const dependency = new Dependency({
          sourceComponent: sourceId,
          dependentComponent: depId,
          impactLevel: d.level
        });
        await dependency.save();
      } else {
        console.warn(`Could not seed dependency from "${d.source}" to "${d.dependent}" - component mapping missing.`);
      }
    }

    // 13. Power Supply System depends on All Components
    const powerSupplyId = compMap['Power Supply System'];
    if (powerSupplyId) {
      for (const rootDef of hierarchy) {
        if (rootDef.name !== 'Power Supply System') {
          const depId = compMap[rootDef.name];
          if (depId) {
            const dependency = new Dependency({
              sourceComponent: powerSupplyId,
              dependentComponent: depId,
              impactLevel: 'High'
            });
            await dependency.save();
          }
        }
      }
    }
    console.log('Dependencies successfully seeded.');

    // Seed standard users (Assigned strictly to the 14 main Modules)
    console.log('Seeding default users...');
    const hashedPwd = await bcrypt.hash('admin123', 10);
    const hashedMfgPwd = await bcrypt.hash('mfg123', 10);
    const hashedViewerPwd = await bcrypt.hash('viewer123', 10);

    // Admin
    const admin = new User({
      name: 'System Admin',
      email: 'admin@ipde.com',
      password: hashedPwd,
      role: 'Admin',
      assignedComponent: null
    });
    await admin.save();

    // Viewer
    const viewer = new User({
      name: 'Safety Inspector (Viewer)',
      email: 'viewer@ipde.com',
      password: hashedViewerPwd,
      role: 'Viewer',
      assignedComponent: null
    });
    await viewer.save();

    // Manufacturers (Assigned only to root Modules)
    const mfgAntenna = new User({
      name: 'Antenna Specialist',
      email: 'mfg.antenna@ipde.com',
      password: hashedMfgPwd,
      role: 'Manufacturer',
      assignedComponent: compMap['Radar Antenna System']
    });
    await mfgAntenna.save();

    const mfgReceiver = new User({
      name: 'RF Engineer',
      email: 'mfg.receiver@ipde.com',
      password: hashedMfgPwd,
      role: 'Manufacturer',
      assignedComponent: compMap['Receiver Sub-system']
    });
    await mfgReceiver.save();

    const mfgSignal = new User({
      name: 'Signal Processing Lead',
      email: 'mfg.signal@ipde.com',
      password: hashedMfgPwd,
      role: 'Manufacturer',
      assignedComponent: compMap['Signal Processing Unit']
    });
    await mfgSignal.save();

    const mfgTransmitter = new User({
      name: 'Power & Transmitter Eng',
      email: 'mfg.transmitter@ipde.com',
      password: hashedMfgPwd,
      role: 'Manufacturer',
      assignedComponent: compMap['Transmitter Sub-system']
    });
    await mfgTransmitter.save();

    console.log('Database Seeding Completed Successfully! 🎉');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
};

seedData();
