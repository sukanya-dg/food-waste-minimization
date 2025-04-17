const mongoose = require('mongoose');

const donatenotificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'userType'
    },
    userType: {
        type: String,
        required: true,
        enum: ['Donor', 'Receiver']
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    read: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    collection: 'donatenotifications'
});

const DonateNotification = mongoose.model('donateNotification', donatenotificationSchema);
module.exports = DonateNotification; 