import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Master = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [captcha, setCaptcha] = useState("");
    const [captchaInput, setCaptchaInput] = useState("");
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState("home");

    // Object to hold online background image URLs
    const bgImages = {
        home: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1920',
        about: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1920',
        contact: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1920',
        login: 'https://images.unsplash.com/photo-1579546929940-15570251147e?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1920'
    };

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
            setError("❌ All fields are required.");
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
                setTimeout(() => navigate("/welcome"), 500);
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

    const containerVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.7, ease: "easeOut" }
        },
        exit: { opacity: 0, y: -50, transition: { duration: 0.5 } }
    };

    const floatingLabelVariant = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
    };

    const cardStyles = {
        background: `rgba(30, 30, 30, 0.6)`,
        backdropFilter: 'blur(15px) saturate(180%)',
        WebkitBackdropFilter: 'blur(15px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.6)',
        borderRadius: '20px',
        padding: '2.5rem',
        width: '100%',
        maxWidth: '800px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
    };

    const loginCardStyles = {
        ...cardStyles,
        maxWidth: '450px',
        width: '90%',
    };

    const renderContent = () => {
        switch (currentPage) {
            case "home":
                return (
                    <motion.div
                        className="page-content-card"
                        key="home"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        style={cardStyles}
                    >
                        <h2 className="page-content-title" style={{ fontSize: "clamp(2rem, 5vw, 3rem)", marginBottom: "25px", color: '#eee' }}>
                            Welcome to <span style={{ color: '#64ffda' }}>HR Policy Management System</span>
                        </h2>
                        <p className="page-content-paragraph" style={{ fontSize: "clamp(1rem, 2vw, 1.2rem)", maxWidth: "650px", textShadow: "1px 1px 2px rgba(0,0,0,0.8)", color: '#ccc' }}>
                            Your central platform for streamlined HR policy management. Access essential information, ensure compliance, and empower your team with a click.
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.05, y: -3 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setCurrentPage("login")}
                            className="primary-button"
                        >
                            Access Dashboard
                        </motion.button>
                    </motion.div>
                );
            case "about":
                return (
                    <motion.div
                        className="page-content-card"
                        key="about"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        style={cardStyles}
                    >
                        <h2 className="page-content-title" style={{ color: '#eee' }}>About Our HR Policy System</h2>
                        <p className="page-content-paragraph" style={{ fontSize: "clamp(1rem, 2vw, 1.2rem)", maxWidth: "650px", textShadow: "1px 1px 2px rgba(0,0,0,0.8)", color: '#ccc' }}>
                            We are committed to providing businesses with a powerful and intuitive solution to effectively manage their HR policies. Our system is designed to enhance transparency, improve communication, and simplify complex HR processes, allowing you to focus on your strategic goals.
                        </p>
                    </motion.div>
                );
            case "contact":
                return (
                    <motion.div
                        className="page-content-card"
                        key="contact"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        style={cardStyles}
                    >
                        <h2 className="page-content-title" style={{ color: '#eee' }}>Contact Our Support Team</h2>
                        <p className="page-content-paragraph" style={{ fontSize: "clamp(1rem, 2vw, 1.2rem)", maxWidth: "650px", textShadow: "1px 1px 2px rgba(0,0,0,0.8)", color: '#ccc' }}>
                            We are here to help you. Please reach out through the following channels:
                        </p>
                        <ul className="contact-list" style={{ color: '#ccc' }}>
                            <li>
                                <motion.span whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} role="img" aria-label="email">📧</motion.span> Email:{" "}
                                <a href="mailto:support@hrpolicymanagement.com" className="contact-link" style={{ color: '#64ffda' }}>
                                    support@hrpolicymanagement.com
                                </a>
                            </li>
                            <li>
                                <motion.span whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} role="img" aria-label="phone">📞</motion.span> Phone: +91 800-123-4567
                            </li>
                            <li>
                                <motion.span whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} role="img" aria-label="address">📍</motion.span> Address: HR Policy Management, Bhubaneswar, Odisha
                            </li>
                        </ul>
                    </motion.div>
                );
            case "login":
                return (
                    <motion.div
                        className="page-content-card login-card"
                        key="login"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        style={loginCardStyles}
                    >
                        <h2 className="login-title" style={{ color: '#eee', marginBottom: '30px' }}>
                            Welcome to <span style={{ color: '#64ffda' }}>HR Policy Management System</span>
                        </h2>

                        <form onSubmit={handleSubmit} style={{ width: '80%', maxWidth: '350px' }}>
                            <motion.div
                                className="form-group floating-label"
                                variants={floatingLabelVariant}
                                initial="hidden"
                                animate="visible"
                            >
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="form-input"
                                    style={{ backgroundColor: 'rgba(40, 40, 40, 0.7)', color: '#eee', borderColor: 'rgba(255, 255, 255, 0.1)' }}
                                />
                                <label className="form-label" style={{ color: '#888' }}>Email</label>
                            </motion.div>

                            <motion.div
                                className="form-group floating-label"
                                variants={floatingLabelVariant}
                                initial="hidden"
                                animate="visible"
                                style={{ transitionDelay: '0.1s' }}
                            >
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="form-input"
                                    style={{ backgroundColor: 'rgba(40, 40, 40, 0.7)', color: '#eee', borderColor: 'rgba(255, 255, 255, 0.1)' }}
                                />
                                <label className="form-label" style={{ color: '#888' }}>Password</label>
                                <motion.button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    style={{ color: '#aaa' }}
                                >
                                    {showPassword ? "👁️" : "🔒"}
                                </motion.button>
                            </motion.div>

                            <motion.div
                                className="form-group captcha-group"
                                variants={floatingLabelVariant}
                                initial="hidden"
                                animate="visible"
                                style={{ transitionDelay: '0.2s' }}
                            >
                                <div className="captcha-container">
                                    <span className="captcha-display" style={{ backgroundColor: 'rgba(40, 40, 40, 0.7)', color: '#64ffda', borderColor: '#64ffda' }}>{captcha}</span>
                                    <motion.button
                                        type="button"
                                        onClick={generateCaptcha}
                                        className="captcha-refresh-button"
                                        whileHover={{ rotate: 360 }}
                                        transition={{ duration: 0.5 }}
                                        style={{ backgroundColor: '#555', color: '#eee' }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.164 1.165a1.25 1.25 0 0 1-.849.336H11.534a.25.25 0 0 1-.192-.41l1.164-1.165a1.25 1.25 0 0 1 .849-.336z"/>
                                            <path d="M14.685 1.401a8 8 0 0 0-13.437.81L.22 2.22a.25.25 0 0 1-.19.41l1.164 1.165a1.25 1.25 0 0 1 .849.336h2.932a.25.25 0 0 1 .192-.41l-1.164-1.165a1.25 1.25 0 0 1-.849-.336L1.517 2.067a6.5 6.5 0 1 1 11.233 4.298h2.932a.25.25 0 0 1 .192.41l-1.164 1.165a1.25 1.25 0 0 1-.849.336H11.534a.25.25 0 0 1-.192-.41l1.164-1.165a1.25 1.25 0 0 1 .849-.336z"/>
                                        </svg>
                                    </motion.button>
                                </div>
                                <input
                                    type="text"
                                    value={captchaInput}
                                    onChange={(e) => setCaptchaInput(e.target.value)}
                                    required
                                    className="form-input captcha-input"
                                    placeholder="Enter CAPTCHA"
                                    style={{ backgroundColor: 'rgba(40, 40, 40, 0.7)', color: '#eee', borderColor: 'rgba(255, 255, 255, 0.1)' }}
                                />
                            </motion.div>

                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        className="error-message"
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        style={{ backgroundColor: '#ff6b6b', color: '#fff' }}
                                    >
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <motion.button
                                type="submit"
                                className="login-button"
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                style={{ backgroundImage: 'linear-gradient(45deg, #00bcd4, #3f51b5)' }}
                            >
                                Login
                            </motion.button>

                            <motion.div style={{ textAlign: "center", marginTop: "20px" }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Link
                                    to="/forgot-password"
                                    className="forgot-password-link"
                                    style={{ color: '#64ffda' }}
                                >
                                    Forgot Password?
                                </Link>
                            </motion.div>
                        </form>
                    </motion.div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="master-container" style={{ backgroundImage: `url(${bgImages[currentPage]})` }}>
            <style>
                {`
                @keyframes neonGlow {
                    from {
                        text-shadow: 0 0 5px #64ffda, 0 0 10px #64ffda, 0 0 15px #64ffda, 0 0 20px #64ffda;
                    }
                    to {
                        text-shadow: 0 0 10px #64ffda, 0 0 20px #64ffda, 0 0 30px #64ffda, 0 0 40px #64ffda;
                    }
                }

                @keyframes animatedGradient {
                    0% {
                        background-position: 0% 50%;
                    }
                    50% {
                        background-position: 100% 50%;
                    }
                    100% {
                        background-position: 0% 50%;
                    }
                }

                .master-container {
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    background-size: cover;
                    background-position: center;
                    background-attachment: fixed;
                    position: relative;
                    font-family: 'Poppins', sans-serif;
                    color: #eee;
                    overflow-x: hidden;
                    transition: background-image 0.8s ease-in-out;
                }

                .master-container::after {
                    content: '';
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(-45deg, rgba(12, 12, 12, 0.8), rgba(30, 30, 30, 0.8));
                    background-size: 400% 400%;
                    animation: animatedGradient 15s ease infinite;
                    z-index: -1;
                    opacity: 0.9;
                }

                .navbar {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    background-color: rgba(30, 30, 30, 0.8);
                    backdrop-filter: blur(10px) saturate(180%);
                    -webkit-backdrop-filter: blur(10px) saturate(180%);
                    padding: 15px 50px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    z-index: 1000;
                    box-shadow: 0 4px 30px rgba(0,0,0,0.6);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    color: #eee;
                }

                .navbar-title {
                    font-size: 26px;
                    color: #eee;
                    font-weight: 700;
                }

                .navbar-title span {
                    color: #64ffda;
                }

                .nav-list {
                    display: flex;
                    list-style: none;
                    margin: 0;
                    padding: 0;
                }

                .nav-item {
                    margin-left: 20px;
                }

                .nav-link {
                    background: none;
                    border: none;
                    color: #eee;
                    font-size: 16px;
                    font-weight: 500;
                    padding: 8px 15px;
                    border-radius: 50px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-decoration: none;
                    border: 1px solid transparent;
                }

                .nav-link:hover {
                    background-color: rgba(255, 255, 255, 0.1);
                    color: #64ffda;
                    transform: translateY(-2px);
                }

                .nav-link.active {
                    background-color: #64ffda;
                    color: #222;
                    box-shadow: 0 4px 15px rgba(100, 255, 218, 0.4);
                    font-weight: 600;
                    transform: scale(1.05);
                }

                .main-content {
                    flex: 1;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 100px 20px 70px;
                    z-index: 1;
                    overflow-y: auto;
                    position: relative;
                    perspective: 1000px;
                }

                .page-content-card {
                    z-index: 1;
                    background: rgba(30, 30, 30, 0.6);
                    backdrop-filter: blur(15px) saturate(180%);
                    -webkit-backdrop-filter: blur(15px) saturate(180%);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.6);
                    border-radius: 20px;
                    padding: 2.5rem;
                    width: 100%;
                    max-width: 800px;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    min-height: 450px;
                    position: relative;
                    overflow: hidden;
                    transition: transform 0.3s ease-in-out, box-shadow 0.3s ease;
                    color: #eee;
                }

                .page-content-card:hover {
                    transform: rotateX(2deg) rotateY(2deg) scale(1.01);
                    box-shadow: 0 15px 50px 0 rgba(0, 0, 0, 0.8);
                }

                .page-content-title {
                    font-size: clamp(2.5rem, 5vw, 3.5rem);
                    font-weight: bold;
                    margin-bottom: 20px;
                    color: #eee;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
                    letter-spacing: 1px;
                }

                .page-content-title span {
                    color: #64ffda;
                }

                .page-content-paragraph {
                    font-size: clamp(1rem, 2vw, 1.2rem);
                    line-height: 1.6;
                    margin-bottom: 30px;
                    max-width: 650px;
                    color: #ccc;
                }

                .primary-button {
                    background-image: linear-gradient(45deg, #00bcd4, #3f51b5);
                    color: #eee;
                    padding: 15px 40px;
                    border-radius: 50px;
                    border: none;
                    font-weight: bold;
                    font-size: 18px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.6);
                    margin-top: 20px;
                    letter-spacing: 1px;
                }

                .primary-button:hover {
                    transform: scale(1.05) translateY(-3px);
                    box-shadow: 0 12px 30px rgba(0,0,0,0.8);
                }

                .contact-list {
                    list-style: none;
                    padding: 0;
                    margin: 20px 0;
                    font-size: 18px;
                    line-height: 2.5;
                    text-align: center;
                    color: #ccc;
                }

                .contact-list li {
                    margin-bottom: 15px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                }

                .contact-link {
                    color: #64ffda;
                    text-decoration: none;
                    font-weight: bold;
                    transition: color 0.3s ease;
                }

                .contact-link:hover {
                    color: #40c4ff;
                    text-decoration: underline;
                }

                /* Login Form Specific Styles */
                .login-title {
                    text-align: center;
                    color: #eee;
                    font-weight: bold;
                    margin-bottom: 30px;
                    font-size: clamp(2rem, 5vw, 2.5rem);
                    letter-spacing: 1px;
                    font-size: 20px;
                }

                .login-title span {
                    color: #64ffda;
                }

                .form-group {
                    margin-bottom: 25px;
                    position: relative;
                }

                .form-label {
                    position: absolute;
                    left: 15px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #888;
                    font-weight: 500;
                    transition: all 0.3s ease;
                    pointer-events: none;
                }

                .form-input {
                    width: 100%;
                    padding: 15px;
                    padding-left: 15px;
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    font-size: 16px;
                    transition: 0.3s;
                    box-sizing: border-box;
                    background-color: rgba(40, 40, 40, 0.7);
                    color: #eee;
                    box-shadow: inset 0 2px 5px rgba(0,0,0,0.4);
                }

                .form-input:focus {
                    border-color: #64ffda;
                    box-shadow: 0 0 0 3px rgba(100, 255, 218, 0.3);
                    outline: none;
                    background-color: rgba(60, 60, 60, 0.7);
                }

                .form-input:not(:placeholder-shown) + .form-label,
                .form-input:focus + .form-label {
                    top: -10px;
                    left: 10px;
                    font-size: 12px;
                    background: rgba(30, 30, 30, 0.9);
                    padding: 0 5px;
                    border-radius: 5px;
                    color: #64ffda;
                    transform: translateY(0);
                }

                .password-toggle {
                    position: absolute;
                    right: 15px;
                    top: 50%;
                    transform: translateY(-50%);
                    cursor: pointer;
                    color: #aaa;
                    background: none;
                    border: none;
                    font-size: 20px;
                    transition: color 0.3s ease, transform 0.2s ease;
                }

                .password-toggle:hover {
                    color: #64ffda;
                    transform: translateY(-50%) scale(1.1);
                }

                .captcha-group {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 15px;
                }

                .captcha-container {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 15px;
                }

                .captcha-display {
                    background-color: rgba(40, 40, 40, 0.7);
                    color: #64ffda;
                    font-size: 26px;
                    font-weight: bold;
                    padding: 10px 20px;
                    border-radius: 8px;
                    letter-spacing: 3px;
                    text-align: center;
                    user-select: none;
                    display: inline-block;
                    min-width: 140px;
                    border: 2px dashed #64ffda;
                    transform: rotate(-3deg);
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
                }

                .captcha-refresh-button {
                    background-color: #555;
                    color: #eee;
                    border: none;
                    padding: 10px;
                    border-radius: 50%;
                    cursor: pointer;
                    transition: background-color 0.3s ease, transform 0.5s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.6);
                }

                .captcha-refresh-button:hover {
                    background-color: #777;
                }

                .error-message {
                    background-color: #ff6b6b;
                    color: #fff;
                    padding: 12px;
                    border-radius: 10px;
                    font-size: 14px;
                    margin-bottom: 20px;
                    text-align: center;
                    box-shadow: 0 4px 15px rgba(255,107,107,0.6);
                }

                .login-button {
                    background-image: linear-gradient(45deg, #00bcd4, #3f51b5);
                    color: #eee;
                    padding: 15px;
                    width: 100%;
                    border: none;
                    border-radius: 12px;
                    font-weight: bold;
                    font-size: 18px;
                    cursor: pointer;
                    transition: all 0.3s;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.6);
                }

                .login-button:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 12px 30px rgba(0,0,0,0.8);
                }

                .forgot-password-link {
                    color: #64ffda;
                    cursor: pointer;
                    text-decoration: none;
                    font-size: 14px;
                    transition: color 0.3s ease;
                }

                .forgot-password-link:hover {
                    color: #40c4ff;
                    text-decoration: underline;
                }

                .footer {
                    position: relative;
                    width: 100%;
                    background-color: rgba(30, 30, 30, 0.8);
                    backdrop-filter: blur(10px) saturate(180%);
                    -webkit-backdrop-filter: blur(10px) saturate(180%);
                    padding: 20px 0;
                    text-align: center;
                    color: #eee;
                    font-size: 14px;
                    z-index: 1000;
                    box-shadow: 0 -4px 30px rgba(0,0,0,0.6);
                    margin-top: auto;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                }

                .footer p {
                    margin-bottom: 5px;
                }

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
                        margin: 5px 8px;
                    }
                    .page-content-card {
                        padding: 1.5rem;
                        min-height: unset;
                    }
                    .page-content-title {
                        font-size: clamp(2rem, 5vw, 3rem);
                    }
                    .page-content-paragraph {
                        font-size: clamp(1rem, 2vw, 1.2rem);
                    }
                    .contact-list {
                        font-size: 16px;
                    }
                    .login-card {
                        width: 95%;
                        max-width: 450px;
                        padding: 2rem;
                    }
                    .login-card form {
                        width: 100%;
                        max-width: none;
                    }
                }
                `}
            </style>
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />

            <nav className="navbar">
                <h1 className="navbar-title">HR Policy Management System</h1>
                <ul className="nav-list">
                    <li className="nav-item">
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setCurrentPage("home")} className={`nav-link ${currentPage === "home" ? "active" : ""}`}>
                            Home
                        </motion.button>
                    </li>
                    <li className="nav-item">
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setCurrentPage("about")} className={`nav-link ${currentPage === "about" ? "active" : ""}`}>
                            About Us
                        </motion.button>
                    </li>
                    <li className="nav-item">
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setCurrentPage("contact")} className={`nav-link ${currentPage === "contact" ? "active" : ""}`}>
                            Contact Us
                        </motion.button>
                    </li>
                    <li className="nav-item">
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setCurrentPage("login")} className={`nav-link ${currentPage === "login" ? "active" : ""}`}>
                            Login
                        </motion.button>
                    </li>
                </ul>
            </nav>

            <main className="main-content">
                <AnimatePresence mode="wait">
                    {renderContent()}
                </AnimatePresence>
            </main>

            <footer className="footer">
                <p>&copy; {new Date().getFullYear()} HR Policy Management System. All rights reserved.</p>
                <p>Made in Bhubaneswar, Odisha</p>
            </footer>
        </div>
    );
};

export default Master;