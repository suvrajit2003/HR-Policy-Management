const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const employeeSchema = new mongoose.Schema({
  // Personal Information
  name: {
    type: String,
    required: [true, "Employee name is required"],
    trim: true
  },
  
  // Contact Information
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, "Please provide a valid email"]
  },
  phone: {
    type: String,
    required: [true, "Phone number is required"]
  },
  address: String,

  // Employment Details
  date_of_joining: {
    type: String, // Keeping as String to match your existing data
    required: true
  },
  salary: {
    type: Number,
    required: true
  },
  level: String,
  experience: Number,
  role: {
    type: String,
    default: "employee", // values: 'employee', 'hr', 'admin'
    enum: ['employee', 'hr', 'admin']
  },

  // Leave Management
  annualLeaveLimit: { 
    type: Number, 
    default: 20 
  },
  leavesTaken: { 
    type: Number, 
    default: 0 
  },
  lastLeaveResetYear: { 
    type: Number, 
    default: new Date().getFullYear() 
  },
  fine: { 
    type: Number, 
    default: 0 
  },
  leaveBalances: [
    {
      leaveType: String,
      totalAllowed: Number,
      used: Number,
      remaining: Number,
      year: Number
    }
  ],

  // Attendance Settings
  attendanceSettings: {
    workingDays: {
      type: [Number], // 0-6 (Sunday-Saturday)
      default: [1, 2, 3, 4, 5] // Monday-Friday by default
    },
    workingHours: {
      start: {
        type: String, // "09:00"
        default: "09:00"
      },
      end: {
        type: String, // "18:00"
        default: "18:00"
      }
    },
    timezone: {
      type: String,
      default: "Asia/Kolkata"
    }
  },
  lastAttendanceReset: {
    type: Date,
    default: Date.now
  },

  // Authentication
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"],
    select: false
  },
  otp: {
    type: String,
    select: false
  },
  otpExpiresAt: {
    type: Date,
    select: false
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

employeeSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to compare passwords
employeeSchema.methods.correctPassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Employee = mongoose.model("Employee", employeeSchema);

module.exports = Employee;