const mongoose = require('mongoose');

const LeaveSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  employeeName: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  leaveType: {
    type: String,
    required: true,
    enum: ['EL', 'CL', 'SL', 'LWP', 'Hospital']
  },
  // Add mode field here
  mode: {
    type: String,
    required: true,
    enum: ['Paid', 'Free'],
    default: function() {
      // Set default mode based on leaveType
      if (this.leaveType === 'LWP') return 'Free';
      return 'Paid'; // All other types are paid by default
    }
  },
  requestedDays: {
    type: Number,
    required: true,
    min: 1
  },
  approvedDays: {
    type: Number,
    default: 0
  },
  approvedEndDate: Date,
  workingDays: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Denied'],
    default: 'Pending'
  },
  hrMessage: {
    type: String,
    default: ''
  },
  isFineApplicable: {
    type: Boolean,
    default: false
  },
  fineAmount: {
    type: Number,
    default: 0
  },
  paidDays: {
    type: Number,
    default: 0
  },
  lwpDays: {
    type: Number,
    default: 0
  },
  hrViewed: {
    type: Boolean,
    default: false
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  reviewedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
LeaveSchema.index({ employee: 1 });
LeaveSchema.index({ status: 1 });
LeaveSchema.index({ startDate: 1 });
LeaveSchema.index({ endDate: 1 });

module.exports = mongoose.model('Leave', LeaveSchema);