import { useEffect, useState } from "react";
import axios from "axios";
import PropTypes from "prop-types";

const Home = ({ permissions }) => {
  const [employees, setEmployees] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Check if user has access for a specific code
  const hasAccess = (code) => {
    const role = (localStorage.getItem("userRole") || "").toLowerCase();
    if (role === "admin" || role === "superadmin") return true;
    return permissions?.some((p) => p.code === code && p.access);
  };

  // Fetch employees from backend
  const fetchEmployees = () => {
    axios
      .get("http://localhost:1000/employees", { 
        params: { searchTerm: searchTerm },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      .then((res) => setEmployees(res.data))
      .catch((err) => console.error("Error fetching employees", err));
  };

  useEffect(() => {
    fetchEmployees();
  }, [permissions, searchTerm]);

  // Start edit mode for an employee
  const startEdit = (emp) => {
    setEditingId(emp._id);
    setEditData({ ...emp });
  };

  // Cancel edit mode
  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  // Save edited employee data
  const saveEdit = async () => {
    try {
      await axios.put(`http://localhost:1000/employees/${editingId}`, editData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setEditingId(null);
      setEditData({});
      fetchEmployees();
      alert("✅ Employee updated successfully");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to update employee");
    }
  };

  // Delete employee
  const deleteEmployee = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await axios.delete(`http://localhost:1000/employees/delete/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        alert('Employee deleted successfully');
        fetchEmployees();
      } catch (err) {
        console.error('Error deleting employee:', err);
        alert('Failed to delete employee');
      }
    }
  };

  // Filter and sort employees
  const filtered = employees
    .filter((emp) => {
      if (!searchTerm) return true;
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const employeeDataString = `
        ${emp.name?.toLowerCase()}
        ${emp.email?.toLowerCase()}
        ${emp.phone?.toLowerCase()}
        ${emp.address?.toLowerCase()}
        ${new Date(emp.date_of_joining).toLocaleDateString().toLowerCase()}
        ${String(emp.salary)?.toLowerCase()}
      `.toLowerCase();
      return employeeDataString.includes(lowerCaseSearchTerm);
    })
    .sort((a, b) => {
      const nameA = a.name?.toLowerCase() || "";
      const nameB = b.name?.toLowerCase() || "";
      return sortAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });

  // Paging logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handler to update edit data
  const handleChange = (field, value) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <h4 style={{ margin: 0 }}>👥 Employee Management</h4>
      </nav>

      <div style={styles.content}>
        <h2 style={styles.heading}>Employee Register Table</h2>

        <div style={styles.searchSortRow}>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            style={styles.searchBox}
          />
          <button onClick={() => setSortAsc(!sortAsc)} style={styles.sortButton}>
            Sort {sortAsc ? "↓" : "↑"}
          </button>
        </div>

        {hasAccess("HOME-View") ? (
          paginated.length > 0 ? (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead style={styles.tableHeader}>
                  <tr>
                    <th style={styles.th}>#</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Phone</th>
                    <th style={styles.th}>Address</th>
                    <th style={styles.th}>Date of Joining</th>
                    <th style={styles.th}>Salary</th>
                    {(hasAccess("E-Edit") || hasAccess("E-Delete")) && (
                      <th style={styles.th}>Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((emp, index) => {
                    const isEditing = editingId === emp._id;
                    return (
                      <tr
                        key={emp._id}
                        style={index % 2 === 0 ? styles.rowEven : styles.rowOdd}
                      >
                        <td style={styles.td}>
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </td>
                        <td style={styles.td}>
                          {isEditing ? (
                            <input
                              value={editData.name || ""}
                              onChange={(e) =>
                                handleChange("name", e.target.value)
                              }
                              style={styles.editInput}
                            />
                          ) : (
                            emp.name
                          )}
                        </td>
                        <td style={styles.td}>
                          {isEditing ? (
                            <input
                              value={editData.email || ""}
                              onChange={(e) =>
                                handleChange("email", e.target.value)
                              }
                              style={styles.editInput}
                            />
                          ) : (
                            emp.email
                          )}
                        </td>
                        <td style={styles.td}>
                          {isEditing ? (
                            <input
                              value={editData.phone || ""}
                              onChange={(e) =>
                                handleChange("phone", e.target.value)
                              }
                              style={styles.editInput}
                            />
                          ) : (
                            emp.phone
                          )}
                        </td>
                        <td style={styles.td}>
                          {isEditing ? (
                            <input
                              value={editData.address || ""}
                              onChange={(e) =>
                                handleChange("address", e.target.value)
                              }
                              style={styles.editInput}
                            />
                          ) : (
                            emp.address
                          )}
                        </td>
                        <td style={styles.td}>
                          {new Date(emp.date_of_joining).toLocaleDateString()}
                        </td>
                        <td style={styles.td}>
                          {isEditing ? (
                            <input
                              type="number"
                              value={editData.salary || ""}
                              onChange={(e) =>
                                handleChange("salary", e.target.value)
                              }
                              style={styles.editInput}
                            />
                          ) : (
                            `₹${emp.salary}`
                          )}
                        </td>
                        {(hasAccess("E-Edit") || hasAccess("E-Delete")) && (
                          <td style={styles.td}>
                            {isEditing ? (
                              <>
                                <button
                                  onClick={saveEdit}
                                  style={styles.saveBtn}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  style={styles.cancelBtn}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                {hasAccess("E-Edit") && (
                                  <button
                                    onClick={() => startEdit(emp)}
                                    style={styles.editBtn}
                                  >
                                    Edit
                                  </button>
                                )}
                                {hasAccess("E-Delete") && (
                                  <button
                                    onClick={() =>
                                      deleteEmployee(emp._id, emp.name)
                                    }
                                    style={styles.deleteBtn}
                                  >
                                    Delete
                                  </button>
                                )}
                              </>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div style={styles.pagination}>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    style={{
                      ...styles.pageBtn,
                      background: currentPage === i + 1 ? "#007bff" : "#fff",
                      color: currentPage === i + 1 ? "#fff" : "#007bff",
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={styles.infoAlert}>✨ No employees found.</div>
          )
        ) : (
          <div style={styles.warnAlert}>
            🚫 You don't have permission to view this page.
          </div>
        )}
      </div>
    </div>
  );
};

Home.propTypes = {
  permissions: PropTypes.arrayOf(
    PropTypes.shape({
      code: PropTypes.string.isRequired,
      access: PropTypes.bool.isRequired,
    })
  ),
};

Home.defaultProps = {
  permissions: [],
};

const styles = {
  container: {
    fontFamily: "'Segoe UI', sans-serif",
    background: "linear-gradient(135deg, #e0eafc, #cfdef3)",
    minHeight: "100vh",
    overflow: "hidden",
  },
  navbar: {
    background: "#1e1e2f",
    color: "#fff",
    padding: "15px 30px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
  },
  content: {
    padding: "40px",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  heading: {
    fontSize: "26px",
    marginBottom: "25px",
    textAlign: "center",
    color: "#333",
  },
  searchSortRow: {
    display: "flex",
    gap: "12px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },
  searchBox: {
    flex: 1,
    minWidth: "200px",
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
  },
  sortButton: {
    padding: "12px 18px",
    background: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  tableContainer: {
    borderRadius: "15px",
    background: "rgba(255,255,white,0.7)",
    backdropFilter: "blur(6px)",
    overflowX: "auto",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    padding: "10px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  tableHeader: {
    backgroundColor: "#343a40",
    color: "#fff",
  },
  th: {
    padding: "12px",
    textAlign: "left",
    fontSize: "14px",
    fontWeight: "600",
  },
  td: {
    padding: "10px",
    fontSize: "14px",
    borderBottom: "1px solid #ccc",
  },
  rowEven: {
    backgroundColor: "#f8f9fa",
  },
  rowOdd: {
    backgroundColor: "#ffffff",
  },
  editBtn: {
    backgroundColor: "#28a745",
    color: "#fff",
    border: "none",
    padding: "6px 10px",
    borderRadius: "5px",
    marginRight: "5px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  saveBtn: {
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    padding: "6px 10px",
    borderRadius: "5px",
    marginRight: "5px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  cancelBtn: {
    backgroundColor: "#6c757d",
    color: "#fff",
    border: "none",
    padding: "6px 10px",
    borderRadius: "5px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  deleteBtn: {
    backgroundColor: "#dc3545",
    color: "#fff",
    border: "none",
    padding: "6px 10px",
    borderRadius: "5px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  editInput: {
    width: "100%",
    padding: "5px",
    boxSizing: "border-box",
    borderRadius: "4px",
    border: "1px solid #007bff",
  },
  pagination: {
    marginTop: "20px",
    display: "flex",
    justifyContent: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  pageBtn: {
    padding: "8px 14px",
    border: "1px solid #007bff",
    borderRadius: "6px",
    fontWeight: "500",
    cursor: "pointer",
    backgroundColor: "#fff",
    color: "#007bff",
  },
  infoAlert: {
    backgroundColor: "#d1ecf1",
    color: "#0c5460",
    padding: "15px",
    borderRadius: "8px",
    textAlign: "center",
  },
  warnAlert: {
    backgroundColor: "#fff3cd",
    color: "#856404",
    padding: "15px",
    borderRadius: "8px",
    textAlign: "center",
  },
};

export default Home;