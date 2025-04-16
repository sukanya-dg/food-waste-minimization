const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema({
    donorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Donor',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['veg', 'nonveg'],
        required: true
    },
    quantity: {
        type: String,
        required: true
    },
    expiryDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['Active', 'Expired', 'Claimed'],
        default: 'Active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    collection: 'donations'
});

const Donation = mongoose.model("Donation", donationSchema);
module.exports = Donation;
