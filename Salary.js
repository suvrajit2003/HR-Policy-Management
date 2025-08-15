const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
  employee: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    name: {
      type: String,
      required: true
    }
  },
  month: {
    type: String,
    enum: ['January', 'February', 'March', 'April', 'May', 'June', 
           'July', 'August', 'September', 'October', 'November', 'December'],
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  components: [{
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['flat', 'percentage'],
      required: true
    },
    value: Number,
    percent: Number,
    amount: {
      type: Number,
      required: true
    },
    isDeduction: {
      type: Boolean,
      default: false
    }
  }],
  basicSalary: {
    type: Number,
    required: true
  },
  grossSalary: {
    type: Number,
    required: true
  },
  netSalary: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'approved', 'paid', 'cancelled'],
    default: 'approved'
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

// Add compound index to ensure only one salary per employee per month/year
salarySchema.index({ 'employee.id': 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Salary', salarySchema);