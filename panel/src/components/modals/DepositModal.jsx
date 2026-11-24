import React, { useState, useEffect } from "react";
import { X, QrCode, Upload, CheckCircle2, AlertCircle, Copy, Check } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getScanners, uploadDeposit, getAdminBankDetails } from "../../services/walletService";

export default function DepositModal({ isOpen = true, onClose }) {
  const { refreshWallet, isDemo } = useAuth();
  const [scanners, setScanners] = useState([]);
  const [bankDetails, setBankDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [price, setPrice] = useState("1000");
  const [transactionId, setTransactionId] = useState("");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  useEffect(() => {
    if (!isOpen) return;
    setStatus({ type: "", message: "" });
    setTransactionId("");
    setFile(null);

    const loadData = async () => {
      setLoading(true);
      try {
        const [scanRes, bankRes] = await Promise.all([
          getScanners().catch(() => ({})),
          getAdminBankDetails().catch(() => ({})),
        ]);
        if (scanRes?.scanners) {
          setScanners(scanRes.scanners);
        }
        if (bankRes?.bankDetails) {
          setBankDetails(bankRes.bankDetails);
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isOpen]);

  if (!isOpen) return null;

  const activeScanner = scanners.find((s) => s.isActive) || scanners[0];

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });

    if (!price || Number(price) <= 0) {
      setStatus({ type: "error", message: "Enter a valid deposit amount" });
      return;
    }
    if (!transactionId.trim()) {
      setStatus({ type: "error", message: "Please enter UTR / Transaction ID" });
      return;
    }

    setSubmitting(true);
    try {
      await uploadDeposit({
        price,
        transactionId: transactionId.trim(),
        file,
        method: "upi",
      });
      setStatus({
        type: "success",
        message: "Deposit submitted! Admin will verify and credit your chips shortly.",
      });
      refreshWallet();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setStatus({
        type: "error",
        message: err.message || "Failed to submit deposit request",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const presetAmounts = [500, 1000, 2500, 5000, 10000, 25000];

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <button style={s.closeBtn} onClick={onClose}>
          <X size={18} />
        </button>

        <div style={s.header}>
          <h3 style={s.title}>Deposit Chips</h3>
          <p style={s.subtitle}>Instant UPI & Bank Transfer Deposit</p>
        </div>

        {isDemo && (
          <div style={s.demoNotice}>
            Demo accounts have unlimited ₹10,000 practice credits. Real deposits are disabled for demo mode.
          </div>
        )}

        {status.message && (
          <div
            style={{
              ...s.statusBox,
              background: status.type === "error" ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
              color: status.type === "error" ? "#fca5a5" : "#6ee7b7",
              borderColor: status.type === "error" ? "rgba(239, 68, 68, 0.3)" : "rgba(16, 185, 129, 0.3)",
            }}
          >
            {status.type === "error" ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
            <span>{status.message}</span>
          </div>
        )}

        <div style={s.bodyScroll}>
          {/* QR Code & Scanner Box */}
          <div style={s.qrBox}>
            {activeScanner ? (
              <div style={s.scannerContent}>
                <img
                  src={activeScanner.scannerImage}
                  alt="Payment QR"
                  style={s.qrImg}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
                <div style={s.upiRow}>
                  <span style={s.upiText}>{activeScanner.upiId || "UPI ID not configured"}</span>
                  <button
                    type="button"
                    style={s.copyBtn}
                    onClick={() => handleCopy(activeScanner.upiId)}
                  >
                    {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                    <span>{copied ? "Copied" : "Copy UPI"}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div style={s.noQrBox}>
                <QrCode size={40} color="#64748b" />
                <span style={s.noQrText}>Scan via UPI or Pay via Bank Details below</span>
              </div>
            )}
          </div>

          {/* Bank Details */}
          {bankDetails && bankDetails.accountNumber && (
            <div style={s.bankBox}>
              <div style={s.bankTitle}>Assigned Deposit Account</div>
              <div style={s.bankRow}>
                <span>A/C Holder:</span>
                <strong>{bankDetails.accountHolderName}</strong>
              </div>
              <div style={s.bankRow}>
                <span>Bank:</span>
                <strong>{bankDetails.bankName}</strong>
              </div>
              <div style={s.bankRow}>
                <span>A/C Number:</span>
                <strong style={s.mono}>{bankDetails.accountNumber}</strong>
              </div>
              <div style={s.bankRow}>
                <span>IFSC Code:</span>
                <strong style={s.mono}>{bankDetails.ifscCode}</strong>
              </div>
            </div>
          )}

          {/* Amount Presets */}
          <div style={s.amountSection}>
            <label style={s.label}>Amount (₹)</label>
            <div style={s.presetGrid}>
              {presetAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  style={{
                    ...s.presetBtn,
                    background: price === String(amt) ? "#2563eb" : "#131b2e",
                    color: price === String(amt) ? "#ffffff" : "#cbd5e1",
                  }}
                  onClick={() => setPrice(String(amt))}
                >
                  ₹{amt.toLocaleString("en-IN")}
                </button>
              ))}
            </div>
            <input
              type="number"
              placeholder="Custom Amount"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              style={s.amountInput}
            />
          </div>

          {/* UTR Form */}
          <form onSubmit={handleSubmit} style={s.utrForm}>
            <div style={s.field}>
              <label style={s.label}>UTR / Transaction Reference ID</label>
              <input
                type="text"
                placeholder="12-digit UTR from GPay / PhonePe / Paytm"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                style={s.textInput}
                required
              />
            </div>

            <div style={s.field}>
              <label style={s.label}>Upload Payment Screenshot (Optional)</label>
              <label style={s.fileLabel}>
                <Upload size={16} color="#64748b" />
                <span>{file ? file.name : "Select Screenshot file"}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files[0])}
                  style={{ display: "none" }}
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting || isDemo}
              style={{
                ...s.submitBtn,
                opacity: submitting || isDemo ? 0.6 : 1,
              }}
            >
              {submitting ? "Submitting Deposit..." : "Submit Deposit Request"}
            </button>
          </form>
        </div>
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
    maxWidth: 440,
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
  statusBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid",
    fontSize: 12,
    marginBottom: 12,
  },
  bodyScroll: {
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 14,
    paddingRight: 4,
  },
  qrBox: {
    background: "#090d18",
    border: "1px solid #1e2c4a",
    borderRadius: 12,
    padding: 14,
    textAlign: "center",
  },
  scannerContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
  },
  qrImg: {
    width: 160,
    height: 160,
    objectFit: "contain",
    borderRadius: 8,
    background: "#ffffff",
    padding: 6,
  },
  upiRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#131b2e",
    border: "1px solid #223254",
    padding: "6px 12px",
    borderRadius: 8,
  },
  upiText: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 11,
    color: "#e2e8f0",
  },
  copyBtn: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "3px 8px",
    fontSize: 10,
    fontWeight: 600,
    cursor: "pointer",
  },
  noQrBox: {
    padding: "24px 0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  },
  noQrText: {
    fontSize: 11,
    color: "#94a3b8",
  },
  bankBox: {
    background: "#0a0f1d",
    border: "1px solid #1a253e",
    borderRadius: 10,
    padding: "10px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontSize: 11.5,
  },
  bankTitle: {
    fontSize: 10,
    fontFamily: "'IBM Plex Mono', monospace",
    color: "#93c5fd",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: 2,
    fontWeight: 600,
  },
  bankRow: {
    display: "flex",
    justifyContent: "space-between",
    color: "#94a3b8",
  },
  mono: {
    fontFamily: "'IBM Plex Mono', monospace",
    color: "#f8fafc",
  },
  amountSection: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    fontSize: 11,
    color: "#94a3b8",
    fontFamily: "'IBM Plex Mono', monospace",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    fontWeight: 600,
  },
  presetGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 6,
  },
  presetBtn: {
    padding: "8px",
    borderRadius: 8,
    border: "1px solid #1e2c4a",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'IBM Plex Mono', monospace",
  },
  amountInput: {
    background: "#080c16",
    border: "1px solid #1e2c4a",
    borderRadius: 8,
    padding: "10px 12px",
    color: "#f8fafc",
    fontSize: 14,
    fontFamily: "'IBM Plex Mono', monospace",
    marginTop: 4,
    outline: "none",
  },
  utrForm: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },
  textInput: {
    background: "#080c16",
    border: "1px solid #1e2c4a",
    borderRadius: 8,
    padding: "10px 12px",
    color: "#f8fafc",
    fontSize: 13,
    fontFamily: "'IBM Plex Mono', monospace",
    outline: "none",
  },
  fileLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#080c16",
    border: "1px dashed #1e2c4a",
    borderRadius: 8,
    padding: "10px 12px",
    cursor: "pointer",
    fontSize: 12,
    color: "#94a3b8",
  },
  submitBtn: {
    height: 44,
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#ffffff",
    border: "none",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 4,
  },
};

