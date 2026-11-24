import React, { useState } from "react";
import { X, Building2, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { requestWithdrawal } from "../../services/walletService";

export default function WithdrawModal({ isOpen = true, onClose }) {
  const { wallet, refreshWallet, isDemo } = useAuth();
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [upiId, setUpiId] = useState("");
  const [withdrawType, setWithdrawType] = useState("bank"); // "bank" | "upi"
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  if (!isOpen) return null;

  const availableBal = wallet?.availableBalance || wallet?.balance || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });

    const numAmt = Number(amount);
    if (!numAmt || numAmt <= 0) {
      setStatus({ type: "error", message: "Enter a valid withdrawal amount" });
      return;
    }
    if (numAmt > availableBal) {
      setStatus({ type: "error", message: "Withdrawal amount exceeds available balance" });
      return;
    }

    setLoading(true);
    try {
      await requestWithdrawal({
        amount: numAmt,
        type: withdrawType,
        bankDetails: {
          bankName,
          accountNumber,
          accountHolderName,
          ifscCode,
        },
        upiId,
      });
      setStatus({
        type: "success",
        message: "Withdrawal request submitted! Payout will be processed shortly.",
      });
      refreshWallet();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setStatus({
        type: "error",
        message: err.message || "Failed to submit withdrawal request",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <button style={s.closeBtn} onClick={onClose}>
          <X size={18} />
        </button>

        <div style={s.header}>
          <h3 style={s.title}>Withdraw Funds</h3>
          <p style={s.subtitle}>Fast Payout directly to your Bank Account / UPI</p>
        </div>

        {isDemo && (
          <div style={s.demoNotice}>
            Withdrawals are disabled on Demo Accounts. Sign in with player account for real payouts.
          </div>
        )}

        {/* Balance Strip */}
        <div style={s.balStrip}>
          <span style={s.balLabel}>Available for Withdrawal:</span>
          <span style={s.balVal}>₹{availableBal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>

        {status.message && (
          <div
            style={{
              ...s.statusBox,
              background: status.type === "error" ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
              color: status.type === "error" ? "#fca5a5" : "#6ee7b7",
            }}
          >
            {status.type === "error" ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
            <span>{status.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.typeSwitch}>
            <button
              type="button"
              style={{
                ...s.typeBtn,
                background: withdrawType === "bank" ? "#2563eb" : "#131b2e",
                color: withdrawType === "bank" ? "#fff" : "#94a3b8",
              }}
              onClick={() => setWithdrawType("bank")}
            >
              <Building2 size={14} />
              Bank Account
            </button>
            <button
              type="button"
              style={{
                ...s.typeBtn,
                background: withdrawType === "upi" ? "#2563eb" : "#131b2e",
                color: withdrawType === "upi" ? "#fff" : "#94a3b8",
              }}
              onClick={() => setWithdrawType("upi")}
            >
              UPI Payout
            </button>
          </div>

          <div style={s.field}>
            <label style={s.label}>Withdrawal Amount (₹)</label>
            <input
              type="number"
              placeholder="e.g. 5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={s.input}
              required
            />
          </div>

          {withdrawType === "bank" ? (
            <>
              <div style={s.field}>
                <label style={s.label}>Account Holder Name</label>
                <input
                  type="text"
                  placeholder="Full name as in passbook"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  style={s.input}
                  required
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Bank Name</label>
                <input
                  type="text"
                  placeholder="e.g. State Bank of India / HDFC"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  style={s.input}
                  required
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Account Number</label>
                <input
                  type="text"
                  placeholder="Enter Bank Account Number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  style={s.input}
                  required
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>IFSC Code</label>
                <input
                  type="text"
                  placeholder="e.g. SBIN0001234"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value)}
                  style={s.input}
                  required
                />
              </div>
            </>
          ) : (
            <div style={s.field}>
              <label style={s.label}>UPI ID (VPA)</label>
              <input
                type="text"
                placeholder="yourname@okhdfcbank"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                style={s.input}
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading || isDemo}
            style={{
              ...s.submitBtn,
              opacity: loading || isDemo ? 0.6 : 1,
            }}
          >
            {loading ? "Processing..." : "Confirm & Withdraw"}
          </button>
        </form>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(5, 8, 15, 0.8)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: 16,
  },
  modal: {
    background: "#0f1628",
    border: "1px solid #1e2c4a",
    borderRadius: 16,
    width: "100%",
    maxWidth: 420,
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    padding: "24px 20px",
    position: "relative",
    boxShadow: "0 25px 60px rgba(0,0,0,0.8)",
    fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    background: "transparent",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    padding: 6,
  },
  header: {
    textAlign: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: "#f8fafc",
    margin: 0,
  },
  subtitle: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 3,
  },
  demoNotice: {
    background: "rgba(217, 119, 6, 0.12)",
    border: "1px solid rgba(217, 119, 6, 0.3)",
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 11,
    color: "#fbbf24",
    marginBottom: 12,
  },
  balStrip: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#090d18",
    border: "1px solid #1e2c4a",
    borderRadius: 8,
    padding: "10px 14px",
    marginBottom: 14,
  },
  balLabel: {
    fontSize: 11,
    color: "#94a3b8",
  },
  balVal: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 14,
    fontWeight: 700,
    color: "#10b981",
  },
  statusBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 8,
    fontSize: 12,
    marginBottom: 12,
  },
  form: {
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  typeSwitch: {
    display: "flex",
    gap: 6,
    background: "#080c16",
    border: "1px solid #1a253e",
    borderRadius: 8,
    padding: 3,
  },
  typeBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "8px",
    borderRadius: 6,
    border: "none",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },
  label: {
    fontSize: 11,
    color: "#94a3b8",
    fontFamily: "'IBM Plex Mono', monospace",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  input: {
    background: "#080c16",
    border: "1px solid #1e2c4a",
    borderRadius: 8,
    padding: "10px 12px",
    color: "#f8fafc",
    fontSize: 13,
    outline: "none",
  },
  submitBtn: {
    height: 44,
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "#ffffff",
    border: "none",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 6,
  },
};

