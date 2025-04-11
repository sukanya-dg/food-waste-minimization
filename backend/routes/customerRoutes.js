const express = require("express");
const bcrypt = require("bcrypt");
const Customer = require("../models/CustomerService");

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
        const existingCustomer = await Customer.findOne({ email });
        if (existingCustomer) {
            return res.status(400).json({ success: false, message: "Customer already exists!" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new customer into MongoDB
        const newCustomer = new Customer({ username: user, email, password: hashedPassword });
        const savedCustomer = await newCustomer.save();

        res.status(201).json({ 
            success: true, 
            user: { id: savedCustomer._id, username: user, email }, 
            redirect: "customer_dashboard.html" 
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
        const customer = await Customer.findOne({ email });
        if (!customer) {
            return res.json({ success: false, message: "Invalid email or password." });
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(password, customer.password);
        if (!isMatch) {
            return res.json({ success: false, message: "Invalid email or password." });
        }

        res.json({ 
            success: true, 
            user: { id: customer._id, username: customer.username, email: customer.email }, 
            redirect: "customer_dashboard.html" 
        });
    } catch (err) {
        console.error("Login Error:", err);
        res.json({ success: false, message: "Login failed" });
    }
});

module.exports = router;
