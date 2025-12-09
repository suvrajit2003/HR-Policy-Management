import { useEffect, useState } from "react";
import axios from "axios";
import PropTypes from "prop-types";

const Salary = ({ permissions }) => {
  const [salaryData, setSalaryData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const hasAccess = (code) => {
    const role = (localStorage.getItem("userRole") || "").toLowerCase();
    if (role === "admin" || role === "superadmin") return true;
    return permissions?.some((p) => p.code === code && p.access);
  };

  useEffect(() => {
    axios
      .get("http://localhost:1000/api/salary-increments")
      .then((res) => {
        const sorted = res.data.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        setSalaryData(sorted);
        setFilteredData(sorted);
      })
      .catch((err) => {
        console.error("Error fetching salary increment data:", err);
      });
  }, []);

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = salaryData.filter((emp) =>
      emp.name.toLowerCase().includes(term)
    );
    setFilteredData(filtered);
    setCurrentPage(1); // Reset to first page on new search
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const changePage = (direction) => {
    if (direction === "prev" && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
    if (direction === "next" && currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

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
    maxWidth: "1100px",
  };

  const headingStyle = {
    fontSize: "28px",
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: "25px",
    borderBottom: "2px solid #eee",
    paddingBottom: "10px",
  };

  const searchStyle = {
    marginBottom: "20px",
    width: "100%",
    padding: "10px 14px",
    fontSize: "16px",
    borderRadius: "8px",
    border: "1px solid #ccc",
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
  };

  const paginationStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "20px",
  };

  const buttonStyle = {
    padding: "8px 16px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    backgroundColor: "#1f2937",
    color: "#fff",
  };

  const pageInfoStyle = {
    fontWeight: "bold",
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h2 style={headingStyle}>Salary Increment Report</h2>

        {hasAccess("SALARY-View") ? (
          <>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search..."
              style={searchStyle}
            />

            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Level</th>
                  <th style={thStyle}>Experience</th>
                  <th style={thStyle}>Current Salary</th>
                  <th style={thStyle}>Avg Rating</th>
                  <th style={thStyle}>Performance</th>
                  <th style={thStyle}>Special %</th>
                  <th style={thStyle}>Total %</th>
                  <th style={thStyle}>New Salary</th>
                </tr>
              </thead>
              <tbody>
                {currentData.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center", padding: "20px" }}>
                      No salary data found.
                    </td>
                  </tr>
                ) : (
                  currentData.map((item, index) => (
                    <tr
                      key={index}
                      style={rowStyle}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.transform = "scale(1.005)")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.transform = "scale(1)")
                      }
                    >
                      <td style={tdStyle}>{item.name}</td>
                      <td style={tdStyle}>{item.level}</td>
                      <td style={tdStyle}>{item.experience}</td>
                      <td style={tdStyle}>₹{item.current_salary}</td>
                      <td style={tdStyle}>{item.avg_rating}</td>
                      <td style={tdStyle}>{item.rating_label}</td>
                      <td style={tdStyle}>{item.special_increment}%</td>
                      <td style={tdStyle}>{item.total_increment}%</td>
                      <td style={tdStyle}>₹{item.new_salary}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {filteredData.length > itemsPerPage && (
              <div style={paginationStyle}>
                <button
                  onClick={() => changePage("prev")}
                  disabled={currentPage === 1}
                  style={buttonStyle}
                >
                  Previous
                </button>
                <span style={pageInfoStyle}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => changePage("next")}
                  disabled={currentPage === totalPages}
                  style={buttonStyle}
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={alertStyle}>
            ❌ You do not have permission to view salary data.
          </div>
        )}
      </div>
    </div>
  );
};

Salary.propTypes = {
  permissions: PropTypes.arrayOf(
    PropTypes.shape({
      code: PropTypes.string.isRequired,
      access: PropTypes.bool.isRequired,
    })
  ).isRequired,
};

export default Salary;
