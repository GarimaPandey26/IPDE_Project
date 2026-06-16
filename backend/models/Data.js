const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
  componentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Component',
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  mimeType: {
    type: String,
  },
  fileSize: {
    type: Number,
  },
  versionNumber: {
    type: Number,
    required: true,
  },
  version: {
    type: String,
    required: true, // e.g., "v1", "v2", "v3"
  },
  previousVersion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Data',
    default: null,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Data', dataSchema);
