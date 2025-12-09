const express = require('express');
const router = express.Router();
const Leave = require('../models/Leave');
const auth = require('../middleware/auth');
const moment = require('moment');

// ✅ WORKING: Get leaves for logged-in user
router.get('/user-leaves', auth, async (req, res) => {
  try {
    const leaves = await Leave.find({ employee: req.user.id })
                            .sort({ createdAt: -1 });

    const formattedLeaves = leaves.map(leave => ({
      _id: leave._id,
      leaveType: leave.leaveType,
      startDate: moment(leave.startDate).format('YYYY-MM-DD'),
      endDate: moment(leave.endDate).format('YYYY-MM-DD'),
      reason: leave.reason,
      numberOfDays: leave.numberOfDays,
      status: leave.status,
      fineAmount: leave.fineAmount,
      isFineApplicable: leave.isFineApplicable,
      appliedOn: moment(leave.createdAt).format('DD/MM/YYYY')
    }));

    res.json(formattedLeaves);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaves' });
  }
});

// ✅ WORKING: Apply for leave
// ✅ WORKING: Apply for leave
router.post('/apply-leave', auth, async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    const employee = await Employee.findById(req.user.id);

    // Calculate business days (exclude weekends)
    let days = 0;
    let current = moment(startDate);
    while (current.isSameOrBefore(endDate)) {
      if (current.day() !== 0 && current.day() !== 6) days++;
      current.add(1, 'day');
    }

    // Check monthly leave limit (2 leaves per month)
    const monthStart = moment().startOf('month');
    const monthEnd = moment().endOf('month');
    
    const monthlyLeaves = await Leave.countDocuments({
      employee: req.user.id,
      startDate: { $gte: monthStart, $lte: monthEnd },
      status: 'Accepted'
    });

    const isFineApplicable = monthlyLeaves >= 2;
    const fineAmount = isFineApplicable ? days * 200 : 0;

    const newLeave = new Leave({
      employee: req.user.id,
      employeeName: employee.name,
      leaveType,
      startDate,
      endDate,
      reason,
      numberOfDays: days,
      status: 'Pending',
      fineAmount,
      isFineApplicable
    });

    await newLeave.save();
    res.status(201).json({ 
      success: true,
      leave: newLeave
    });

  } catch (err) {
    res.status(500).json({ error: 'Failed to apply leave' });
  }
});


router.get('/balance/:employeeId', auth, async (req, res) => {
  try {
    const balance = await calculateLeaveBalance(req.params.employeeId);
    res.json(balance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/review/:id', auth, async (req, res) => {
  try {
    const { status, message } = req.body;
    const leave = await Leave.findByIdAndUpdate(req.params.id, {
      status,
      message,
      reviewedBy: req.user.id,
      reviewedAt: Date.now()
    }, { new: true });

    // If approved and fine is applicable, deduct from salary
    if (status === 'Accepted' && leave.isFineApplicable) {
      await axios.post(`${API_BASE_URL}/api/salary/deduct-fine`, {
        employeeId: leave.employee,
        amount: leave.fineAmount,
        reason: `Leave fine for ${leave.numberOfDays} days`
      }, {
        headers: { 'Authorization': `Bearer ${req.token}` }
      });
    }

    res.json(leave);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

