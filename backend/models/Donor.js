const mongoose = require("mongoose");

// ✅ Donor Schema
const donorSchema = new mongoose.Schema({
    companyname: { type: String, required: true },
    regno: { type: String, default: null },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    verified: { type: Boolean, default: false },
    address: { type: String, default: null }
}, {
    collection: "donor" // 🔥 This forces the name
});

// ✅ Donor Model
const Donor = mongoose.model("Donor", donorSchema);

module.exports = Donor;
