import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import defaultAvatar from './pages/hrpolicypicture.jpg'; 

const Navbar = ({ permissions = [] }) => {
  const navigate = useNavigate();
  const role = (localStorage.getItem("userRole") || "").toLowerCase();
  const username = localStorage.getItem("username") || "User";
  const userId = localStorage.getItem("userId") || "";
  const [collapsed, setCollapsed] = useState(false);
  const [pendingLeavesCount, setPendingLeavesCount] = useState(0);
  const [myPendingLeavesCount, setMyPendingLeavesCount] = useState(0);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [profilePicture, setProfilePicture] = useState(defaultAvatar);
  const API_BASE_URL = "http://localhost:1000";
  
  // Fetch user profile picture
  useEffect(() => {
    const fetchProfilePicture = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token || !userId) return;
        
        // Check if picture exists in localStorage
        const savedPic = localStorage.getItem('userProfilePic');
        if (savedPic) {
          setProfilePicture(savedPic);
          return;
        }

        // Fetch from API
        const response = await axios.get(`${API_BASE_URL}/api/users/profile/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.data.profilePicture) {
          localStorage.setItem('userProfilePic', response.data.profilePicture);
          setProfilePicture(response.data.profilePicture);
        }
      } catch (error) {
        console.error("Error fetching profile picture:", error);
      }
    };

    fetchProfilePicture();
  }, [userId]);

  const toggleNavbar = () => {
    setCollapsed(!collapsed);
    setOpenDropdown(null);
  };

  const toggleDropdown = (dropdownName) => {
    if (role === "admin" || role === "superadmin") {
      setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
    } else {
      navigate(dropdownName);
    }
  };

  const fetchPendingLeaves = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      if (role === 'hr' || role === 'admin' || role === 'superadmin') {
        const response = await axios.get(`${API_BASE_URL}/api/leaves/pending-count`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.data.count > pendingLeavesCount) {
          const diff = response.data.count - pendingLeavesCount;
          toast.info(
            `You have ${diff} new pending leave request${diff > 1 ? 's' : ''} to review`, 
            {
              position: "top-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            }
          );
        }
        
        setPendingLeavesCount(response.data.count);
      }

      if (userId) {
        const myResponse = await axios.get(`${API_BASE_URL}/api/leaves/my-pending-count/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (myResponse.data.count > myPendingLeavesCount) {
          const diff = myResponse.data.count - myPendingLeavesCount;
          if (diff > 0 && role === 'employee') {
            toast.info(
              `Your ${diff} leave request${diff > 1 ? 's' : ''} ${diff > 1 ? 'are' : 'is'} pending approval`, 
              {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
              }
            );
          }
        }
        
        setMyPendingLeavesCount(myResponse.data.count);
      }
    } catch (err) {
      console.error("Error fetching pending leaves count:", err);
    }
  };

  useEffect(() => {
    fetchPendingLeaves();
    const interval = setInterval(fetchPendingLeaves, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [pendingLeavesCount, myPendingLeavesCount, role, userId]);

  const hasAccess = (code) => {
    if (role === "admin" || role === "superadmin") return true;
    return permissions?.some((p) => p.code === code && p.access);
  };

  // Function to handle profile picture click
  const handleProfileClick = () => {
    if (role === "admin" || role === "superadmin") {
      navigate("/superadmin");
    } else if (role === "hr") {
      navigate("/hrdet");
    } else {
      navigate("/welcome");
    }
    setOpenDropdown(null);
  };

  const styles = {
    sidebar: {
      width: collapsed ? "80px" : "260px",
      height: "100vh",
      background: "linear-gradient(145deg, #1f2d3d, #1a2533)",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      padding: "20px 10px",
      transition: "width 0.4s ease",
      boxShadow: "8px 0 20px rgba(0,0,0,0.25)",
      position: "fixed",
      top: 0,
      left: 0,
      borderRight: "1px solid #00b4d8",
      backdropFilter: "blur(10px)",
      zIndex: 999,
    },
    navItems: {
        overflowY: 'auto',
        flexGrow: 1,
        paddingBottom: '20px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        '&::-webkit-scrollbar': {
            display: 'none',
        },
    },
    title: {
      fontSize: collapsed ? "1.0rem" : "0.8rem",
      fontWeight: "bold",
      textAlign: collapsed ? "center" : "left",
      marginBottom: "10px",
      color: "#48cae4",
      transition: "font-size 0.4s ease, text-align 0.4s ease",
      paddingLeft: collapsed ? "0" : "10px",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      flexShrink: 0,
    },
    userInfo: {
      display: 'flex',
      flexDirection: collapsed ? 'column' : 'row',
      alignItems: 'center',
      justifyContent: collapsed ? 'center' : 'flex-start',
      marginBottom: '20px',
      paddingLeft: collapsed ? '0' : '10px',
      transition: 'all 0.4s ease',
      color: '#e0e0e0',
      gap: '10px',
      flexShrink: 0,
      cursor: 'pointer',
    },
    avatar: {
      width: collapsed ? '40px' : '50px',
      height: collapsed ? '40px' : '50px',
      borderRadius: '50%',
      objectFit: 'cover',
      border: '2px solid #48cae4',
      backgroundColor: '#1a2533',
      transition: 'all 0.3s ease',
    },
    avatarHover: {
      transform: 'scale(1.05)',
      boxShadow: '0 0 15px rgba(72, 202, 228, 0.7)',
    },
    userName: {
      fontSize: collapsed ? '0.8rem' : '1rem',
      fontWeight: 'bold',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      transition: 'color 0.3s ease',
    },
    userRole: {
      fontSize: collapsed ? '0.7rem' : '0.9rem',
      textTransform: 'capitalize',
      transition: 'color 0.3s ease',
    },
    toggleButton: {
      position: "absolute",
      top: "20px",
      right: "-25px",
      background: "linear-gradient(90deg, #00b4d8, #48cae4)",
      color: "#fff",
      border: "none",
      borderRadius: "50%",
      width: "40px",
      height: "40px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      boxShadow: "0 4px 15px rgba(0,180,216,0.4)",
      transition: "transform 0.3s ease",
      zIndex: 1000,
      transform: collapsed ? "translateX(0) rotate(180deg)" : "translateX(0) rotate(0deg)",
    },
    button: {
      background: "rgba(255,255,255,0.05)",
      color: "#e0e0e0",
      border: "none",
      borderRadius: "10px",
      padding: collapsed ? "10px 5px" : "12px 15px",
      textAlign: "left",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.3s ease",
      marginBottom: "10px",
      fontSize: collapsed ? "0.7rem" : "0.9rem",
      whiteSpace: "nowrap",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      width: "100%",
      boxSizing: "border-box",
      position: "relative",
    },
    buttonHover: {
      background: "linear-gradient(90deg, #00b4d8, #48cae4)",
      color: "#fff",
    },
    dangerButton: {
      background: "#e63946",
      color: "#fff",
      borderRadius: "8px",
      padding: collapsed ? "10px 5px" : "12px 15px",
      fontWeight: "bold",
      fontSize: collapsed ? "0.7rem" : "0.9rem",
      border: "none",
      cursor: "pointer",
      transition: "0.3s",
      width: "100%",
      boxSizing: "border-box",
    },
    signOutSection: {
      marginTop: "auto",
      paddingTop: "20px",
      borderTop: "1px solid #999",
      flexShrink: 0,
    },
    pageContent: {
      marginLeft: collapsed ? "80px" : "260px",
      padding: "20px",
      transition: "margin-left 0.4s ease-in-out",
    },
    notificationBadge: {
      position: 'absolute',
      top: '-5px',
      right: '-5px',
      backgroundColor: '#ff4757',
      color: 'white',
      borderRadius: '50%',
      width: '20px',
      height: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.7rem',
      fontWeight: 'bold',
    },
    myLeavesBadge: {
      position: 'absolute',
      top: '-5px',
      right: '-5px',
      backgroundColor: '#ffa502',
      color: 'white',
      borderRadius: '50%',
      width: '20px',
      height: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.7rem',
      fontWeight: 'bold',
    },
    buttonWithBadge: {
      position: 'relative',
      width: '100%',
    },
    dropdownContent: {
      display: 'block',
      paddingLeft: '15px',
      marginTop: '5px',
      animation: 'fadeIn 0.3s ease-in-out',
    },
    dropdownButton: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    dropdownIcon: {
      transition: 'transform 0.3s ease',
      transform: openDropdown ? 'rotate(90deg)' : 'rotate(0deg)',
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
    setOpenDropdown(null);
  };

  const handleLogout = () => {
    localStorage.clear();
    window.alert("Sign out successful");
    navigate("/");
  };

  const navButton = (label, icon, path, condition = true, isDanger = false, showBadge = false, badgeCount = 0, badgeStyle = styles.notificationBadge) => {
    if (!condition) return null;
    const baseStyle = isDanger ? styles.dangerButton : styles.button;
    return (
      <div style={showBadge ? styles.buttonWithBadge : { width: '100%' }}>
        <button
          style={baseStyle}
          onClick={() => handleNavigation(path)}
          onMouseOver={(e) => {
            Object.assign(e.currentTarget.style, isDanger ? {} : styles.buttonHover);
          }}
          onMouseOut={(e) => {
            Object.assign(e.currentTarget.style, baseStyle);
          }}
        >
          {icon} {!collapsed && label}
        </button>
        {showBadge && badgeCount > 0 && (
          <span style={badgeStyle}>
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </div>
    );
  };

  const adminDropdownButton = (label, icon, path, items) => {
    if (role === "admin" || role === "superadmin") {
      return (
        <div>
          <button
            style={{ ...styles.button, ...styles.dropdownButton }}
            onClick={() => toggleDropdown(label)}
            onMouseOver={(e) => {
              Object.assign(e.currentTarget.style, styles.buttonHover);
            }}
            onMouseOut={(e) => {
              Object.assign(e.currentTarget.style, styles.button);
            }}
          >
            <span>
              {icon} {!collapsed && label}
            </span>
            {!collapsed && (
              <span style={styles.dropdownIcon}>▶</span>
            )}
          </button>
          
          {openDropdown === label && !collapsed && (
            <div style={styles.dropdownContent}>
              {items.map((item, index) => (
                <div key={index} style={{ marginBottom: '5px' }}>
                  {navButton(item.label, item.icon, item.path, item.condition)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    } else {
      if (items.length > 0 && items[0].condition) {
        return navButton(items[0].label, items[0].icon, items[0].path, true);
      }
      return null;
    }
  };

  return (
    <>
      <div style={styles.sidebar}>
        <button
          style={styles.toggleButton}
          onClick={toggleNavbar}
          aria-label={collapsed ? "Expand Navbar" : "Collapse Navbar"}
        >
          {collapsed ? "◀" : "◀"}
        </button>

        <div style={styles.title}>
          {collapsed ? "HPMS" : "HR Policy Management System"}
        </div>
        
        <div 
          style={styles.userInfo}
          onClick={handleProfileClick}
          onMouseOver={(e) => {
            e.currentTarget.style.color = '#48cae4';
            const avatar = e.currentTarget.querySelector('img');
            if (avatar) {
              Object.assign(avatar.style, styles.avatarHover);
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = '#e0e0e0';
            const avatar = e.currentTarget.querySelector('img');
            if (avatar) {
              Object.assign(avatar.style, styles.avatar);
            }
          }}
        >
          <img 
            src={profilePicture} 
            alt="Profile" 
            style={styles.avatar}
            onError={(e) => {
              e.target.src = defaultAvatar;
            }}
          />
          {!collapsed && (
            <div>
              <div style={styles.userName}>{username}</div>
              <div style={styles.userRole}>{role}</div>
            </div>
          )}
        </div>

        <div style={styles.navItems}>
          {navButton("Welcome", "👋", "/welcome", !!userId)}
          
          {adminDropdownButton("Admin", "🔒", "/superadmin", [
            { label: "Dashboard", icon: "🏠", path: "/superadmin", condition: true },
            { label: "Permissions", icon: "🔐", path: "/per", condition: true },
            { label: "HR Leave", icon: "📝", path: "/policy", condition: true },
            { label: "Attendance", icon: "📅", path: "/attendance", condition: true },
            { label: "Salary Components", icon: "🧾", path: "/component", condition: true },
            { label: "Generate Salary", icon: "💰", path: "/salary-generate", condition: true },
            { label: "Salary Slips", icon: "💵", path: "/slip", condition: true }
          ])}
          
          {role === "hr" && navButton("HR Task", "🧑‍💻", "/hrdet")}
          {hasAccess("HOME-View") && navButton("Registered Employee", "👥", "/home")}
          {hasAccess("HR-View") && navButton("HR Policy", "📋", "/hr")}
          {hasAccess("SALARY-View") && navButton("Salary Table", "💰", "/salary")}
          {hasAccess("E-Add") && navButton("Add Employee", "➕", "/add")}
          {hasAccess("TASK-View") && navButton("Task Details", "📑", "/taskdetail")}
          {hasAccess("TASK-SelfAssign") && role === "employee" &&
            navButton("My Tasks", "📝", "/mytasks")}

          {role === "employee" &&
            navButton("Apply Leave", "🗓️", "/apply-leave")}

          {navButton(
            "My Leave Applications", 
            "📋", 
            "/leave-applications",
            role === "employee",
            false,
            true,
            myPendingLeavesCount,
            styles.myLeavesBadge
          )}

          {navButton(
            "Review Leaves", 
            "👁️", 
            "/review-leaves",
            role === "hr" || role === "admin" || role === "superadmin",
            false,
            true,
            pendingLeavesCount,
            styles.notificationBadge
          )}
        </div>

        <div style={styles.signOutSection}>
          <button
            style={styles.dangerButton}
            onClick={handleLogout}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {collapsed ? "🚪" : "Sign Out"}
          </button>
        </div>
      </div>

      <div style={styles.pageContent}>
        <ToastContainer />
      </div>
    </>
  );
};

Navbar.propTypes = {
  permissions: PropTypes.arrayOf(
    PropTypes.shape({
      code: PropTypes.string.isRequired,
      access: PropTypes.bool.isRequired,
    })
  ),
};

export default Navbar;