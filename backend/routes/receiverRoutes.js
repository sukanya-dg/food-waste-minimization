const express = require("express");
const bcrypt = require("bcryptjs");
const { verifyNgo } = require("./ngoVerification"); // ✅ Keep as-is
const Receiver = require("../models/Receiver"); // ✅ MongoDB Mongoose model

const router = express.Router();

// ✅ Signup Route
router.post("/signup", async (req, res) => {
    console.log("Signup request received:", req.body);
    const { nponame, regno, email, password } = req.body;

    if (!nponame || !regno || !email || !password) {
        return res.status(400).json({ success: false, message: "All fields are required." });
    }

    try {
        const existingReceiver = await Receiver.findOne({ email });
        if (existingReceiver) {
            return res.status(400).json({ success: false, message: "Email is already in use." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newReceiver = new Receiver({
            nponame,
            regno,
            email,
            password: hashedPassword,
            verified: false
        });

        await newReceiver.save();

        res.status(201).json({
            success: true,
            nponame,
            redirect: "/receiver_dashboard.html"
        });
    } catch (error) {
        console.error("❌ Signup Error:", error);
        res.status(500).json({ success: false, message: "Server error during signup." });
    }
});

// ✅ Login Route
router.post("/login", async (req, res) => {
    console.log("Login Request Received:", req.body);
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "All fields are required." });
    }

    try {
        const receiver = await Receiver.findOne({ email });
        if (!receiver) {
            return res.status(400).json({ success: false, message: "Invalid email or password." });
        }

        const isMatch = await bcrypt.compare(password, receiver.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid email or password." });
        }

        res.json({
            success: true,
            nponame: receiver.nponame,
            redirect: "/receiver_dashboard.html"
        });
    } catch (error) {
        console.error("❌ Login Error:", error);
        res.status(500).json({ success: false, message: "Server error during login." });
    }
});

// ✅ Verification Route
router.post("/verify", async (req, res) => {
    const { nponame } = req.body;

    if (!nponame) {
        return res.status(400).json({ success: false, message: "No NGO name provided." });
    }

    try {
        const receiver = await Receiver.findOne({ nponame: { $regex: `^${nponame}$`, $options: "i" } });

        if (!receiver) {
            return res.status(404).json({ success: false, message: "Receiver not found." });
        }

        const { isVerified, fetchedAddress } = await verifyNgo(receiver.nponame, receiver.regno);

        if (isVerified) {
            receiver.verified = true;
            receiver.address = fetchedAddress;
            await receiver.save();

            res.json({
                success: true,
                verified: true,
                message: "NGO verified successfully.",
                address: fetchedAddress,
            });
        } else {
            res.json({
                success: false,
                verified: false,
                message: "NGO verification failed or registration number mismatch.",
                address: null,
            });
        }
    } catch (err) {
        console.error("Verification error:", err);
        res.status(500).json({ success: false, message: "Server error during verification." });
    }
});

// ✅ Details Route (used on login/dashboard load)
router.post("/details", async (req, res) => {
    const { nponame } = req.body;

    if (!nponame) {
        return res.status(400).json({ success: false, message: "NGO name is required." });
    }

    try {
        const receiver = await Receiver.findOne({ nponame: { $regex: `^${nponame}$`, $options: "i" } });

        if (!receiver) {
            return res.status(404).json({ success: false, message: "Receiver not found." });
        }

        res.json({
            success: true,
            nponame: receiver.nponame,
            verified: receiver.verified,
            address: receiver.verified ? receiver.address : "Verify First"
        });
    } catch (error) {
        console.error("Error fetching details:", error);
        res.status(500).json({ success: false, message: "Server error." });
    }
});

module.exports = router;
