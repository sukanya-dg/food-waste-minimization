const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const session = require("express-session");
const bodyParser = require("body-parser");
const cors = require("cors");
const morgan = require("morgan");

//Trust the first proxy (Render’s load‑balancer)
app.set("trust proxy", 1);

// ✅ Load environment variables
dotenv.config();

// ✅ Connect to MongoDB (ensure you use a secure connection string in production)
require("./db");

// ✅ Import Routes
const receiverRoutes = require("./routes/receiverRoutes");
const donorRoutes = require("./routes/donorRoutes");
const customerRoutes = require("./routes/customerRoutes");
const complaintRoutes = require('./routes/complaintRoutes');
const donationRoutes = require("./routes/donationRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

// ✅ Initialize Express
const app = express();

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "..", "frontend")));

// Configure CORS
app.use(cors({
  origin: true,  // This will allow any origin
  credentials: true,  // This is important for cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ Set up session
app.use(session({
  proxy: true,              // 2) honor X-Forwarded-* headers so secure cookies get set
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  name: 'connect.sid',  // Set a specific name for the session cookie
  cookie: {
    secure: process.env.NODE_ENV === 'production',  // Set to true in production
    httpOnly: true,
    sameSite: 'lax',  // This is important for cross-site requests
    maxAge: 24 * 60 * 60 * 1000  // 24 hours
  }
}));

// Add middleware to clear other user type from session
app.use((req, res, next) => {
  if (req.session) {
    // If accessing donor routes, clear receiver session
    if (req.path.startsWith('/api/donor') && req.session.Receiver) {
      delete req.session.Receiver;
    }
    // If accessing receiver routes, clear donor session
    if (req.path.startsWith('/api/receiver') && req.session.Donor) {
      delete req.session.Donor;
    }
  }
  next();
});

// ✅ Use Routes
app.use("/api/receiver", receiverRoutes);
app.use("/api/donor", donorRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/notifications", notificationRoutes);

// ✅ Server Homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "home.html"));
});

// ✅ Logout Route
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

// ✅ Error Handling Middleware (for production)
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({ success: false, message: "Something went wrong!" });
});

// ✅ Use morgan for logging requests in production
if (process.env.NODE_ENV === "production") {
  app.use(morgan("combined"));
} else {
  app.use(morgan("dev"));
}

// ✅ Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
