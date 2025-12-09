import { useEffect, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import {
  BsPersonFill,
  BsListTask,
  BsStarFill,
  BsSearch
} from "react-icons/bs";
import {
  FaClock,
  FaCheckCircle,
  FaPauseCircle,
  FaPlayCircle
} from "react-icons/fa";
import PropTypes from "prop-types";

const TaskDetail = ({ permissions }) => {
  const location = useLocation();
  const [tasks, setTasks] = useState([]);
  const [timers, setTimers] = useState({});
  const [running, setRunning] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const hasAccess = (code) => {
    const role = (localStorage.getItem("userRole") || "").toLowerCase();
    if (role === "admin" || role === "superadmin") return true;
    return permissions?.some((p) => p.code === code && p.access);
  };

  useEffect(() => {
    fetchTasks();
  }, [location.state?.refresh, refreshKey]);

 const fetchTasks = async () => {
  try {
    const userRole = (localStorage.getItem("userRole") || "").toLowerCase();
    let url = "http://localhost:1000/task";
    
    if (userRole === "employee") {
      const employeeName = localStorage.getItem("userName") || "";
      url += `?employeeName=${encodeURIComponent(employeeName)}`;
    }
    
    const response = await axios.get(url, {
      headers: {
        'x-auth-token': localStorage.getItem('token')
      }
    });
    
    setTasks(response.data);
    const initialTimers = {};
    const initialRunning = {};
    response.data.forEach((task) => {
      initialTimers[task._id] = 0;
      initialRunning[task._id] = false;
    });
    setTimers(initialTimers);
    setRunning(initialRunning);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    // Handle error (show message to user, etc.)
  }
};

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) => {
        const updated = { ...prev };
        for (let id in running) {
          if (running[id]) updated[id] += 1;
        }
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const filteredTasks = tasks.filter((task) =>
    task.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.taskName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to page 1 on search
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // 🌟 Styling
  const containerStyle = {
    padding: "40px 20px",
    fontFamily: "'Poppins', sans-serif",
    background: "linear-gradient(to right, #f9f9f9, #e0f7fa)",
    backgroundImage: `
      radial-gradient(circle at 20% 30%, #a0e9ff55 10%, transparent 40%),
      radial-gradient(circle at 80% 70%, #b2f7ef55 10%, transparent 40%)
    `,
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    minHeight: "100vh",
  };

  const cardStyle = {
    background: "#ffffffcc",
    borderRadius: "16px",
    boxShadow: "0 12px 20px rgba(0, 0, 0, 0.1)",
    padding: "40px",
    backdropFilter: "blur(10px)",
    maxWidth: "1200px",
    margin: "0 auto",
  };

  const headingStyle = {
    fontSize: "30px",
    fontWeight: "600",
    textAlign: "center",
    color: "#007acc",
    marginBottom: "30px",
    textShadow: "1px 1px 2px rgba(0,0,0,0.1)",
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    borderRadius: "12px",
    overflow: "hidden",
    backgroundColor: "#ffffff",
  };

  const thStyle = {
    background: "linear-gradient(to right, #007acc, #005b96)",
    color: "#ffffff",
    padding: "16px",
    fontSize: "15px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    textAlign: "center",
  };

  const tdStyle = {
    padding: "16px",
    borderBottom: "1px solid #ddd",
    fontSize: "14px",
    textAlign: "center",
    color: "#333",
    backgroundColor: "#fefefe",
  };

  const badgeStyle = {
    padding: "8px 16px",
    borderRadius: "30px",
    fontSize: "13px",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.3s ease",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  };

  const alertStyle = {
    padding: "20px",
    backgroundColor: "#ffe6e6",
    color: "#cc0000",
    border: "1px solid #ffcccc",
    borderRadius: "8px",
    marginTop: "20px",
    textAlign: "center",
    fontSize: "16px",
  };

  const searchContainer = {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: "20px",
  };

  const searchInput = {
    padding: "10px 14px",
    fontSize: "14px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    outline: "none",
    marginLeft: "8px",
    width: "250px",
  };

  const paginationStyle = {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    marginTop: "25px",
  };

  const pageButton = {
    padding: "8px 16px",
    backgroundColor: "#007acc",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
  };

  const pageButtonDisabled = {
    ...pageButton,
    backgroundColor: "#cccccc",
    cursor: "default",
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h3 style={headingStyle}>📝 Task Dashboard Overview</h3>

        {hasAccess("TASK-View") ? (
          <>
            <div style={searchContainer}>
              <BsSearch style={{ fontSize: "18px" }} />
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={handleSearchChange}
                style={searchInput}
              />
            </div>

            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}><BsPersonFill /> Employee</th>
                  <th style={thStyle}><BsListTask /> Task</th>
                  <th style={thStyle}><FaClock /> Duration (min)</th>
                  <th style={thStyle}><FaClock /> Finished In</th>
                  <th style={thStyle}>Live Timer</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}><BsStarFill /> Rating</th>
                </tr>
              </thead>
              <tbody>
                {currentTasks.map((task) => {
                  const isRunning = running[task._id];
                  const isCompleted = task.finishedIn !== undefined;
                  const timerColor = isRunning
                    ? { color: "#d9534f", fontWeight: "bold" }
                    : { color: "#6c757d" };

                  let statusBadge;
                  if (isCompleted) {
                    statusBadge = (
                      <span style={{ ...badgeStyle, backgroundColor: "#d4edda", color: "#155724" }}>
                        <FaCheckCircle /> Completed
                      </span>
                    );
                  } else if (isRunning) {
                    statusBadge = (
                      <span style={{ ...badgeStyle, backgroundColor: "#fff3cd", color: "#856404" }}>
                        <FaPlayCircle /> In Progress
                      </span>
                    );
                  } else {
                    statusBadge = (
                      <span style={{ ...badgeStyle, backgroundColor: "#e2e3e5", color: "#383d41" }}>
                        <FaPauseCircle /> Paused
                      </span>
                    );
                  }

                  return (
                    <tr
                      key={task._id}
                      style={{ transition: "background 0.3s ease", cursor: "pointer" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1faff")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <td style={tdStyle}>{task.employeeName}</td>
                      <td style={tdStyle}>{task.taskName}</td>
                      <td style={tdStyle}>{task.duration}</td>
                      <td style={tdStyle}>{task.finishedIn ?? "-"}</td>
                      <td style={{ ...tdStyle, ...timerColor }}>
                        {formatTime(timers[task._id] || 0)}
                      </td>
                      <td style={tdStyle}>{statusBadge}</td>
                      <td style={tdStyle}>
                        {task.rating ? (
                          <span style={{ color: "green", fontWeight: "bold" }}>
                            {"⭐".repeat(task.rating)} ({task.rating}/5)
                          </span>
                        ) : (
                          <span style={{ color: "#888" }}>Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div style={paginationStyle}>
              <button
                style={currentPage === 1 ? pageButtonDisabled : pageButton}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Prev
              </button>
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  style={
                    currentPage === index + 1
                      ? { ...pageButton, backgroundColor: "#005b96" }
                      : pageButton
                  }
                  onClick={() => handlePageChange(index + 1)}
                >
                  {index + 1}
                </button>
              ))}
              <button
                style={currentPage === totalPages ? pageButtonDisabled : pageButton}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <div style={alertStyle}>
            ❌ You do not have permission to view Task Details
          </div>
        )}
      </div>
    </div>
  );
};

TaskDetail.propTypes = {
  permissions: PropTypes.arrayOf(
    PropTypes.shape({
      code: PropTypes.string.isRequired,
      access: PropTypes.bool.isRequired,
    })
  ).isRequired,
};

export default TaskDetail;
