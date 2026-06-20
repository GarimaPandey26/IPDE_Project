const mongoose = require('mongoose');

const componentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['Module', 'Sub-module', 'Component'],
    trim: true,
  },
  category: {
    type: String,
    required: true,
    enum: [
      'RF & Microwave Components',
      'Signal Processing Components',
      'Communication Components',
      'Power Components',
      'Mechanical Components',
      'Environmental Components',
      'Cooling Components',
      'Storage Components',
      'Software Components',
      'Control Components',
      'Security Components',
      'Maintenance Components'
    ],
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Component',
    default: null,
  },
  connectedComponents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Component',
    }
  ],
  dataHistory: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Data',
    }
  ],
  status: {
    type: String,
    enum: ['Active', 'Review Required'],
    default: 'Active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Component', componentSchema);

