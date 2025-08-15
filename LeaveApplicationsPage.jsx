import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_BASE_URL = "http://localhost:1000";

const LeaveApplicationsPage = () => {
    const navigate = useNavigate();
    const [leaveApplications, setLeaveApplications] = useState([]);
    const [filteredApplications, setFilteredApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'pending', 'approved', 'denied'
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'appliedAt', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchLeaveApplications = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/');
                return;
            }

            const response = await axios.get(`${API_BASE_URL}/api/leaves/my-leaves`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const formattedApplications = response.data.map(app => {
                const startDateMoment = moment(app.startDate);
                const endDateMoment = moment(app.endDate);
                const approvedEndDateMoment = app.approvedEndDate ? moment(app.approvedEndDate) : null;

                let unapprovedDays = 0;
                if (app.status === 'Approved' && app.numberOfDays > app.approvedDays) {
                    unapprovedDays = app.numberOfDays - app.approvedDays;
                }

                return {
                    ...app,
                    id: app._id || app.id,
                    status: app.status === 'Approved' ? 'Accepted' :
                            app.status === 'Rejected' ? 'Denied' : app.status,
                    hrMessage: app.hrMessage || '',
                    originalStartDate: startDateMoment.toDate(),
                    originalEndDate: endDateMoment.toDate(),
                    approvedEndDate: approvedEndDateMoment ? approvedEndDateMoment.toDate() : null,
                    startDate: startDateMoment.format('MMM DD, YYYY'),
                    endDate: endDateMoment.format('MMM DD, YYYY'),
                    appliedAt: moment(app.appliedAt).format('MMM DD, YYYY, HH:mm'),
                    isFineApplicable: app.isFineApplicable || false,
                    fineAmount: app.fineAmount || 0,
                    requestedDays: app.requestedDays || app.numberOfDays,
                    approvedDays: app.approvedDays || (app.status === 'Accepted' ? app.numberOfDays : 0),
                    unapprovedDays: unapprovedDays
                };
            });

            setLeaveApplications(formattedApplications);
            setFilteredApplications(formattedApplications);
        } catch (err) {
            console.error("Error fetching leave applications:", err);
            setError({
                message: err.response?.data?.message || "Failed to load leave applications.",
                details: err.message
            });
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                navigate('/');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleReapply = (originalLeave) => {
        try {
            const newStartDate = moment(originalLeave.approvedEndDate).add(1, 'days').toDate();
            const newEndDate = originalLeave.originalEndDate;
            
            navigate('/apply-leave', { 
                state: {
                    leaveType: originalLeave.leaveType,
                    startDate: newStartDate.toISOString(),
                    endDate: newEndDate.toISOString(),
                    reason: originalLeave.reason,
                    isReapplication: true
                }
            });
        } catch (err) {
            console.error('Error preparing reapplication:', err);
            setError({
                message: "Failed to prepare reapplication.",
                details: err.message
            });
        }
    };

    const formatApprovedPeriod = (app) => {
        if (!app.approvedDays || app.status !== 'Accepted') return '-';
        
        const approvedStart = moment(app.originalStartDate);
        const approvedEnd = app.approvedEndDate ? moment(app.approvedEndDate) : approvedStart.clone().add(app.approvedDays - 1, 'days');
        
        return `${approvedStart.format('MMM DD, YYYY')} to ${approvedEnd.format('MMM DD, YYYY')}`;
    };

    // Filter applications based on active filter and search term
    useEffect(() => {
        let filtered = [...leaveApplications];
        
        // Apply status filter
        if (activeFilter !== 'all') {
            filtered = filtered.filter(app => 
                activeFilter === 'pending' ? app.status === 'Pending' :
                activeFilter === 'approved' ? app.status === 'Accepted' :
                app.status === 'Denied'
            );
        }
        
        // Apply search term filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(app => 
                app.leaveType.toLowerCase().includes(term) ||
                app.reason.toLowerCase().includes(term) ||
                app.status.toLowerCase().includes(term) ||
                app.hrMessage.toLowerCase().includes(term)
            );
        }
        
        setFilteredApplications(filtered);
        setCurrentPage(1); // Reset to first page when filters change
    }, [leaveApplications, activeFilter, searchTerm]);

    // Sort applications
    const sortedApplications = React.useMemo(() => {
        let sortableItems = [...filteredApplications];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                let aValue, bValue;
                
                // Handle different sort keys
                if (sortConfig.key === 'appliedAt') {
                    aValue = new Date(a.appliedAt);
                    bValue = new Date(b.appliedAt);
                } else if (sortConfig.key === 'startDate') {
                    aValue = new Date(a.originalStartDate);
                    bValue = new Date(b.originalStartDate);
                } else if (sortConfig.key === 'leaveType') {
                    aValue = a.leaveType.toLowerCase();
                    bValue = b.leaveType.toLowerCase();
                } else if (sortConfig.key === 'status') {
                    aValue = a.status.toLowerCase();
                    bValue = b.status.toLowerCase();
                } else if (sortConfig.key === 'requestedDays') {
                    aValue = a.requestedDays;
                    bValue = b.requestedDays;
                } else {
                    aValue = a[sortConfig.key];
                    bValue = b[sortConfig.key];
                }
                
                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [filteredApplications, sortConfig]);

    // Pagination
    const totalPages = Math.ceil(sortedApplications.length / itemsPerPage);
    const currentItems = sortedApplications.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleFilterChange = (filter) => {
        setActiveFilter(filter);
    };

    useEffect(() => {
        fetchLeaveApplications();
    }, []);

    if (loading) {
        return (
            <div className="review-leave-page-container">
                <div className="loading-state">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="loading-text">Loading leave applications...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="review-leave-page-container">
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
            </div>
        );
    }

    if (leaveApplications.length === 0) {
        return (
            <div className="review-leave-page-container">
                <div className="no-data-state">
                    <div className="no-data-card">
                        <p className="no-data-message">No leave applications found yet.</p>
                        <button 
                            className="btn-apply-leave"
                            onClick={() => navigate('/apply-leave')}
                        >
                            Apply for Leave
                        </button>
                    </div>
                </div>
            </div>
        );
    }

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

                .filter-controls {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    margin-bottom: 20px;
                    align-items: center;
                }

                .filter-buttons {
                    display: flex;
                    gap: 12px;
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

                .filter-button.all {
                    background-color: ${activeFilter === 'all' ? '#6b7280' : '#e2e8f0'};
                    color: ${activeFilter === 'all' ? '#ffffff' : '#4a5568'};
                }

                .filter-button.pending {
                    background-color: ${activeFilter === 'pending' ? '#f59e0b' : '#e2e8f0'};
                    color: ${activeFilter === 'pending' ? '#ffffff' : '#4a5568'};
                }

                .filter-button.approved {
                    background-color: ${activeFilter === 'approved' ? '#16a34a' : '#e2e8f0'};
                    color: ${activeFilter === 'approved' ? '#ffffff' : '#4a5568'};
                }

                .filter-button.denied {
                    background-color: ${activeFilter === 'denied' ? '#dc2626' : '#e2e8f0'};
                    color: ${activeFilter === 'denied' ? '#ffffff' : '#4a5568'};
                }

                .filter-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
                }

                .search-input {
                    flex: 1;
                    min-width: 200px;
                    padding: 10px 15px;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    font-size: 14px;
                    transition: all 0.3s ease;
                }

                .search-input:focus {
                    outline: none;
                    border-color: #2563eb;
                    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
                }

                .table-container {
                    overflow-x: auto;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    background-color: #ffffff;
                    margin-bottom: 20px;
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
                    cursor: pointer;
                    transition: background-color 0.2s ease;
                }

                .data-table th:hover {
                    background-color: #dbeafe;
                }

                .data-table th.sorted-asc::after {
                    content: ' ↑';
                    font-size: 12px;
                }

                .data-table th.sorted-desc::after {
                    content: ' ↓';
                    font-size: 12px;
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
                .action-button.reapply {
                    background-color: #2563eb;
                }
                .action-button.reapply:hover {
                    background-color: #1d4ed8;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(37, 99, 235, 0.3);
                }

                .pagination-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 10px;
                    margin-top: 20px;
                }

                .pagination-button {
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    border: none;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                    background-color: #e2e8f0;
                    color: #4a5568;
                }

                .pagination-button:hover:not(:disabled) {
                    background-color: #cbd5e0;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
                }

                .pagination-button.active {
                    background-color: #2563eb;
                    color: #ffffff;
                }

                .pagination-button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .page-info {
                    font-size: 14px;
                    color: #4a5568;
                    margin: 0 10px;
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
                .btn-retry, .btn-apply-leave {
                    background-color: #ffc107;
                    border: none;
                    color: #333;
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background-color 0.2s ease, transform 0.2s ease;
                }
                .btn-retry:hover, .btn-apply-leave:hover {
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
                    .filter-controls {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    .filter-buttons {
                        flex-wrap: wrap;
                        justify-content: center;
                    }
                    .search-input {
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
                    .pagination-container {
                        flex-wrap: wrap;
                    }
                }
                `}
            </style>
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />

            <div className="main-content-wrapper">
                <h1 className="page-title">
                    <span className="text-blue">Your</span> <span className="text-green">Leave Applications</span>
                </h1>

                <div className="filter-controls">
                    <div className="filter-buttons">
                        <button 
                            className={`filter-button all`}
                            onClick={() => handleFilterChange('all')}
                        >
                            All Leaves
                        </button>
                        <button 
                            className={`filter-button pending`}
                            onClick={() => handleFilterChange('pending')}
                        >
                            Pending
                        </button>
                        <button 
                            className={`filter-button approved`}
                            onClick={() => handleFilterChange('approved')}
                        >
                            Approved
                        </button>
                        <button 
                            className={`filter-button denied`}
                            onClick={() => handleFilterChange('denied')}
                        >
                            Denied
                        </button>
                    </div>
                    <input
                        type="text"
                        placeholder="Search leaves..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th 
                                    className={sortConfig.key === 'leaveType' ? `sorted-${sortConfig.direction}` : ''}
                                    onClick={() => requestSort('leaveType')}
                                >
                                    Leave Type
                                </th>
                                <th>Period</th>
                                <th 
                                    className={`text-center ${sortConfig.key === 'requestedDays' ? `sorted-${sortConfig.direction}` : ''}`}
                                    onClick={() => requestSort('requestedDays')}
                                >
                                    Requested Days
                                </th>
                                <th className="text-center">Approved Days</th>
                                <th className="text-center">Approved Period</th>
                                <th className="text-center">Fine</th>
                                <th 
                                    className={sortConfig.key === 'status' ? `sorted-${sortConfig.direction}` : ''}
                                    onClick={() => requestSort('status')}
                                >
                                    Status
                                </th>
                                <th 
                                    className={sortConfig.key === 'appliedAt' ? `sorted-${sortConfig.direction}` : ''}
                                    onClick={() => requestSort('appliedAt')}
                                >
                                    Applied On
                                </th>
                                <th className="hr-message-cell">Message / Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.map((app) => (
                                <tr key={app.id}>
                                    <td className="capitalize">
                                        {app.leaveType === 'EL' ? 'Earned Leave' :
                                        app.leaveType === 'CL' ? 'Casual Leave' :
                                        app.leaveType === 'SL' ? 'Sick Leave' :
                                        'Leave Without Pay'}
                                    </td>
                                    <td>{app.startDate} to {app.endDate}</td>
                                    <td className="text-center">
                                        {app.requestedDays}
                                        {app.status === 'Accepted' && app.requestedDays !== app.approvedDays && (
                                            <span className="text-muted small"> (original)</span>
                                        )}
                                    </td>
                                    <td className="text-center">
                                        {app.status === 'Accepted' ? app.approvedDays : '-'}
                                    </td>
                                    <td className="text-center">
                                        {formatApprovedPeriod(app)}
                                    </td>
                                    <td className="text-center fine-amount">
                                        {app.isFineApplicable ? (
                                            <span className="text-red">₹{app.fineAmount}</span>
                                        ) : (
                                            <span className="text-green">No Fine</span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`status-text ${app.status.toLowerCase()}`}>
                                            {app.status}
                                        </span>
                                    </td>
                                    <td>{app.appliedAt}</td>
                                    <td className="hr-message-cell">
                                        <div>
                                            {app.hrMessage ? <p>{app.hrMessage}</p> : <p className="italic">No message from HR</p>}
                                        </div>
                                        {app.status === 'Accepted' && app.unapprovedDays > 0 && (
                                            <div className="action-buttons-container">
                                                <button
                                                    onClick={() => handleReapply(app)}
                                                    className="action-button reapply"
                                                >
                                                    Reapply for {app.unapprovedDays} days
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="pagination-container">
                    <button
                        className="pagination-button"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>
                    
                    <span className="page-info">
                        Page {currentPage} of {totalPages}
                    </span>
                    
                    <button
                        className="pagination-button"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages || totalPages === 0}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LeaveApplicationsPage;