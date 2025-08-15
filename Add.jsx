import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import PropTypes from "prop-types";

const Add = ({ permissions = [] }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    date_of_joining: "",
    salary: "",
    level: "",
    experience: "",
    role: "employee",
  });

  const [allEmails, setAllEmails] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:1000/employees").then((res) => {
      if (Array.isArray(res.data)) {
        setAllEmails(res.data.map((emp) => emp.email));
      }
    });
  }, []);

  const hasAccess = (code) => {
    const role = (localStorage.getItem("userRole") || "").toLowerCase();
    if (role === "admin" || role === "superadmin") return true;
    return permissions?.some((p) => p.code === code && p.access);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (allEmails.includes(formData.email)) {
      alert("⚠️ Email already exists!");
      return;
    }
    const password = (formData.name.substring(0, 3) + "@123").toLowerCase();
    try {
      await axios.post("http://localhost:1000/employees/add", {
        ...formData,
        password,
      });
      alert("✅ Employee added successfully!");
      navigate("/home");
    } catch (err) {
      alert("❌ Error while submitting the form.");
    }
  };

  if (!hasAccess("E-Add")) {
    return (
      <div style={styles.permissionBox}>
        ❌ You do not have permission to add employees.
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h2 style={styles.title}>➕ Add New Employee</h2>
        <form onSubmit={handleSubmit}>
          {[
            { label: "Name", name: "name", type: "text" },
            { label: "Email", name: "email", type: "email" },
            { label: "Phone", name: "phone", type: "text" },
            { label: "Address", name: "address", type: "textarea" },
            { label: "Date of Joining", name: "date_of_joining", type: "date" },
            { label: "Salary", name: "salary", type: "number" },
            { label: "Type", name: "level", type: "text" },
            { label: "Experience (Years)", name: "experience", type: "number" },
          ].map((field) => (
            <div key={field.name} style={styles.fieldGroup}>
              <label style={styles.label}>{field.label}:</label>
              {field.type === "textarea" ? (
                <textarea
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              ) : (
                <input
                  type={field.type}
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              )}
            </div>
          ))}

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Role:</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              style={styles.input}
            >
              <option value="employee">Employee</option>
              <option value="hr">HR</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
          </div>

          <div style={{ textAlign: "center", marginTop: "30px" }}>
            <button type="submit" style={styles.button}>
              🚀 Add Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

Add.propTypes = {
  permissions: PropTypes.arrayOf(
    PropTypes.shape({
      code: PropTypes.string.isRequired,
      access: PropTypes.bool.isRequired,
    })
  ),
};

const styles = {
  page: {
    background: "linear-gradient(135deg, #f5f7fa, #c3cfe2)",
    minHeight: "100vh",
    padding: "10px 8px",
    fontFamily: "Segoe UI, sans-serif",
    boxSizing: "border-box",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "100%",
    maxWidth: "360px", // slightly reduced
    margin: "auto",
    background: "#ffffffdd",
    padding: "16px 14px", // reduced padding
    borderRadius: "12px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
  },
  title: {
    textAlign: "center",
    marginBottom: "14px", // less space
    fontSize: "20px",
    color: "#023e8a",
    fontWeight: "bold",
  },
  fieldGroup: {
    marginBottom: "10px", // tighter spacing
  },
  label: {
    display: "block",
    fontWeight: "600",
    marginBottom: "4px",
    color: "#2c3e50",
    fontSize: "12px",
  },
  input: {
    width: "100%",
    padding: "6px 8px", // tighter input box
    borderRadius: "6px",
    border: "1px solid #dcdcdc",
    fontSize: "13px",
    background: "#f1f3f5",
    boxShadow: "inset 1px 1px 2px #d1d9e6, inset -1px -1px 2px #ffffff",
    transition: "0.3s",
  },
  button: {
    background: "linear-gradient(135deg, #0077b6, #00b4d8)",
    color: "white",
    padding: "8px 14px", // reduced height
    fontSize: "13px",
    fontWeight: "bold",
    border: "none",
    borderRadius: "24px",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
    transition: "transform 0.2s ease",
    marginTop: "10px",
  },
  permissionBox: {
    background: "#e63946",
    color: "#fff",
    padding: "12px",
    margin: "30px auto",
    textAlign: "center",
    borderRadius: "8px",
    fontSize: "14px",
    maxWidth: "340px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  },
};



export default Add;
