const mongoose = require("mongoose");

const salaryIncrementSchema = new mongoose.Schema({
  name: String,
  date_of_joining: Date,
  current_salary: Number,
  performance_rating: Number,
});
module.exports = mongoose.model("SalaryIncrement", salaryIncrementSchema);
