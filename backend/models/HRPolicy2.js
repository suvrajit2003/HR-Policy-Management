const mongoose = require('mongoose');

const HRPolicySchema = new mongoose.Schema({
  leaveTypes: [{
    type: {
      type: String,
      required: true,
      trim: true
    },
    mode: {
      type: String,
      enum: ['Free', 'Paid'],
      default: 'Free'
    },
    frequency: {
      type: String,
      enum: ['Monthly', 'Yearly'],
      default: 'Monthly'
    },
    maxPerRequest: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    normalDays: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
HRPolicySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('HRPolicy2', HRPolicySchema);