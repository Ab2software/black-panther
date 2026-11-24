// pages/ChangePassword.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { resetPassword } from "../../services/authService";
import { toast } from "../../utils/toast";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/panther-logo.svg";

const ChangePassword = () => {
  const [form, setForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { fetchUser, handleLogout } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (form.newPassword === form.oldPassword) {
      toast.error("New password must be different from the old one");
      return;
    }

    try {
      setLoading(true);
      await resetPassword({
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
      });
      toast.success("Password changed successfully 🎉");
      await fetchUser(); // refreshes user, mustChangePassword now false
      navigate("/");
    } catch (err) {
      toast.error(err?.message || "Password change failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cp-overlay">
      <div className="cp-box">
        <img src={logo} className="cp-logo" alt="logo" />
        <h2>Change Your Password</h2>
        <p className="cp-sub">
          For your security, you must set a new password before continuing.
        </p>

        <form className="cp-form" onSubmit={handleSubmit}>
          <label>Current (temporary) Password</label>
          <input
            type="password"
            placeholder="Enter password given by admin"
            value={form.oldPassword}
            onChange={(e) => setForm({ ...form, oldPassword: e.target.value })}
            required
          />

          <label>New Password</label>
          <input
            type="password"
            placeholder="Enter new password"
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            required
          />

          <label>Confirm New Password</label>
          <input
            type="password"
            placeholder="Re-enter new password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            required
          />

          <button className="primary" type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>

          <button
            type="button"
            className="cp-logout-link"
            onClick={handleLogout}
          >
            Log out instead
          </button>
        </form>
      </div>

      <style>{`
        .cp-overlay { min-height:100vh; display:flex; align-items:center; justify-content:center; background:#0b1f23; }
        .cp-box { background:white; width:380px; max-width:90vw; padding:28px 24px; border-radius:10px; text-align:center; }
        .cp-logo { height:60px; margin-bottom:12px; }
        .cp-box h2 { margin:0 0 6px; font-size:20px; color:#0b1f23; }
        .cp-sub { font-size:13px; color:#666; margin-bottom:18px; }
        .cp-form { display:flex; flex-direction:column; text-align:left; gap:4px; }
        .cp-form label { font-size:12px; color:#333; margin-top:8px; }
        .cp-form input { padding:10px; border-radius:6px; border:1px solid #ccc; outline:none; }
        .primary { margin-top:16px; padding:10px; border:none; border-radius:6px; background:#2c4f58; color:white; font-weight:600; cursor:pointer; }
        .primary:disabled { opacity:0.6; cursor:not-allowed; }
        .cp-logout-link { margin-top:10px; background:none; border:none; color:#999; font-size:12px; cursor:pointer; text-decoration:underline; }
      `}</style>
    </div>
  );
};

export default ChangePassword;