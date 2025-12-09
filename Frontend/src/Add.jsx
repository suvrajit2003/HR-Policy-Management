// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import PropTypes from "prop-types";

// const Add = ({ permissions = [] }) => {
//   const navigate = useNavigate();

//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     phone: "",
//     address: "",
//     date_of_joining: "",
//     salary: "",
//     level: "",
//     experience: "",
//     role: "employee",
//   });

//   const [allEmails, setAllEmails] = useState([]);

//   useEffect(() => {
//     axios.get("http://localhost:1000/employees").then((res) => {
//       if (Array.isArray(res.data)) {
//         setAllEmails(res.data.map((emp) => emp.email));
//       }
//     });
//   }, []);

//   const hasAccess = (code) => {
//     const role = (localStorage.getItem("userRole") || "").toLowerCase();
//     if (role === "admin" || role === "superadmin") return true;
//     return permissions?.some((p) => p.code === code && p.access);
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prevData) => ({
//       ...prevData,
//       [name]: value,
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (allEmails.includes(formData.email)) {
//       alert("⚠️ Email already exists!");
//       return;
//     }
//     const password = (formData.name.substring(0, 3) + "@123").toLowerCase();
//     try {
//       await axios.post("http://localhost:1000/employees/add", {
//         ...formData,
//         password,
//       });
//       alert("✅ Employee added successfully!");
//       navigate("/home");
//     } catch (err) {
//       alert("❌ Error while submitting the form.");
//     }
//   };

//   if (!hasAccess("E-Add")) {
//     return (
//       <div style={styles.permissionBox}>
//         ❌ You do not have permission to add employees.
//       </div>
//     );
//   }

//   return (
//     <div style={styles.page}>
//       <div style={styles.container}>
//         <h2 style={styles.title}>➕ Add New Employee</h2>
//         <form onSubmit={handleSubmit}>
//           {[
//             { label: "Name", name: "name", type: "text" },
//             { label: "Email", name: "email", type: "email" },
//             { label: "Phone", name: "phone", type: "text" },
//             { label: "Address", name: "address", type: "textarea" },
//             { label: "Date of Joining", name: "date_of_joining", type: "date" },
//             { label: "Salary", name: "salary", type: "number" },
//             { label: "Type", name: "level", type: "text" },
//             { label: "Experience (Years)", name: "experience", type: "number" },
//           ].map((field) => (
//             <div key={field.name} style={styles.fieldGroup}>
//               <label style={styles.label}>{field.label}:</label>
//               {field.type === "textarea" ? (
//                 <textarea
//                   name={field.name}
//                   value={formData[field.name]}
//                   onChange={handleChange}
//                   style={styles.input}
//                   required
//                 />
//               ) : (
//                 <input
//                   type={field.type}
//                   name={field.name}
//                   value={formData[field.name]}
//                   onChange={handleChange}
//                   style={styles.input}
//                   required
//                 />
//               )}
//             </div>
//           ))}

//           <div style={styles.fieldGroup}>
//             <label style={styles.label}>Role:</label>
//             <select
//               name="role"
//               value={formData.role}
//               onChange={handleChange}
//               style={styles.input}
//             >
//               <option value="employee">Employee</option>
//               <option value="hr">HR</option>
//               <option value="admin">Admin</option>
//               <option value="superadmin">Super Admin</option>
//             </select>
//           </div>

//           <div style={{ textAlign: "center", marginTop: "30px" }}>
//             <button type="submit" style={styles.button}>
//               🚀 Add Employee
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// Add.propTypes = {
//   permissions: PropTypes.arrayOf(
//     PropTypes.shape({
//       code: PropTypes.string.isRequired,
//       access: PropTypes.bool.isRequired,
//     })
//   ),
// };

// const styles = {
//   page: {
//     background: "linear-gradient(135deg, #f5f7fa, #c3cfe2)",
//     minHeight: "100vh",
//     padding: "10px 8px",
//     fontFamily: "Segoe UI, sans-serif",
//     boxSizing: "border-box",
//     display: "flex",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   container: {
//     width: "100%",
//     maxWidth: "360px", // slightly reduced
//     margin: "auto",
//     background: "#ffffffdd",
//     padding: "16px 14px", // reduced padding
//     borderRadius: "12px",
//     boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
//   },
//   title: {
//     textAlign: "center",
//     marginBottom: "14px", // less space
//     fontSize: "20px",
//     color: "#023e8a",
//     fontWeight: "bold",
//   },
//   fieldGroup: {
//     marginBottom: "10px", // tighter spacing
//   },
//   label: {
//     display: "block",
//     fontWeight: "600",
//     marginBottom: "4px",
//     color: "#2c3e50",
//     fontSize: "12px",
//   },
//   input: {
//     width: "100%",
//     padding: "6px 8px", // tighter input box
//     borderRadius: "6px",
//     border: "1px solid #dcdcdc",
//     fontSize: "13px",
//     background: "#f1f3f5",
//     boxShadow: "inset 1px 1px 2px #d1d9e6, inset -1px -1px 2px #ffffff",
//     transition: "0.3s",
//   },
//   button: {
//     background: "linear-gradient(135deg, #0077b6, #00b4d8)",
//     color: "white",
//     padding: "8px 14px", // reduced height
//     fontSize: "13px",
//     fontWeight: "bold",
//     border: "none",
//     borderRadius: "24px",
//     cursor: "pointer",
//     boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
//     transition: "transform 0.2s ease",
//     marginTop: "10px",
//   },
//   permissionBox: {
//     background: "#e63946",
//     color: "#fff",
//     padding: "12px",
//     margin: "30px auto",
//     textAlign: "center",
//     borderRadius: "8px",
//     fontSize: "14px",
//     maxWidth: "340px",
//     boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
//   },
// };



// export default Add;




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

  const [errors, setErrors] = useState({});
  const [allEmails, setAllEmails] = useState([]);

  useEffect(() => {
    // Fetch existing emails to prevent duplicates
    axios.get("http://localhost:1000/employees").then((res) => {
      if (Array.isArray(res.data)) {
        setAllEmails(res.data.map((emp) => emp.email));
      }
    }).catch(err => {
      console.error("Failed to fetch employees:", err);
    });
  }, []);

  const hasAccess = (code) => {
    const role = (localStorage.getItem("userRole") || "").toLowerCase();
    if (role === "admin" || role === "superadmin") return true;
    return permissions?.some((p) => p.code === code && p.access);
  };
  
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Name is required.";
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid.";
    } else if (allEmails.includes(formData.email)) {
      newErrors.email = "This email already exists.";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required.";
    } else if (formData.phone.length !== 10) {
      newErrors.phone = "Phone number must be exactly 10 digits.";
    }
    
    if (!formData.address.trim()) newErrors.address = "Address is required.";
    if (!formData.date_of_joining) newErrors.date_of_joining = "Date of joining is required.";
    
    if (!formData.salary) {
      newErrors.salary = "Salary is required.";
    } else if (isNaN(formData.salary) || Number(formData.salary) <= 0) {
      newErrors.salary = "Salary must be a positive number.";
    }

    if (!formData.level.trim()) newErrors.level = "Type is required.";
    
    if (formData.experience === '' || formData.experience === null) {
      newErrors.experience = "Experience is required.";
    } else if (isNaN(formData.experience) || Number(formData.experience) < 0) {
      newErrors.experience = "Experience must be a non-negative number.";
    }

    setErrors(newErrors);
    // Return true if there are no errors, false otherwise
    return Object.keys(newErrors).length === 0;
  };


  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Enforce 10-digit limit for the phone number
    if (name === "phone") {
        // Allow only numeric input and limit to 10 characters
        if (/^\d*$/.test(value) && value.length <= 10) {
            setFormData((prevData) => ({
              ...prevData,
              [name]: value,
            }));
        }
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }

    // Clear the error for the field being edited
    if (errors[name]) {
        setErrors((prevErrors) => ({
            ...prevErrors,
            [name]: null,
        }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Run validation and stop if the form is not valid
    if (!validateForm()) {
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
      console.error("Submission error:", err);
    }
  };

  if (!hasAccess("E-Add")) {
    return (
      <div style={styles.permissionBox}>
        ❌ You do not have permission to add employees.
      </div>
    );
  }

  // Helper to render form fields to avoid repetition
  const renderField = (label, name, type) => (
    <div key={name} style={styles.fieldGroup}>
      <label style={styles.label}>
        {label}
        <span style={styles.requiredStar}>*</span>:
      </label>
      {type === "textarea" ? (
        <textarea
          name={name}
          value={formData[name]}
          onChange={handleChange}
          style={errors[name] ? { ...styles.input, ...styles.inputError } : styles.input}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={formData[name]}
          onChange={handleChange}
          style={errors[name] ? { ...styles.input, ...styles.inputError } : styles.input}
        />
      )}
      {errors[name] && <div style={styles.errorText}>{errors[name]}</div>}
    </div>
  );

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h2 style={styles.title}>➕ Add New Employee</h2>
        <form onSubmit={handleSubmit} noValidate>
          {renderField("Name", "name", "text")}
          {renderField("Email", "email", "email")}
          {renderField("Phone", "phone", "text")}
          {renderField("Address", "address", "textarea")}
          {renderField("Date of Joining", "date_of_joining", "date")}
          {renderField("Salary", "salary", "number")}
          {renderField("Type", "level", "text")}
          {renderField("Experience (Years)", "experience", "number")}

          <div style={styles.fieldGroup}>
            <label style={styles.label}>
                Role<span style={styles.requiredStar}>*</span>:
            </label>
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
    maxWidth: "380px",
    margin: "auto",
    background: "#ffffffdd",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
  },
  title: {
    textAlign: "center",
    marginBottom: "20px",
    fontSize: "22px",
    color: "#023e8a",
    fontWeight: "bold",
  },
  fieldGroup: {
    marginBottom: "12px",
  },
  label: {
    display: "block",
    fontWeight: "600",
    marginBottom: "5px",
    color: "#2c3e50",
    fontSize: "13px",
  },
  input: {
    width: "100%",
    padding: "8px 10px",
    borderRadius: "6px",
    border: "1px solid #dcdcdc",
    fontSize: "14px",
    background: "#f1f3f5",
    boxShadow: "inset 1px 1px 2px #d1d9e6, inset -1px -1px 2px #ffffff",
    transition: "border-color 0.3s, box-shadow 0.3s",
    boxSizing: "border-box",
  },
  inputError: {
    borderColor: "#e63946",
    boxShadow: "0 0 0 2px rgba(230, 57, 70, 0.2)",
  },
  button: {
    background: "linear-gradient(135deg, #0077b6, #00b4d8)",
    color: "white",
    padding: "10px 18px",
    fontSize: "14px",
    fontWeight: "bold",
    border: "none",
    borderRadius: "24px",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
    transition: "transform 0.2s ease, opacity 0.2s",
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
  requiredStar: {
    color: 'red',
    marginLeft: '4px',
  },
  errorText: {
    color: "#d90429",
    fontSize: "11px",
    fontWeight: '500',
    marginTop: "4px",
  },
};

export default Add;