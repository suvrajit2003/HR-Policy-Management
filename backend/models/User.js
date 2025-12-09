// for login and role hanfdling
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: {
    type: String,
    otp: String,
    otpExpiresAt: Date,
    enum: ["SuperAdmin","user"],
    default:'user',
    required: true,
  },
  annualLeaveLimit: { // Total leave days allowed per year
        type: Number,
        default: 15 // As per your requirement
    },
    leavesTaken: { // Leaves taken in the current year
        type: Number,
        default: 0
    },
    // You might want to add 'lastLeaveResetYear' to handle annual resets
    lastLeaveResetYear: {
        type: Number,
        default: new Date().getFullYear() // Initialize with current year
    }
});

module.exports = mongoose.model("user", userSchema);
