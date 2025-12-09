import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const EmpId = () => {
  const { id } = useParams();
  const [employee, setEmployee] = useState({});
  const [tasks, setTasks] = useState([]);
  const [taskName, setTaskName] = useState("");
  const [duration, setDuration] = useState("");
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    axios.get(`http://localhost:1000/employees/${id}`).then((res) => {
      setEmployee(res.data);
      fetchTasks(res.data.name);
    });
  }, [id]);

  const fetchTasks = (empName) => {
    axios
      .get(`http://localhost:1000/task/${empName}`)
      .then((res) => setTasks(res.data))
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
      fetchTasks(employee.name);
    } catch (err) {
      console.error("Failed to add task", err);
    }
  };

  const handleStart = async (taskId) => {
    setActiveTaskId(taskId);
    setElapsedTime(0);
    setIsPaused(false);
    clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    await axios.put(`http://localhost:1000/task/start/${taskId}`);
  };

  const handlePause = async () => {
    clearInterval(timerRef.current);
    setIsPaused(true);
    await axios.put(`http://localhost:1000/task/pause/${activeTaskId}`);
  };

  const handleResume = () => {
    setIsPaused(false);
    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
  };

  const handleComplete = async () => {
    clearInterval(timerRef.current);
    const elapsedMinutes = (elapsedTime / 60).toFixed(2);

    try {
      await axios.put(`http://localhost:1000/task/complete/${activeTaskId}`, {
        elapsedMinutes,
      });

      alert("✅ Task completed successfully!"); // <-- Show alert here
      setActiveTaskId(null);
      setElapsedTime(0);
      setIsPaused(false);
      fetchTasks(employee.name);
    } catch (err) {
      console.error("Error completing task", err);
      alert("❌ Failed to complete task");
    }
  };

  const formatTime = (seconds) => {
    const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");
    return `${hrs}:${mins}:${secs}`;
  };

  const averageRating =
    tasks.length > 0
      ? (
          tasks.reduce((acc, task) => acc + (task.rating || 0), 0) /
          tasks.filter((task) => task.rating).length
        ).toFixed(1)
      : "N/A";

  return (
    <div style={{ fontFamily: "Arial", backgroundColor: "#f4f6f8", minHeight: "100vh" }}>
      <nav style={{ backgroundColor: "#1e3d59", padding: "1rem 2rem", color: "white", display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontWeight: "bold", fontSize: "1.2rem" }}>👋 {employee.name}</span>
        <span style={{ fontSize: "1rem" }}>⭐ Avg Rating: {averageRating !== "N/A" ? averageRating : "No ratings yet"}</span>
      </nav>

      <div style={{ maxWidth: "1000px", margin: "2rem auto", padding: "1rem" }}>
        <h2>Task Table</h2>

        {activeTaskId && (
          <div style={{ backgroundColor: "#d1ecf1", color: "#0c5460", padding: "1rem", textAlign: "center", borderRadius: "6px", fontSize: "1.2rem" }}>
            ⏱️ Stopwatch: <strong>{formatTime(elapsedTime)}</strong>
            {isPaused && <span style={{ marginLeft: "10px", color: "red" }}>(Paused)</span>}
          </div>
        )}

        <div style={{ backgroundColor: "white", padding: "1rem", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", borderRadius: "8px", marginTop: "1rem" }}>
          <h4>Assign New Task</h4>
          <form onSubmit={handleAddTask} style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <input
              type="text"
              placeholder="Task Name"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              style={{ flex: 2, padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
            />
            <input
              type="number"
              placeholder="Duration (mins)"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              style={{ flex: 1, padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
            />
            <button type="submit" style={{ padding: "0.5rem 1rem", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "4px" }}>
              Add
            </button>
          </form>
        </div>

        <div style={{ marginTop: "2rem" }}>
          <h4>Your Tasks</h4>
          {tasks.length === 0 ? (
            <p style={{ color: "gray" }}>No tasks assigned yet.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem", backgroundColor: "white", borderRadius: "8px", overflow: "hidden" }}>
              <thead style={{ backgroundColor: "#1e3d59", color: "white" }}>
                <tr>
                  <th style={{ padding: "0.75rem" }}>Task</th>
                  <th>Duration</th>
                  <th>Finished In</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task._id} style={{ textAlign: "center", borderTop: "1px solid #ddd" }}>
                    <td style={{ padding: "0.75rem" }}>{task.taskName}</td>
                    <td>{task.duration} mins</td>
                    <td>{task.finishedIn || "-"} mins</td>
                    <td>
                      {task.rating
                        ? `⭐`.repeat(task.rating) + ` (${task.rating}/5)`
                        : "Not Rated"}
                    </td>
                    <td>
                      {task.finishedIn ? (
                        <span style={{ color: "green" }}>Completed</span>
                      ) : (
                        <span style={{ color: "orange" }}>Pending</span>
                      )}
                    </td>
                    <td>
                      {!task.finishedIn ? (
                        activeTaskId !== task._id ? (
                          <button
                            onClick={() => handleStart(task._id)}
                            style={{ padding: "0.25rem 0.75rem", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px" }}
                          >
                            Start
                          </button>
                        ) : (
                          <>
                            {!isPaused ? (
                              <button
                                onClick={handlePause}
                                style={{ padding: "0.25rem 0.75rem", backgroundColor: "#ffc107", color: "black", border: "none", borderRadius: "4px", marginRight: "5px" }}
                              >
                                Pause
                              </button>
                            ) : (
                              <button
                                onClick={handleResume}
                                style={{ padding: "0.25rem 0.75rem", backgroundColor: "#17a2b8", color: "white", border: "none", borderRadius: "4px", marginRight: "5px" }}
                              >
                                Resume
                              </button>
                            )}
                            <button
                              onClick={handleComplete}
                              style={{ padding: "0.25rem 0.75rem", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "4px" }}
                            >
                              Complete
                            </button>
                          </>
                        )
                      ) : (
                        <button disabled style={{ padding: "0.25rem 0.75rem", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "4px" }}>
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
    </div>
  );
};

export default EmpId;
