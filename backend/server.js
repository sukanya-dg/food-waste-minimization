const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const session = require("express-session");
const bodyParser = require("body-parser");
const receiverRoutes = require("./routes/receiverRoutes");
const donorRoutes = require("./routes/donorRoutes");
const customerRoutes = require("./routes/customerRoutes");
const fssaiVerificationRoute = require("./routes/fssaiVerification");
const db = require("./db"); // ✅ Import MySQL connection from db.js

dotenv.config();

const app = express();

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

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
app.use("/api/donor", fssaiVerificationRoute); // ✅ Fixed duplicate route issue
app.use("/api/customer", customerRoutes);

// ✅ Server Homepage
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "home.html"));
});

// ✅ Logout Route
app.get("/logout", (req, res) => {
    req.session.destroy(() => res.redirect("/"));
});
// Show all databases
app.get('/showdatabase', (req, res) => {
    db.query('SHOW DATABASES', (err, results) => {
      if (err) return res.status(500).send(err);
      res.json(results);
    });
  });
  
  // Show tables in a database
  app.get('/showdatabase/:dbname', (req, res) => {
    const dbName = req.params.dbname;
    db.query(`SHOW TABLES FROM ??`, [dbName], (err, results) => {
      if (err) return res.status(500).send(err);
      res.json(results);
    });
  });
  
  // Show records in a table
  app.get('/showdatabase/:dbname/:tablename', (req, res) => {
    const { dbname, tablename } = req.params;
    db.query(`SELECT * FROM ?? . ??`, [dbname, tablename], (err, results) => {
      if (err) return res.status(500).send(err);
      res.json(results);
    });
  });

// ✅ Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
