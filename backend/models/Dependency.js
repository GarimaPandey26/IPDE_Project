const mongoose = require('mongoose');

const dependencySchema = new mongoose.Schema({
  sourceComponent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Component',
    required: true,
  },
  dependentComponent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Component',
    required: true,
  },
  impactLevel: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Enforce uniqueness of source-dependent pair
dependencySchema.index({ sourceComponent: 1, dependentComponent: 1 }, { unique: true });

module.exports = mongoose.model('Dependency', dependencySchema);
