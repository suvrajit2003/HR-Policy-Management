const express = require("express");
const router = express.Router();
const Employee = require("../models/Employee");

// POST: Add new employee
router.post("/add", async (req, res) => {
  try {
    const { name, email, phone, address, date_of_joining, salary } = req.body;

    const newEmployee = new Employee({
      name,
      email,
      phone,
      address,
      date_of_joining,
      salary
    });

    await newEmployee.save();
    res.status(201).json({ message: "Employee added successfully" });
  } catch (error) {
    console.error("Error adding employee:", error);
    res.status(500).json({ error: "Server error while adding employee" });
  }
});

router.get('/', async (req, res) => {
    if (req.user.role !== 'hr' && req.user.role !== 'superadmin' && req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'पहुंच अस्वीकृत। केवल HR/एडमिन सभी कर्मचारियों को देख सकते हैं।' });
    }
    try {
        const employees = await Employee.find().select('-password'); // पासवर्ड को छोड़कर सब कुछ लाएँ
        res.json(employees);
    } catch (err) {
        console.error('सभी कर्मचारियों को प्राप्त करने में त्रुटि:', err.message);
        res.status(500).send('सर्वर त्रुटि');
    }
});

// कर्मचारी को नाम से खोजने का रूट (HR/एडमिन/सुपरएडमिन किसी को भी, कर्मचारी केवल खुद को)
router.get('/find-by-name', async (req, res) => {
    const { name } = req.query; // क्वेरी पैरामीटर से नाम प्राप्त करें
    const { role: userRoleFromToken, id: userIdFromToken } = req.user; // auth मिडलवेयर से उपयोगकर्ता की भूमिका और ID

    if (!name) {
        return res.status(400).json({ msg: 'कृपया खोजने के लिए कर्मचारी का नाम प्रदान करें।' });
    }

    try {
        let employees;

        if (userRoleFromToken === 'hr' || userRoleFromToken === 'superadmin' || userRoleFromToken === 'admin') {
            // HR/सुपरएडमिन/एडमिन सभी कर्मचारियों को नाम से खोज सकते हैं (केस-असंवेदनशील)
            employees = await Employee.find({ name: { $regex: new RegExp(name, 'i') } }).select('-password');
        } else if (userRoleFromToken === 'employee') {
            // सामान्य कर्मचारी केवल अपना ही डेटा देख सकते हैं
            employees = await Employee.find({ _id: userIdFromToken, name: { $regex: new RegExp(name, 'i') } }).select('-password');
            if (employees.length === 0) {
                return res.status(403).json({ msg: 'आप केवल अपनी जानकारी खोज सकते हैं। नाम आपके रिकॉर्ड से मेल नहीं खाता।' });
            }
        } else {
            return res.status(403).json({ msg: 'इस कार्रवाई को करने के लिए आपके पास पर्याप्त अनुमति नहीं है।' });
        }

        if (!employees || employees.length === 0) {
            return res.status(404).json({ msg: 'इस नाम से कोई कर्मचारी नहीं मिला।' });
        }

        res.json(employees);

    } catch (err) {
        console.error("कर्मचारी खोज त्रुटि:", err.message);
        res.status(500).send('सर्वर त्रुटि।');
    }
});


module.exports = router;
