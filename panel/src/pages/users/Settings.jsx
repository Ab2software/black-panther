import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { updateProfile, resetPassword } from "../../services/authService";
import { toast } from "../../utils/toast";

const Settings = () => {
  const { user, fetchUser } = useAuth();

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [profile, setProfile] = useState({
    username: user?.username || "",
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
  });

  // ================= PROFILE =================
  const handleProfileUpdate = async () => {
    try {
      setProfileLoading(true);
      const res = await updateProfile(profile);
      toast.success(res?.message || "Profile updated ✅");
      await fetchUser();
    } catch (err) {
      toast.error(err?.message || "Profile update failed ❌");
    } finally {
      setProfileLoading(false);
    }
  };

  // ================= PASSWORD =================
  const handlePasswordChange = async () => {
    try {
      setPasswordLoading(true);
      const res = await resetPassword(passwordData);
      toast.success(res?.message || "Password updated 🔐");
      setPasswordData({ oldPassword: "", newPassword: "" });
    } catch (err) {
      toast.error(err?.message || "Password update failed ❌");
    } finally {
      setPasswordLoading(false);
    }
  };

  /* ===== INLINE STYLES ===== */
  const page = {
    maxWidth: "750px",
    margin: "auto",
    padding: "20px",
  };

  const header = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px",
  };

  const avatar = {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    background: "#0b1f23",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
  };

  const sub = {
    fontSize: "12px",
    color: "gray",
  };

  const card = {
    background: "white",
    padding: "16px",
    borderRadius: "12px",
    marginBottom: "15px",
    boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  };

  const input = {
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    outline: "none",
  };

  const button = {
    background: "#0b1f23",
    color: "white",
    padding: "10px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
  };

  const grid = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    fontSize: "13px",
  };

  const permissionsWrap = {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  };

  const badgeYes = {
    padding: "5px 10px",
    borderRadius: "6px",
    fontSize: "12px",
    background: "#16a34a",
    color: "white",
  };

  const badgeNo = {
    padding: "5px 10px",
    borderRadius: "6px",
    fontSize: "12px",
    background: "#dc2626",
    color: "white",
  };

  return (
    <div style={page}>
      {/* HEADER */}
      <div style={header}>
        <div style={avatar}>
          {user?.username?.charAt(0).toUpperCase()}
        </div>

        <div>
          <h2 style={{ margin: 0 }}>{user?.username}</h2>
          <p style={sub}>
            {user?.role} • {user?.status}
          </p>
        </div>
      </div>

      {/* PROFILE */}
      <div style={card}>
        <h3>👤 Profile</h3>

        <input
          style={input}
          placeholder="Username"
          value={profile.username}
          onChange={(e) =>
            setProfile({ ...profile, username: e.target.value })
          }
        />

        <input
          style={input}
          placeholder="Full Name"
          value={profile.fullName}
          onChange={(e) =>
            setProfile({ ...profile, fullName: e.target.value })
          }
        />

        <input
          style={input}
          placeholder="Email"
          value={profile.email}
          onChange={(e) =>
            setProfile({ ...profile, email: e.target.value })
          }
        />

        <input
          style={input}
          placeholder="Phone"
          value={profile.phone}
          onChange={(e) =>
            setProfile({ ...profile, phone: e.target.value })
          }
        />

        <button
          style={button}
          onClick={handleProfileUpdate}
          disabled={profileLoading}
        >
          {profileLoading ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* SECURITY */}
      <div style={card}>
        <h3>🔐 Security</h3>

        <input
          style={input}
          type="password"
          placeholder="Old Password"
          value={passwordData.oldPassword}
          onChange={(e) =>
            setPasswordData({
              ...passwordData,
              oldPassword: e.target.value,
            })
          }
        />

        <input
          style={input}
          type="password"
          placeholder="New Password"
          value={passwordData.newPassword}
          onChange={(e) =>
            setPasswordData({
              ...passwordData,
              newPassword: e.target.value,
            })
          }
        />

        <button
          style={button}
          onClick={handlePasswordChange}
          disabled={passwordLoading}
        >
          {passwordLoading ? "Updating..." : "Update Password"}
        </button>
      </div>

      {/* ACCOUNT INFO */}
      <div style={card}>
        <h3>📊 Account Info</h3>

        <div style={grid}>
          <p><b>Role:</b> {user?.role}</p>
          <p><b>Status:</b> {user?.status}</p>
          <p><b>Phone:</b> {user?.phone}</p>
          <p><b>Email:</b> {user?.email || "N/A"}</p>
          <p>
            <b>Created:</b>{" "}
            {user?.createdAt && new Date(user.createdAt).toLocaleDateString()}
          </p>
          <p>
            <b>Last Login:</b>{" "}
            {user?.lastLoginAt &&
              new Date(user.lastLoginAt).toLocaleString()}
          </p>
        </div>

        <h4>Permissions</h4>

        <div style={permissionsWrap}>
          <span
            style={user?.permissions?.canBet ? badgeYes : badgeNo}
          >
            Bet
          </span>

          <span
            style={user?.permissions?.canDeposit ? badgeYes : badgeNo}
          >
            Deposit
          </span>

          <span
            style={user?.permissions?.canWithdraw ? badgeYes : badgeNo}
          >
            Withdraw
          </span>

          <span
            style={user?.permissions?.canLogin ? badgeYes : badgeNo}
          >
            Login
          </span>
        </div>
      </div>
    </div>
  );
};

export default Settings;