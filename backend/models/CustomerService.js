const db = require("../db"); // Import MySQL connection

// ✅ Insert a New Customer
const createCustomer = (username, email, password, callback) => {
    const query = "INSERT INTO customer_service (username, email, password) VALUES (?, ?, ?)";
    db.query(query, [username, email, password], callback);
};

// ✅ Get a Customer by Email
const getCustomerByEmail = (email, callback) => {
    const query = "SELECT * FROM customer_service WHERE email = ?";
    db.query(query, [email], callback);
};

module.exports = { createCustomer, getCustomerByEmail };
