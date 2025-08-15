const mongoose = require('mongoose');

const salarySlipSchema = new mongoose.Schema({
  month: String,
  year: String,
  generatedAt: Date,
  companyLogo:String,
  slips: [{
    employeeID: mongoose.Schema.Types.ObjectId,
    employeeName: String,
    totalWorkingDays: Number,
    paidLeaves: Number,
    unpaidLeaves: Number,
    baseSalary: Number, 
    grossSalary: Number,
    deductionAmount: Number,
    netSalary: Number,
    status: String,
    errorMessage: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('SalarySlip', salarySlipSchema);