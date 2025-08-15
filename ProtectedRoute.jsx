import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";
import { jwtDecode } from "jwt-decode";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("token");
  
  if (!token) {
    alert("Please login to access this page");
    return <Navigate to="/" replace />;
  }

  try {
    const decoded = jwtDecode(token);
    const userRole = decoded.user?.role?.toLowerCase();
    
    if (!userRole) {
      alert("Invalid token. Please login again.");
      return <Navigate to="/" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(userRole)) {
      alert("You don't have permission to access this page");
      return <Navigate to="/dashboard" replace />;
    }

    return children;
  } catch (err) {
    console.error("Token decode error:", err);
    alert("Session expired. Please login again.");
    return <Navigate to="/" replace />;
  }
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.arrayOf(PropTypes.string)
};

export default ProtectedRoute;