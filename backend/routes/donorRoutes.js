const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const Donor = require("../models/Donor");
const { verifyFSSAI } = require("./fssaiVerification");
const Donation = require("../models/Donation");
const DonateNotification = require("../models/DonateNotification");

// ✅ Signup Route
router.post("/signup", async (req, res) => {
    console.log("Signup request received:", req.body);
    const { companyname, email, password } = req.body;

    if (!companyname || !email || !password) {
        return res.status(400).json({ success: false, message: "All fields are required!" });
    }

    try {
        const existingDonor = await Donor.findOne({ email });
        if (existingDonor) {
            return res.status(400).json({ success: false, message: "Donor already exists!" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newDonor = await Donor.create({ companyname, email, password: hashedPassword });

        req.session.Donor = { id: newDonor._id, email, companyname };
        console.log("Session after login:", req.session);

        res.status(201).json({
            success: true,
            redirect: "/donor_dashboard.html",
            companyname
        });

    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
});

// ✅ Login Route
router.post("/login", async (req, res) => {
    console.log("Login Request Received:", req.body);
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "All fields are required!" });
    }

    try {
        const donor = await Donor.findOne({ email });

        if (!donor) {
            return res.status(400).json({ success: false, message: "Invalid email or password!" });
        }

        const isMatch = await bcrypt.compare(password, donor.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid email or password!" });
        }

        req.session.Donor = { id: donor._id, email: donor.email, companyname: donor.companyname };
        console.log("Session after login:", req.session);
        res.status(200).json({
            success: true,
            redirect: "/donor_dashboard.html",
            companyname: donor.companyname,
            sessionID: req.sessionID
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
});

// ✅ Fetch donor verification status, address, and company name
router.get("/status", async (req, res) => {
    if (!req.session.Donor) {
        return res.status(401).json({ success: false, message: "Not logged in" });
    }

    try {
        const donor = await Donor.findOne({ email: req.session.Donor.email });
        if (!donor) {
            return res.status(404).json({ success: false, message: "Donor not found" });
        }

        res.json({
            success: true,
            verified: donor.verified,
            address: donor.address || null,
            companyname: donor.companyname || "Unknown"
        });

    } catch (error) {
        console.error("Database Error:", error);
        res.status(500).json({ success: false, message: "Database error" });
    }
});

// ✅ FSSAI verification endpoint (moved here)
router.post("/verify", verifyFSSAI);

// ✅ Logout Route
router.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Logout Error:", err);
            return res.status(500).json({ success: false, message: "Logout failed!" });
        }
        res.status(200).json({ success: true, message: "Logged out successfully!" });
    });
});

// Add this new route
router.post("/donations", async (req, res) => {
    if (!req.session.Donor) {
        return res.status(401).json({ success: false, message: "Not logged in" });
    }

    try {
        const { title, type, quantity, expiryDate, status } = req.body;

        // Create new donation
        const donation = await Donation.create({
            donorId: req.session.Donor.id,
            title,
            type,
            quantity,
            expiryDate,
            status
        });

        res.status(201).json({
            success: true,
            donation
        });

    } catch (error) {
        console.error("Donation Creation Error:", error);
        res.status(500).json({ success: false, message: "Failed to create donation" });
    }
});

// Add this route to get donor's donations
router.get("/donations", async (req, res) => {
    if (!req.session.Donor) {
        return res.status(401).json({ success: false, message: "Not logged in" });
    }

    try {
        const donations = await Donation.find({ donorId: req.session.Donor.id })
            .populate('receiverId', 'nponame')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            donations
        });

    } catch (error) {
        console.error("Fetch Donations Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch donations" });
    }
});

// Add route to delete/cancel a donation
router.delete("/donations/:donationId", async (req, res) => {
    if (!req.session.Donor) {
        return res.status(401).json({ success: false, message: "Not logged in" });
    }

    try {
        const donation = await Donation.findOne({
            _id: req.params.donationId,
            donorId: req.session.Donor.id,
            status: { $in: ['Active', 'Claimed'] }
        }).populate('receiverId', 'nponame');

        if (!donation) {
            return res.status(404).json({ 
                success: false, 
                message: "Donation not found or cannot be cancelled" 
            });
        }

        // If the donation was claimed, create a notification for the receiver
        if (donation.status === 'Claimed' && donation.receiverId) {
            try {
                const notification = new DonateNotification({
                    userId: donation.receiverId._id,
                    userType: 'Receiver',
                    title: 'Donation Cancelled',
                    message: `The donation "${donation.title}" has been cancelled by the donor.`,
                    donationId: donation._id
                });
                await notification.save();
            } catch (notificationError) {
                console.error("Error creating notification:", notificationError);
                // Continue with donation deletion even if notification fails
            }
        }

        await donation.deleteOne();

        res.json({
            success: true,
            message: "Donation cancelled successfully"
        });

    } catch (error) {
        console.error("Cancel Donation Error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to cancel donation",
            error: error.message 
        });
    }
});

module.exports = router;
