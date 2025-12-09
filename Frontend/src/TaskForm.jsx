import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const TaskForm = () => {
  const { id: paramId } = useParams();
  const navigate = useNavigate();

  // Retrieve userId from URL params or localStorage
  const userId = paramId || localStorage.getItem("userId");

  // State variables for employee, tasks, new task input, timers, and messages
  const [employee, setEmployee] = useState({});
  const [tasks, setTasks] = useState([]);
  const [taskName, setTaskName] = useState("");
  const [duration, setDuration] = useState("");
  const [timers, setTimers] = useState({}); // Stores setInterval IDs for active tasks
  const [startTimes, setStartTimes] = useState({}); // Stores start timestamps for active tasks
  const [message, setMessage] = useState({ type: "", text: "" }); // For displaying user messages

  // Effect hook to fetch employee data and tasks on component mount or userId change
  useEffect(() => {
    if (!userId) {
      setMessage({ type: "error", text: "No user ID found. Please log in." });
      navigate("/");
      return;
    }

    // Fetch employee details
    axios
      .get(`http://localhost:1000/employees/${userId}`)
      .then((res) => {
        setEmployee(res.data);
        // Once employee data is fetched, fetch their tasks
        fetchTasks(res.data.name);
      })
      .catch((err) => {
        console.error("Failed to fetch employee:", err);
        setMessage({ type: "error", text: "Failed to load employee data. Please try again." });
        navigate("/");
      });
  }, [userId, navigate]); // Depend on userId and navigate

  // Function to fetch tasks for a given employee name
  const fetchTasks = (empName) => {
    axios
      .get(`http://localhost:1000/task/${empName}`)
      .then((res) => setTasks(res.data))
      .catch((err) => {
        console.error("Task fetch error", err);
        setMessage({ type: "error", text: "Failed to fetch tasks. Please try again." });
      });
  };

  // Handler for adding a new task
  const handleAddTask = async (e) => {
    e.preventDefault(); // Prevent default form submission
    if (!taskName || !duration) {
      setMessage({ type: "error", text: "Please enter both task name and duration." });
      return;
    }

    try {
      const newTask = {
        taskName,
        duration: parseInt(duration), // Ensure duration is an integer
        employeeName: employee.name,
        employeeId: employee._id, // Pass employeeId for backend linking
      };

      await axios.post("http://localhost:1000/task/add", newTask);
      setTaskName(""); // Clear task name input
      setDuration(""); // Clear duration input
      setMessage({ type: "success", text: "Task added successfully!" });
      fetchTasks(employee.name); // Re-fetch tasks to update the list
    } catch (err) {
      console.error("Failed to add task", err);
      setMessage({ type: "error", text: "Failed to add task. Please try again." });
    }
  };

  // Handler for starting a task
  const handleStart = async (taskId) => {
    const now = Date.now();
    setStartTimes((prev) => ({ ...prev, [taskId]: now })); // Record start time in local state

    // Set up an interval to periodically fetch tasks (e.g., every minute)
    // This helps in keeping the UI somewhat fresh, though direct elapsed time isn't shown live here.
    const interval = setInterval(() => fetchTasks(employee.name), 60000);
    setTimers((prev) => ({ ...prev, [taskId]: interval })); // Store interval ID

    try {
      await axios.put(`http://localhost:1000/task/start/${taskId}`);
      setMessage({ type: "success", text: "Task started!" });
      fetchTasks(employee.name); // Re-fetch to update status immediately
    } catch (err) {
      console.error("Failed to start task:", err);
      setMessage({ type: "error", text: "Failed to start task. Please try again." });
    }
  };

  // Handler for pausing a task
  const handlePause = async (taskId) => {
    const end = Date.now();
    const start = startTimes[taskId];
    // Calculate elapsed minutes for the current segment
    const currentSegmentElapsedMinutes = start ? ((end - start) / 60000) : 0;

    // Clear the interval and remove from timers/startTimes state
    clearInterval(timers[taskId]);
    setTimers((prev) => {
      const copy = { ...prev };
      delete copy[taskId];
      return copy;
    });
    setStartTimes((prev) => {
      const copy = { ...prev };
      delete copy[taskId];
      return copy;
    });

    try {
      // Call the backend's pause endpoint, sending the elapsed time for this segment
      await axios.put(`http://localhost:1000/task/pause/${taskId}`, {
        currentSegmentElapsedMinutes: currentSegmentElapsedMinutes.toFixed(2),
      });
      setMessage({ type: "success", text: "Task paused!" });
      fetchTasks(employee.name); // Re-fetch tasks to update the list
    } catch (err) {
      console.error("Failed to pause task:", err);
      setMessage({ type: "error", text: "Failed to pause task. Please try again." });
    }
  };

  // Handler for completing a task
  const handleComplete = async (taskId) => {
    const taskToComplete = tasks.find(task => task._id === taskId);
    if (!taskToComplete) {
      setMessage({ type: "error", text: "Task not found." });
      return;
    }

    let totalElapsedMinutes = taskToComplete.finishedIn || 0;

    // If the task was currently running, add the current segment's elapsed time
    if (startTimes[taskId]) {
      const currentSegmentElapsed = (Date.now() - startTimes[taskId]) / 60000;
      totalElapsedMinutes += currentSegmentElapsed;

      // Clear the interval and remove from timers/startTimes state
      clearInterval(timers[taskId]);
      setTimers((prev) => {
        const copy = { ...prev };
        delete copy[taskId];
        return copy;
      });
      setStartTimes((prev) => {
        const copy = { ...prev };
        delete copy[taskId];
        return copy;
      });
    }

    try {
      // Call the backend's complete endpoint, sending the total elapsed time
      await axios.put(`http://localhost:1000/task/complete/${taskId}`, {
        elapsedMinutes: totalElapsedMinutes.toFixed(2),
      });
      setMessage({ type: "success", text: "Task completed and rated!" });
      fetchTasks(employee.name); // Re-fetch tasks to update the list with rating and final status
    } catch (err) {
      console.error("Failed to complete task:", err);
      setMessage({ type: "error", text: "Failed to complete task. Please try again." });
    }
  };

  // Handler for logging out
  const handleLogout = () => {
    localStorage.clear(); // Clear local storage
    navigate("/"); // Navigate to the login/home page
  };

  // Calculate average rating
  const averageRating =
    tasks.length > 0
      ? (
          tasks.reduce((acc, task) => acc + (task.rating || 0), 0) /
          tasks.filter((task) => task.rating).length
        ).toFixed(1)
      : "N/A";

  return (
    <div
      className="min-vh-100"
      style={{
        background: "linear-gradient(to bottom right, #e3f2fd, #ffffff)",
        paddingBottom: "40px",
      }}
    >
      {/* Top Navbar */}
      <nav
        className="navbar navbar-expand-lg navbar-dark"
        style={{ backgroundColor: "#1565c0" }}
      >
        <div className="container d-flex justify-content-between align-items-center">
          <span className="navbar-brand fs-5">👋 {employee.name}</span>
          <div className="text-white text-end">
            <span className="fw-semibold text-warning">⭐ Avg Rating:</span>{" "}
            {averageRating !== "N/A" ? (
              <span className="text-warning">{averageRating} / 5.0</span>
            ) : (
              <span className="text-light">No rated tasks</span>
            )}
          </div>
        </div>
      </nav>

      {/* Message Display */}
      {message.text && (
        <div
          className={`mx-auto mt-4 p-3 rounded-md text-center max-w-lg
            ${message.type === "success" ? "bg-success text-white" : "bg-danger text-white"}`}
        >
          {message.text}
        </div>
      )}

      {/* Main Content */}
      <div className="container mt-5">
        <h3 className="text-primary fw-bold mb-4 text-center">📝 Task Dashboard</h3>

        {/* Add Task Form */}
        <div
          className="card p-4 mb-5 shadow-lg"
          style={{ borderLeft: "5px solid #42a5f5", background: "#f9f9f9" }}
        >
          <h5 className="text-info mb-3">Assign New Task</h5>
          <form onSubmit={handleAddTask} className="row g-3">
            <div className="col-md-6">
              <input
                type="text"
                className="form-control"
                placeholder="Task Name"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <input
                type="number"
                className="form-control"
                placeholder="Duration (mins)"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <button type="submit" className="btn btn-info text-white w-100">
                ➕ Add
              </button>
            </div>
          </form>
        </div>

        {/* Task Table */}
        <h5 className="text-secondary mb-3">📋 Your Tasks</h5>
        {tasks.length === 0 ? (
          <p className="text-muted">No tasks assigned yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered shadow-sm">
              <thead className="table-primary text-center">
                <tr>
                  <th>Task</th>
                  <th>Duration</th>
                  <th>Finished In</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task._id}>
                    <td>{task.taskName}</td>
                    <td>{task.duration} mins</td>
                    <td>{task.finishedIn ? `${parseFloat(task.finishedIn).toFixed(2)} mins` : "-"}</td>
                    <td className="text-center">
                      {task.rating ? (
                        <span className="text-success">
                          {"⭐".repeat(task.rating)} ({task.rating}/5)
                        </span>
                      ) : (
                        <span className="text-muted">Not Rated</span>
                      )}
                    </td>
                    <td className="text-center">
                      {task.status === 'completed' ? (
                        <span className="badge bg-success">Completed</span>
                      ) : task.status === 'started' ? (
                        <span className="badge bg-primary">Started</span>
                      ) : task.status === 'paused' ? (
                        <span className="badge bg-warning text-dark">Paused</span>
                      ) : (
                        <span className="badge bg-secondary">Pending</span>
                      )}
                    </td>
                    <td className="text-center">
                      {task.status === 'pending' && (
                        <button
                          className="btn btn-sm btn-primary me-2"
                          onClick={() => handleStart(task._id)}
                        >
                          ▶ Start
                        </button>
                      )}
                      {task.status === 'started' && (
                        <>
                          <button
                            className="btn btn-sm btn-warning me-2"
                            onClick={() => handlePause(task._id)}
                          >
                            ⏸ Pause
                          </button>
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleComplete(task._id)}
                          >
                            ✅ Complete
                          </button>
                        </>
                      )}
                      {task.status === 'paused' && (
                        <>
                          <button
                            className="btn btn-sm btn-primary me-2"
                            onClick={() => handleStart(task._id)}
                          >
                            ▶ Resume
                          </button>
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleComplete(task._id)}
                          >
                            ✅ Complete
                          </button>
                        </>
                      )}
                      {task.status === 'completed' && (
                        <button className="btn btn-sm btn-success" disabled>
                          ✅ Completed
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskForm;
