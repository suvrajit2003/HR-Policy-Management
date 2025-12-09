import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const EmployeePage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const handleCheck = async (e) => {
    e.preventDefault();

    if (username.toLowerCase() === "admin") {
      navigate("/home");
      return;
    }

    try {
      const res = await axios.get(`http://localhost:1000/employees?name=${username}`);
      const employee = res.data;

      if (employee && employee._id) {
        navigate(`/emp_page/${employee._id}`);
      } else {
        setError("Employee not found");
      }
    } catch (err) {
      setError("Error fetching user");
    }
  };

  return (
    <section
      style={{
        backgroundColor: "#f7f7f7",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "15px",
          padding: "30px",
          width: "90%",
          maxWidth: "500px",
          boxShadow: "0 0 15px rgba(0,0,0,0.1)",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            fontWeight: "bold",
            marginBottom: "25px",
            color: "#333",
          }}
        >
          Employee Login
        </h2>

        <form onSubmit={handleCheck}>
          <div style={{ marginBottom: "20px" }}>
            <label htmlFor="username" style={{ marginBottom: "5px", display: "block" }}>
              Enter Your Name
            </label>
            <input
              type="text"
              id="username"
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "5px",
                border: "1px solid #ccc",
              }}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. John Doe"
              required
            />
          </div>

          {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

          <div style={{ display: "flex", justifyContent: "center", marginBottom: "15px" }}>
            <button
              type="submit"
              style={{
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                padding: "10px 25px",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Login
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <Link
              to="/"
              style={{
                textDecoration: "none",
                color: "#dc3545",
                fontWeight: "bold",
              }}
            >
              ← Back to User Login Page
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
};

export default EmployeePage;
