// routes/attendance.js or inside your main app.js
const express = require("express");
const router = express.Router();
const Attendance = require("../models/Attendance");

router.get("/attendance", async (req, res) => {
  try {
    const data = await Attendance.find().populate("employeeId"); // Optional: join employee details
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Error fetching attendance", error });
  }
});

module.exports = router;