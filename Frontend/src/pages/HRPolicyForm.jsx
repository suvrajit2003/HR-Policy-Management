import React, { useState, useEffect } from "react";
import axios from "axios";


const HRPolicyForm = () => {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch policy on mount
  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const res = await axios.get("http://localhost:1000/hr-policy2");
        if (res.data?.leaveTypes) {
          setLeaveTypes(res.data.leaveTypes.map(lt => ({
            ...lt,
            isActive: lt.isActive !== undefined ? lt.isActive : true
          })));
        } else {
          setLeaveTypes([{
            type: "",
            mode: "Free",
            frequency: "Monthly",
            maxPerRequest: 1,
            normalDays: 0,
            isActive: true
          }]);
        }
      } catch (err) {
        console.error("Error fetching policy:", err);
        setError("Failed to load policy data");
        setLeaveTypes([{
          type: "",
          mode: "Free",
          frequency: "Monthly",
          maxPerRequest: 1,
          normalDays: 0,
          isActive: true
        }]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPolicy();
  }, []);

  const handleLeaveChange = (index, field, value) => {
    const updated = [...leaveTypes];
    updated[index] = {
      ...updated[index],
      [field]: field === "maxPerRequest" || field === "normalDays" 
        ? parseInt(value) || 0 
        : field === "isActive"
        ? !updated[index].isActive // Toggle for checkbox
        : value
    };
    setLeaveTypes(updated);
  };

  const addLeaveType = () => {
    setLeaveTypes([
      ...leaveTypes,
      {
        type: "",
        mode: "Free",
        frequency: "Monthly",
        maxPerRequest: 1,
        normalDays: 0,
        isActive: true
      },
    ]);
  };

  const removeLeaveType = (index) => {
    if (leaveTypes.length <= 1) {
      alert("You must have at least one leave type");
      return;
    }
    setLeaveTypes(leaveTypes.filter((_, i) => i !== index));
  };

  const savePolicy = async () => {
    try {
      // Validate before saving
      const hasEmptyTypes = leaveTypes.some(lt => !lt.type.trim());
      if (hasEmptyTypes) {
        alert("Please fill in all leave type names");
        return;
      }

      const response = await axios.post("http://localhost:1000/hr-policy2", {
        leaveTypes: leaveTypes.map(lt => ({
          type: lt.type.trim(),
          mode: lt.mode,
          frequency: lt.frequency,
          maxPerRequest: parseInt(lt.maxPerRequest) || 1,
          normalDays: parseInt(lt.normalDays) || 0,
          isActive: lt.isActive
        }))
      });

      if (response.data.message) {
        alert(response.data.message);
      } else {
        alert("Policy saved successfully");
      }
    } catch (err) {
      console.error("Error saving policy:", err);
      alert(err.response?.data?.error || "Failed to save policy");
    }
  };

  if (isLoading) {
    return (
      <div className="container mt-4">
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-4">HR Leave Policy Setup</h2>
      
      <div className="card mb-4 shadow-sm">
        <div className="card-header bg-primary text-white">
          <h4 className="mb-0">Leave Types Configuration</h4>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-bordered table-hover">
              <thead className="table-light">
                <tr>
                  <th>Leave Type</th>
                  <th>Mode</th>
                  <th>Frequency</th>
                  <th>Max Days Per Request</th>
                  <th>Total Days</th>
                  <th className="text-center">Active (Yes/No)</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {leaveTypes.map((leave, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        type="text"
                        className="form-control"
                        value={leave.type}
                        onChange={(e) =>
                          handleLeaveChange(index, "type", e.target.value)
                        }
                        required
                        placeholder="e.g., Annual Leave"
                      />
                    </td>
                    <td>
                      <select
                        className="form-select"
                        value={leave.mode}
                        onChange={(e) =>
                          handleLeaveChange(index, "mode", e.target.value)
                        }
                      >
                        <option value="Free">Free</option>
                        <option value="Paid">Paid</option>
                      </select>
                    </td>
                    <td>
                      <select
                        className="form-select"
                        value={leave.frequency}
                        onChange={(e) =>
                          handleLeaveChange(index, "frequency", e.target.value)
                        }
                      >
                        <option value="Monthly">Monthly</option>
                        <option value="Yearly">Yearly</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        className="form-control"
                        value={leave.maxPerRequest}
                        onChange={(e) =>
                          handleLeaveChange(index, "maxPerRequest", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        className="form-control"
                        value={leave.normalDays}
                        onChange={(e) =>
                          handleLeaveChange(index, "normalDays", e.target.value)
                        }
                      />
                    </td>
                    <td className="text-center align-middle">
                      <div className="form-check form-switch d-inline-block">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={leave.isActive}
                          onChange={() => handleLeaveChange(index, "isActive")}
                          id={`active-switch-${index}`}
                          style={{ transform: "scale(1.5)", cursor: "pointer" }}
                        />
                        <label 
                          className="form-check-label ms-2" 
                          htmlFor={`active-switch-${index}`}
                        >
                          {leave.isActive ? "Yes" : "No"}
                        </label>
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => removeLeaveType(index)}
                        disabled={leaveTypes.length <= 1}
                      >
                        <i className="bi bi-trash"></i> Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex gap-2 mt-3">
            <button
              type="button"
              className="btn btn-success"
              onClick={addLeaveType}
            >
              <i className="bi bi-plus-circle"></i> Add Leave Type
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={savePolicy}
              disabled={leaveTypes.length === 0}
            >
              <i className="bi bi-save"></i> Save Policy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRPolicyForm;