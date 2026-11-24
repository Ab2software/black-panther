import React, { useState } from "react";
import logo from '../assets/panther-logo.svg';

const LoginModal = ({ onClose, onLogin, onDemoLogin, loading }) => {
  const [form, setForm] = useState({ username: "", password: "" });
// console.log("LoginModal rendered", { onClose, onLogin, onDemoLogin, loading }); // ← add this
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

          <label>Username</label>
          <input
            type="text"
            placeholder="Enter username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />  

          <label>Password</label>
          <input
            type="password"
            placeholder="Enter Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <button className="primary" onClick={() => onLogin(form)}>
            {loading ? "Loading..." : "Login"}
          </button>


          {/* DEMO BUTTON */}
          <button
            className="primary demo-btn"
            
            onClick={onDemoLogin}
            disabled={loading}
          >
            {loading ? "Please wait..." : "Demo Login"}
          </button>

        </div>
      </div>

      <style>{`
        .demo-btn {
          cursor: pointer;
        }
      
        .demo-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default LoginModal;