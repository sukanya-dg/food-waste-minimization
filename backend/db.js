const mysql = require(require.resolve("mysql2"));
const dotenv = require("dotenv");

dotenv.config(); // Load environment variables

// ✅ Create MySQL Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "food_waste_minimization"
});

// ✅ Connect to MySQL
db.connect(err => {
    if (err) {
        console.error("❌ MySQL Connection Error:", err);
        return;
    }
    console.log("✅ MySQL Connected to food_waste_minimization");
});

// ✅ Create Tables if Not Exist
const createTables = () => {
    const donorTable = `
    CREATE TABLE IF NOT EXISTS donor (
        id INT AUTO_INCREMENT PRIMARY KEY,
        companyname VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        verified BOOLEAN DEFAULT FALSE,
        regno VARCHAR(255) DEFAULT NULL,  -- ✅ New Column for FSSAI Reg No.
        address VARCHAR(255) DEFAULT 'Verify First' -- ✅ New Column for Address
    )`;

    const receiverTable = `
    CREATE TABLE IF NOT EXISTS receiver (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nponame VARCHAR(255) NOT NULL,
        regno VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        verified BOOLEAN DEFAULT FALSE,
        address VARCHAR(255) DEFAULT 'Verify First'
    )`;

    const customerServiceTable = `
    CREATE TABLE IF NOT EXISTS customer_service (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL
    )`;

    db.query(donorTable, (err) => {
        if (err) console.error("❌ Error creating donor table:", err);
        else console.log("✅ Donor table is ready");
    });

    db.query(receiverTable, (err) => {
        if (err) console.error("❌ Error creating receiver table:", err);
        else console.log("✅ Receiver table is ready");
    });

    db.query(customerServiceTable, (err) => {
        if (err) console.error("❌ Error creating customer service table:", err);
        else console.log("✅ Customer Service table is ready");
    });
};

// ✅ Initialize Tables
createTables();

// ✅ Export Database Connection
module.exports = db;
