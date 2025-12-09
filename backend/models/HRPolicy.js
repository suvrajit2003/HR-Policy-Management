const mongoose = require("mongoose");
const HRPolicySchema = new mongoose.Schema({
  title: { type: String, required: true },
  eligibility: [String],
  appraisal_process: [String],
  criteria: [
    {
      rating: String, // e.g., "5"
      label: String, // e.g., "Outstanding"
      increment_range: String, // e.g., "10% - 15%"
    },
  ],
  special_increments: [
    {
      milestone: String,
      details: [String],
    },
  ],
});
const HrPolicy = mongoose.model("HrPolicy", HRPolicySchema);
module.exports = HrPolicy;
