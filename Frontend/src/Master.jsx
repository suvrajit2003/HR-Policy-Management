import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Master = () => {
const navigate = useNavigate();
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [showPassword, setShowPassword] = useState(false); // New state for password visibility
const [captcha, setCaptcha] = useState("");
const [captchaInput, setCaptchaInput] = useState("");
const [error, setError] = useState("");
const [currentPage, setCurrentPage] = useState("home");


const generateCaptcha = () => {
    const result = Math.floor(1000 + Math.random() * 9000).toString();
    setCaptcha(result);
    setCaptchaInput("");
};

useEffect(() => {
    generateCaptcha();
}, []);

const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password || !captchaInput) {
        setError("❌ All fields including CAPTCHA are required");
        return;
    }

    if (captchaInput !== captcha) {
        setError("❌ CAPTCHA mismatch. Please try again.");
        generateCaptcha();
        return;
    }

    try {
        const res = await fetch("http://localhost:1000/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        console.log("📥 Response from backend:", data);

        if (res.ok && data.token) {
            const { role, name, id } = data.user;

            localStorage.setItem("token", data.token);
            localStorage.setItem("userRole", role);
            localStorage.setItem("employeeId", id);
            localStorage.setItem("username", name);
            localStorage.setItem("userId", id);

            sessionStorage.setItem("userRole", role);

            toast.success(`${role} login successful!`);
            navigate("/welcome");
        } else {
            setError(data.error || data.message || "❌ Invalid credentials");
            generateCaptcha();
        }
    } catch (err) {
        console.error("❌ Network/Server error:", err);
        setError("❌ Server error. Please try again later.");
        generateCaptcha();
    }
};

return (
    <div className="master-container">
        <style>
            {`
            .master-container {
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                background-image: url('https://images.unsplash.com/photo-1508780709619-79562169bc64?auto=format&fit=crop&w=1920&q=80');
                background-size: cover;
                background-position: center;
                position: relative;
                font-family: 'Poppins', sans-serif;
                color: #fff;
            }

            .overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(to right, rgba(0,0,0,0.6), rgba(37,117,252,0.6));
                z-index: 0;
            }

            .navbar {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                background-color: rgba(0, 0, 0, 0.8);
                padding: 15px 50px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                z-index: 1000;
                box-shadow: 0 2px 10px rgba(0,0,0,0.4);
            }

            .navbar-title {
                margin: 0;
                font-size: 26px;
                color: #fff;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
            }

            .nav-list {
                display: flex;
                list-style: none;
                margin: 0;
                padding: 0;
            }

            .nav-item {
                margin-left: 25px;
            }

            .nav-link {
                background: none;
                border: none;
                color: #eee;
                font-size: 16px;
                font-weight: 500;
                padding: 8px 12px;
                border-radius: 5px;
                cursor: pointer;
                transition: background-color 0.3s ease, color 0.3s ease;
                text-decoration: none;
            }

            .nav-link:hover {
                background-color: rgba(255, 255, 255, 0.2);
            }

            .nav-link.active {
                background-color: #3780f7;
                color: #fff;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            }

            .main-content {
                flex: 1;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 70px 20px 70px;
                z-index: 1;
                overflow-y: auto;
            }

            .page-content-card {
                z-index: 1;
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(8px);
                padding: 2.2rem;
                border-radius: 18px;
                max-width: 850px;
                width: 95%;
                box-shadow: 0 10px 20px rgba(0,0,0,0.25);
                text-align: center;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 450px;
            }

            .page-content-card.login-card {
                background: rgba(255, 255, 255, 0.15);
                backdrop-filter: blur(15px);
                padding: 2rem;
                box-shadow: 0 15px 30px rgba(0,0,0,0.3);
                max-width: 420px;
            }

            .page-content-title {
                font-size: 36px;
                font-weight: bold;
                margin-bottom: 20px;
                color: #ffdd57;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            }

            .page-content-paragraph {
                font-size: 18px;
                line-height: 1.6;
                margin-bottom: 20px;
                max-width: 600px;
                color: #eee;
            }

            .primary-button {
                background-color: #2575fc;
                color: #fff;
                padding: 14px 30px;
                border-radius: 30px;
                border: none;
                font-weight: bold;
                font-size: 18px;
                cursor: pointer;
                transition: background-color 0.3s ease, transform 0.2s ease;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                margin-top: 20px;
            }

            .primary-button:hover {
                background-color: #1a60e0;
                transform: scale(1.02);
            }

            .contact-list {
                list-style: none;
                padding: 0;
                margin: 20px 0;
                font-size: 18px;
                line-height: 2.0;
                text-align: center;
                color: #eee;
            }

            .contact-list li {
                margin-bottom: 10px;
            }

            .contact-link {
                color: #ffdd57;
                text-decoration: none;
                font-weight: bold;
            }

            .contact-link:hover {
                text-decoration: underline;
            }

            /* Login Form Specific Styles */
            .login-title {
                text-align: center;
                color: #fff;
                font-weight: bold;
                margin-bottom: 20px;
                font-size: 28px;
                letter-spacing: 1px;
            }
            .login-title span {
                color: #ffdd57;
            }

            .form-group {
                margin-bottom: 15px;
                position: relative;
            }

            .form-label {
                color: #eee;
                font-weight: bold;
                display: block;
                margin-bottom: 5px;
            }

            .form-input {
                width: 100%;
                padding: 10px;
                border-radius: 8px;
                border: 1px solid #ccc;
                margin-top: 5px;
                font-size: 15px;
                transition: 0.3s;
                box-sizing: border-box;
                background-color: rgba(255, 255, 255, 0.9);
                color: #333;
            }
            .form-input:focus {
                border-color: #2575fc;
                box-shadow: 0 0 0 3px rgba(37, 117, 252, 0.3);
                outline: none;
            }

            /* Password toggle styles */
            .password-toggle {
                position: absolute;
                right: 10px;
                top: 35px;
                cursor: pointer;
                color: #666;
                background: none;
                border: none;
                font-size: 18px;
            }

            .captcha-display {
                background-color: #f0f0f0;
                color: #333;
                font-size: 24px;
                font-weight: bold;
                padding: 8px 15px;
                border-radius: 5px;
                letter-spacing: 3px;
                text-align: center;
                margin-bottom: 10px;
                user-select: none;
                display: inline-block;
                min-width: 120px;
            }

            .captcha-refresh-button {
                background-color: #6c757d;
                color: #fff;
                border: none;
                padding: 8px 12px;
                border-radius: 5px;
                cursor: pointer;
                transition: background-color 0.3s ease;
                margin-left: 10px;
                font-size: 14px;
            }
            .captcha-refresh-button:hover {
                background-color: #5a6268;
            }

            .error-message {
                background-color: #ffccd5;
                color: #900;
                padding: 10px;
                border-radius: 8px;
                font-size: 14px;
                margin-bottom: 15px;
                text-align: center;
            }

            .login-button {
                background-color: #2575fc;
                color: #fff;
                padding: 12px;
                width: 100%;
                border: none;
                border-radius: 10px;
                font-weight: bold;
                font-size: 16px;
                cursor: pointer;
                transition: all 0.3s;
            }
            .login-button:hover {
                background-color: #1a60e0;
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            }

            .forgot-password-link {
                color: #ffdd57;
                cursor: pointer;
                text-decoration: underline;
                font-size: 14px;
            }
            .forgot-password-link:hover {
                color: #ffe066;
            }

            .footer {
                position: relative;
                bottom: 0;
                left: 0;
                width: 100%;
                background-color: rgba(0, 0, 0, 0.8);
                padding: 20px 0;
                text-align: center;
                color: #fff;
                font-size: 14px;
                z-index: 1000;
                box-shadow: 0 -2px 10px rgba(0,0,0,0.4);
                margin-top: auto;
            }
            .footer p {
                margin-bottom: 5px;
            }

            /* Responsive adjustments */
            @media (max-width: 768px) {
                .navbar {
                    flex-direction: column;
                    padding: 15px 20px;
                }
                .nav-list {
                    margin-top: 10px;
                    flex-wrap: wrap;
                    justify-content: center;
                }
                .nav-item {
                    margin: 5px 10px;
                }
                .navbar-title {
                    font-size: 22px;
                }
                .page-content-card {
                    padding: 1.5rem;
                    min-height: unset;
                }
                .page-content-title {
                    font-size: 28px;
                }
                .page-content-paragraph {
                    font-size: 16px;
                }
                .primary-button {
                    padding: 12px 25px;
                    font-size: 16px;
                }
                .contact-list {
                    font-size: 16px;
                }
                .login-card {
                    padding: 1.5rem;
                }
                .login-title {
                    font-size: 24px;
                }
            }

            @media (max-width: 480px) {
                .nav-item {
                    margin: 5px 8px;
                }
                .nav-link {
                    font-size: 14px;
                    padding: 6px 10px;
                }
                .page-content-title {
                    font-size: 24px;
                }
                .page-content-paragraph {
                    font-size: 14px;
                }
                .primary-button {
                    padding: 10px 20px;
                    font-size: 14px;
                }
                .contact-list {
                    font-size: 14px;
                }
                .login-title {
                    font-size: 20px;
                }
                .form-input, .captcha-input {
                    font-size: 14px;
                    padding: 8px;
                }
                .captcha-display {
                    font-size: 20px;
                    padding: 6px 10px;
                }
                .captcha-refresh-button {
                    font-size: 12px;
                    padding: 6px 10px;
                }
            }
            `}
        </style>
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />

        <div className="overlay" />

        <nav className="navbar">
            <h1 className="navbar-title">
                HR Policy Management System
            </h1>
            <ul className="nav-list">
                <li className="nav-item">
                    <button
                        onClick={() => setCurrentPage("home")}
                        className={`nav-link ${currentPage === "home" ? "active" : ""}`}
                    >
                        Home
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        onClick={() => setCurrentPage("about")}
                        className={`nav-link ${currentPage === "about" ? "active" : ""}`}
                    >
                        About Us
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        onClick={() => setCurrentPage("contact")}
                        className={`nav-link ${currentPage === "contact" ? "active" : ""}`}
                    >
                        Contact Us
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        onClick={() => setCurrentPage("login")}
                        className={`nav-link ${currentPage === "login" ? "active" : ""}`}
                    >
                        Login
                    </button>
                </li>
            </ul>
        </nav>

        <main className="main-content">
            {currentPage === "home" && (
                <div className="page-content-card">
                    <h2 className="page-content-title" style={{ fontSize: "38px", marginBottom: "25px" }}>Welcome to your HR Policy Management System</h2>
                    <p className="page-content-paragraph" style={{ fontSize: "19px", maxWidth: "650px", textShadow: "1px 1px 2px rgba(0,0,0,0.6)" }}>
                        Your central platform for managing human resources policies. Streamline workflows, ensure compliance, and empower your employees with easy access to essential HR information.
                    </p>
                    <button
                        onClick={() => setCurrentPage("login")}
                        className="primary-button"
                    >
                        Access Dashboard
                    </button>
                </div>
            )}

            {currentPage === "about" && (
                <div className="page-content-card">
                    <h2 className="page-content-title">About Our HR Policy System</h2>
                    <p className="page-content-paragraph" style={{ fontSize: "19px", maxWidth: "650px", textShadow: "1px 1px 2px rgba(0,0,0,0.6)" }}>
                        We are dedicated to providing businesses with a seamless and powerful solution to effectively manage their HR policies. Our system is designed to enhance transparency, improve communication, and simplify HR processes, allowing you to focus on your core business objectives.
                    </p>
                </div>
            )}

            {currentPage === "contact" && (
                <div className="page-content-card">
                    <h2 className="page-content-title">Contact Our Support Team</h2>
                    <p className="page-content-paragraph" style={{ fontSize: "19px", maxWidth: "650px", textShadow: "1px 1px 2px rgba(0,0,0,0.6)" }}>
                        We are here to help you. Please reach out through the following channels:
                    </p>
                    <ul className="contact-list">
                        <li>
                            <span role="img" aria-label="email">📧</span> Email:{" "}
                            <a href="mailto:support@hrpolicyhub.com" className="contact-link">
                                support@hrpolicymanagement.com
                            </a>
                        </li>
                        <li>
                            <span role="img" aria-label="phone">📞</span> Phone: +91 800-123-4567
                        </li>
                        <li>
                            <span role="img" aria-label="address">📍</span> Address: HR Policy Management, Bhubaneswar, Odisha
                        </li>
                    </ul>
                </div>
            )}

            {currentPage === "login" && (
                <div className="page-content-card login-card">
                    <h2 className="login-title">
                        Welcome to <span>HR Policy Management System</span>
                    </h2>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="form-input"
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? "👁️‍🗨️" : "👁️‍🗨️"}
                            </button>
                        </div>

                        <div className="form-group">
                            <label className="form-label">CAPTCHA</label>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "10px" }}>
                                <span className="captcha-display">{captcha}</span>
                                <button
                                    type="button"
                                    onClick={generateCaptcha}
                                    className="captcha-refresh-button"
                                >
                                    Refresh
                                </button>
                            </div>
                            <input
                                type="text"
                                value={captchaInput}
                                onChange={(e) => setCaptchaInput(e.target.value)}
                                required
                                className="form-input"
                                placeholder="Enter CAPTCHA"
                            />
                        </div>

                        {error && (
                            <div className="error-message">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="login-button"
                        >
                            Login
                        </button>

                        <div style={{ textAlign: "right", marginTop: "10px" }}>
                            <Link
                                to="/forgot-password"
                                className="forgot-password-link"
                            >
                                Forgot Password?
                            </Link>
                        </div>
                    </form>
                </div>
            )}
        </main>

        <footer className="footer">
            <p>&copy; {new Date().getFullYear()} HR Policy Management System. All rights reserved.</p>
            <p>Made in Bhubaneswar, Odisha</p>
        </footer>
    </div>
);

};

export default Master;