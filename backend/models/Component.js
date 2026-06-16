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
    trim: true,
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
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Component', componentSchema);
