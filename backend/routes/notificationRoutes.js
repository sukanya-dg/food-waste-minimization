const express = require('express');
const router = express.Router();
const Notification = require('../models/DonateNotification');

// Get user's notifications
router.get('/', async (req, res) => {
    try {
        const notifications = await Notification.find({
            userId: req.session.userId,
            userType: req.session.userType
        })
            .sort({ createdAt: -1 })
            .limit(10);

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Mark notification as read
router.put('/:notificationId/read', async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            {
                _id: req.params.notificationId,
                userId: req.session.userId
            },
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a notification
router.post('/', async (req, res) => {
    try {
        const { userId, userType, title, message } = req.body;

        const notification = new Notification({
            userId,
            userType,
            title,
            message
        });

        await notification.save();
        res.status(201).json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete a notification
router.delete('/:notificationId', async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.notificationId,
            userId: req.session.userId
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 