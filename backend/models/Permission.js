// models/Permission.js
const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
  operations: [
    {
      code: String,
      access: Boolean,
    },
  ],
});
module.exports = mongoose.model("Permission", permissionSchema);
