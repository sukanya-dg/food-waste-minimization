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

// Confirm collection of donation
router.post("/collect/:donationId", async (req, res) => {
  try {
    const { donationId } = req.params;

    // Find and update the donation
    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }

    // Update collection status
    donation.status = 'Collected';
    await donation.save();

    // Create notification for donor
    const notification = new Notification({
      userId: donation.donorId,
      userType: 'Donor',
      title: 'Donation Collected',
      message: 'Your donation has been collected successfully!',
      donationId: donation._id
    });
    await notification.save();

    res.status(200).json({ message: "Donation collected successfully" });
  } catch (error) {
    console.error("Error collecting donation:", error);
    res.status(500).json({ message: "Failed to collect donation" });
  }
});

// Add review to donation
router.post("/:donationId/review", async (req, res) => {
  try {
    const { donationId } = req.params;
    const { rating, comment } = req.body;
    
    console.log('Review submission attempt:', {
      donationId,
      rating,
      comment
    });

    if (!rating) {
      console.log('Rating missing in request');
      return res.status(400).json({ message: "Rating is required" });
    }

    // Find the donation
    const donation = await Donation.findById(donationId);
    console.log('Found donation:', donation);

    if (!donation) {
      console.log('Donation not found with ID:', donationId);
      return res.status(404).json({ message: "Donation not found" });
    }

    // Add review
    const reviewData = {
      rating: parseInt(rating),
      comment: comment || '',
      createdAt: new Date()
    };
    console.log('Setting review data:', reviewData);

    donation.review = reviewData;

    // Save the updated donation
    const savedDonation = await donation.save();
    console.log('Saved donation with review:', savedDonation);

    // Create notification for donor about the review
    const notification = new Notification({
      userId: donation.donorId,
      userType: 'Donor',
      title: 'Donation Reviewed',
      message: `Your donation received a ${rating}-star rating!`,
      donationId: donation._id
    });
    await notification.save();
    console.log('Notification created for donor');

    res.status(200).json({ 
      message: "Review submitted successfully",
      review: savedDonation.review 
    });
  } catch (error) {
    console.error("Error submitting review:", {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      message: "Failed to submit review",
      error: error.message 
    });
  }
});

module.exports = router; 