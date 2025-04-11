const mongoose = require("mongoose");

// ✅ Receiver Schema
const receiverSchema = new mongoose.Schema({
    nponame: { type: String, required: true },
    regno: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    verified: { type: Boolean, default: false },
    address: { type: String, default: "Verify First" }
}, {
    collection: "receivers" // 🔥 This forces the name
});
// ✅ Receiver Model
const Receiver = mongoose.model("Receiver", receiverSchema);

module.exports = Receiver;
