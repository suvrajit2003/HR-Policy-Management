import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_BASE_URL = "http://localhost:1000";

const ReviewLeavePage = () => {
    const navigate = useNavigate();
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [userRole, setUserRole] = useState(localStorage.getItem('userRole'));
    const [allLeaves, setAllLeaves] = useState([]);
    const [filteredLeaves, setFilteredLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDialog, setShowDialog] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [actionType, setActionType] = useState('');
    const [customMessage, setCustomMessage] = useState('');
    const [approvedDays, setApprovedDays] = useState(0);
    const [activeFilter, setActiveFilter] = useState('pending'); // 'pending' or 'approved'
    // Effect to check authorization and fetch leaves on component mount
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedRole = localStorage.getItem('userRole');

        setToken(storedToken);
        setUserRole(storedRole);

        if (!storedToken || !['hr', 'admin', 'superadmin'].includes(storedRole)) {
            navigate('/');
            toast.error('You are not authorized to view this page.');
            return;
        }

        fetchLeaves();
    }, [navigate, token]);

    // Function to fetch all leave applications
    const fetchLeaves = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(`${API_BASE_URL}/api/leaves/all`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Sort leaves: Pending first, then by appliedAt (newest first)
            const sortedLeaves = response.data.sort((a, b) => {
                if (a.status === 'Pending' && b.status !== 'Pending') return -1;
                if (a.status !== 'Pending' && b.status === 'Pending') return 1;
                return new Date(b.appliedAt) - new Date(a.appliedAt);
            });

            setAllLeaves(sortedLeaves);
            filterLeaves(sortedLeaves, activeFilter);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch leaves');
            toast.error(err.response?.data?.message || 'Failed to fetch leaves');
        } finally {
            setLoading(false);
        }
    }, [token, activeFilter]);

    // Filter leaves based on active filter
    const filterLeaves = (leaves, filter) => {
        if (filter === 'pending') {
            setFilteredLeaves(leaves.filter(leave => leave.status === 'Pending'));
        } else {
            setFilteredLeaves(leaves.filter(leave => leave.status !== 'Pending'));
        }
    };

    // Handle filter change
    const handleFilterChange = (filter) => {
        setActiveFilter(filter);
        filterLeaves(allLeaves, filter);
    };

    // Opens the action dialog (Accept/Deny)
    const openActionDialog = (leave, action) => {
        setSelectedLeave(leave);
        setActionType(action);
        // Set approved days to requested days by default when opening dialog
        setApprovedDays(leave.requestedDays); // Use requestedDays as default
        setCustomMessage(''); // Clear custom message on dialog open
        setShowDialog(true);
    };

    // Handles the review action (Accept or Deny)
    const handleReview = async () => {
        if (!selectedLeave) return;

        try {
            let finalMessage = customMessage;
            if (!finalMessage) {
                finalMessage = actionType === 'Accepted'
                    ? `Your leave has been partially approved for ${approvedDays} of ${selectedLeave.requestedDays} days.`
                    : 'Your leave request has been denied.';
            }

            const response = await axios.put(
                `${API_BASE_URL}/api/leaves/review/${selectedLeave._id}`,
                {
                    status: actionType,
                    hrMessage: finalMessage,
                    approvedDays: actionType === 'Accepted' ? approvedDays : undefined
                },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            // Update the local state
            const updatedLeaves = allLeaves.map(leave =>
                leave._id === selectedLeave._id
                    ? {
                        ...leave,
                        status: actionType,
                        approvedDays: actionType === 'Accepted' ? approvedDays : leave.approvedDays,
                        approvedEndDate: actionType === 'Accepted' ? 
                            new Date(new Date(leave.startDate).getTime() + (approvedDays - 1) * 24 * 60 * 60 * 1000) : 
                            null,
                        hrMessage: finalMessage
                    }
                    : leave
            );

            setAllLeaves(updatedLeaves);
            filterLeaves(updatedLeaves, activeFilter);

            toast.success(`Leave ${actionType.toLowerCase()} successfully${actionType === 'Accepted' ? ` for ${approvedDays} days` : ''}!`);
            setShowDialog(false);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to process leave');
        }
    };

    const handleDaysChange = (e) => {
        const value = parseInt(e.target.value);
        // Ensure the value doesn't exceed requested days and is a valid number
        if (!isNaN(value) && value >= 0 && selectedLeave && value <= selectedLeave.requestedDays) {
            setApprovedDays(value);
        } else if (isNaN(value) || value < 0) {
            setApprovedDays(0); // Set to 0 if invalid input
        } else if (selectedLeave && value > selectedLeave.requestedDays) {
            setApprovedDays(selectedLeave.requestedDays); // Cap at requested days
        }
    };

    return (
        <div className="review-leave-page-container">
            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

                .review-leave-page-container {
                    min-height: 100vh;
                    background: linear-gradient(to bottom right, #f0f4f8, #e0e7ed);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 40px 16px;
                    font-family: 'Inter', sans-serif;
                    color: #333;
                }

                .main-content-wrapper {
                    max-width: 1280px;
                    width: 100%;
                    margin: 0 auto;
                }

                .page-title {
                    font-size: 48px;
                    font-weight: 800;
                    color: #1a202c;
                    margin-bottom: 24px;
                    text-align: center;
                    text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.1);
                    line-height: 1.25;
                }

                .page-title .text-blue {
                    color: #2563eb;
                }

                .page-title .text-green {
                    color: #16a34a;
                }

                .filter-buttons {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 20px;
                }

                .filter-button {
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    border: none;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                }

                .filter-button.pending {
                    background-color: ${activeFilter === 'pending' ? '#2563eb' : '#e2e8f0'};
                    color: ${activeFilter === 'pending' ? '#ffffff' : '#4a5568'};
                }

                .filter-button.approved {
                    background-color: ${activeFilter === 'approved' ? '#16a34a' : '#e2e8f0'};
                    color: ${activeFilter === 'approved' ? '#ffffff' : '#4a5568'};
                }

                .filter-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
                }

                .table-container {
                    overflow-x: auto;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    background-color: #ffffff;
                }

                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .data-table thead {
                    background-color: #eff6ff;
                }

                .data-table th {
                    padding: 12px 16px;
                    text-align: left;
                    font-size: 14px;
                    font-weight: 700;
                    color: #1e40af;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    border-bottom: 1px solid #e2e8f0;
                }

                .data-table tbody {
                    background-color: #ffffff;
                }

                .data-table td {
                    padding: 12px 16px;
                    border-bottom: 1px solid #e2e8f0;
                    font-size: 14px;
                    color: #4a5568;
                    vertical-align: middle;
                }

                .data-table tbody tr:hover {
                    background-color: #f5faff;
                }

                .data-table td.capitalize {
                    text-transform: capitalize;
                }

                .data-table td.text-center {
                    text-align: center;
                }

                .data-table td.fine-amount .text-red {
                    color: #dc2626;
                    font-weight: 600;
                }

                .data-table td.fine-amount .text-green {
                    color: #16a34a;
                    font-weight: 600;
                }

                .status-text {
                    padding: 4px 8px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    line-height: 1.25;
                    font-weight: 600;
                    border-radius: 9999px;
                }

                .status-text.accepted { background-color: #d1fae5; color: #065f46; }
                .status-text.denied { background-color: #fee2e2; color: #991b1b; }
                .status-text.pending { background-color: #fffbeb; color: #92400e; }

                .hr-message-cell {
                    max-width: 250px;
                    word-break: break-word;
                    white-space: normal;
                    color: #6b7280;
                    font-size: 14px;
                }
                .hr-message-cell .italic {
                    font-style: italic;
                    color: #6b7280;
                }

                .action-buttons-container {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                @media (min-width: 768px) {
                    .action-buttons-container {
                        flex-direction: row;
                        gap: 12px;
                    }
                }

                .action-button {
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                    color: #ffffff;
                    border: none;
                    cursor: pointer;
                }
                .action-button.accept {
                    background-color: #28a745;
                }
                .action-button.accept:hover {
                    background-color: #218838;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
                }
                .action-button.deny {
                    background-color: #dc3545;
                }
                .action-button.deny:hover {
                    background-color: #c82333;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3);
                }

                .dialog-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    z-index: 1000;
                }

                .dialog-content {
                    background-color: #ffffff;
                    border-radius: 12px;
                    padding: 30px;
                    width: 100%;
                    max-width: 500px;
                    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
                    animation: fadeInScale 0.3s ease-out forwards;
                }

                @keyframes fadeInScale {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }

                .dialog-title {
                    font-size: 24px;
                    font-weight: 700;
                    margin-bottom: 20px;
                    color: #1a202c;
                    text-align: center;
                }

                .dialog-warning {
                    background-color: #fffbeb;
                    padding: 15px;
                    margin-bottom: 20px;
                    border-radius: 8px;
                    border: 1px solid #fbd38d;
                    display: flex;
                    align-items: flex-start;
                    color: #92400e;
                    font-size: 14px;
                }
                .dialog-warning .icon {
                    height: 20px;
                    width: 20px;
                    color: #f6ad55;
                    flex-shrink: 0;
                    margin-right: 10px;
                }
                .dialog-warning .font-semibold {
                    font-weight: 600;
                }

                .dialog-label {
                    display: block;
                    font-size: 14px;
                    font-weight: 600;
                    color: #4a5568;
                    margin-bottom: 8px;
                }

                .days-input, .dialog-textarea {
                    width: 100%;
                    padding: 10px 12px;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    font-size: 14px;
                    margin-bottom: 15px;
                    transition: border-color 0.2s ease, box-shadow 0.2s ease;
                }
                .days-input:focus, .dialog-textarea:focus {
                    outline: none;
                    border-color: #63b3ed;
                    box-shadow: 0 0 0 3px rgba(99, 179, 237, 0.5);
                }

                .dialog-buttons-container {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    margin-top: 20px;
                }

                .dialog-button {
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-weight: 600;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                    transition: all 0.3s ease;
                    border: none;
                    cursor: pointer;
                }

                .dialog-button.cancel {
                    background-color: #cbd5e0;
                    color: #2d3748;
                }
                .dialog-button.cancel:hover {
                    background-color: #a0aec0;
                    transform: translateY(-2px);
                }

                .dialog-button.confirm-accept {
                    background-color: #28a745;
                    color: #ffffff;
                }
                .dialog-button.confirm-accept:hover {
                    background-color: #218838;
                    transform: translateY(-2px);
                }

                .dialog-button.confirm-deny {
                    background-color: #dc3545;
                    color: #ffffff;
                }
                .dialog-button.confirm-deny:hover {
                    background-color: #c82333;
                    transform: translateY(-2px);
                }

                .dialog-button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: none;
                }

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

                @media (max-width: 768px) {
                    .review-leave-page-container {
                        padding: 20px 10px;
                    }
                    .page-title {
                        font-size: 2rem;
                        margin-bottom: 20px;
                    }
                    .filter-buttons {
                        flex-direction: column;
                        gap: 8px;
                    }
                    .filter-button {
                        width: 100%;
                    }
                    .data-table th, .data-table td {
                        padding: 10px 15px;
                        font-size: 0.85rem;
                    }
                    .hr-message-cell {
                        max-width: 180px;
                        font-size: 0.8rem;
                    }
                    .action-button {
                        padding: 6px 10px;
                        font-size: 0.8rem;
                    }
                    .dialog-content {
                        padding: 20px;
                    }
                    .dialog-title {
                        font-size: 1.5rem;
                    }
                    .days-input, .dialog-textarea {
                        padding: 8px 12px;
                        font-size: 0.9rem;
                    }
                    .dialog-button {
                        padding: 10px 20px;
                        font-size: 0.9rem;
                    }
                }
                `}
            </style>
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />

            <div className="main-content-wrapper">
                <h1 className="page-title">
                    <span className="text-blue">Leave</span> <span className="text-green">Applications</span>
                </h1>

                {loading ? (
                    <div className="loading-state">
                        <div className="spinner-border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="loading-text">Loading leave applications...</p>
                    </div>
                ) : error ? (
                    <div className="error-state">
                        <div className="error-card">
                            <h4 className="error-title">Error Loading Data</h4>
                            <p className="error-message">{error.message}</p>
                            {error.details && <p className="error-details">{error.details}</p>}
                            <button 
                                className="btn-retry"
                                onClick={() => window.location.reload()}
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                ) : allLeaves.length === 0 ? (
                    <div className="no-data-state">
                        <div className="no-data-card">
                            <p className="no-data-message">No leave applications to display.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="filter-buttons">
                            <button 
                                className={`filter-button pending`}
                                onClick={() => handleFilterChange('pending')}
                            >
                                Pending Leaves
                            </button>
                            <button 
                                className={`filter-button approved`}
                                onClick={() => handleFilterChange('approved')}
                            >
                                Approved/Denied Leaves
                            </button>
                        </div>

                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Employee</th>
                                        <th>Leave Type</th>
                                        <th>Reason</th>
                                        <th>Start Date</th>
                                        <th>End Date</th>
                                        <th className="text-center">Fine</th>
                                        <th className="text-center">Requested Days</th>
                                        <th className="text-center">Approved Days</th>
                                        <th>Status</th>
                                        <th>Applied At</th>
                                        <th className="hr-message-cell">Actions / HR Message</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLeaves.map((leave) => (
                                        <tr key={leave._id}>
                                            <td style={{ fontWeight: 500 }}>{leave.employeeName}</td>
                                            <td className="capitalize">
                                                {leave.leaveType === 'EL' ? 'Earned Leave' :
                                                 leave.leaveType === 'CL' ? 'Casual Leave' :
                                                 leave.leaveType === 'SL' ? 'Sick Leave' :
                                                 'Leave Without Pay'}
                                            </td>
                                            <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {leave.reason}
                                            </td>
                                            <td>{moment(leave.startDate).format('MMM DD, YYYY')}</td>
                                            <td>{moment(leave.endDate).format('MMM DD, YYYY')}</td>
                                            <td className="text-center fine-amount">
                                                {leave.isFineApplicable ? (
                                                    <span className="text-red">₹{leave.fineAmount}</span>
                                                ) : (
                                                    <span className="text-green">No Fine</span>
                                                )}
                                            </td>
                                            <td className="text-center">
                                                {leave.requestedDays}
                                                {leave.requestedDays !== leave.approvedDays && leave.status === 'Accepted' &&
                                                <span className="text-muted small"> (original)</span>}
                                            </td>
                                            <td className="text-center">
                                                {leave.status === 'Accepted' ? leave.approvedDays : '-'}
                                            </td>
                                            <td>
                                                <span className={`status-text ${leave.status.toLowerCase()}`}>
                                                    {leave.status}
                                                </span>
                                            </td>
                                            <td>{moment(leave.appliedAt).format('MMM DD, YYYY HH:mm')}</td>
                                            <td className="hr-message-cell">
                                                {leave.status === 'Pending' && userRole === 'hr' ? (
                                                    <div className="action-buttons-container">
                                                        <button
                                                            onClick={() => openActionDialog(leave, 'Accepted')}
                                                            className="action-button accept"
                                                        >
                                                            Accept
                                                        </button>
                                                        <button
                                                            onClick={() => openActionDialog(leave, 'Denied')}
                                                            className="action-button deny"
                                                        >
                                                            Deny
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        {leave.hrMessage ? <p>{leave.hrMessage}</p> : <p className="italic">No message from HR</p>}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {showDialog && (
                    <div className="dialog-overlay">
                        <div className="dialog-content">
                            <h3 className="dialog-title">
                                {actionType === 'Accepted' ? 'Accept Leave Request' : 'Deny Leave Request'}
                            </h3>

                            {actionType === 'Accepted' && selectedLeave && (
                                <div className="form-group">
                                    <label className="dialog-label">
                                        Approved Days (Max: {selectedLeave.requestedDays})
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max={selectedLeave.requestedDays}
                                        value={approvedDays}
                                        onChange={handleDaysChange}
                                        className="days-input"
                                    />
                                    {approvedDays > selectedLeave.requestedDays && (
                                        <p style={{ color: '#dc3545', fontSize: '12px', marginTop: '5px' }}>
                                            Cannot approve more days than requested
                                        </p>
                                    )}
                                </div>
                            )}

                            {selectedLeave?.isFineApplicable && actionType === 'Accepted' && (
                                <div className="dialog-warning">
                                    <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-sm">
                                        This leave will incur a fine of <span className="font-semibold">₹{selectedLeave.fineAmount}</span> as the employee has exceeded monthly limit.
                                    </p>
                                </div>
                            )}

                            <div className="form-group" style={{ marginBottom: '16px' }}>
                                <label htmlFor="customMessage" className="dialog-label">
                                    Message to Employee (Optional)
                                </label>
                                <textarea
                                    id="customMessage"
                                    value={customMessage}
                                    onChange={(e) => setCustomMessage(e.target.value)}
                                    className="dialog-textarea"
                                    rows="3"
                                    placeholder={
                                        actionType === 'Accepted'
                                            ? selectedLeave?.isFineApplicable
                                                ? `Leave approved for ${approvedDays} days with ₹${selectedLeave.fineAmount} fine`
                                                : `Leave approved for ${approvedDays} days`
                                            : 'Leave denied'
                                    }
                                />
                            </div>

                            <div className="dialog-buttons-container">
                                <button
                                    onClick={() => setShowDialog(false)}
                                    className="dialog-button cancel"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReview}
                                    className={`dialog-button ${actionType === 'Accepted' ? 'confirm-accept' : 'confirm-deny'}`}
                                    disabled={actionType === 'Accepted' && (approvedDays <= 0 || approvedDays > selectedLeave.requestedDays)}
                                >
                                    Confirm {actionType}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReviewLeavePage;