'use strict';

const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
   taskName: { type: String, required: true },
  duration: { type: Number, required: true },
  employeeName: { type: String, required: true }, // Will be used as assignedToName
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee', // Used as assignedTo
    required: true,
  },
  startedAt: { type: Date, default: null },
  pausedAt: { type: Date, default: null },
  finishedIn: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'started', 'paused', 'completed'],
    default: 'pending',
  },
  rating: { type: Number, min: 1, max: 5, default: null },
  completedAt: { type: Date, default: null },
});


const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
