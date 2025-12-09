const mongoose = require("mongoose");
const IndividualSchema = new mongoose.Schema({
  name: String,
  password: number,
});
module.exports = mongoose.model("Employee", IndividualSchema);
