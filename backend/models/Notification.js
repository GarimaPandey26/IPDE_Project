const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  sourceComponent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Component',
    required: true,
  },
  affectedComponent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Component',
    required: true,
  },
  uploadedVersion: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Unread', 'Read'],
    default: 'Unread',
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // Null indicates system-wide notifications visible to Admins/Viewers
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Map specific fields for exact client compatibility
notificationSchema.virtual('notification_id').get(function() {
  return this._id;
});

notificationSchema.virtual('source_component').get(function() {
  return this.sourceComponent;
});

notificationSchema.virtual('affected_component').get(function() {
  return this.affectedComponent;
});

notificationSchema.virtual('uploaded_version').get(function() {
  return this.uploadedVersion;
});

notificationSchema.virtual('created_at').get(function() {
  return this.createdAt;
});

module.exports = mongoose.model('Notification', notificationSchema);
