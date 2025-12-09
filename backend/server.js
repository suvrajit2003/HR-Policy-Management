const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Permission = require("./models/Permission");
const HrPolicy = require("./models/HRPolicy");
const SalaryIncrement = require("./models/SalaryIncrement");
const Employee = require("./models/Employee");
const Task = require("./models/Task");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const nodemailer = require("nodemailer");
const moment = require("moment"); // For date manipulation
const jwt = require("jsonwebtoken");
const Leave = require("./models/Leave");
const HRPolicy2 = require("./models/HRPolicy2");
const Attendance = require('./models/Attendance');
const attendanceRoutes = require("./routes/attendanceRoutes"); 
const SalarySlip = require('./models/SalarySlip');
const SalaryComponent = require('./models/SalaryComponent');
const Salary = require('./models/Salary');
require('dotenv').config();


async function generateHash() {
    const plainPassword = "123"; // <-- REPLACE WITH YOUR DESIRED ADMIN PASSWORD
    const salt = await bcrypt.genSalt(10); // Generate a salt
    const hashedPassword = await bcrypt.hash(plainPassword, salt); // Hash the password
    console.log("Hashed Password:", hashedPassword);
}

generateHash();

const authenticate = (req, res, next) => {
  // Check for token in either Authorization header or x-auth-token header
  const token = req.headers['x-auth-token'] || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);
  
  if (!token) {
    return res.status(401).json({ 
      message: 'No authentication token provided',
      code: 'MISSING_AUTH_TOKEN'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded.user || !decoded.user.id) {
      return res.status(401).json({
        message: 'Invalid token payload',
        code: 'INVALID_TOKEN_PAYLOAD'
      });
    }
    
    req.user = decoded.user;
    next();
  } catch (err) {
    let message = 'Invalid token';
    let code = 'INVALID_TOKEN';
    
    if (err.name === 'TokenExpiredError') {
      message = 'Token expired';
      code = 'TOKEN_EXPIRED';
    } else if (err.name === 'JsonWebTokenError') {
      message = 'Malformed token';
      code = 'MALFORMED_TOKEN';
    }
    
    return res.status(401).json({ message, code });
  }
};


const app = express();
app.use(cors());
app.use(express.json());

const otpStore = {};



mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/employeeDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("MongoDB connected for attandance");

    try {
      const attendanceCount = await Attendance.countDocuments();

      if (attendanceCount === 0) {
        await Attendance.insertMany(data);
        console.log("Dummy attendance data added successfully");
      } else {
        console.log("Attendance data already exists, skipping insertion");
      }
    } catch (err) {
      console.error("Error seeding attendance data:", err);
    }
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

const employeeSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String, // "employee" or "hr"
});


const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  role: String, // "admin"
// });
// const User = mongoose.model('User', userSchema);

// Store OTP temporarily in memory
// const otpStore = {} // { email: otp }
})

function getAllDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
}

function getWorkingDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) )throw new Error('Invalid start date');
  if (isNaN(end.getTime())) throw new Error('Invalid end date');

  if (start > end) {
    [start, end] = [end, start];
  }

  let count = 0;
  const current = new Date(start);
  
  while (current <= end) {
    count++; // Count EVERY day (including Sundays)
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

function calculateWorkingDays(startDate, endDate) {
  let count = 0;
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) { // Skip weekends
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

// Connect MongoDB
mongoose.connection.once("open", async () => {
  console.log("connected");
  const existing = await HrPolicy.find();
  if (existing.length === 0) {
    await HrPolicy.create({
      title: "Annual Performance-Based Increments",
      eligibility: [
        "Employees who have completed 12 months of service as of the appraisal cut-off date.",
        "No increment during probation period, unless mentioned in offer letter.",
      ],
      appraisal_process: [
        "Self-Appraisal Submission",
        "Manager Review",
        "HR Calibration and Review",
        "Final Approval by Management",
      ],
      criteria: [
        { rating: "5", label: "Outstanding", increment_range: "10% - 15%" },
        {
          rating: "4",
          label: "Exceeds Expectations",
          increment_range: "5% - 10%",
        },
        {
          rating: "3",
          label: "Meets Expectations",
          increment_range: "3% - 5%",
        },
        { rating: "2", label: "Average", increment_range: "2% - 3%" },
        { rating: "1", label: "General", increment_range: "1%" },
      ],
      special_increments: [
        {
          milestone: "5-Year Completion",
          details: [
            "One-time 10%-15% increment after 5 years",
            "Performance must be Meets Expectations or higher",
            "Effective after 5 years of service",
          ],
        },
        {
          milestone: "10-Year Milestone",
          details: [
            "One-time 15%-25% increment",
            "Given in recognition of long-term contribution",
            "May be accompanied by certificate/award",
          ],
        },
        {
          milestone: "15-Year Milestone",
          details: [
            "One-time 30%-45% increment",
            "Given in recognition of long-term contribution",
            "May be accompanied by certificate/award",
          ],
        },
      ],
    });
  }
});


app.use("/api", attendanceRoutes);

const sessions = {}; // { sessionId: { id, name, email, role } }

// Middleware to authenticate requests using a session ID
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const sessionId = authHeader && authHeader.split(' ')[1]; // Expects "Bearer <sessionId>"

    if (!sessionId) {
        return res.status(401).json({ message: 'Authentication required. No session ID provided.' });
    }

    if (sessions[sessionId]) {
        req.user = sessions[sessionId]; // Attach user info to request
        next();
    } else {
        res.status(403).json({ message: 'Invalid or expired session ID. Please log in again.' });
    }
};

// Middleware to authorize based on user role
const authorizeRoles = (allowedRoles) => (req, res, next) => {
    if (!req.user || !req.user.role) {
        return res.status(403).json({ message: 'Authorization denied: User role not found.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: `Access denied. Requires one of: ${allowedRoles.join(', ')} roles.` });
    }
    next();
};



// Resets annual leaves for an employee if a new year has started since last reset
const resetAnnualLeavesIfNewYear = async (employee) => {
    const currentYear = new Date().getFullYear();
    if (employee.lastLeaveResetYear !== currentYear) {
        employee.leavesTaken = 0;
        employee.lastLeaveResetYear = currentYear;
        await employee.save();
        console.log(`Annual leaves reset for employee ${employee.name} for year ${currentYear}`);
    }
    return employee; // Return the potentially updated employee object
};



app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000);

  // Check if email exists in either Employee or User
  const employee = await Employee.findOne({ email });
  const user = await User.findOne({ email });

  if (!employee && !user) {
    return res.status(404).json({ error: 'User not found' });
  }

  otpStore[email] = otp;
  console.log(`OTP for ${email}: ${otp}`); // Simulate email sending

  res.json({ message: 'OTP sent successfully (check console)' });
});

// Verify OTP and Reset Password API
app.post('/api/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (!otpStore[email]) {
    return res.status(400).json({ error: 'No OTP sent to this email' });
  }

  if (otpStore[email] != otp) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  return res.status(200).json({ message: 'OTP verified successfully' });
});

app.get('/api/performance/:employeeId', async (req, res) => { // Changed to employeeId
    const { employeeId } = req.params; // Get employeeId from URL
    try {
        // Find all completed tasks for the given employeeId
        // Ensure employeeId is treated as an ObjectId for the query
        const tasks = await Task.find({ employeeId: new mongoose.Types.ObjectId(employeeId), status: 'completed' });

        // The frontend expects 'completionDate' and 'rating'.
        // Your schema has 'completedAt'. We map it to 'completionDate'.
        const processedTasks = tasks.map(task => ({
            ...task.toObject(), // Convert Mongoose document to plain JS object
            completionDate: task.completedAt // Use completedAt directly as it's the completion date
        }));

        if (processedTasks.length > 0) {
            res.status(200).json(processedTasks);
        } else {
            res.status(200).json([]); // Return empty array if no tasks found
        }
    } catch (error) {
        console.error('Error fetching performance data:', error);
        // If the employeeId is not a valid ObjectId, Mongoose will throw an error.
        // Handle this gracefully.
        if (error.name === 'CastError' && error.path === '_id') {
            return res.status(400).json({ message: 'Invalid Employee ID format.' });
        }
        res.status(500).json({ message: 'Server error fetching performance data.' });
    }
});

app.post("/api/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!otpStore[email]) {
    return res.status(400).json({ error: "OTP not sent" });
  }

  if (String(otpStore[email]) !== String(otp)) {
    return res.status(400).json({ error: "Invalid OTP" });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    console.log("Reset request for:", normalizedEmail);

    const user = await Employee.findOne({ email: normalizedEmail });
    console.log("Found user:", user);

    if (!user) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log("New hashed password:", hashedPassword);

    user.password = hashedPassword;
    await user.save();

    delete otpStore[email];

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});  

app.put("/employees/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const updated = await Employee.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});




app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
    }

    try {
        let userFound = null;
        let loginRole = null;

        // 1. First try to find as SuperAdmin (from User collection)
        const superAdmin = await User.findOne({ email });
        
        if (superAdmin) {
            // For SuperAdmin, we only accept bcrypt hashed passwords
            const isMatch = await bcrypt.compare(password, superAdmin.password);
            if (isMatch) {
                userFound = superAdmin;
                loginRole = superAdmin.role.toLowerCase();
            }
        }

        // 2. If not found as SuperAdmin, try as Employee/HR
        if (!userFound) {
            const employee = await Employee.findOne({ email });
            if (employee) {
                if (employee.role !== "hr" && employee.role !== "employee") {
                    return res.status(403).json({ error: "Access denied: Invalid role" });
                }

                let isMatch = false;
                
                // First check if password exists and is a string
                if (employee.password && typeof employee.password === 'string') {
                    // Check bcrypt hash if password looks hashed
                    if (employee.password.startsWith('$2b$')) {
                        isMatch = await bcrypt.compare(password, employee.password);
                    } else {
                        // Fallback to default password if bcrypt fails
                        const defaultPassword = (employee.name.substring(0, 3) + "123").toLowerCase();
                        isMatch = (password.toLowerCase() === defaultPassword);
                    }
                } else {
                    // Handle case where password is missing or invalid
                    const defaultPassword = (employee.name.substring(0, 3) + "123").toLowerCase();
                    isMatch = (password.toLowerCase() === defaultPassword);
                }

                if (isMatch) {
                    userFound = employee;
                    loginRole = employee.role;
                }
            }
        }

        // 3. If user authenticated, generate token
        if (userFound) {
            const payload = {
                user: {
                    id: userFound._id,
                    name: userFound.name,
                    role: loginRole,
                    email: userFound.email
                }
            };

            jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: '1h' },
                (err, token) => {
                    if (err) {
                        console.error("JWT error:", err);
                        return res.status(500).json({ error: "Token generation failed" });
                    }
                    res.json({
                        message: "Login successful",
                        token,
                        user: payload.user
                    });
                }
            );
        } else {
            res.status(401).json({ error: "Invalid credentials" });
        }

    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Server error during login" });
    }
});



const createUser = async () => {
  try {
    const existingUser = await User.findOne({ email: "test@gmail.com" });
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash("123", 10);
      const user = new User({
        name: "Test",
        email: "test@gmail.com",
        password: hashedPassword,
        role: "SuperAdmin",
      });
      await user.save();
      console.log("Test user created");
      
    }
  } catch (err) {
    console.error("Error creating test user:", err);
  }
};
createUser();


// Create or update permissions
app.post("/permissions/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { operations } = req.body;

    let perm = await Permission.findOne({ userId });
    if (!perm) {
      perm = new Permission({ userId, operations });
    } else {
      perm.operations = operations;
    }

    await perm.save();
    res.status(200).json({ message: "Permissions updated", perm });
  } catch (err) {
    res.status(500).json({ error: "Error saving permissions" });
  }
});


app.get('/api/all_performance', async (req, res) => {
  try {
    const allCompletedTasks = await Task.find({ status: 'completed' })
      .select('employeeId employeeName rating completedAt');

    // Map to match frontend expectations
    const formattedTasks = allCompletedTasks
      .filter(task => task.rating && task.completedAt && task.employeeId && task.employeeName)
      .map(task => ({
        _id: task._id,
        rating: task.rating,
        completedAt: task.completedAt,
        assignedTo: task.employeeId, // backend: employeeId
        assignedToName: task.employeeName, // backend: employeeName
      }));

    res.status(200).json(formattedTasks);
  } catch (error) {
    console.error("Error fetching all performance data:", error);
    res.status(500).json({ error: "Failed to fetch performance data" });
  }
});




app.get("/employees", async (req, res) => {
  try {
    const searchTerm = req.query.searchTerm || ""; // Will come as 'searchTerm' from the frontend
    let query = {};

    if (searchTerm) {
      const searchRegex = new RegExp(searchTerm, "i"); // For case-insensitive search

      // Check if the search term is a number (for salary)
      const isNumeric = !isNaN(Number(searchTerm));

      query = {
        $or: [
          { name: { $regex: searchRegex } },
          { email: { $regex: searchRegex } },
          { phone: { $regex: searchRegex } },
          { address: { $regex: searchRegex } },
          // Searching date_of_joining directly with regex can be tricky as it's a Date object.
          // If you store dates also as a string or implement date range search, it would be better.
          // For now, we'll attempt to match it as a string with regex.
          { date_of_joining: { $regex: searchRegex } },
        ],
      };

      // If the search term is numeric, also add the salary field to the $or query
      if (isNumeric) {
        query.$or.push({ salary: Number(searchTerm) });
      }
    }

    const employees = await Employee.find(query);
    res.json(employees);
  } catch (err) {
    console.error("Error fetching employees:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/employees/add", async (req, res) => {
  try {
    // Auto-generate password: first 3 letters of name + '@123'
    const plainPassword = req.body.name.substring(0, 3).toLowerCase() + "@123";
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

    // Create employee with hashed password
    const employee = new Employee({
      ...req.body,
      password: hashedPassword,
    });
    await employee.save();

    const doj = new Date(employee.date_of_joining);
    const today = new Date();
    const experienceInYears = (today - doj) / (1000 * 60 * 60 * 24 * 365);

    let rating = 1;
    if (experienceInYears >= 5) rating = 5;
    else if (experienceInYears >= 3) rating = 4;
    else if (experienceInYears >= 2) rating = 3;
    else if (experienceInYears >= 1) rating = 2;

    await SalaryIncrement.create({
      name: employee.name,
      date_of_joining: employee.date_of_joining,
      current_salary: employee.salary,
      performance_rating: rating,
    });

    res.status(201).json({ message: "Employee added successfully" });
  } catch (err) {
    res.status(500).json({ error: "Error adding employee" });
  }
});


app.delete("/employees/delete/:id", async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ error: "Employee not found" });

    await Employee.findByIdAndDelete(req.params.id);
    await SalaryIncrement.deleteMany({ name: employee.name });
    await Task.deleteMany({ employeeName: employee.name });

    res.status(200).json({ message: "Employee and related data deleted" });
  } catch (err) {
    res.status(500).json({ error: "Error deleting employee" });
  }
});
// hr
app.get("/api/special-increments", async (req, res) => {
  try {
    const employees = await Employee.find();
    const [policy] = await HrPolicy.find();
    const today = new Date();

    const all = employees.map((emp) => {
      const doj = new Date(emp.date_of_joining);
      const years =
        today.getFullYear() -
        doj.getFullYear() -
        (today.getMonth() < doj.getMonth() ||
        (today.getMonth() === doj.getMonth() &&
          today.getDate() < doj.getDate())
          ? 1
          : 0);

      // Find highest eligible milestone
      let matchedMilestone = null;
      let maxYears = 0;
      policy.special_increments.forEach((item) => {
        const match = item.milestone.match(/(\d+)-Year/);
        if (match) {
          const milestoneYears = parseInt(match[1]);
          if (years >= milestoneYears && milestoneYears > maxYears) {
            matchedMilestone = item;
            maxYears = milestoneYears;
          }
        }
      });
      return {
        name: emp.name,
        date_of_joining: emp.date_of_joining,
        years: years,
        milestone: matchedMilestone ? matchedMilestone.milestone : "Not eligible yet",
      };
    });
    res.status(200).json(all);
  } catch (err) {
    console.error("Error fetching special increment eligible employees", err);
    res.status(500).json({ error: "Server error" });
  }
});
// salary
app.get("/api/salary-increments", async (req, res) => {
  try {
    const tasks = await Task.find();
    const employees = await Employee.find();
    const [policy] = await HrPolicy.find(); // Fetch the first HR policy

    if (!policy || !policy.criteria) {
      return res.status(500).json({ error: "HR Policy criteria missing." });
    }

    const ratingCriteria = policy.criteria;

    // Step 1: Group task ratings by employee name
    const ratingMap = {};
    tasks.forEach((task) => {
      if (!ratingMap[task.employeeName]) {
        ratingMap[task.employeeName] = [];
      }
      ratingMap[task.employeeName].push(task.rating);
    });

    // Step 2: Calculate salary increments
    const result = employees.map((emp) => {
      const doj = new Date(emp.date_of_joining);
      const today = new Date();
      const experience = Math.floor(
        (today - doj) / (1000 * 60 * 60 * 24 * 365)
      );

      const ratings = ratingMap[emp.name] || [];
      const avgRating = ratings.length
        ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length)
        : 1;

      // Match rating info from HR policy
      const ratingInfo = ratingCriteria.find((c) => {
        const numericRating = parseInt(c.rating); // make sure it's comparable
        return numericRating === avgRating;
      });

      // Fallback if no match found
      const label = ratingInfo?.label || "General";
      const incrementRange = ratingInfo?.increment_range || "1%";
      const basePercent = parseInt(incrementRange.split("-")[0]) || 1;

      // Determine experience level
      let specialIncrement = 0;
      let level = "Fresher";
      if (experience >= 2 && experience < 5) level = "Mid-Level";
      else if (experience >= 5) level = "Expert";

      // Special increments from policy
      if (experience >= 15) specialIncrement = 45;
      else if (experience >= 10) specialIncrement = 25;
      else if (experience >= 5 && avgRating >= 3) specialIncrement = 15;

      const totalIncrement = basePercent + specialIncrement;
      const newSalary = Math.round(emp.salary * (1 + totalIncrement / 100));

      return {
        name: emp.name,
        level,
        experience,
        current_salary: emp.salary,
        avg_rating: avgRating,
        rating_label: label,
        base_increment: basePercent,
        special_increment: specialIncrement,
        total_increment: totalIncrement,
        new_salary: newSalary,
      };
    });

    res.status(200).json(result);
  } catch (err) {
    console.error("Failed to fetch salary increments:", err);
    res.status(500).json({ error: "Server error" });
  }
});


app.get("/task/:name", async (req, res) => {
  try {
    const tasks = await Task.find({ employeeName: req.params.name });
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});
// Get Employee by ID (used when assigning task)
app.get("/employees/:id", async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    res.status(200).json(employee);
  } catch (err) {
    console.error("Error fetching employee by ID:", err);
    res.status(500).json({ error: "Server error while fetching employee" });
  }
});

// ADD THIS to handle assigning task to employee by ID
app.post("/api/assign-task", async (req, res) => {
  try {
    const { employee_id, employee_name, task_name, duration } = req.body;
    const task = new Task({
      employeeId: employee_id,
      employeeName: employee_name,
      taskName: task_name,
      duration,
    });
    await task.save();
    res.status(201).json({ message: "Task assigned successfully", task });
  } catch (err) {
    console.error("Error assigning task:", err);
    res.status(500).json({ error: "Failed to assign task" });
  }
});

app.get("/api/tasks/:employeeId", async (req, res) => {
  try {
    const tasks = await Task.find({ employeeId: req.params.employeeId });
    res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

app.put("/task/start/:id", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found." });

    // Set startedAt to current time if it's pending or paused (resuming)
    if (task.status === 'pending' || task.status === 'paused') {
        task.startedAt = new Date();
    }
    task.status = 'started';
    task.pausedAt = null; // Clear pausedAt when starting/resuming

    await task.save(); // Save the updated task
    res.status(200).json({ message: "Task started.", task });
  } catch (err) {
    console.error("Failed to start task:", err);
    res.status(500).json({ error: "Failed to start task." });
  }
});

// PUT /task/pause/:id: Marks a task as paused and accumulates elapsed time
app.put("/task/pause/:id", async (req, res) => {
  try {
    const { currentSegmentElapsedMinutes } = req.body; // Expect current segment's elapsed time from frontend
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ error: "Task not found." });
    }
    if (task.status !== 'started' || !task.startedAt) {
      return res.status(400).json({ error: "Task is not currently started or not found." });
    }

    // Accumulate the elapsed time for the current segment
    const newFinishedIn = (task.finishedIn || 0) + parseFloat(currentSegmentElapsedMinutes);

    task.pausedAt = new Date(); // Set pausedAt to current time
    // task.startedAt = null; // Removed this line: startedAt will now retain its value when paused
    task.finishedIn = newFinishedIn.toFixed(2); // Store accumulated elapsed time
    task.status = 'paused'; // Set status to 'paused'

    await task.save(); // Save the updated task
    res.status(200).json({ message: "Task paused.", task: task }); // Corrected 'updated' to 'task'
  } catch (err) {
    console.error("Failed to pause task:", err);
    res.status(500).json({ error: "Failed to pause task." });
  }
});

// PUT /task/complete/:id: Marks a task as completed, calculates final elapsed time and rating
app.put("/task/complete/:id", async (req, res) => {
  try {
    const { elapsedMinutes } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found." });

    const targetDuration = task.duration;
    let rating = 1; // Default rating

    const actualElapsed = parseFloat(elapsedMinutes);

    if (actualElapsed <= targetDuration - 2) rating = 5;
    else if (actualElapsed <= targetDuration - 1) rating = 4;
    else if (actualElapsed <= targetDuration) rating = 3;
    else if (actualElapsed <= targetDuration + 1) rating = 2;
    else rating = 1;

    task.finishedIn = actualElapsed; // Store final elapsed time
    task.rating = rating;
    task.status = 'completed'; // Set status to 'completed'
    task.completedAt = new Date(); // Record completion timestamp

    // startedAt and pausedAt will retain their last set values as these lines are commented out.
    // task.startedAt = null;
    // task.pausedAt = null;

    await task.save();
    res.status(200).json({ message: "Task completed.", task });
  } catch (err) {
    console.error("Failed to complete task:", err);
    res.status(500).json({ error: "Failed to complete task." });
  }
});


app.post("/task/add", async (req, res) => {
  try {
    const { taskName, duration, employeeName, employeeId } = req.body;
    if (!taskName || !duration || !employeeName || !employeeId) {
      return res.status(400).json({ error: "Missing required task fields (taskName, duration, employeeName, employeeId)." });
    }

    const task = new Task({
      taskName,
      duration: parseInt(duration),
      employeeName,
      employeeId,
      status: 'pending',
      finishedIn: 0,
      startedAt: null, // Ensure these are explicitly null for a new pending task
      pausedAt: null,
      completedAt: null,
      rating: null,
    });
    await task.save();
    res.status(201).json({ message: "Task added successfully.", task });
  } catch (err) {
    console.error("Error adding task:", err.message);
    if (err.name === 'ValidationError') {
      const errors = Object.keys(err.errors).map(key => err.errors[key].message);
      return res.status(400).json({ error: "Validation failed: " + errors.join(', '), details: err.errors });
    }
    res.status(500).json({ error: "Internal Server Error: Failed to add task. Please check server logs." });
  }
});


app.get("/task/:employeeName", async (req, res) => {
  try {
    const tasks = await Task.find({ employeeName: req.params.employeeName });
    res.status(200).json(tasks);
  } catch (err) {
    console.error("Failed to fetch tasks by employee name:", err);
    res.status(500).json({ error: "Failed to fetch tasks." });
  }
});



app.delete("/task/delete/:id", async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.status(200).json({ message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete task" });
  }
});

// PUT /employees/update-role/:id
app.put("/employees/update-role/:id", async (req, res) => {
  try {
    const { role } = req.body;
    if (!["employee", "hr", "admin"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const updated = await Employee.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );

    res.status(200).json({ message: "Role updated", employee: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to update role" });
  }
});
// POST /admin/login
app.post("/admin/login", async (req, res) => {
  const { username, password } = req.body;
  if (username === "admin" && password === "admin123") {
    // Create a session id
    const sessionId = Math.random().toString(36).substring(2);
    sessions[sessionId] = "admin";
    return res.status(200).json({ message: "Login successful", sessionId });
  }
  return res.status(401).json({ error: "Invalid credentials" });
// Example protected route for superadmin
app.get("/superadmin", authMiddleware("admin"), (req, res) => {
  res.json({ message: "SuperAdmin access granted" });
});
});
// GET /task/:id
app.get("/task/:id", async (req, res) => {
  const task = await Task.findById(req.params.id);
  res.json({ task });
});

// ---------------------------- START SERVER ----------------------------
// const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

app.get("/permissions/:userId", async (req, res) => {
  try {
    const permission = await Permission.findOne({
      userId: new ObjectId(req.params.userId),
    });
    res.json(permission || {});
  } catch (err) {
    res.status(400).json({ error: "Invalid user ID" });
  }
});

app.post("/permissions", async (req, res) => {
  try {
    let { userId, operations } = req.body;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    userId = new mongoose.Types.ObjectId(userId);
    let existing = await Permission.findOne({ userId });
    if (existing) {
      existing.operations = operations;
      await existing.save();
      res.json({ message: "Permissions updated" });
    } else {
      const newPermission = new Permission({ userId, operations });
      await newPermission.save();
      res.json({ message: "Permissions created" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
// In your server.js, replace the existing /task endpoint with this:
app.get("/task", authenticate, async (req, res) => {
  try {
    const { employeeName } = req.query;
    let query = {};
    
    // If user is HR/Admin, show all tasks
    if (req.user.role === 'hr' || req.user.role === 'admin') {
      if (employeeName) {
        query.employeeName = employeeName;
      }
    } 
    // If user is employee, only show their tasks
    else if (req.user.role === 'employee') {
      const employee = await Employee.findById(req.user.id);
      if (employee) {
        query.employeeName = employee.name;
      }
    }
    
    const tasks = await Task.find(query);
    res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

app.get('/api/leave-balance/:employeeId', authenticate, async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Authorization check
    if (req.user.id !== employeeId && 
        !['hr', 'admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Unauthorized to view this balance',
        code: 'UNAUTHORIZED_ACCESS'
      });
    }

    // Get HR policy
    const policy = await HRPolicy2.findOne();
    if (!policy) {
      return res.status(404).json({ error: "HR Policy not configured" });
    }

    // Calculate current year leaves
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(`${currentYear}-01-01`);
    const yearEnd = new Date(`${currentYear}-12-31`);

    const leavesTaken = await Leave.aggregate([
      {
        $match: {
          employee: new mongoose.Types.ObjectId(employeeId),
          status: "Accepted",
          startDate: { $gte: yearStart, $lte: yearEnd },
          leaveType: { $ne: "LWP" } // Exclude unpaid leaves
        }
      },
      {
        $group: {
          _id: "$leaveType",
          daysTaken: { $sum: "$approvedDays" }
        }
      }
    ]);

    // Prepare response
    const response = {
      leaveTypes: policy.leaveTypes.map(lt => {
        const taken = leavesTaken.find(item => item._id === lt.type)?.daysTaken || 0;
        return {
          type: lt.type,
          mode: lt.mode,
          frequency: lt.frequency,
          maxPerRequest: lt.maxPerRequest,
          totalDays: lt.normalDays,
          daysTaken: taken,
          daysRemaining: lt.normalDays - taken
        };
      })
    };

    res.status(200).json(response);
  } catch (err) {
    console.error("Leave balance error:", err);
    res.status(500).json({ 
      error: "Failed to calculate leave balance",
      details: err.message 
    });
  }
});
// In server.js - update the leave apply endpoint
app.post('/api/leaves/apply', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, reason, leaveType, numberOfDays, paidDays, lwpDays, mode } = req.body; // Add mode to destructuring
    const employeeId = req.user.id;

    // First check for overlapping approved leaves
    const overlappingLeaves = await Leave.find({
      employee: employeeId,
      status: 'Accepted',
      $or: [
        { 
          startDate: { $lte: new Date(endDate) },
          $expr: {
            $gte: [
              { $ifNull: ["$approvedEndDate", "$endDate"] }, 
              new Date(startDate)
            ]
          }
        }
      ]
    });

    if (overlappingLeaves.length > 0) {
      // Check if this is a reapplication for unapproved days
      const isReapplication = req.body.isReapplication;
      
      if (!isReapplication) {
        return res.status(400).json({
          message: 'You already have approved leaves during these dates',
          overlappingLeaves,
          code: 'LEAVE_OVERLAP'
        });
      }
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const requestedDays = numberOfDays || Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const workingDays = calculateWorkingDays(start, end);

    const leave = new Leave({
      employee: employeeId,
      employeeName: req.user.name,
      startDate,
      endDate,
      reason,
      leaveType,
      mode, // Add this line to include the mode
      requestedDays,
      workingDays,
      paidDays: paidDays || 0,
      lwpDays: lwpDays || 0,
      status: 'Pending',
      approvedDays: 0,
      isReapplication: req.body.isReapplication || false
    });

    await leave.save();
    
    res.status(201).json({
      ...leave.toObject(),
      message: "Leave application submitted successfully"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
function getAllDaysExcludingSundays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid date format');
  }

  if (start > end) {
    [start, end] = [end, start];
  }

  let count = 0;
  const current = new Date(start);
  
  while (current <= end) {
    if (current.getDay() !== 0) { // Skip Sunday (day 0)
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

app.put('/api/leaves/review/:leaveId', authenticate, async (req, res) => {
    try {
        const { status, hrMessage, approvedDays } = req.body;
        const { leaveId } = req.params;

        if (!['hr', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const leave = await Leave.findById(leaveId);
        if (!leave) {
            return res.status(404).json({ message: 'Leave not found' });
        }

        if (status === 'Accepted') {
            if (!approvedDays || approvedDays < 1 || approvedDays > leave.requestedDays) {
                return res.status(400).json({ message: 'Invalid approved days count' });
            }
            
            // Calculate the approved end date based on approved days
            const startDate = new Date(leave.startDate);
            const approvedEndDate = new Date(startDate);
            approvedEndDate.setDate(startDate.getDate() + (approvedDays - 1));
            
            leave.approvedDays = approvedDays;
            leave.approvedEndDate = approvedEndDate;
            leave.unapprovedDays = leave.requestedDays - approvedDays;
        } else {
            leave.approvedDays = 0;
            leave.approvedEndDate = null;
            leave.unapprovedDays = leave.requestedDays;
        }

        leave.status = status;
        leave.hrMessage = hrMessage || `Your leave was ${status.toLowerCase()} by HR`;
        leave.reviewedBy = req.user.id;
        leave.reviewedAt = new Date();
        
        await leave.save();

        res.json({
            message: `Leave ${status.toLowerCase()} successfully`,
            leave: {
                ...leave.toObject(),
                requestedDays: leave.requestedDays,
                approvedDays: leave.approvedDays,
                unapprovedDays: leave.unapprovedDays,
                approvedEndDate: leave.approvedEndDate
            }
        });

    } catch (err) {
        console.error('Leave review error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});// Update the leave approval endpoint
// Update the leave review endpoint to handle partial approvals

app.get('/api/leaves/can-reapply/:leaveId', authenticate, async (req, res) => {
    try {
        const { leaveId } = req.params;
        const leave = await Leave.findById(leaveId);
        
        if (!leave) {
            return res.status(404).json({ message: 'Leave not found' });
        }
        
        if (leave.employee.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        
        // Check if there are unapproved days that can be reapplied for
        const canReapply = leave.status === 'Accepted' && 
                          leave.unapprovedDays > 0 && 
                          new Date(leave.endDate) > new Date();
        
        res.json({
            canReapply,
            unapprovedDays: leave.unapprovedDays,
            originalStartDate: leave.startDate,
            originalEndDate: leave.endDate
        });
        
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});
app.put('/api/leaves/review/:leaveId', authenticate, async (req, res) => {
    try {
        const { status, hrMessage, approvedDays } = req.body;
        const { leaveId } = req.params;

        if (!['hr', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const leave = await Leave.findById(leaveId);
        if (!leave) {
            return res.status(404).json({ message: 'Leave not found' });
        }

        if (status === 'Accepted') {
            if (!approvedDays || approvedDays < 1 || approvedDays > leave.requestedDays) {
                return res.status(400).json({ message: 'Invalid approved days count' });
            }
            
            // Calculate the approved end date based on approved days
            const startDate = new Date(leave.startDate);
            const approvedEndDate = new Date(startDate);
            approvedEndDate.setDate(startDate.getDate() + (approvedDays - 1));
            
            leave.approvedDays = approvedDays;
            leave.approvedEndDate = approvedEndDate;
        } else {
            leave.approvedDays = 0;
            leave.approvedEndDate = null;
        }

        leave.status = status;
        leave.hrMessage = hrMessage || `Your leave was ${status.toLowerCase()} by HR`;
        leave.reviewedBy = req.user.id;
        leave.reviewedAt = new Date();
        
        await leave.save();

        res.json({
            message: `Leave ${status.toLowerCase()} successfully`,
            leave: {
                ...leave.toObject(),
                requestedDays: leave.requestedDays,
                approvedDays: leave.approvedDays,
                approvedEndDate: leave.approvedEndDate
            }
        });

    } catch (err) {
        console.error('Leave review error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});
app.get('/api/leaves/all', authenticate, async (req, res) => {
  try {
    const leaves = await Leave.find()
      .sort({ status: -1, appliedAt: -1 })
      .lean();
      
    res.json(leaves.map(leave => ({
      ...leave,
      // Ensure both fields are included
      requestedDays: leave.requestedDays,
      approvedDays: leave.approvedDays || 0, // Default to 0 if not set
      // Keep existing fields
      days: leave.approvedDays > 0 ? `${leave.approvedDays}/${leave.requestedDays}` : leave.requestedDays
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get('/api/leave-balance', authenticate, async (req, res) => {
  try {
    // Get HR policy
    const policy = await HRPolicy2.findOne();
    if (!policy) {
      return res.status(404).json({ message: 'HR Policy not found' });
    }

    // Get employee's leave applications for current year
    const currentYear = new Date().getFullYear();
    const leaves = await Leave.find({
      employee: req.user.id,
      status: 'Accepted',
      startDate: {
        $gte: new Date(`${currentYear}-01-01`),
        $lte: new Date(`${currentYear}-12-31`)
      }
    });

    // Calculate leaves taken (only counting accepted leaves)
    const leavesTaken = leaves.reduce((sum, leave) => sum + leave.numberOfDays, 0);

    res.json({
      totalAnnualLeave: policy.totalAnnualLeave,
      monthlyLeaveLimit: policy.monthlyLeaveLimit,
      freeLeavePerYear: policy.freeLeavePerYear,
      finePerExtraLeave: policy.finePerExtraLeave,
      leavesTaken,
      remaining: policy.totalAnnualLeave - leavesTaken,
      year: currentYear
    });
  } catch (error) {
    console.error('Error fetching leave balance:', error);
    res.status(500).json({ message: 'Failed to fetch leave balance' });
  }
});

// Update your existing leave apply endpoint to include appliedAt
// In your server.js
// In your leave routes
app.get('/api/leaves/my-leaves', authenticate, async (req, res) => {
  try {
    const leaves = await Leave.find({ employee: req.user.id })
      .sort({ appliedAt: -1 })
      .lean();
      
    res.json(leaves.map(leave => ({
      ...leave,
      days: leave.approvedDays > 0 ? `${leave.approvedDays}/${leave.requestedDays}` : leave.requestedDays
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/leaves/check-overlap', authenticate, async (req, res) => {
    try {
        const { startDate, endDate, employeeId, isReapplication } = req.query;
        
        const query = {
            employee: employeeId,
            status: 'Accepted',
            $or: [
                { 
                    startDate: { $lte: new Date(endDate) },
                    $expr: {
                        $gte: [
                            { $ifNull: ["$approvedEndDate", "$endDate"] }, 
                            new Date(startDate)
                        ]
                    }
                }
            ]
        };

        // If this is a reapplication, exclude the original leave being reapplied for
        if (isReapplication === 'true' && req.query.originalLeaveId) {
            query._id = { $ne: new mongoose.Types.ObjectId(req.query.originalLeaveId) };
        }

        const overlappingLeaves = await Leave.find(query);

        res.json({
            hasOverlap: overlappingLeaves.length > 0,
            overlappingLeaves
        });
    } catch (err) {
        console.error('Error checking leave overlap:', err);
        res.status(500).json({ error: 'Error checking leave overlap' });
    }
});


// Update the leave review endpoint to handle fines and messages properly
app.put('/api/leaves/review/:leaveId', authenticate, async (req, res) => {
    try {
        const { status, hrMessage, fineAmount } = req.body; // Add fineAmount to destructuring
        const { leaveId } = req.params;

        // Only HR/Admin can approve leaves
        if (!['hr', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const leave = await Leave.findById(leaveId);
        if (!leave) {
            return res.status(404).json({ message: 'Leave not found' });
        }

        // Update leave status and messages
        leave.status = status;
        leave.hrMessage = hrMessage || `Your leave was ${status.toLowerCase()} by HR`;
        
        // Only update fine if provided
        if (typeof fineAmount !== 'undefined') {
            leave.fineAmount = fineAmount;
            leave.isFineApplicable = fineAmount > 0;
        }
        
        leave.reviewedBy = req.user.id;
        leave.reviewedAt = new Date();
        
        await leave.save();

        res.json({
            message: `Leave ${status.toLowerCase()} successfully`,
            leave
        });

    } catch (err) {
        console.error('Leave review error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});
// Add new endpoint for employee notifications
app.get('/api/leaves/notifications', authenticate, async (req, res) => {
    try {
        const leaves = await Leave.find({ 
            employee: req.user.id,
            'notification.read': false
        }).sort({ 'notification.createdAt': -1 });
        
        res.json(leaves.map(leave => leave.notification));
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/leaves/monthly-summary', authenticate, async (req, res) => {
    try {
        const currentMonth = new Date().getMonth();
        const monthStart = new Date(new Date().getFullYear(), currentMonth, 1);
        const monthEnd = new Date(new Date().getFullYear(), currentMonth + 1, 0);
        
        const leaves = await Leave.find({
            employee: req.user.id,
            status: 'Accepted',
            startDate: { $gte: monthStart, $lte: monthEnd }
        });
        
        const policy = await HRPolicy2.findOne();
        const leavesTaken = leaves.reduce((sum, leave) => sum + leave.numberOfDays, 0);
        
        res.json({
            leavesTaken,
            monthlyLimit: policy.monthlyLeaveLimit,
            remaining: Math.max(0, policy.monthlyLeaveLimit - leavesTaken)
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});


// HR Policy Routes
app.get("/hr-policy2", async (req, res) => {
  try {
    const policy = await HRPolicy2.findOne();
    if (!policy) {
      return res.status(200).json({
        leaveTypes: [],
        message: "No HR policy found, using empty defaults"
      });
    }
    res.status(200).json(policy);
  } catch (err) {
    console.error("HR Policy fetch error:", err);
    res.status(500).json({
      error: "Failed to fetch HR Policy",
      details: err.message
    });
  }
});

app.post("/hr-policy2", async (req, res) => {
  try {
    const { leaveTypes } = req.body;
    
    // Calculate total annual leave from all yearly leave types
    const totalAnnualLeave = leaveTypes.reduce((total, lt) => {
      return lt.frequency === "Yearly" ? total + lt.normalDays : total;
    }, 0);

    // Calculate monthly leave limit from monthly leave types
    const monthlyLeaveLimit = leaveTypes.reduce((total, lt) => {
      return lt.frequency === "Monthly" ? total + lt.normalDays : total;
    }, 0);

    await HRPolicy2.findOneAndUpdate(
      {},
      { leaveTypes, totalAnnualLeave, monthlyLeaveLimit },
      { upsert: true, new: true }
    );
    
    res.json({ message: "Policy saved successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to save policy" });
  }
});


// Update the leave balance endpoint to properly handle employeeId
app.get('/api/leave-balance/:employeeId', authenticate, async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Authorization check
    if (req.user.id !== employeeId && 
        !['hr', 'admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Unauthorized to view this balance',
        code: 'UNAUTHORIZED_ACCESS'
      });
    }

    // Get HR policy
    const policy = await HRPolicy2.findOne();
    if (!policy) {
      return res.status(404).json({ error: "HR Policy not configured" });
    }

    // Calculate current year leaves
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(`${currentYear}-01-01`);
    const yearEnd = new Date(`${currentYear}-12-31`);

  const leavesTaken = await Leave.aggregate([
      {
        $match: {
          employee: new mongoose.Types.ObjectId(employeeId),
          status: "Accepted",
          startDate: { $gte: yearStart, $lte: yearEnd },
          leaveType: { $ne: "LWP" } // Exclude unpaid leaves
        }
      },
      {
        $group: {
          _id: "$leaveType",
          daysTaken: { $sum: "$approvedDays" } // Changed from workingDays to approvedDays
        }
      }
    ]);

    // Prepare response
    const response = {
      leaveTypes: policy.leaveTypes.map(lt => {
        const taken = leavesTaken.find(item => item._id === lt.type)?.daysTaken || 0;
        return {
          type: lt.type,
          mode: lt.mode,
          frequency: lt.frequency,
          maxPerRequest: lt.maxPerRequest,
          totalDays: lt.normalDays,
          daysTaken: taken,
          daysRemaining: lt.normalDays - taken
        };
      })
    };

    res.status(200).json(response);
  } catch (err) {
    console.error("Leave balance error:", err);
    res.status(500).json({ 
      error: "Failed to calculate leave balance",
      details: err.message 
    });
  }
});
// Add this to your existing server.js routes
// Get count of all pending leaves (for HR/Admin)
app.get('/api/leaves/pending-count', authenticate, async (req, res) => {
  try {
    if (!['hr', 'admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const count = await Leave.countDocuments({ status: 'Pending' });
    res.json({ count });
  } catch (err) {
    console.error('Error counting pending leaves:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get count of employee's own pending leaves
app.get('/api/leaves/my-pending-count/:employeeId', authenticate, async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    // Verify the requesting user can only see their own count
    if (req.user.id !== employeeId && !['hr', 'admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const count = await Leave.countDocuments({ 
      employee: employeeId,
      status: 'Pending'
    });
    
    res.json({ count });
  } catch (err) {
    console.error('Error counting employee pending leaves:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add these routes to your existing backend

// Attendance Routes
app.post('/api/attendance/checkin', authenticate, async (req, res) => {
  try {
    const employeeId = req.user.id;
    const employee = await Employee.findById(employeeId);
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingAttendance = await Attendance.findOne({
      employeeId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (existingAttendance) {
      return res.status(400).json({ message: 'Already checked in today' });
    }

    const attendance = new Attendance({
      employeeId,
      employeeName: employee.name,
      date: new Date(),
      checkIn: new Date(),
      status: 'Present'
    });

    await attendance.save();

    res.status(201).json({
      message: 'Checked in successfully',
      attendance
    });

  } catch (err) {
    console.error('Check-in error:', err);
    res.status(500).json({ message: 'Server error during check-in' });
  }
});

app.post('/api/attendance/checkout', authenticate, async (req, res) => {
  try {
    const employeeId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employeeId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (!attendance) {
      return res.status(400).json({ message: 'You need to check in first' });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ message: 'Already checked out today' });
    }

    attendance.checkOut = new Date();
    
    // Calculate duration
    const diffMs = attendance.checkOut - attendance.checkIn;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    attendance.duration = `${hours}h ${minutes}m`;

    await attendance.save();

    res.status(200).json({
      message: 'Checked out successfully',
      attendance
    });

  } catch (err) {
    console.error('Check-out error:', err);
    res.status(500).json({ message: 'Server error during check-out' });
  }
});

app.get('/api/attendance/today', authenticate, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employeeId: req.user.id,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    res.status(200).json({
      data: attendance || null
    });

  } catch (err) {
    console.error('Error fetching today\'s attendance:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/attendance/calendar', authenticate, async (req, res) => {
  try {
    const { year, month } = req.query;
    const employeeId = req.user.id;

    if (!year || !month) {
      return res.status(400).json({ message: 'Year and month are required' });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const attendanceRecords = await Attendance.find({
      employeeId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    });

    // Format data for frontend
    const formattedData = {};
    attendanceRecords.forEach(record => {
      const dateKey = record.date.toISOString().split('T')[0];
      formattedData[dateKey] = {
        checkIn: record.checkIn,
        checkOut: record.checkOut,
        status: record.status,
        duration: record.duration
      };
    });

    res.status(200).json(formattedData);

  } catch (err) {
    console.error('Error fetching calendar data:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get("/generate-salary-slip", async (req, res) => {
  try {
    const { employeeId, month: monthQuery, year } = req.query;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found", status: "error_employee_not_found" });
    }

    // --- THE CRUCIAL FIX IS HERE ---
    // We need to find BOTH the month number and the month label to search for.
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthIndex = parseInt(monthQuery, 10) - 1;

    // This ensures we have both "08" and "August" to check against the database
    const monthNumberStr = monthQuery.toString().padStart(2, '0');
    const monthLabelStr = monthNames[monthIndex];
    
    // Use MongoDB's $or operator to find a match for either format.
    const salaryRecord = await Salary.findOne({
      'employee.id': employeeId,
      year: Number(year),
      $or: [
        { month: monthNumberStr }, // Looks for the new format, e.g., "08"
        { month: monthLabelStr }   // Looks for the old format, e.g., "August"
      ]
    }).sort({ createdAt: -1 });
    // --- END OF FIX ---

    const totalDaysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const startDate = new Date(year, monthIndex, 1);
    const endDate = new Date(year, monthIndex, totalDaysInMonth);

    const leaves = await Leave.find({
      employee: employeeId,
      status: 'Accepted',
      startDate: { $lte: endDate },
      $expr: { $gte: [{ $ifNull: ["$approvedEndDate", "$endDate"] }, startDate] }
    });

    let paidLeaves = 0;
    let unpaidLeaves = 0;
    leaves.forEach(leave => {
      const leaveStart = new Date(leave.startDate);
      const leaveEnd = new Date(leave.approvedEndDate || leave.endDate);
      const overlapStart = leaveStart < startDate ? startDate : leaveStart;
      const overlapEnd = leaveEnd > endDate ? endDate : leaveEnd;
      if (overlapStart <= overlapEnd) {
        const leaveDaysInMonth = Math.floor((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)) + 1;
        if (leave.leaveType === 'LWP' || leave.mode === 'unpaid') {
          unpaidLeaves += leaveDaysInMonth;
        } else {
          paidLeaves += leaveDaysInMonth;
        }
      }
    });

    let baseSalary, grossSalary, netSalary, deductionAmount, earnings = [], deductions = [];

    if (salaryRecord) {
      baseSalary = salaryRecord.basicSalary;
      grossSalary = salaryRecord.grossSalary;
      earnings = salaryRecord.components.filter(c => !c.isDeduction);
      deductions = salaryRecord.components.filter(c => c.isDeduction);
      netSalary = salaryRecord.netSalary;
    } else {
      baseSalary = employee.salary; // Fallback
      grossSalary = 0; netSalary = 0;
    }
    
    const response = {
      employeeName: employee.name,
      employeeId: employee._id,
      month: monthNumberStr,
      year: year,
      totalWorkingDays: totalDaysInMonth,
      paidLeaves,
      unpaidLeaves,
      baseSalary,
      grossSalary,
      netSalary,
      earnings,
      deductions,
      status: salaryRecord ? "success" : "not_calculated"
    };

    res.json(response);
  } catch (err) {
    console.error("Error generating salary slip:", err);
    res.status(500).json({ error: "Server error", details: err.message, status: "error_server" });
  }
});

app.post('/save-salary-slips', async (req, res) => {
  try {
    const { month, year, slips, companyLogo } = req.body; // <-- logo bhi le lo

    if (!month || !year || !slips || !Array.isArray(slips)) {
      return res.status(400).json({ success: false, message: "Invalid input data" });
    }

    const batchRecord = {
      month,
      year,
      generatedAt: new Date(),
      companyLogo: companyLogo || "", // <-- logo save karo
      slips: slips.map(slip => ({
        employeeID: slip.employeeID,
        employeeName: slip.employeeName,
        totalWorkingDays: slip.totalWorkingDays,
        paidLeaves: slip.paidLeaves,
        unpaidLeaves: slip.unpaidLeaves,
        baseSalary: slip.baseSalary,
        grossSalary: slip.grossSalary,
        deductionAmount: slip.deductionAmount,
        netSalary: slip.netSalary,
        status: slip.status,
        errorMessage: slip.errorMessage || ""
      }))
    };

    // Upsert by month/year
    const savedRecord = await SalarySlip.findOneAndUpdate(
      { month, year },
      batchRecord,
      { upsert: true, new: true }
    );

    res.json({ 
      success: true,
      message: `Salary slips for ${month} ${year} saved successfully`,
      recordId: savedRecord._id,
      count: slips.length
    });
  } catch (err) {
    console.error("Error saving salary slips:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to save salary slips",
      error: err.message 
    });
  }
});

app.get('/get-salary-slip-logo', async (req, res) => {
  try {
    const { month, year } = req.query;
    let slip;
    if (month && year) {
      slip = await SalarySlip.findOne({ month, year });
    } else {
      slip = await SalarySlip.findOne().sort({ createdAt: -1 });
    }
    if (slip && slip.companyLogo) {
      res.json({ logo: slip.companyLogo });
    } else {
      res.json({ logo: null });
    }
  } catch (err) {
    res.status(500).json({ logo: null, error: err.message });
  }
});
app.get('/api/components', async (req, res) => {
  try {
    const components = await SalaryComponent.find().sort({ createdAt: -1 });
    res.json(components); // Return all fields, including calculateDays
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
app.post('/api/components', async (req, res) => {
  try {
    const { components } = req.body;
    
    if (!Array.isArray(components)) {
      return res.status(400).json({ message: 'Components must be an array' });
    }

    const existingComponents = await SalaryComponent.find({});
    const existingMap = new Map();
    existingComponents.forEach(comp => {
      existingMap.set(comp.name, comp);
    });

    const operations = components.map(comp => {
      if (existingMap.has(comp.name)) {
        const existing = existingMap.get(comp.name);
        return {
          updateOne: {
            filter: { _id: existing._id },
            update: { 
              $set: { 
                type: comp.type,
                calculateDays: comp.calculateDays || false  // Add this line
              }
            }
          }
        };
      }
      return {
        insertOne: {
          document: {
            name: comp.name,
            type: comp.type,
            calculateDays: comp.calculateDays || false  // Add this line
          }
        }
      };
    });

    await SalaryComponent.bulkWrite(operations);
    const updatedComponents = await SalaryComponent.find({});
    res.status(200).json(updatedComponents);

  } catch (error) {
    console.error("Error saving components:", error);
    res.status(400).json({ 
      message: error.message,
      details: error.errors 
    });
  }
});

app.post('/api/salaries', async (req, res) => {
  try {
    const { employee, month, year, components, grossSalary, netSalary } = req.body;
    
    const employeeData = await Employee.findById(employee);
    if (!employeeData) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const basicSalary = components.find(c => c.name === 'BASIC')?.amount || 0;
    
    const salaryData = {
      employee: {
        id: employee,
        name: employeeData.name
      },
      month,
      year,
      components,
      basicSalary,
      grossSalary,
      netSalary,
      status: 'approved'
    };
    
    // Update existing or create new
    await Salary.findOneAndUpdate(
      { 'employee.id': employee, month, year },
      salaryData,
      { upsert: true, new: true }
    );
    
    res.status(201).json({ message: 'Salary saved successfully' });
  } catch (error) {
    console.error('Error saving salary:', error);
    res.status(500).json({ error: 'Failed to save salary' });
  }
});

app.get('/api/salaries', async (req, res) => {
  try {
    const { employee, month, year } = req.query;

    if (employee && month && year) {
      
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];      
      const monthIndex = parseInt(month, 10) - 1;
      const monthNumberStr = month;
      const monthLabelStr = monthNames[monthIndex];

     
      const query = {
        'employee.id': employee,
        year: Number(year),
        $or: [
          { month: monthNumberStr }, 
          { month: monthLabelStr }   
        ]
      };
     

      const salary = await Salary.findOne(query);
      return res.json(salary ? [salary] : []);
    }

    
    const salaries = await Salary.find().sort({ year: -1, month: -1 });
    res.json(salaries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch salaries' });
  }
});



app.listen(1000, () => {
  console.log("Server running at http://localhost:1000");
});
