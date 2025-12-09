const mongoose = require('mongoose');

const SalaryComponentSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 50
  },
  type: { 
    type: String, 
    enum: ['earning', 'deduction'], 
    required: true,
    default: 'earning'
  },
  calculateDays: {  // Add this new field
    type: Boolean,
    default: false
  },
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
SalaryComponentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('SalaryComponent', SalaryComponentSchema);