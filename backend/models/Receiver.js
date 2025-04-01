const db = require("../db"); // Import database connection from db.js

// ✅ Create Receiver Table if not exists
const createReceiverTable = `
CREATE TABLE IF NOT EXISTS receiver (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nponame VARCHAR(255) NOT NULL,
    regno VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    address VARCHAR(255) DEFAULT 'Verify First'
)`;

db.query(createReceiverTable, (err) => {
    if (err) console.error("❌ Error creating receiver table:", err);
    else console.log("✅ Receiver table is ready");
});

// ✅ Function to add a new receiver
const addReceiver = (nponame, regno, email, password, callback) => {
    const sql = `INSERT INTO receiver (nponame, regno, email, password) VALUES (?, ?, ?, ?)`;
    db.query(sql, [nponame.toUpperCase(), regno.toUpperCase(), email, password], callback);
};

// ✅ Function to get all receivers
const getReceivers = (callback) => {
    db.query("SELECT * FROM receiver", callback);
};

// ✅ Export Functions
module.exports = { addReceiver, getReceivers };
