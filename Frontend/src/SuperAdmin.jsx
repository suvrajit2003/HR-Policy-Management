import { useEffect, useState } from "react";
import axios from "axios";

const SuperAdmin = () => {
  const [employees, setEmployees] = useState([]);
  const [taskName, setTaskName] = useState("");
  const [duration, setDuration] = useState("");
  const [selectedHR, setSelectedHR] = useState("");

  const fetchEmployees = () => {
    axios
      .get("http://localhost:1000/employees")
      .then((res) => setEmployees(res.data))
      .catch((err) => console.error("Error fetching employees", err));
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const deleteEmployee = async (id) => {
    if (window.confirm("Are you sure to delete this employee?")) {
      await axios.delete(`http://localhost:1000/employees/delete/${id}`);
      fetchEmployees();
    }
  };

  const hrEmployees = employees.filter((emp) => emp.role === "hr");

  const assignTask = async (e) => {
    e.preventDefault();
    if (!taskName || !duration || !selectedHR) {
      alert("Please fill all fields");
      return;
    }

    try {
      await axios.post("http://localhost:1000/task/add", {
        taskName,
        duration: Number(duration),
        employeeName: selectedHR,
      });

      alert("✅ Task assigned successfully!");
      setTaskName("");
      setDuration("");
      setSelectedHR("");
      fetchEmployees();
    } catch (err) {
      console.error("Failed to assign task", err);
      alert("❌ Failed to assign task.");
    }
  };

  return (
    <div style={containerStyle}>
      <h2 style={headerStyle}>👑 Welcome to Admin Panel</h2>
      <p style={{ color: "#555", marginBottom: "30px" }}>
        Manage employees & assign HR tasks
      </p>

      {/* Employee Table */}
      <div style={cardStyle}>
        <table style={tableStyle}>
          <thead>
            <tr style={tableHeaderStyle}>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joining Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp._id} style={rowStyle}>
                <td>{emp.name}</td>
                <td>{emp.email}</td>
                <td>
                  <span
                    style={{
                      ...badgeStyle,
                      backgroundColor:
                        emp.role === "admin"
                          ? "#343a40"
                          : emp.role === "hr"
                          ? "#17a2b8"
                          : "#6c757d",
                    }}
                  >
                    {emp.role.toUpperCase()}
                  </span>
                </td>
                <td>
                  {emp.date_of_joining
                    ? new Date(emp.date_of_joining).toLocaleDateString()
                    : "-"}
                </td>
                <td>
                  <button
                    style={deleteBtn}
                    onClick={() => deleteEmployee(emp._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Task Assignment */}
      {/* <div style={formCardStyle}>
        <h4 style={{ marginBottom: "20px" }}>📋 Assign Task to HR</h4>
        <form onSubmit={assignTask}>
          <div style={formGrid}>
            <div>
              <label style={labelStyle}>Task Name</label>
              <input
                type="text"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Duration (mins)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Select HR</label>
              <select
                value={selectedHR}
                onChange={(e) => setSelectedHR(e.target.value)}
                style={inputStyle}
              >
                <option value="">-- Choose HR --</option>
                {hrEmployees.map((hr) => (
                  <option key={hr._id} value={hr.name}>
                    {hr.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" style={submitBtn}>
            Assign Task
          </button>
        </form>
      </div> */}
    </div>
  );
};

// Styles
const containerStyle = {
  maxWidth: "1000px",
  margin: "40px auto",
  padding: "20px",
  fontFamily: "'Segoe UI', sans-serif",
};

const headerStyle = {
  fontWeight: "bold",
  color: "#0d6efd",
};

const cardStyle = {
  backgroundColor: "#fff",
  padding: "20px",
  borderRadius: "10px",
  boxShadow: "0 0 10px rgba(0,0,0,0.05)",
  marginBottom: "40px",
  overflowX: "auto",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
};

const tableHeaderStyle = {
  backgroundColor: "#f1f1f1",
  textAlign: "left",
};

const rowStyle = {
  borderBottom: "1px solid #ddd",
  height: "50px",
};

const badgeStyle = {
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: "12px",
  color: "white",
  fontSize: "12px",
};

const deleteBtn = {
  backgroundColor: "#dc3545",
  border: "none",
  color: "#fff",
  padding: "6px 12px",
  borderRadius: "4px",
  cursor: "pointer",
};

const formCardStyle = {
  backgroundColor: "#fff",
  padding: "25px",
  borderRadius: "10px",
  boxShadow: "0 0 10px rgba(0,0,0,0.05)",
};

const formGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: "20px",
  marginBottom: "20px",
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  fontSize: "14px",
  border: "1px solid #ccc",
  borderRadius: "6px",
};

const labelStyle = {
  display: "block",
  marginBottom: "6px",
  fontWeight: "500",
  color: "#333",
};

const submitBtn = {
  backgroundColor: "#0d6efd",
  color: "#fff",
  border: "none",
  padding: "12px 20px",
  borderRadius: "6px",
  fontWeight: "bold",
  cursor: "pointer",
  marginTop: "10px",
};

export default SuperAdmin;
