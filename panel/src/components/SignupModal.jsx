import React, { useState } from "react";
import logo from '../assets/panther-logo.svg';
const SignupModal = ({ onClose, onRegister, loading }) => {
  const [form, setForm] = useState({
    username: "",
    phone: "",
    password: "",
  });

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-box" onClick={(e) => e.stopPropagation()}>

        <div className="auth-header">
          <span></span>
          <span className="close" onClick={onClose}>✕</span>
        </div>

        <img
          src={logo}
          className="auth-logo"
        />

        <div className="auth-form">

          {/* USERNAME */}
          <label>Username</label>
          <input
            placeholder="Enter username"
            value={form.username}
            onChange={(e) =>
              setForm({ ...form, username: e.target.value })
            }
          />

          {/* PHONE */}
          <label>Phone Number</label>
          <input
            type="tel"
            maxLength={10}
            placeholder="Enter phone number"
            value={form.phone}
            onChange={(e) =>
              setForm({ ...form, phone: e.target.value })
            }
          />

          {/* PASSWORD */}
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter password"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
          />

          <button
            className="primary"
            onClick={() => onRegister(form)}
          >
            {loading ? "Loading..." : "Register"}
          </button>

        </div>
      </div>
    </div>
  );
};

export default SignupModal;