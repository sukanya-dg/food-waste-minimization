const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db"); // ✅ Import MySQL connection
const { verifyNgo } = require("./ngoVerification"); // ✅ Adjust path if needed

const router = express.Router();

// ✅ Signup Route
router.post("/signup", async (req, res) => {
    console.log("Signup request received:", req.body);
    const { nponame, regno, email, password } = req.body;

    if (!nponame || !regno || !email || !password) {
        return res.status(400).json({ success: false, message: "All fields are required." });
    }

    try {
        // Check if email is already registered
        db.query("SELECT * FROM receiver WHERE email = ?", [email], async (err, results) => {
            if (err) {
                console.error("MySQL Query Error:", err);
                return res.status(500).json({ success: false, message: "Database error." });
            }

            if (results.length > 0) {
                return res.status(400).json({ success: false, message: "Email is already in use." });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert new receiver into MySQL
            db.query("INSERT INTO receiver (nponame, regno, email, password, verified) VALUES (?, ?, ?, ?, ?)", 
                [nponame, regno, email, hashedPassword, false], 
                (err, result) => {
                    if (err) {
                        console.error("MySQL Insert Error:", err);
                        return res.status(500).json({ success: false, message: "Database error." });
                    }

                    res.status(201).json({ 
                        success: true, 
                        nponame, 
                        redirect: "/receiver_dashboard.html" 
                    });
                }
            );
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
        // Fetch receiver from MySQL
        db.query("SELECT * FROM receiver WHERE email = ?", [email], async (err, results) => {
            if (err) {
                console.error("MySQL Query Error:", err);
                return res.status(500).json({ success: false, message: "Database error." });
            }

            if (results.length === 0) {
                return res.status(400).json({ success: false, message: "Invalid email or password." });
            }

            const receiver = results[0];

            // Compare passwords
            const isMatch = await bcrypt.compare(password, receiver.password);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: "Invalid email or password." });
            }

            res.json({ 
                success: true, 
                nponame: receiver.nponame, 
                redirect: "/receiver_dashboard.html" 
            });
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
        // Fetch receiver by nponame
        db.query("SELECT * FROM receiver WHERE UPPER(nponame) = ?", [nponame.toUpperCase()], async (err, results) => {
            if (err) {
                console.error("MySQL Query Error:", err);
                return res.status(500).json({ success: false, message: "Database error." });
            }

            if (results.length === 0) {
                return res.status(404).json({ success: false, message: "Receiver not found." });
            }

            const receiver = results[0];

            // Perform verification
            const { isVerified, fetchedAddress } = await verifyNgo(receiver.nponame, receiver.regno);

            if (isVerified) {
                // Update verification status in MySQL
                db.query("UPDATE receiver SET verified = ?, address = ? WHERE id = ?", 
                    [true, fetchedAddress, receiver.id], 
                    (err) => {
                        if (err) {
                            console.error("MySQL Update Error:", err);
                            return res.status(500).json({ success: false, message: "Database error." });
                        }

                        res.json({
                            success: true,
                            verified: true,
                            message: "NGO verified successfully.",
                            address: fetchedAddress,
                        });
                    }
                );
            } else {
                res.json({
                    success: false,
                    verified: false,
                    message: "NGO verification failed or registration number mismatch.",
                    address: null,
                });
            }
        });
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
        // Fetch receiver details
        db.query("SELECT * FROM receiver WHERE UPPER(nponame) = ?", [nponame.toUpperCase()], (err, results) => {
            if (err) {
                console.error("MySQL Query Error:", err);
                return res.status(500).json({ success: false, message: "Database error." });
            }

            if (results.length === 0) {
                return res.status(404).json({ success: false, message: "Receiver not found." });
            }

            const receiver = results[0];

            res.json({
                success: true,
                nponame: receiver.nponame,
                verified: receiver.verified,
                address: receiver.verified ? receiver.address : "Verify First"
            });
        });
    } catch (error) {
        console.error("Error fetching details:", error);
        res.status(500).json({ success: false, message: "Server error." });
    }
});

module.exports = router;
