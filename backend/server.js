const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const session = require("express-session");
const bodyParser = require("body-parser");

// ✅ Load environment variables
dotenv.config();

// ✅ Connect to MongoDB
require("./db");

// ✅ Import Routes
const receiverRoutes = require("./routes/receiverRoutes");
const donorRoutes = require("./routes/donorRoutes");
const customerRoutes = require("./routes/customerRoutes");
const fssaiVerificationRoute = require("./routes/fssaiVerification");

// ✅ Initialize Express
const app = express();

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "..", "frontend")));

// ✅ Set up session
app.use(session({
    secret: process.env.SESSION_SECRET || "your_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true }
}));

// ✅ Use Routes
app.use("/api/receiver", receiverRoutes);
app.use("/api/donor", donorRoutes);
app.use("/api/donor", fssaiVerificationRoute); // Same base path is okay — different subpaths
app.use("/api/customer", customerRoutes);

// ✅ Server Homepage
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "frontend", "home.html"));
});

// ✅ Logout Route
app.get("/logout", (req, res) => {
    req.session.destroy(() => res.redirect("/"));
});

// ✅ Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
