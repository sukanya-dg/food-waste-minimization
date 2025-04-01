const db = require("../db"); // Import database connection from db.js

// ✅ Create Donor Table if not exists
const createDonorTable = `
CREATE TABLE IF NOT EXISTS donor (
    id INT AUTO_INCREMENT PRIMARY KEY,
    companyname VARCHAR(255) NOT NULL,
    regno VARCHAR(50) DEFAULT NULL, 
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    address VARCHAR(255) DEFAULT NULL
)`;

db.query(createDonorTable, (err) => {
    if (err) console.error("❌ Error creating donor table:", err);
    else console.log("✅ Donor table is ready");
});

// ✅ Function to add a new donor
const addDonor = (companyname, email, password, callback) => {
    const sql = "INSERT INTO donor (companyname, email, password) VALUES (?, ?, ?)";
    db.query(sql, [companyname, email, password], callback);
};

// ✅ Function to get all donors
const getDonors = (callback) => {
    db.query("SELECT * FROM donor", callback);
};

// ✅ Function to update donor verification, address, and regno after FSSAI verification
const updateDonorVerification = (email, verified, regno, address, callback) => {
    const sql = "UPDATE donor SET verified = ?, regno = ?, address = ? WHERE email = ?";
    db.query(sql, [verified, regno, address, email], callback);
};

// ✅ Export Functions
module.exports = { addDonor, getDonors, updateDonorVerification };
