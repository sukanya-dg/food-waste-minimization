const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
}, {
    collection: "customerservices" // 🔥 This forces the name
});

const Customer = mongoose.model("Customer", customerSchema); // Model name can stay "Customer"

module.exports = Customer;