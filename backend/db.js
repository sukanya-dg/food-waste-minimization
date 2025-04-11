const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config(); // Load environment variables

// ✅ MongoDB connection string
const mongoURI = process.env.MONGO_URI || "mongodb+srv://sukanya-dg:Rai%4014102005@cluster0.8w3ko.mongodb.net/food-waste-minimization?retryWrites=true&w=majority";

// ✅ Connect to MongoDB
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
        console.log("✅ MongoDB Connected");
    })
    .catch(err => {
        console.error("❌ MongoDB Connection Error:", err);
    });

// ✅ Export Mongoose connection (optional if you want to access db directly)
module.exports = mongoose;
