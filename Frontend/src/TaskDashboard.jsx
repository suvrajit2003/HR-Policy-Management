import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { BsSkipStartCircleFill, BsPauseCircleFill } from "react-icons/bs";
import { FcOk } from "react-icons/fc";

const TaskDashboard = () => {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [timers, setTimers] = useState({});
  const [running, setRunning] = useState({});

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  useEffect(() => {
    if (employee?.name) {
      fetchTasks(employee.name);
    }
  }, [employee]);

  const fetchEmployee = async () => {
    try {
      const res = await axios.get(`http://localhost:1000/employees/${id}`);
      setEmployee(res.data);
    } catch (err) {
      console.error("Failed to fetch employee", err);
    }
  };

  const fetchTasks = async (empName) => {
    try {
      const res = await axios.get(`http://localhost:1000/task/${empName}`);
      setTasks(res.data);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    }
  };

  const startTask = async (taskId) => {
    await axios.put(`http://localhost:1000/task/start/${taskId}`);
    setRunning((prev) => ({ ...prev, [taskId]: true }));
    setTimers((prev) => ({ ...prev, [taskId]: 0 }));
  };

  const pauseTask = async (taskId) => {
    await axios.put(`http://localhost:1000/task/pause/${taskId}`);
    setRunning((prev) => ({ ...prev, [taskId]: false }));
    fetchTasks(employee.name);
  };

  const completeTask = async (taskId, minutes) => {
    await axios.put(`http://localhost:1000/task/complete/${taskId}`, {
      elapsedMinutes: minutes,
    });
    setRunning((prev) => ({ ...prev, [taskId]: false }));
    fetchTasks(employee.name);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) => {
        const updated = { ...prev };
        for (const taskId in running) {
          if (running[taskId]) {
            updated[taskId] = (updated[taskId] || 0) + 1;
          }
        }
        return updated;
      });
    }, 60000); // 1 minute interval
    return () => clearInterval(interval);
  }, [running]);

  return (
    <div className="container mt-4">
      <h3 className="text-center text-primary">Task Dashboard</h3>

      {employee && (
        <div className="mb-4">
          <h5>Welcome, {employee.name}</h5>
          <p>Email: {employee.email}</p>
          <p>Phone: {employee.phone}</p>
          <p>Joining: {new Date(employee.date_of_joining).toLocaleDateString()}</p>
        </div>
      )}

      <table className="table table-bordered table-hover">
        <thead className="table-secondary">
          <tr>
            <th>Task</th>
            <th>Duration (min)</th>
            <th>Finished In</th>
            <th>Timer</th>
            <th>Status</th>
            <th>Rating</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const status = task.finishedIn
              ? "Completed"
              : running[task._id]
              ? "Running"
              : "Pending";

            return (
              <tr key={task._id}>
                <td>{task.taskName}</td>
                <td>{task.duration}</td>
                <td>{task.finishedIn || "--"}</td>
                <td>{timers[task._id] || 0}</td>
                <td>
                  <span
                    className={`badge ${
                      status === "Completed"
                        ? "bg-success"
                        : status === "Running"
                        ? "bg-warning text-dark"
                        : "bg-secondary"
                    }`}
                  >
                    {status}
                  </span>
                </td>
                <td>{task.rating || "--"}</td>
                <td>
                  {!task.finishedIn && (
                    <>
                      <button
                        className="btn btn-sm btn-success me-2"
                        onClick={() => startTask(task._id)}
                      >
                        <BsSkipStartCircleFill />
                      </button>
                      <button
                        className="btn btn-sm btn-warning me-2"
                        onClick={() => pauseTask(task._id)}
                      >
                        <BsPauseCircleFill />
                      </button>
                      <button
                        className="btn btn-sm btn-info"
                        onClick={() =>
                          completeTask(task._id, timers[task._id] || 0)
                        }
                      >
                        <FcOk />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TaskDashboard;
