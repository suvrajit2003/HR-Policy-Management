// import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import "./assets/bootstrap.min.css"
import axios from "axios";
import PropTypes from "prop-types";

import Home from "./Home";
import Add from "./Add";
import HRPolicy from "./HRPolicy";
import Salary from "./Salary";
import TaskDetail from "./Taskdetail";
import Navbar from "./Navbar";
import EmployeePage from "./EmployeePage";
import EmpId from "./EmpId";
import SuperAdmin from "./SuperAdmin";
import Master from "./Master";
import TaskForm from "./TaskForm";
import Permission from "./Permission";
import ProtectedRoute from "./ProtectedRoute";
import ForgotPassword from "./ForgotPassword";
import WelcomePage from "./WelcomePage";
import ApplyLeavePage from './ApplyLeavePage';
import LeaveApplicationsPage from './LeaveApplicationsPage';
import ReviewLeavesPage from './ReviewLeavesPage';
import HRPolicyForm from "./pages/HRPolicyForm";
import Attendance from "./Attendance"; // Import the Attendance component
import SalarySlip from "./SalarySlip"; // Import the SalarySlip component
import SalarySlipForm from "./SalarySlipForm";
import SalaryGeneratePage from "./SalaryGeneratePage";
const AppLayout = ({ permissions }) => {
  const location = useLocation();
  const isSignInPage = location.pathname === "/sign" || location.search === "?admin=true";
  const hideNavbar = location.pathname === "/" || isSignInPage || location.pathname === "/forgot-password";

  return (
    <div className="d-flex vh-100">
      {!hideNavbar && <Navbar permissions={permissions} />}
      <div className="flex-grow-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Master />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/welcome"
            element={
              <ProtectedRoute allowedRoles={['admin', 'superadmin', 'hr', 'employee']}>
                <WelcomePage />
              </ProtectedRoute>
            }
          />

          {/* Attendance Route */}
          <Route
            path="/attendance"
            element={
              <ProtectedRoute allowedRoles={['employee', 'hr', 'admin', 'superadmin']}>
                <Attendance />
              </ProtectedRoute>
            }
          />

          <Route
            path="/policy"
            element={
              <ProtectedRoute allowedRoles={['hr', 'admin', 'superadmin']}>
                <HRPolicyForm />
              </ProtectedRoute>
            }
          />

          {/* Leave Management Routes */}
          <Route
            path="/apply-leave"
            element={
              <ProtectedRoute allowedRoles={['employee', 'hr', 'admin', 'superadmin']}>
                <ApplyLeavePage />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/leave-applications" 
            element={
              <ProtectedRoute allowedRoles={['employee', 'hr', 'admin', 'superadmin']}>
                <LeaveApplicationsPage />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/slip"
            element={
              <ProtectedRoute allowedRoles={['employee', 'hr', 'admin', 'superadmin']}>
                <SalarySlip />
              </ProtectedRoute>
            }
          />

        <Route
        path="/component"
        element={<SalarySlipForm/>}/>

        <Route
            path="/salary-generate"
            element={ <SalaryGeneratePage/>}
          />

          <Route
            path="/review-leaves"
            element={
              <ProtectedRoute allowedRoles={['hr', 'admin', 'superadmin']}>
                <ReviewLeavesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/emp_page/:id"
            element={
              <ProtectedRoute>
                <EmpId />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee"
            element={
              <ProtectedRoute>
                <EmployeePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home permissions={permissions} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/add"
            element={
              <ProtectedRoute>
                <Add permissions={permissions} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr"
            element={
              <ProtectedRoute>
                <HRPolicy permissions={permissions} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/salary"
            element={
              <ProtectedRoute>
                <Salary permissions={permissions} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/taskdetail"
            element={
              <ProtectedRoute>
                <TaskDetail permissions={permissions} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hrdet"
            element={
              <ProtectedRoute>
                <TaskForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mytasks"
            element={
              <ProtectedRoute>
                <TaskForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin"
            element={
              <ProtectedRoute>
                <SuperAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/per"
            element={
              <ProtectedRoute>
                <Permission />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </div>
  );
};

AppLayout.propTypes = {
  permissions: PropTypes.arrayOf(
    PropTypes.shape({
      code: PropTypes.string.isRequired,
      access: PropTypes.bool.isRequired,
    })
  ).isRequired,
};

const App = () => {
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      axios
        .get(`http://localhost:1000/permissions/${userId}`)
        .then((res) => {
          const ops = res.data?.operations || [];
          setPermissions(ops);
        })
        .catch((err) => console.error("Permission fetch error", err));
    }
  }, []);

  return (
    <BrowserRouter>
      <AppLayout permissions={permissions} />
    </BrowserRouter>
  );
};

export default App;