const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const Donor = require('../models/Donor');
const Receiver = require('../models/Receiver');
const Notification = require('../models/DonateNotification');
const mongoose = require('mongoose');

// Get active donations
router.get('/active', async (req, res) => {
    try {
        const donations = await Donation.find({ status: 'Active' })
            .populate('donorId', 'companyname')
            .populate('receiverId', 'nponame')
            .sort({ createdAt: -1 });

        res.json(donations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get donation requests for a donor
router.get('/requests', async (req, res) => {
    try {
        if (!req.session.Donor) {
            return res.status(401).json({ message: 'Not authenticated as donor' });
        }

        const donations = await Donation.find({
            donorId: req.session.Donor.id,
            status: 'Claimed'
        })
            .populate('receiverId', 'nponame')
            .sort({ createdAt: -1 });

        res.json(donations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get receiver's requests
router.get('/receiver-requests', async (req, res) => {
    try {
        const receiverId = req.query.receiverId;
        console.log('Received receiverId:', receiverId);

        if (!receiverId) {
            console.log('No receiverId provided');
            return res.status(400).json({ error: 'Receiver ID is required' });
        }

        // Check if receiver exists using string comparison
        console.log('Checking receiver existence...');
        const receiver = await Receiver.findOne({ _id: receiverId });
        if (!receiver) {
            console.log('Receiver not found:', receiverId);
            return res.status(404).json({ error: 'Receiver not found' });
        }

        // Find all donations where this receiver is the requester
        console.log('Fetching donations for receiver:', receiverId);
        const requests = await Donation.find({
            receiverId: receiverId,
            status: { $in: ['Claimed', 'Confirmed'] }
        })
            .populate('donorId', 'name companyname address')
            .sort({ createdAt: -1 });

        console.log('Found requests:', requests.length);

        // Ensure we're sending an array
        if (!Array.isArray(requests)) {
            console.error('Requests is not an array:', requests);
            return res.status(500).json({
                error: 'Server error',
                message: 'Invalid response format'
            });
        }

        res.json(requests);
    } catch (error) {
        console.error("Detailed error in receiver-requests:", {
            message: error.message,
            stack: error.stack,
            name: error.name
        });

        res.status(500).json({
            error: 'Server error',
            message: error.message,
            type: error.name
        });
    }
});

// Request a donation
router.post('/request/:donationId', async (req, res) => {
    try {
        const { receiverId } = req.body;
        console.log('Request received with receiverId:', receiverId); // Debug log

        if (!receiverId || receiverId === "undefined") {
            return res.status(400).json({
                success: false,
                message: 'Invalid receiver ID. Please log in again.'
            });
        }

        // Check if receiver exists using string comparison
        const receiver = await Receiver.findOne({ _id: receiverId });
        if (!receiver) {
            return res.status(404).json({
                success: false,
                message: 'Receiver not found. Please log in again.'
            });
        }

        const donation = await Donation.findById(req.params.donationId)
            .populate('donorId', 'name');

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: 'Donation not found'
            });
        }

        if (donation.status !== 'Active') {
            return res.status(400).json({
                success: false,
                message: 'Donation is not available'
            });
        }

        // Update donation status to Claimed
        donation.status = 'Claimed';
        donation.receiverId = receiverId;
        await donation.save();

        // Create notification for donor
        const notification = new Notification({
            userId: donation.donorId._id,
            userType: 'Donor',
            title: 'New Donation Request',
            message: `A receiver has requested your donation: ${donation.title}`,
            donationId: donation._id
        });
        await notification.save();

        res.json({
            success: true,
            message: 'Request sent successfully',
            donorName: donation.donorId.name
        });
    } catch (error) {
        console.error('Request error:', error); // Debug log
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get donation by ID
router.get('/:donationId', async (req, res) => {
    try {
        const donation = await Donation.findById(req.params.donationId)
            .populate('donorId', 'name companyname address phone')
            .populate('receiverId', 'nponame');

        if (!donation) {
            return res.status(404).json({ message: 'Donation not found' });
        }

        res.json(donation);
    } catch (error) {
        console.error('Error fetching donation:', error);
        res.status(500).json({
            error: 'Failed to fetch donation',
            message: error.message
        });
    }
});

// Donate/Confirm a donation
router.post('/donate/:donationId', async (req, res) => {
    try {
        const { receiverId } = req.body;
        if (!receiverId) {
            return res.status(400).json({ message: 'Receiver ID is required' });
        }

        const donation = await Donation.findById(req.params.donationId)
            .populate('donorId', 'name')
            .populate('receiverId', 'nponame');

        if (!donation) {
            return res.status(404).json({ message: 'Donation not found' });
        }

        if (donation.status !== 'Claimed') {
            return res.status(400).json({ message: 'Donation is not in claimed state' });
        }

        // Update donation status to Confirmed
        donation.status = 'Confirmed';
        await donation.save();

        // Create notification for receiver
        const notification = new Notification({
            userId: receiverId,
            userType: 'Receiver',
            title: 'Donation Approved',
            message: `Your request for ${donation.title} has been approved by ${donation.donorId.name}`,
            donationId: donation._id
        });
        await notification.save();

        res.json({
            success: true,
            message: 'Donation confirmed successfully'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Mark donation as collected and add review
router.post('/collect/:donationId', async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const donation = await Donation.findById(req.params.donationId)
            .populate('donorId', 'name');

        if (!donation) {
            return res.status(404).json({ message: 'Donation not found' });
        }

        donation.status = 'Collected';
        donation.review = {
            rating,
            comment,
            createdAt: new Date()
        };
        await donation.save();

        // Create notification for donor
        const notification = new Notification({
            userId: donation.donorId._id,
            userType: 'Donor',
            title: 'Donation Collected',
            message: 'Great Job! Your Kindness helped to resolve hunger.'
        });
        await notification.save();

        res.json({
            message: 'Great Job! Your Kindness helped to resolve hunger.',
            donation
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add review to donation
router.post('/:donationId/review', async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const donationId = req.params.donationId;

        if (!rating) {
            return res.status(400).json({ error: 'Rating is required' });
        }

        const donation = await Donation.findById(donationId);
        if (!donation) {
            return res.status(404).json({ error: 'Donation not found' });
        }

        // Update donation with review
        donation.review = {
            rating: parseInt(rating),
            comment: comment || '',
            createdAt: new Date()
        };

        await donation.save();

        res.json({
            success: true,
            message: 'Review submitted successfully'
        });
    } catch (error) {
        console.error('Review submission error:', error);
        res.status(500).json({
            error: 'Failed to submit review',
            message: error.message
        });
    }
});

module.exports = router; 