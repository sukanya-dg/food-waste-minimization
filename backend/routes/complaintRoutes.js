const express = require("express");
const router = express.Router();
const Complaint = require("../models/Complaint");
const Notification = require("../models/Notification");

router.post("/raise", async (req, res) => {
  console.log("Complaint route, full session data:", req.session);
  console.log("Request headers:", req.headers);

  // Check if the logged-in user is a donor or receiver.
  let loggedUser;
  let userType;

  // Check session for both donor and receiver
  if (req.session.Receiver) {
    loggedUser = req.session.Receiver;
    userType = "receiver";
    console.log("Complaint raised by receiver:", loggedUser);
  } else if (req.session.Donor) {
    loggedUser = req.session.Donor;
    userType = "donor";
    console.log("Complaint raised by donor:", loggedUser);
  } else {
    console.log("No valid session found. Session data:", req.session);
    return res.status(401).json({ success: false, message: "User not logged in" });
  }

  // Destructure the fields from the request body.
  const { title, description, ticketId } = req.body;
  console.log("Received complaint data:", {
    title,
    description,
    ticketId,
    userId: loggedUser.id,
    userType
  });

  try {
    // Create a new complaint using the logged-in user's info.
    const newComplaint = new Complaint({
      ticketId,
      title,
      description,
      userId: loggedUser.id,
      userType,
      status: "Open",
      createdAt: new Date()
    });

    await newComplaint.save();
    console.log("Complaint saved successfully:", {
      _id: newComplaint._id,
      ticketId: newComplaint.ticketId,
      userId: newComplaint.userId,
      userType: newComplaint.userType,
      title: newComplaint.title
    });
    return res.status(201).json({ success: true, message: "Complaint submitted successfully" });
  } catch (error) {
    console.error("Error raising complaint:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

router.get("/all", async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 });
    console.log("Fetched complaints:", complaints);  // Log the fetched complaints
    res.json({ success: true, complaints });
  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).json({ success: false, message: "Failed to fetch complaints" });
  }
});

router.put("/update/:id", async (req, res) => {
  const { id } = req.params;
  const { status, reply, sender } = req.body;

  try {
    const complaint = await Complaint.findById(id);
    if (!complaint) return res.status(404).json({ success: false, message: "Complaint not found" });

    console.log("Updating complaint:", {
      complaintId: id,
      userId: complaint.userId,
      userType: complaint.userType,
      status,
      reply,
      sender
    });

    // Update status
    complaint.status = status || complaint.status;

    // Add new reply if provided
    if (reply) {
      complaint.replies.push({
        sender: sender || 'agent',
        message: reply,
        timestamp: new Date()
      });

      // Create notification only if the reply is from an agent
      if (sender === 'agent') {
        const notification = new Notification({
          userId: complaint.userId,  // This is the ID of the user who raised the complaint
          userType: complaint.userType,  // This is the type of user who raised the complaint
          ticketId: complaint.ticketId,
          message: `New reply on your complaint ${complaint.ticketId}`,
          read: false,
          timestamp: new Date()
        });

        console.log("Creating notification for:", {
          userId: notification.userId,
          userType: notification.userType,
          ticketId: notification.ticketId,
          complaintUserId: complaint.userId,
          complaintUserType: complaint.userType
        });

        try {
          await notification.save();
          console.log("Notification saved successfully for user:", {
            userId: notification.userId,
            userType: notification.userType,
            complaintUserId: complaint.userId,
            complaintUserType: complaint.userType
          });
        } catch (error) {
          console.error("Error saving notification:", error);
          // Continue with complaint update even if notification fails
        }
      }
    }

    await complaint.save();

    res.json({
      success: true,
      message: "Complaint updated successfully",
      complaint: complaint
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ success: false, message: "Failed to update complaint" });
  }
});

// Get notifications for a user
router.get("/notifications", async (req, res) => {
  console.log("Notifications route, full session data:", req.session);
  console.log("Request headers:", req.headers);

  let loggedUser;
  let userType;

  // Check session for both donor and receiver
  if (req.session.Receiver) {
    loggedUser = req.session.Receiver;
    userType = "receiver";
    console.log("Fetching notifications for receiver:", loggedUser.id);
  } else if (req.session.Donor) {
    loggedUser = req.session.Donor;
    userType = "donor";
    console.log("Fetching notifications for donor:", loggedUser.id);
  } else {
    console.log("No valid session found. Session data:", req.session);
    return res.status(401).json({ success: false, message: "User not logged in" });
  }

  try {
    const notifications = await Notification.find({
      userId: loggedUser.id,
      userType: userType
    }).sort({ timestamp: -1 });

    console.log("Found notifications:", notifications.length, "for", userType, loggedUser.id);
    res.json({ success: true, notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
});

// Mark notification as read
router.put("/notifications/:id/read", async (req, res) => {
  const { id } = req.params;

  try {
    const notification = await Notification.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.json({ success: true, notification });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ success: false, message: "Failed to update notification" });
  }
});

module.exports = router;
