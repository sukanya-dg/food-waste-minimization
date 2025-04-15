const mongoose = require("mongoose");

const officialVerifySchema = new mongoose.Schema({
    "FBO/Company Name": {
        type: String,
        required: true
    },
    "Premises Address": {
        type: String,
        required: true
    },
    "License Type": {
        type: String,
        required: true
    },
    "Valid(Active/Inactive)": {
        type: String,
        required: true,
        enum: ["Active", "Inactive"]
    },
    "LicenseNo": {
        type: String,
        required: true,
        unique: true
    }
}, { collection: "officialverify" });

const OfficialVerify = mongoose.model("OfficialVerify", officialVerifySchema);

module.exports = OfficialVerify;
