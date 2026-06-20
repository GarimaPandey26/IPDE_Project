const Notification = require('../models/Notification');

// Retrieve notifications based on role
exports.getNotifications = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'Manufacturer') {
      query = {
        $or: [
          { recipient: req.user._id },
          { affectedComponent: req.user.assignedComponent }
        ]
      };
    }

    const notifications = await Notification.find(query)
      .populate('sourceComponent', 'name type category')
      .populate('affectedComponent', 'name type category')
      .populate('recipient', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get count of unread notifications
exports.getUnreadCount = async (req, res) => {
  try {
    let query = { status: 'Unread' };

    if (req.user.role === 'Manufacturer') {
      query.$or = [
        { recipient: req.user._id },
        { affectedComponent: req.user.assignedComponent }
      ];
    }

    const count = await Notification.countDocuments(query);
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    let query = { _id: id };
    if (req.user.role === 'Manufacturer') {
      // Manufacturers can only update their own notifications
      query.$or = [
        { recipient: req.user._id },
        { affectedComponent: req.user.assignedComponent }
      ];
    }

    const notification = await Notification.findOne(query);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found or access denied' });
    }

    notification.status = 'Read';
    await notification.save();

    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
