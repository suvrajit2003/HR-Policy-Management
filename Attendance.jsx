import React, { useEffect, useState } from "react";
import axios from "axios";

const Attendance = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:1000/api/attendance");
      setAttendanceData(res.data);
      setError(null);
    } catch (error) {
      console.error("Failed to fetch attendance", error);
      setError("Failed to load attendance data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const filteredData = attendanceData.filter((entry) => {
    const matchesSearch = entry.emp_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = dateFilter ? new Date(entry.date).toISOString().split('T')[0] === dateFilter : true;
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "present" && entry.is_active) || 
                         (statusFilter === "absent" && !entry.is_active);
    
    return matchesSearch && matchesDate && matchesStatus;
  });

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-gradient-primary">
        <div className="text-center">
          <div className="spinner-grow text-light" style={{ width: '3rem', height: '3rem' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-white fs-5">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-gradient-primary">
        <div className="alert alert-danger text-center shadow-lg p-4 rounded-3" style={{ maxWidth: '500px' }} role="alert">
          <i className="bi bi-exclamation-triangle-fill fs-1 mb-3"></i>
          <h4 className="alert-heading fw-bold">Error!</h4>
          <p className="fs-5">{error}</p>
          <hr />
          <button className="btn btn-outline-danger rounded-pill px-4" onClick={fetchAttendance}>
            <i className="bi bi-arrow-clockwise me-2"></i>Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
            <div className="card-header bg-gradient-primary text-white py-3">
              <div className="row align-items-center">
                <div className="col-md-6">
                  <h2 className="mb-0 fw-bold">
                    <i className="bi bi-calendar-check me-2"></i>
                    Employee Attendance Dashboard
                  </h2>
                </div>
                <div className="col-md-6 text-md-end">
                  <button 
                    className="btn btn-light rounded-pill px-4"
                    onClick={fetchAttendance}
                  >
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Refresh Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-body p-4">
              <div className="row g-3">
                <div className="col-md-4">
                  <div className="form-floating">
                    <input
                      type="text"
                      className="form-control rounded-pill"
                      id="searchInput"
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <label htmlFor="searchInput">
                      <i className="bi bi-search me-2"></i>Search Employees
                    </label>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="form-floating">
                    <input
                      type="date"
                      className="form-control rounded-pill"
                      id="dateFilter"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                    />
                    <label htmlFor="dateFilter">
                      <i className="bi bi-calendar me-2"></i>Filter by Date
                    </label>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="form-floating">
                    <select
                      className="form-select rounded-pill"
                      id="statusFilter"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">All Statuses</option>
                      <option value="present">Present Only</option>
                      <option value="absent">Absent Only</option>
                    </select>
                    <label htmlFor="statusFilter">
                      <i className="bi bi-funnel me-2"></i>Filter by Status
                    </label>
                  </div>
                </div>
                <div className="col-md-2 d-flex align-items-center">
                  <button
                    className="btn btn-outline-secondary rounded-pill w-100"
                    onClick={() => {
                      setSearchTerm("");
                      setDateFilter("");
                      setStatusFilter("all");
                    }}
                  >
                    <i className="bi bi-x-lg me-2"></i>Clear
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
            <div className="card-body p-0">
              {filteredData.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-calendar-x text-muted" style={{ fontSize: '3rem' }}></i>
                  <h4 className="mt-3 text-muted">No attendance records found</h4>
                  <p className="text-muted">Try adjusting your filters or check back later</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover table-borderless mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th scope="col" className="ps-4 py-3 text-uppercase fw-semibold text-muted">Employee</th>
                        <th scope="col" className="py-3 text-uppercase fw-semibold text-muted">Date</th>
                        <th scope="col" className="py-3 text-uppercase fw-semibold text-muted">Check In</th>
                        <th scope="col" className="py-3 text-uppercase fw-semibold text-muted">Check Out</th>
                        <th scope="col" className="py-3 text-uppercase fw-semibold text-muted">Status</th>
                        <th scope="col" className="py-3 text-uppercase fw-semibold text-muted">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="border-top-0">
                      {filteredData.map((entry) => {
                        const checkIn = new Date(`2000-01-01T${entry.check_in}`);
                        const checkOut = entry.check_out ? new Date(`2000-01-01T${entry.check_out}`) : null;
                        const duration = checkOut ? 
                          `${Math.floor((checkOut - checkIn) / (1000 * 60 * 60))}h ${Math.floor((checkOut - checkIn) / (1000 * 60) % 60)}m` : 
                          'N/A';

                        return (
                          <tr key={entry._id} className="border-bottom">
                            <td className="ps-4 py-3">
                              <div className="d-flex align-items-center">
                                <div className="symbol symbol-40px symbol-circle me-3">
                                  <span className="symbol-label bg-primary bg-opacity-10 text-primary fw-bold">
                                    {entry.emp_name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <div className="fw-bold">{entry.emp_name}</div>
                                  <div className="text-muted small">{entry.emp_id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3">
                              {new Date(entry.date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </td>
                            <td className="py-3">
                              <span className="badge bg-light text-dark p-2">
                                <i className="bi bi-box-arrow-in-right me-2"></i>
                                {entry.check_in}
                              </span>
                            </td>
                            <td className="py-3">
                              {entry.check_out ? (
                                <span className="badge bg-light text-dark p-2">
                                  <i className="bi bi-box-arrow-right me-2"></i>
                                  {entry.check_out}
                                </span>
                              ) : (
                                <span className="badge bg-light text-muted p-2">Not checked out</span>
                              )}
                            </td>
                            <td className="py-3">
                              <span className={`badge ${entry.is_active ? "bg-success" : "bg-danger"} p-2`}>
                                <i className={`bi ${entry.is_active ? "bi-check-circle" : "bi-x-circle"} me-2`}></i>
                                {entry.is_active ? "Present" : "Absent"}
                              </span>
                            </td>
                            <td className="py-3">
                              <span className="badge bg-light text-dark p-2">
                                <i className="bi bi-clock-history me-2"></i>
                                {duration}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="card-footer bg-transparent border-0 py-3">
              <div className="d-flex justify-content-between align-items-center">
                <div className="text-muted">
                  Showing <span className="fw-bold">{filteredData.length}</span> of <span className="fw-bold">{attendanceData.length}</span> records
                </div>
                <div>
                  <button className="btn btn-sm btn-outline-primary rounded-pill me-2">
                    <i className="bi bi-download me-2"></i>Export
                  </button>
                  <button className="btn btn-sm btn-primary rounded-pill">
                    <i className="bi bi-plus-circle me-2"></i>Add Record
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;