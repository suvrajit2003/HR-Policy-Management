import { useEffect, useState } from "react";
import axios from "axios";
import PropTypes from "prop-types";

// Create axios instance with default headers
const api = axios.create({
  baseURL: "http://localhost:1000/api",
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor to include token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const HRPolicy = ({ permissions }) => {
  const [eligibleEmployees, setEligibleEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const itemsPerPage = 10;

  const hasAccess = (code) => {
    const role = (localStorage.getItem("userRole") || "").toLowerCase();
    if (role === "admin" || role === "superadmin") return true;
    return permissions?.some((p) => p.code === code && p.access);
  };

  useEffect(() => {
    const fetchEligibleEmployees = async () => {
      try {
        setLoading(true);
        const response = await api.get("/special-increments");
        const sorted = response.data.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        setEligibleEmployees(sorted);
        setError(null);
      } catch (err) {
        console.error("Error fetching eligible employees", err);
        setError(err.response?.data?.message || "Failed to fetch data");
        if (err.response?.status === 401) {
          // Handle unauthorized access (e.g., redirect to login)
          console.error("Authentication failed - please login again");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEligibleEmployees();
  }, []);

  const filteredEmployees = eligibleEmployees.filter((emp) =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const displayedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Styles
  const containerStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "40px",
    backgroundColor: "#f0f2f5",
    minHeight: "100vh",
    fontFamily: "Segoe UI, sans-serif",
  };

  const cardStyle = {
    backgroundColor: "#fff",
    borderRadius: "16px",
    padding: "30px 40px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
    width: "100%",
    maxWidth: "1000px",
  };

  const headingStyle = {
    fontSize: "28px",
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: "20px",
    borderBottom: "2px solid #eee",
    paddingBottom: "10px",
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: "0 10px",
  };

  const thStyle = {
    backgroundColor: "#1f2937",
    color: "#ffffff",
    padding: "14px 16px",
    textAlign: "left",
    borderTopLeftRadius: "8px",
    borderTopRightRadius: "8px",
  };

  const tdStyle = {
    backgroundColor: "#ffffff",
    padding: "14px 16px",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
    transition: "background-color 0.3s",
  };

  const rowStyle = {
    transition: "transform 0.2s",
  };

  const alertStyle = {
    backgroundColor: "#fdecea",
    color: "#b71c1c",
    padding: "15px",
    borderRadius: "10px",
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: "20px",
  };

  const infoStyle = {
    backgroundColor: "#e8f4fd",
    color: "#0b5394",
    padding: "15px",
    borderRadius: "10px",
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: "20px",
  };

  const searchStyle = {
    marginBottom: "20px",
    padding: "10px",
    width: "100%",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "16px",
  };

  const paginationStyle = {
    display: "flex",
    justifyContent: "center",
    marginTop: "20px",
    gap: "10px",
  };

  const pageButtonStyle = (active) => ({
    padding: "8px 14px",
    backgroundColor: active ? "#1f2937" : "#fff",
    color: active ? "#fff" : "#333",
    border: "1px solid #ccc",
    borderRadius: "6px",
    cursor: "pointer",
  });

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h2 style={headingStyle}>Employees Eligible for Special Increments</h2>

        {!hasAccess("HR-View") ? (
          <div style={alertStyle}>
            ❌ You do not have permission to view HR policy data.
          </div>
        ) : (
          <>
            {error && (
              <div style={alertStyle}>
                ⚠️ {error}
              </div>
            )}

            {loading ? (
              <div style={infoStyle}>
                Loading employee data...
              </div>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={searchStyle}
                />

                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>ID</th>
                      <th style={thStyle}>Name</th>
                      <th style={thStyle}>Date of Joining</th>
                      <th style={thStyle}>Years of Service</th>
                      <th style={thStyle}>Eligible For</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedEmployees.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ ...tdStyle, textAlign: "center" }}>
                          {filteredEmployees.length === 0
                            ? "No employees found."
                            : "No employees match your search."}
                        </td>
                      </tr>
                    ) : (
                      displayedEmployees.map((emp, index) => (
                        <tr
                          key={emp._id}
                          style={rowStyle}
                          onMouseOver={(e) =>
                            (e.currentTarget.style.transform = "scale(1.005)")
                          }
                          onMouseOut={(e) =>
                            (e.currentTarget.style.transform = "scale(1)")
                          }
                        >
                          <td style={tdStyle}>
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>
                          <td style={tdStyle}>{emp.name}</td>
                          <td style={tdStyle}>
                            {new Date(emp.date_of_joining).toLocaleDateString()}
                          </td>
                          <td style={tdStyle}>{emp.years} Years</td>
                          <td style={tdStyle}>{emp.milestone}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {totalPages > 1 && (
                  <div style={paginationStyle}>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i + 1}
                        style={pageButtonStyle(currentPage === i + 1)}
                        onClick={() => setCurrentPage(i + 1)}
                        disabled={loading}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

HRPolicy.propTypes = {
  permissions: PropTypes.arrayOf(
    PropTypes.shape({
      code: PropTypes.string.isRequired,
      access: PropTypes.bool.isRequired,
    })
  ).isRequired,
};

export default HRPolicy;