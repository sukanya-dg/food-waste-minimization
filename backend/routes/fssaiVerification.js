const Donor = require("../models/Donor");
const OfficialVerify = require("../models/GovtDatabase");

const verifyFSSAI = async (req, res) => {
    const { license } = req.body;

    if (!license) {
        return res.status(400).json({ success: false, message: "License number is required" });
    }

    try {
        const cleanLicense = license.trim();
        console.log("Started verification process");

        // Use the exact field name from your schema ("LicenseNo")
        const officialVerify = await OfficialVerify.findOne({ "LicenseNo": cleanLicense });

        if (!officialVerify) {
            return res.status(404).json({ success: false, message: "FSSAI License not found" });
        }

        // Find donor by company name exactly as stored.
        const donor = await Donor.findOne({ companyname: officialVerify["FBO/Company Name"].trim() });

        if (!donor) {
            return res.status(404).json({ success: false, message: "Donor company not found" });
        }

        // Update donor verification details and address
        donor.verified = true;
        donor.address = officialVerify["Premises Address"] || "Address not available";
        donor.regno = officialVerify.LicenseNo;  // Store the license number
        await donor.save();

        console.log({
            success: true,
            message: "FSSAI verification successful",
            verified: donor.verified,
            address: donor.address
        });

        res.json({
            success: true,
            message: "FSSAI verification successful",
            verified: donor.verified,
            address: donor.address
        });

    } catch (error) {
        console.error("Verification Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = { verifyFSSAI };
