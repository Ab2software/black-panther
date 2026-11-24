// pages/wallet/Withdraw.jsx
import React, { useState } from "react";
import { withdrawMoney, withdrawWithQr } from "../../services/walletService";
import { toast } from "../../utils/toast";

const WithdrawPage = () => {
  const [withdrawMethod, setWithdrawMethod] = useState("upi");
  const [amount, setAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
  });
  const [qrImage, setQrImage] = useState(null);
  const [qrPreview, setQrPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleBankChange = (field, value) => {
    setBankDetails((prev) => ({ ...prev, [field]: value }));
  };

  const handleQrChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setQrImage(file);
    setQrPreview(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setAmount("");
    setUpiId("");
    setBankDetails({ accountHolderName: "", accountNumber: "", ifscCode: "", bankName: "" });
    setQrImage(null);
    setQrPreview(null);
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();

    if (!amount) return toast.error("Amount is required");
    if (Number(amount) < 300) {
      return toast.error("Minimum withdrawal amount is ₹300");
    }

    if (withdrawMethod === "upi" && !upiId) {
      return toast.error("UPI ID is required");
    }

    if (withdrawMethod === "bank") {
      const { accountHolderName, accountNumber, ifscCode, bankName } = bankDetails;
      if (!accountHolderName || !accountNumber || !ifscCode || !bankName) {
        return toast.error("All bank details are required");
      }
    }

    if (withdrawMethod === "qr" && !qrImage) {
      return toast.error("Please upload your QR code");
    }

    try {
      setLoading(true);

      let res;
      if (withdrawMethod === "qr") {
        const formData = new FormData();
        formData.append("amount", Number(amount));
        formData.append("qrImage", qrImage);
        res = await withdrawWithQr(formData);
      } else {
        const payload =
          withdrawMethod === "upi"
            ? { amount: Number(amount), withdrawMethod, upiId }
            : { amount: Number(amount), withdrawMethod, bankDetails };
        res = await withdrawMoney(payload);
      }

      toast.success(res.message || "Withdraw request sent");
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Withdraw failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.heading}>
        <h1 style={styles.h1}>Withdraw Funds</h1>
        <p style={styles.subtitle}>
          Enter your amount (minimum ₹300) and payment details to request a withdrawal
        </p>
      </div>

      <div style={styles.card}>
        <div style={styles.toggleWrap}>
          <button
            type="button"
            onClick={() => setWithdrawMethod("upi")}
            style={{
              ...styles.toggleBtn,
              ...(withdrawMethod === "upi" ? styles.toggleBtnActive : {}),
            }}
          >
            UPI
          </button>
          <button
            type="button"
            onClick={() => setWithdrawMethod("bank")}
            style={{
              ...styles.toggleBtn,
              ...(withdrawMethod === "bank" ? styles.toggleBtnActive : {}),
            }}
          >
            Bank Transfer
          </button>
          <button
            type="button"
            onClick={() => setWithdrawMethod("qr")}
            style={{
              ...styles.toggleBtn,
              ...(withdrawMethod === "qr" ? styles.toggleBtnActive : {}),
            }}
          >
            QR Code
          </button>
        </div>

        <form onSubmit={handleWithdraw}>
          <div style={styles.field}>
            <label style={styles.label}>Amount</label>
            <input
              type="number"
              min="300"
              placeholder="Minimum ₹300"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={styles.input}
            />
          </div>

          {withdrawMethod === "upi" && (
            <div style={styles.field}>
              <label style={styles.label}>UPI ID</label>
              <input
                type="text"
                placeholder="example@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                style={styles.input}
              />
            </div>
          )}

          {withdrawMethod === "bank" && (
            <>
              <div style={styles.field}>
                <label style={styles.label}>Account Holder Name</label>
                <input
                  type="text"
                  placeholder="As per bank records"
                  value={bankDetails.accountHolderName}
                  onChange={(e) => handleBankChange("accountHolderName", e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Account Number</label>
                <input
                  type="text"
                  placeholder="Enter account number"
                  value={bankDetails.accountNumber}
                  onChange={(e) => handleBankChange("accountNumber", e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>IFSC Code</label>
                <input
                  type="text"
                  placeholder="e.g. SBIN0001234"
                  value={bankDetails.ifscCode}
                  onChange={(e) => handleBankChange("ifscCode", e.target.value.toUpperCase())}
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Bank Name</label>
                <input
                  type="text"
                  placeholder="e.g. State Bank of India"
                  value={bankDetails.bankName}
                  onChange={(e) => handleBankChange("bankName", e.target.value)}
                  style={styles.input}
                />
              </div>
            </>
          )}

          {withdrawMethod === "qr" && (
            <div style={styles.field}>
              <label style={styles.label}>Upload your QR code</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleQrChange}
                style={styles.input}
              />
              {qrPreview && (
                <img
                  src={qrPreview}
                  alt="QR preview"
                  style={styles.qrPreview}
                />
              )}
            </div>
          )}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Processing…" : "Request withdrawal"}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  page: {
    width: "100%",
    minHeight: "100vh",
    padding: "2rem 1rem",
    background: "#f7f7f5",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  heading: {
    textAlign: "center",
    marginBottom: "1.75rem",
  },
  h1: {
    fontSize: "22px",
    fontWeight: 500,
    color: "#1a1a18",
    margin: "0 0 4px",
    letterSpacing: "-0.3px",
  },
  subtitle: {
    fontSize: "13px",
    color: "#888780",
    margin: 0,
  },
  card: {
    background: "#fff",
    border: "0.5px solid rgba(0,0,0,0.12)",
    borderRadius: "12px",
    padding: "1.5rem",
    width: "100%",
    maxWidth: "440px",
  },
  toggleWrap: {
    display: "flex",
    gap: "8px",
    marginBottom: "16px",
    background: "#f2f1ee",
    padding: "4px",
    borderRadius: "9px",
  },
  toggleBtn: {
    flex: 1,
    padding: "8px",
    fontSize: "13px",
    fontWeight: 500,
    color: "#5f5e5a",
    background: "transparent",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  toggleBtnActive: {
    background: "#fff",
    color: "#1a1a18",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    marginBottom: "12px",
  },
  label: {
    fontSize: "12px",
    fontWeight: 500,
    color: "#5f5e5a",
  },
  input: {
    padding: "9px 12px",
    fontSize: "14px",
    borderRadius: "8px",
    border: "0.5px solid rgba(0,0,0,0.2)",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    background: "#fff",
    color: "#1a1a18",
  },
  qrPreview: {
    width: 120,
    height: 120,
    objectFit: "contain",
    marginTop: 8,
    border: "0.5px solid rgba(0,0,0,0.2)",
    borderRadius: 8,
    background: "#fafaf8",
  },
  button: {
    width: "100%",
    padding: "10px",
    marginTop: "4px",
    background: "#fff",
    border: "0.5px solid rgba(0,0,0,0.2)",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 500,
    color: "#1a1a18",
    cursor: "pointer",
  },
};

export default WithdrawPage;