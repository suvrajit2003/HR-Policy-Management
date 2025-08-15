import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Modal, Button, ListGroup, Alert } from 'react-bootstrap';

const API_BASE_URL = 'http://localhost:1000';

const ApplyLeavePage = () => {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const [leaveData, setLeaveData] = useState(null);
  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
    isReapplication: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [alternativeOptions, setAlternativeOptions] = useState([]);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [requestedDays, setRequestedDays] = useState(0);
  const [leaveSplit, setLeaveSplit] = useState({
    paidDays: 0,
    lwpDays: 0,
  });

  // Check authentication on load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('Please login to access this page');
      navigate('/');
    }
  }, [navigate]);

  // Fetch leave balance data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId'); // Assuming userId is stored in localStorage
        if (!token || !userId) {
          throw new Error('Authentication required');
        }

        setLoading(true);
        setError(null);

        const response = await axios.get(
          `${API_BASE_URL}/api/leave-balance/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.data?.leaveTypes) {
          throw new Error('No leave data received from server');
        }

        const transformedData = {
          leaveTypes: response.data.leaveTypes.map((lt) => ({
            type: lt.type,
            mode: lt.mode,
            maxPerRequest: lt.maxPerRequest,
            totalDays: lt.totalDays,
            daysTaken: lt.daysTaken,
            daysRemaining: lt.daysRemaining,
          })),
        };

        setLeaveData(transformedData);

        if (transformedData.leaveTypes.length > 0) {
          setFormData((prev) => ({
            ...prev,
            leaveType: transformedData.leaveTypes[0].type,
          }));
        }
      } catch (err) {
        console.error('Failed to fetch leave data:', err);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          navigate('/apply-leave'); // Redirect to login or home
        }
        setError({
          message:
            err.response?.data?.error || 'Failed to load leave information',
          details: err.message,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // Helper function to calculate number of days between two dates
  const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    // Calculate days including start and end date
    return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  // Function to check leave availability and set validation messages
  const checkLeaveAvailability = useCallback(async () => {
    if (
      !formData.startDate ||
      !formData.endDate ||
      !formData.leaveType ||
      !leaveData
    ) {
      setValidationError(''); // Clear validation error if inputs are incomplete
      setRequestedDays(0);
      setLeaveSplit({ paidDays: 0, lwpDays: 0 });
      return;
    }

    const days = calculateDays(formData.startDate, formData.endDate);
    setRequestedDays(days);

    const selectedLeaveType = leaveData.leaveTypes.find(
      (lt) => lt.type === formData.leaveType
    );
    const lwpType = leaveData.leaveTypes.find((lt) => lt.type === 'LWP');

    if (!selectedLeaveType) {
      setValidationError('Invalid leave type selected');
      setAlternativeOptions([]);
      return;
    }

    // Validate dates
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (start > end) {
      setValidationError('Start date cannot be after end date.');
      setAlternativeOptions([]);
      return;
    }
    if (days <= 0) {
      setValidationError('Leave duration must be at least 1 day.');
      setAlternativeOptions([]);
      return;
    }

    // Check for overlapping approved leaves
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      const response = await axios.get(
        `${API_BASE_URL}/api/leaves/check-overlap`,
        {
          params: {
            startDate: formData.startDate,
            endDate: formData.endDate,
            employeeId: userId,
          },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.hasOverlap) {
        const overlappingDates = response.data.overlappingLeaves.map(
          (leave) => {
            const start = new Date(leave.startDate);
            const end = new Date(leave.approvedEndDate || leave.endDate);
            return `${start.toLocaleDateString()} to ${end.toLocaleDateString()}`;
          }
        );

        setValidationError(
          `You already have approved leaves during these dates: ${overlappingDates.join(
            ', '
          )}`
        );
        setAlternativeOptions([]);
        return;
      }
    } catch (err) {
      console.error('Error checking leave overlap:', err);
      setValidationError('Error checking leave availability');
      setAlternativeOptions([]);
      return;
    }

    // Check max days per request for selected leave type
    if (selectedLeaveType.maxPerRequest && days > selectedLeaveType.maxPerRequest) {
      setValidationError(
        `Maximum ${selectedLeaveType.maxPerRequest} days allowed per request for ${selectedLeaveType.type}`
      );
      setAlternativeOptions([]);
      return;
    }

    // Calculate how leave will be split
    const paidDays = Math.min(days, selectedLeaveType.daysRemaining);
    const lwpDays = Math.max(0, days - paidDays);

    setLeaveSplit({ paidDays, lwpDays });

    if (lwpDays > 0) {
      // Check if LWP has any restrictions
      if (lwpType?.maxPerRequest && lwpDays > lwpType.maxPerRequest) {
        setValidationError(
          `Insufficient ${formData.leaveType} balance (only ${paidDays} days left). ` +
            `Would need ${lwpDays} days of LWP but maximum allowed is ${lwpType.maxPerRequest}.`
        );
        setAlternativeOptions([]);
      } else {
        setValidationError(
          `Will use ${paidDays} ${formData.leaveType} days + ${lwpDays} LWP days.`
        );
        setAlternativeOptions([]);
      }
    } else {
      setValidationError('');
      setAlternativeOptions([]);
    }
  }, [formData.startDate, formData.endDate, formData.leaveType, leaveData]);

  // Add this function to handle reapplication (if needed, though not directly used in this UI yet)
  const handleReapply = async (originalLeave) => {
    try {
      // Calculate the new start date (day after the approved end date)
      const newStartDate = new Date(originalLeave.approvedEndDate);
      newStartDate.setDate(newStartDate.getDate() + 1);

      // Keep the original end date
      const newEndDate = new Date(originalLeave.endDate);

      // Set up the form for reapplication
      setFormData({
        leaveType: originalLeave.leaveType,
        startDate: newStartDate.toISOString().split('T')[0],
        endDate: originalLeave.endDate.split('T')[0],
        reason: originalLeave.reason,
        isReapplication: true,
      });

      // Recalculate leave availability
      await checkLeaveAvailability();
    } catch (err) {
      console.error('Error preparing reapplication:', err);
      setValidationError('Failed to prepare reapplication');
    }
  };

  // Real-time validation when dates or leave type change
  useEffect(() => {
    checkLeaveAvailability();
  }, [formData.startDate, formData.endDate, formData.leaveType, checkLeaveAvailability]);

  // Handle selection of an alternative leave type from the modal
  const handleSelectAlternative = (leaveType) => {
    setFormData((prev) => ({ ...prev, leaveType }));
    setShowOptionsModal(false);
    setValidationError(''); // Clear validation error after selecting alternative
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (
        !formData.leaveType ||
        !formData.startDate ||
        !formData.endDate ||
        !formData.reason
      ) {
        setValidationError('All fields are required');
        return;
      }

      // Re-run validation before submission to catch any last-minute issues
      await checkLeaveAvailability();

      // If there's a validation error that is NOT the "Will use LWP" message, prevent submission
      if (validationError && !validationError.includes('Will use')) {
        if (alternativeOptions.length > 0) {
          setShowOptionsModal(true);
          return;
        }
        // If no alternatives and still an error, display it
        return;
      }

      await submitLeave();
    } catch (err) {
      console.error('Submission error:', err);
      setValidationError(err.message || 'Failed to submit leave application');
    }
  };

  // Function to submit leave application to backend
  const submitLeave = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      if (!token || !userId) {
        throw new Error('Authentication required. Please login again.');
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/leaves/apply`,
        {
          startDate: formData.startDate,
          endDate: formData.endDate,
          reason: formData.reason,
          leaveType: formData.leaveType,
          numberOfDays: requestedDays, // Sending numberOfDays as requestedDays
          paidDays: leaveSplit.paidDays,
          lwpDays: leaveSplit.lwpDays,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data && response.data.success !== false) {
        console.log('Leave application submitted successfully!'); // For Canvas environment
        navigate('/leave-applications'); // Redirect after successful submission
      } else {
        throw new Error(response.data?.message || 'Leave submission failed');
      }
    } catch (err) {
      console.error('Leave submission error:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        navigate('/apply-leave'); // Redirect to login or home
      }
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Failed to submit leave application';
      setValidationError(errorMessage); // Display error message to user
    }
  };

  // Loading state UI
  if (loading) {
    return (
      <div className="apply-leave-page-container loading-state">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="loading-text">Loading leave information...</p>
      </div>
    );
  }

  // Error state UI
  if (error) {
    return (
      <div className="apply-leave-page-container error-state">
        <div className="error-card">
          <h4 className="error-title">Error Loading Data</h4>
          <p className="error-message">{error.message}</p>
          {error.details && <p className="error-details">{error.details}</p>}
          <button className="btn-retry" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No data state UI
  if (!leaveData || leaveData.leaveTypes.length === 0) {
    return (
      <div className="apply-leave-page-container no-data-state">
        <div className="no-data-card">
          <p className="no-data-message">
            No leave data available. Please contact HR.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="apply-leave-page-container">
      <style>
        {`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        .apply-leave-page-container {
            min-height: 100vh;
            background: linear-gradient(to bottom right, #e0f2f7, #c2e0f0);
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 40px 20px;
            font-family: 'Inter', sans-serif;
            color: #333;
        }

        .main-content-wrapper {
            max-width: 900px;
            width: 100%;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            gap: 30px;
        }

        .page-title {
            font-size: 2.8rem;
            font-weight: 800;
            color: #2c3e50;
            margin-bottom: 30px;
            text-align: center;
            text-shadow: 2px 2px 5px rgba(0, 0, 0, 0.1);
            line-height: 1.2;
            letter-spacing: -0.02em;
        }

        .card {
            background-color: #ffffff;
            border-radius: 16px;
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.08), 0 5px 15px rgba(0, 0, 0, 0.04);
            border: none;
            overflow: hidden;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12), 0 8px 20px rgba(0, 0, 0, 0.06);
        }

        .card-header {
            background: linear-gradient(to right, #007bff, #0056b3);
            color: white;
            padding: 18px 25px;
            font-size: 1.5rem;
            font-weight: 700;
            border-bottom: none;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .card-header.bg-success {
            background: linear-gradient(to right, #28a745, #1e7e34);
        }

        .card-body {
            padding: 25px;
        }

        .table-responsive {
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #e0e0e0;
        }

        .table {
            width: 100%;
            margin-bottom: 0;
            border-collapse: separate;
            border-spacing: 0;
        }

        .table thead th {
            background-color: #f8f9fa;
            color: #495057;
            font-weight: 600;
            padding: 15px 20px;
            text-align: left;
            border-bottom: 2px solid #dee2e6;
            font-size: 0.95rem;
            text-transform: uppercase;
            letter-spacing: 0.03em;
        }

        .table tbody tr:nth-of-type(odd) {
            background-color: #fcfdff;
        }

        .table tbody tr:hover {
            background-color: #e9f5fe;
            transition: background-color 0.2s ease;
        }

        .table tbody td {
            padding: 12px 20px;
            border-bottom: 1px solid #e9ecef;
            color: #555;
            font-size: 0.9rem;
        }

        .table tbody tr:last-child td {
            border-bottom: none;
        }

        .text-danger {
            color: #dc3545 !important;
            font-weight: 600;
        }

        .text-success {
            color: #28a745 !important;
            font-weight: 600;
        }

        /* Form Styling */
        .form-label {
            font-weight: 600;
            color: #495057;
            margin-bottom: 8px;
            display: block;
        }

        .form-control, .form-select {
            border: 1px solid #ced4da;
            border-radius: 8px;
            padding: 10px 15px;
            font-size: 1rem;
            color: #495057;
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
            width: 100%;
        }

        .form-control:focus, .form-select:focus {
            border-color: #80bdff;
            box-shadow: 0 0 0 0.25rem rgba(0, 123, 255, 0.25);
            outline: none;
        }

        textarea.form-control {
            min-height: 100px;
            resize: vertical;
        }

        .mb-3 {
            margin-bottom: 1.5rem !important;
        }

        .row.mb-3 > div {
            padding-right: 10px;
            padding-left: 10px;
        }

        .btn-primary {
            background-color: #007bff;
            border-color: #007bff;
            padding: 12px 25px;
            font-size: 1.1rem;
            font-weight: 600;
            border-radius: 8px;
            transition: background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
            box-shadow: 0 4px 10px rgba(0, 123, 255, 0.2);
        }

        .btn-primary:hover {
            background-color: #0056b3;
            border-color: #0056b3;
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(0, 123, 255, 0.3);
        }

        .btn-primary:disabled {
            background-color: #a0c9f0;
            border-color: #a0c9f0;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }

        /* Alert Styling */
        .alert {
            border-radius: 12px;
            padding: 15px 20px;
            font-size: 0.95rem;
            line-height: 1.4;
        }
        .alert-info {
            background-color: #e0f7fa;
            color: #00796b;
            border-color: #b2ebf2;
        }
        .alert-danger {
            background-color: #ffebee;
            color: #c62828;
            border-color: #ef9a9a;
        }
        .alert-warning {
            background-color: #fffde7;
            color: #fbc02d;
            border-color: #fff59d;
        }

        .alert strong {
            font-weight: 700;
        }
        .alert ul {
            list-style: disc;
            margin-left: 20px;
            padding-left: 0;
            margin-top: 10px;
        }
        .alert li {
            margin-bottom: 5px;
        }

        /* Modal Styling (adjusting Bootstrap defaults) */
        .modal-content {
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15), 0 8px 20px rgba(0, 0, 0, 0.08);
            border: none;
        }
        .modal-header {
            background: linear-gradient(to right, #6a11cb, #2575fc);
            color: white;
            border-bottom: none;
            padding: 20px 25px;
            border-top-left-radius: 16px;
            border-top-right-radius: 16px;
        }
        .modal-title {
            font-weight: 700;
            font-size: 1.6rem;
        }
        .modal-body {
            padding: 25px;
            color: #444;
        }
        .modal-footer {
            border-top: 1px solid #eee;
            padding: 15px 25px;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        }
        .modal-footer .btn-secondary {
            background-color: #6c757d;
            border-color: #6c757d;
            border-radius: 8px;
            padding: 10px 20px;
            font-weight: 600;
            transition: background-color 0.2s ease, transform 0.2s ease;
        }
        .modal-footer .btn-secondary:hover {
            background-color: #5a6268;
            transform: translateY(-1px);
        }
        .modal-body .list-group-item {
            border-radius: 10px;
            margin-bottom: 8px;
            padding: 12px 18px;
            transition: background-color 0.2s ease, transform 0.2s ease;
            cursor: pointer;
            border: 1px solid #e9ecef;
        }
        .modal-body .list-group-item:hover {
            background-color: #f0f8ff;
            transform: translateX(5px);
        }
        .modal-body .badge {
            background-color: #28a745;
            color: white;
            padding: 6px 10px;
            border-radius: 20px;
            font-size: 0.85rem;
        }

        /* Loading and Error States */
        .loading-state, .error-state, .no-data-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            text-align: center;
        }
        .spinner-border {
            width: 3rem;
            height: 3rem;
            color: #007bff !important;
        }
        .loading-text {
            font-size: 1.2rem;
            color: #555;
            margin-top: 15px;
        }
        .error-card, .no-data-card {
            background-color: #ffffff;
            border-radius: 16px;
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.08);
            padding: 40px;
            max-width: 500px;
            width: 100%;
        }
        .error-title {
            color: #dc3545;
            font-size: 1.8rem;
            font-weight: 700;
            margin-bottom: 15px;
        }
        .error-message {
            color: #666;
            font-size: 1.1rem;
            margin-bottom: 10px;
        }
        .error-details {
            color: #888;
            font-size: 0.9rem;
            margin-bottom: 20px;
        }
        .btn-retry {
            background-color: #ffc107;
            border: none;
            color: #333;
            padding: 10px 20px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s ease, transform 0.2s ease;
        }
        .btn-retry:hover {
            background-color: #e0a800;
            transform: translateY(-2px);
        }

        /* Responsive Adjustments */
        @media (max-width: 768px) {
            .apply-leave-page-container {
                padding: 20px 10px;
            }
            .page-title {
                font-size: 2rem;
                margin-bottom: 20px;
            }
            .card-header {
                font-size: 1.3rem;
                padding: 15px 20px;
            }
            .card-body {
                padding: 20px;
            }
            .table thead th, .table tbody td {
                padding: 10px 15px;
                font-size: 0.85rem;
            }
            .form-control, .form-select {
                padding: 8px 12px;
                font-size: 0.95rem;
            }
            .btn-primary {
                padding: 10px 20px;
                font-size: 1rem;
            }
            .modal-title {
                font-size: 1.4rem;
            }
        }
        `}
      </style>

      <div className="main-content-wrapper">
        <h2 className="page-title">Apply for Leave</h2>

        {/* Leave Information Table */}
        <div className="card mb-4">
          <div className="card-header">
            <h4>Your Leave Information</h4>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Mode</th>
                    <th>Max Days/Request</th>
                    <th>Total Days</th>
                    <th>Taken</th>
                    <th>Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveData.leaveTypes.map((lt, index) => (
                    <tr key={index}>
                      <td>{lt.type}</td>
                      <td>{lt.mode}</td>
                      <td>{lt.maxPerRequest || 'N/A'}</td>
                      <td>{lt.totalDays}</td>
                      <td>{lt.daysTaken}</td>
                      <td
                        className={
                          lt.daysRemaining <= 3 ? 'text-danger fw-bold' : 'text-success'
                        }
                      >
                        {lt.daysRemaining}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Application Form */}
        <div className="card">
          <div className="card-header bg-success">
            <h4>Apply for Leave</h4>
          </div>
          <div className="card-body">
            {validationError && (
              <Alert
                variant={validationError.includes('Will use') ? 'info' : 'danger'}
                className="mb-3"
              >
                {validationError}
                {leaveSplit.lwpDays > 0 && (
                  <div className="mt-2">
                    <p className="mb-1">
                      <strong>Leave Breakdown:</strong>
                    </p>
                    <ul className="mb-0">
                      <li>{formData.leaveType} days: {leaveSplit.paidDays}</li>
                      <li>LWP days: {leaveSplit.lwpDays}</li>
                    </ul>
                  </div>
                )}
                {alternativeOptions.length > 0 && (
                  <div className="mt-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => setShowOptionsModal(true)}
                    >
                      View Available Options
                    </Button>
                  </div>
                )}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Leave Type</label>
                <select
                  name="leaveType"
                  value={formData.leaveType}
                  onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                  className="form-select"
                  required
                >
                  {leaveData.leaveTypes.map((lt, index) => (
                    <option
                      key={index}
                      value={lt.type}
                      disabled={lt.daysRemaining <= 0 && lt.type !== 'LWP'}
                    >
                      {lt.type} (Remaining: {lt.daysRemaining} days)
                    </option>
                  ))}
                </select>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="form-control"
                    // Removed min attribute to allow past dates
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="form-control"
                    min={formData.startDate || ''} // End date cannot be before start date
                    required
                  />
                </div>
              </div>

              {formData.startDate && formData.endDate && requestedDays > 0 && (
                <div className="mb-3">
                  <p>Requested Duration: {requestedDays} days</p>
                </div>
              )}

              <div className="mb-3">
                <label className="form-label">Reason</label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="form-control"
                  rows="3"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={
                  (!!validationError && !validationError.includes('Will use')) &&
                  alternativeOptions.length === 0
                }
              >
                Submit Application
              </button>
            </form>
          </div>
        </div>

        {/* Alternative Options Modal */}
        <Modal show={showOptionsModal} onHide={() => setShowOptionsModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Alternative Leave Options</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              You don't have enough {formData.leaveType} leave for {requestedDays} days.
              Available options:
            </p>
            <ListGroup>
              {alternativeOptions.map((lt) => (
                <ListGroup.Item
                  action
                  key={lt.type}
                  onClick={() => handleSelectAlternative(lt.type)}
                  className="d-flex justify-content-between align-items-center"
                >
                  {lt.type}
                  <span className="badge bg-success rounded-pill">
                    {lt.daysRemaining} days available
                  </span>
                </ListGroup.Item>
              ))}
            </ListGroup>
            {alternativeOptions.length === 0 && (
              <Alert variant="warning" className="mt-3">
                No alternative leave types available with sufficient balance.
              </Alert>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowOptionsModal(false)}>
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};

export default ApplyLeavePage;
