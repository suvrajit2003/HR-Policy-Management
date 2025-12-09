import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const TaskModule = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState({});
  const [tasks, setTasks] = useState([]);
  const [taskName, setTaskName] = useState("");
  const [duration, setDuration] = useState("");
  const [timers, setTimers] = useState({});
  const [startTimes, setStartTimes] = useState({});
  const [elapsedTimes, setElapsedTimes] = useState({});
  const intervalRefs = useRef({});

  useEffect(() => {
    axios.get(`http://localhost:1000/employees/${id}`).then((res) => {
      setEmployee(res.data);
    });
  }, [id]);

  useEffect(() => {
    if (employee.name) {
      fetchTasks(employee.name);
    }
  }, [employee.name]);

  const fetchTasks = (empName) => {
    axios
      .get(`http://localhost:1000/task/${empName}`)
      .then((res) => {
        setTasks(res.data);
        // Restore elapsedTimes from tasks
        const newElapsed = {};
        res.data.forEach((task) => {
          newElapsed[task._id] = task.finishedIn ? task.finishedIn * 60 : 0;
        });
        setElapsedTimes(newElapsed);
      })
      .catch((err) => console.error("Task fetch error", err));
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!taskName || !duration) return alert("Please enter task details");

    try {
      const newTask = {
        taskName,
        duration,
        employeeName: employee.name,
      };

      await axios.post("http://localhost:1000/task/add", newTask);
      setTaskName("");
      setDuration("");
      setTimeout(() => fetchTasks(employee.name), 200);
    } catch (err) {
      console.error("Failed to add task", err);
    }
  };

  const handleStart = async (taskId) => {
    await axios.put(`http://localhost:1000/task/start/${taskId}`);
    setStartTimes((prev) => ({ ...prev, [taskId]: Date.now() }));
    intervalRefs.current[taskId] = setInterval(() => {
      setElapsedTimes((prev) => ({
        ...prev,
        [taskId]: (prev[taskId] || 0) + 1,
      }));
    }, 1000);
  };

  const handlePause = async (taskId) => {
    clearInterval(intervalRefs.current[taskId]);
    intervalRefs.current[taskId] = null;
    setStartTimes((prev) => {
      const copy = { ...prev };
      delete copy[taskId];
      return copy;
    });
    await axios.put(`http://localhost:1000/task/pause/${taskId}`);
  };

  const handleResume = async (taskId) => {
    await axios.put(`http://localhost:1000/task/start/${taskId}`);
    setStartTimes((prev) => ({ ...prev, [taskId]: Date.now() }));
    intervalRefs.current[taskId] = setInterval(() => {
      setElapsedTimes((prev) => ({
        ...prev,
        [taskId]: (prev[taskId] || 0) + 1,
      }));
    }, 1000);
  };

  const handleComplete = async (taskId) => {
    clearInterval(intervalRefs.current[taskId]);
    intervalRefs.current[taskId] = null;
    const elapsedSeconds = elapsedTimes[taskId] || 0;
    const elapsedMinutes = (elapsedSeconds / 60).toFixed(2);
    await axios.put(`http://localhost:1000/task/complete/${taskId}`, {
      elapsedMinutes,
    });
    fetchTasks(employee.name);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const averageRating =
    tasks.length > 0
      ? (
          tasks.reduce((acc, task) => acc + (task.rating || 0), 0) /
          tasks.filter((task) => task.rating).length
        ).toFixed(1)
      : "N/A";

  const styles = {
    container: {
      fontFamily: "Segoe UI, sans-serif",
      backgroundColor: "#f4f7fa",
      minHeight: "100vh",
      padding: "20px",
    },
    navbar: {
      backgroundColor: "#343a40",
      padding: "15px 30px",
      color: "#fff",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      borderRadius: "10px",
    },
    infoBox: {
      color: "#ccc",
      fontSize: "14px",
      marginRight: "20px",
    },
    card: {
      backgroundColor: "#fff",
      padding: "20px",
      borderRadius: "10px",
      boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
      marginBottom: "30px",
    },
    heading: {
      color: "#007BFF",
      marginBottom: "20px",
    },
    input: {
      padding: "10px",
      borderRadius: "6px",
      border: "1px solid #ccc",
      marginRight: "10px",
      width: "100%",
      maxWidth: "200px",
    },
    btn: {
      padding: "10px 15px",
      backgroundColor: "#28a745",
      color: "#fff",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "bold",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      marginTop: "20px",
    },
    th: {
      backgroundColor: "#007BFF",
      color: "white",
      padding: "12px",
      borderRadius: "4px",
    },
    td: {
      padding: "10px",
      borderBottom: "1px solid #ddd",
      textAlign: "center",
    },
    badge: {
      padding: "5px 10px",
      borderRadius: "12px",
      fontSize: "13px",
    },
    badgeSuccess: {
      backgroundColor: "#28a745",
      color: "#fff",
    },
    badgeWarning: {
      backgroundColor: "#ffc107",
      color: "#212529",
    },
    logout: {
      padding: "8px 15px",
      backgroundColor: "#dc3545",
      color: "white",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
    },
  };

  return (
    <div style={styles.container}>
      {/* Navbar */}
      <div style={styles.navbar}>
        <h4>👋 Welcome, {employee.name}</h4>
        <div style={styles.infoBox}>
          <div>📧 {employee.email}</div>
          <div>📱 {employee.phone}</div>
          <div>
            🗓 DOJ:{" "}
            {employee.date_of_joining &&
              new Date(employee.date_of_joining).toLocaleDateString()}
          </div>
        </div>
        <div>
          <strong style={{ color: "#ffc107" }}>⭐ Avg Rating:</strong>{" "}
          {averageRating !== "N/A" ? (
            <span style={{ color: "#ffc107" }}>{averageRating} / 5.0</span>
          ) : (
            <span style={{ color: "#bbb" }}>No rated tasks</span>
          )}
        </div>
        <button style={styles.logout} onClick={() => navigate("/employee")}>
          🔒 Logout
        </button>
      </div>

      {/* Task Form */}
      <div style={styles.card}>
        <h3 style={styles.heading}>📝 Assign New Task</h3>
        <form onSubmit={handleAddTask} style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Task Name"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            style={styles.input}
          />
          <input
            type="number"
            placeholder="Duration (mins)"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            style={styles.input}
          />
          <button type="submit" style={styles.btn}>
            ➕ Add Task
          </button>
        </form>
      </div>

      {/* Task Table */}
      <div style={styles.card}>
        <h3 style={styles.heading}>📋 Assigned Tasks</h3>
        {tasks.length === 0 ? (
          <p>No tasks assigned yet.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Task</th>
                <th style={styles.th}>Duration</th>
                <th style={styles.th}>Finished In</th>
                <th style={styles.th}>Rating</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task._id}>
                  <td style={styles.td}>{task.taskName}</td>
                  <td style={styles.td}>{task.duration} mins</td>
                  <td style={styles.td}>{task.finishedIn || "-"}</td>
                  <td style={styles.td}>
                    {task.rating ? (
                      <span style={{ color: "#28a745" }}>
                        {"\u2b50".repeat(task.rating)} ({task.rating}/5)
                      </span>
                    ) : (
                      <span style={{ color: "#888" }}>Not Rated</span>
                    )}
                  </td>
                  <td style={styles.td}>
                    {task.status === 'completed' ? (
                      <span style={{ ...styles.badge, ...styles.badgeSuccess }}>Completed</span>
                    ) : task.status === 'paused' ? (
                      <span style={{ ...styles.badge, ...styles.badgeWarning }}>Paused</span>
                    ) : task.status === 'started' ? (
                      <span style={{ ...styles.badge, backgroundColor: '#17a2b8', color: '#fff' }}>Started</span>
                    ) : (
                      <span style={{ ...styles.badge, backgroundColor: '#6c757d', color: '#fff' }}>Pending</span>
                    )}
                  </td>
                  <td style={styles.td}>
                    {/* Stopwatch UI */}
                    {task.status !== 'completed' && (
                      <span style={{ fontFamily: 'monospace', marginRight: 8 }}>
                        {formatTime(elapsedTimes[task._id] || 0)}
                      </span>
                    )}
                    {task.status === 'pending' && (
                      <button style={{ ...styles.btn, backgroundColor: '#007bff' }} onClick={() => handleStart(task._id)}>
                        ▶ Start
                      </button>
                    )}
                    {task.status === 'started' && (
                      <>
                        <button style={{ ...styles.btn, backgroundColor: '#ffc107', color: '#000' }} onClick={() => handlePause(task._id)}>
                          ⏸ Pause
                        </button>
                        <button style={{ ...styles.btn, backgroundColor: '#28a745' }} onClick={() => handleComplete(task._id)}>
                          ✅ Complete
                        </button>
                      </>
                    )}
                    {task.status === 'paused' && (
                      <>
                        <button style={{ ...styles.btn, backgroundColor: '#17a2b8' }} onClick={() => handleResume(task._id)}>
                          ▶ Resume
                        </button>
                        <button style={{ ...styles.btn, backgroundColor: '#28a745' }} onClick={() => handleComplete(task._id)}>
                          ✅ Complete
                        </button>
                      </>
                    )}
                    {task.status === 'completed' && (
                      <button style={{ ...styles.btn, backgroundColor: '#6c757d' }} disabled>
                        ✅ Completed
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TaskModule;
