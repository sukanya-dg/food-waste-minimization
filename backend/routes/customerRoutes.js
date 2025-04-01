const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../db"); // ✅ Import MySQL connection

const router = express.Router();

// Signup Route
router.post("/signup", async (req, res) => {
    console.log("Signup request received:", req.body);
    const { user, email, password } = req.body;

    if (!user || !email || !password) {
        return res.json({ success: false, message: "Please fill in all fields." });
    }

    try {
        // Check if customer already exists
        db.query("SELECT * FROM customer_service WHERE email = ?", [email], async (err, results) => {
            if (err) {
                console.error("MySQL Error:", err);
                return res.status(500).json({ success: false, message: "Database error." });
            }

            if (results.length > 0) {
                return res.status(400).json({ success: false, message: "Customer already exists!" });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert new customer into MySQL
            db.query("INSERT INTO customer_service (username, email, password) VALUES (?, ?, ?)", 
                [user, email, hashedPassword], 
                (err, result) => {
                    if (err) {
                        console.error("MySQL Insert Error:", err);
                        return res.status(500).json({ success: false, message: "Database error." });
                    }

                    res.status(201).json({ 
                        success: true, 
                        user: { id: result.insertId, username: user, email }, 
                        redirect: "customer_dashboard.html" 
                    });
                }
            );
        });
    } catch (err) {
        console.error("Signup Error:", err);
        res.json({ success: false, message: "Signup failed" });
    }
});

// Login Route
router.post("/login", async (req, res) => {
    console.log("Login Request Received:", req.body);
    const { email, password } = req.body;

    if (!email || !password) {
        return res.json({ success: false, message: "Please enter your email and password." });
    }

    try {
        // Check if customer exists
        db.query("SELECT * FROM customer_service WHERE email = ?", [email], async (err, results) => {
            if (err) {
                console.error("MySQL Query Error:", err);
                return res.status(500).json({ success: false, message: "Database error." });
            }

            if (results.length === 0) {
                return res.json({ success: false, message: "Invalid email or password." });
            }

            const customer = results[0];

            // Compare passwords
            const isMatch = await bcrypt.compare(password, customer.password);
            if (!isMatch) {
                return res.json({ success: false, message: "Invalid email or password." });
            }

            res.json({ 
                success: true, 
                user: { id: customer.id, username: customer.username, email: customer.email }, 
                redirect: "customer_dashboard.html" 
            });
        });
    } catch (err) {
        console.error("Login Error:", err);
        res.json({ success: false, message: "Login failed" });
    }
});

module.exports = router;
