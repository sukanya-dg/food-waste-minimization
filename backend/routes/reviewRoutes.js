const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');

// Get all reviews for a specific restaurant (donor)
router.get('/restaurant/:donorId', async (req, res) => {
    try {
        const { donorId } = req.params;

        // Find all donations for this donor that have reviews
        const donations = await Donation.find({
            donorId: donorId,
            'review.rating': { $exists: true }
        })
        .sort({ 'review.createdAt': -1 });

        // Extract reviews from donations
        const reviews = donations.map(donation => ({
            rating: donation.review.rating,
            comment: donation.review.comment,
            createdAt: donation.review.createdAt,
            foodItem: donation.title
        }));

        res.json({
            success: true,
            reviews: reviews
        });
    } catch (error) {
        console.error('Error fetching restaurant reviews:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reviews'
        });
    }
});

module.exports = router; 