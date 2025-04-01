const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const db = require("../db");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

// ✅ Helper function to query MySQL
const queryDB = (sql, params) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

// ✅ Signup Route
router.post("/signup", async (req, res) => {
    console.log("Signup request received:", req.body);
    const { companyname, email, password } = req.body;

    if (!companyname || !email || !password) {
        return res.status(400).json({ success: false, message: "All fields are required!" });
    }

    try {
        const existingDonor = await queryDB("SELECT * FROM donor WHERE email = ?", [email]);

        if (existingDonor.length > 0) {
            return res.status(400).json({ success: false, message: "Donor already exists!" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await queryDB("INSERT INTO donor (companyname, email, password) VALUES (?, ?, ?)", 
                                    [companyname, email, hashedPassword]);

        req.session.Donor = { id: result.insertId, email, companyname };

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
        const existingDonor = await queryDB("SELECT * FROM donor WHERE email = ?", [email]);

        if (existingDonor.length === 0) {
            return res.status(400).json({ success: false, message: "Invalid email or password!" });
        }

        const donor = existingDonor[0];

        const isMatch = await bcrypt.compare(password, donor.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid email or password!" });
        }

        req.session.Donor = { id: donor.id, email: donor.email, companyname: donor.companyname };

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

// ✅ Fetch donor verification status
router.get("/status", async (req, res) => {
    if (!req.session.Donor) {
        return res.status(401).json({ success: false, message: "Not logged in" });
    }

    const userEmail = req.session.Donor.email;
    try {
        const results = await queryDB("SELECT verified FROM donor WHERE email = ?", [userEmail]);

        if (results.length > 0) {
            res.json({ success: true, verified: results[0].verified });
        } else {
            res.status(404).json({ success: false, message: "Donor not found" });
        }

    } catch (error) {
        console.error("Database Error:", error);
        res.status(500).json({ success: false, message: "Database error" });
    }
});

// ✅ Start Puppeteer for Verification
router.post("/start-fssai-verification", async (req, res) => {
    if (!req.session.Donor || !req.session.Donor.email) {
        return res.status(400).json({ success: false, message: "User session required." });
    }

    const userEmail = req.session.Donor.email;

    console.log("🚀 Launching Puppeteer for FSSAI verification...");

    try {
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
        // Set default timeouts to 10 minutes (600000 ms)
        await page.setDefaultNavigationTimeout(600000);
        await page.setDefaultTimeout(600000);
        console.log("✅ Opening FSSAI Website...");
        await page.goto("https://foscos.fssai.gov.in/", { waitUntil: "networkidle2", timeout: 600000 });

        console.log("✅ Expanding 'FBO Search' Section...");
        await page.waitForSelector("a#governmentAgencies1", { visible: true, timeout: 10000 });
        await page.evaluate(() => document.querySelector("a#governmentAgencies1").click());
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log("⌛ Waiting for user to enter license & CAPTCHA...");
        try {
            await page.waitForSelector("#data-table-simple", { timeout: 30000 });
        } catch (error) {
            console.log("❌ No results found. License may be invalid.");
            await browser.close();
            return res.json({ valid: false, message: "No records found for this FSSAI number." });
        }

        console.log("✅ Extracting FSSAI Status...");
        const statusElement = await page.evaluate(() => {
            const allCells = document.querySelectorAll("td");
            return Array.from(allCells).map(td => td.innerText.trim()).find(text => text.includes("Active")) || "No data found";
        });

        console.log("🔍 Extracted FSSAI Status:", statusElement);
        const isValid = statusElement.includes("Active");

        await queryDB("UPDATE donor SET verified = ? WHERE email = ?", [isValid ? 1 : 0, userEmail]);

        console.log(`✅ Database Updated: ${userEmail} verification set to ${isValid}`);

        await browser.close();
        res.json({ valid: isValid });

    } catch (error) {
        console.error("❌ Puppeteer Error:", error);
        res.status(500).json({ error: "Failed to complete FSSAI verification" });
    }
});

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

module.exports = router;
