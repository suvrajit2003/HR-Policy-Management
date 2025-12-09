✅ 1. Imports & Initial Setup
js
Copy
Edit
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const HrPolicy = require("./models/HRPolicy");
const SalaryIncrement = require("./models/SalaryIncrement");
const Employee = require("./models/Employee");
These lines import required modules:

express: Web framework for Node.js

mongoose: For MongoDB connection and schema handling

cors: Allows cross-origin requests (important for frontend/backend to communicate)

Models: Represent MongoDB collections

✅ 2. Middleware Configuration
js
Copy
Edit
const app = express();
app.use(cors());
app.use(express.json());
app.use(cors()): Allows API access from different origins

app.use(express.json()): Parses incoming JSON data (important for POST requests)

✅ 3. MongoDB Connection
js
Copy
Edit
mongoose.connect("mongodb://localhost:27017/employeeDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
Connects to the MongoDB database employeeDB.

js
Copy
Edit
db.once("open", async () => {
  console.log("MongoDB connected");
  const existing = await HrPolicy.find();
  if (existing.length === 0) {
    await HrPolicy.create({ ... });
  }
});
After DB connects, it checks if HrPolicy collection is empty.

If yes, it inserts default HR policy data (like increment rules, milestones, etc.).

✅ 4. Add Employee – POST
js
Copy
Edit
app.post("/employees/add", async (req, res) => {
  ...
});
Client sends POST request with employee details (from a form).

req.body contains:

json
Copy
Edit
{
  "name": "John",
  "salary": 50000,
  "date_of_joining": "2022-01-01",
  ...
}
Employee is saved to DB using new Employee(req.body).save().

Then, experience is calculated using date_of_joining.

Based on experience:

js
Copy
Edit
if (>=5 years) rating = 5
else if >=3 years → 4
else if >=2 → 3
else if >=1 → 2
else → 1
A new record in SalaryIncrement is created with rating.

✅ 5. Get All Employees – GET
js
Copy
Edit
app.get("/employees", async (req, res) => {
  ...
});
Returns all employees from the database as JSON.

Used in frontend list view.

✅ 6. Get HR Policy – GET
js
Copy
Edit
app.get("/api/hr-policy", async (req, res) => {
  ...
});
Fetches the full HR policy document from MongoDB (only one exists).

Includes criteria, milestones, appraisal process.

✅ 7. Get Final Salary Increments – GET
js
Copy
Edit
app.get("/api/salary-increments", async (req, res) => {
  ...
});
Fetches all salary increment records.

For each record, it calls a model method:
emp.calculateIncrements()
(this must be defined in SalaryIncrement.js)

That method returns:

js
Copy
Edit
{
  experience: ..., // in years
  specialIncrementPercent: ...,
  totalIncrementPercent: ...,
  newSalary: ...
}
Final structured response is sent to frontend.

✅ Sync SalaryIncrement – GET
js
Copy
Edit
app.get("/api/salary-increments/sync", async (req, res) => {
  ...
});
Used to reset and regenerate the SalaryIncrement collection.

First fetches all employees

Then:

Calculates experience

Assigns new rating

Recreates SalaryIncrement documents

Useful if data changes or app is reset

✅ Delete Employee – DELETE
js
Copy
Edit
app.delete("/employees/delete/:id", async (req, res) => {
  ...
});
Deletes an employee based on their _id (MongoDB unique ID)

Used in frontend when clicking "delete" button

Ex: /employees/delete/64b3e82...

✅ Server Start
js
Copy
Edit
app.listen(1000, () => {
  console.log("Server running on http://localhost:1000");
});
Starts backend server on port 1000

All your frontend Axios/API requests should point to this port

🔁 Quick Flow Recap
Action	Route	Method	What Happens
Add Employee	/employees/add	POST	Saves employee + generates rating + creates increment
Get All Employees	/employees	GET	Lists all employees
Get HR Policy	/api/hr-policy	GET	Loads static HR rules
Get Increments	/api/salary-increments	GET	Calculates salary hike, returns full increment logic
Sync Increments	/api/salary-increments/sync	GET	Re-creates increment table from employee data
Delete Employee	/employees/delete/:id	DELETE	Deletes employee by ID

