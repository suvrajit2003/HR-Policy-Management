import { useEffect, useState } from "react";
import axios from "axios";

const allPermissions = [
  { code: "E-Add", label: "Create new employees" },
  { code: "E-Edit", label: "Edit employee information" },
  { code: "E-Delete", label: "Delete employee" },
  { code: "T-Add", label: "Create new tasks" },
  { code: "T-Edit", label: "Edit existing tasks" },
  { code: "T-Delete", label: "Delete tasks" },
  { code: "HR-View", label: "View HR Policy" },
  { code: "SALARY-View", label: "View Salary Info" },
  { code: "TASK-View", label: "View Task Details" },
  { code: "HOME-View", label: "Access Home Page" },
  { code: "TASK-SelfAssign", label: "Allow employee to assign their own tasks" },
];

const Permission = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState({});

  useEffect(() => {
    axios.get("http://localhost:1000/employees").then((res) => {
      setEmployees(res.data);
    });
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      const emp = employees.find((emp) => emp._id === selectedUserId);
      setSelectedUser(emp);
      axios.get(`http://localhost:1000/permissions/${selectedUserId}`).then((res) => {
        const perms = res.data?.operations || [];
        const mapped = {};
        perms.forEach((p) => (mapped[p.code] = p.access));
        setUserPermissions(mapped);
      });
    }
  }, [selectedUserId, employees]);

  const handleToggle = (code) => {
    setUserPermissions((prev) => ({
      ...prev,
      [code]: !prev[code],
    }));
  };

  const handleSave = () => {
    const payload = {
      userId: selectedUserId,
      operations: allPermissions.map((perm) => ({
        code: perm.code,
        access: userPermissions[perm.code] || false,
      })),
    };

    axios
      .post("http://localhost:1000/permissions", payload)
      .then(() => {
        alert("✅ Employee permissions updated!");
      })
      .catch(() => alert("❌ Error saving permissions"));
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h2 style={styles.heading}>🛡️ Manage Employee Permissions</h2>

        <div style={styles.formGroup}>
          <label style={styles.label}>👤 Select Employee:</label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            style={styles.select}
          >
            <option value="">-- Choose Employee --</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.name} ({emp.role})
              </option>
            ))}
          </select>
        </div>

        {selectedUser && (
          <div style={styles.userInfo}>
            <div><strong>Selected:</strong> {selectedUser.name}</div>
            <div style={styles.roleTag}>{selectedUser.role}</div>
          </div>
        )}

        {selectedUserId && (
          <>
            <h3 style={styles.sectionTitle}>🔧 Set Permissions</h3>
            <div style={styles.permissionsGrid}>
              {allPermissions.map((perm) => (
                <div key={perm.code} style={styles.permissionCard}>
                  <div>
                    <strong>{perm.label}</strong>
                    <div style={styles.code}>{perm.code}</div>
                  </div>
                  <label style={styles.toggleLabel}>
                    <input
                      type="checkbox"
                      checked={userPermissions[perm.code] === true}
                      onChange={() => handleToggle(perm.code)}
                    />
                    <span>Allow</span>
                  </label>
                </div>
              ))}
            </div>

            <div style={{ textAlign: "center", marginTop: "30px" }}>
              <button style={styles.saveBtn} onClick={handleSave}>
                💾 Save Permissions
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(to right top, #b2fefa, #0ed2f7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "50px 20px",
  },
  container: {
    width: "100%",
    maxWidth: "950px",
    background: "rgba(255, 255, 255, 0.9)",
    backdropFilter: "blur(12px)",
    borderRadius: "20px",
    padding: "40px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
    fontFamily: "Segoe UI, sans-serif",
    animation: "fadeIn 0.5s ease-in-out",
  },
  heading: {
    textAlign: "center",
    marginBottom: "30px",
    fontSize: "30px",
    color: "#1f2937",
    fontWeight: "bold",
  },
  formGroup: {
    marginBottom: "30px",
  },
  label: {
    fontWeight: "600",
    marginBottom: "8px",
    display: "block",
    fontSize: "16px",
    color: "#333",
  },
  select: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #ccc",
    fontSize: "16px",
    backgroundColor: "#f9f9f9",
    transition: "0.3s",
    outline: "none",
  },
  userInfo: {
    background: "#e3f2fd",
    padding: "12px 20px",
    borderRadius: "12px",
    marginBottom: "25px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roleTag: {
    background: "#007bff",
    color: "#fff",
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "bold",
  },
  sectionTitle: {
    fontWeight: "600",
    marginBottom: "20px",
    fontSize: "20px",
    color: "#333",
  },
  permissionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "20px",
  },
  permissionCard: {
    background: "#ffffff",
    padding: "18px 20px",
    border: "1px solid #dee2e6",
    borderRadius: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.06)",
  },
  code: {
    fontSize: "12px",
    color: "#6c757d",
    marginTop: "5px",
  },
  toggleLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontWeight: "500",
    fontSize: "15px",
  },
  saveBtn: {
    padding: "14px 36px",
    fontSize: "16px",
    borderRadius: "12px",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 5px 15px rgba(40,167,69,0.4)",
    transition: "background-color 0.3s, transform 0.2s",
  },
};

export default Permission;
