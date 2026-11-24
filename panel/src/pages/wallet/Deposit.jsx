import React, { useEffect, useState } from "react";
import { getScanners, uploadPayment, getAssignedAdminBankDetails } from "../../services/walletService";
import { toast } from "../../utils/toast";
import { useNavigate } from "react-router-dom";

const DepositPage = () => {
  const [method, setMethod] = useState("upi"); // "upi" | "bank"

  const [scanner, setScanner]   = useState(null);
  const [bankDetails, setBankDetails] = useState(null);

  const [amount, setAmount]     = useState("");
  const [txnId, setTxnId]       = useState("");
  const [file, setFile]         = useState(null);
  const [preview, setPreview]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(true);
  const navigate = useNavigate();

  const fetchPaymentInfo = async () => {
    try {
      setFetching(true);

      const [scannerRes, bankRes] = await Promise.allSettled([
        getScanners(),
        getAssignedAdminBankDetails(),
      ]);

      if (scannerRes.status === "fulfilled" && scannerRes.value?.scanner) {
        setScanner(scannerRes.value.scanner);
      } else {
        setScanner(null);
      }

      if (bankRes.status === "fulfilled" && bankRes.value?.bankDetails?.accountNumber) {
        setBankDetails(bankRes.value.bankDetails);
      } else {
        setBankDetails(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchPaymentInfo();
  }, []);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
  };

  const handleSubmit = async () => {
    if (!amount || !txnId || !file) {
      return toast.error("All fields are required");
    }
    try {
      setLoading(true);
      await uploadPayment({ price: amount, transactionId: txnId, file, method });
      toast.success("Payment submitted successfully (Pending approval)");
      setAmount("");
      setTxnId("");
      setFile(null);
      setPreview(null);
      navigate("/");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };
// console.log("scanner", scanner);
  const qrSrc = scanner?.scannerImageUrl || null;
  const isReady = method === "upi" ? !!scanner : !!bankDetails;

  return (
    <div style={styles.page}>
      <div style={styles.heading}>
        <h1 style={styles.h1}>Deposit Funds</h1>
        <p style={styles.subtitle}>
          Choose a payment method and submit your details below
        </p>
      </div>

      <div style={styles.card}>

        <div style={styles.tabRow}>
          <button
            onClick={() => setMethod("upi")}
            style={{
              ...styles.tabBtn,
              ...(method === "upi" ? styles.tabBtnActive : {}),
            }}
          >
            UPI
          </button>
          <button
            onClick={() => setMethod("bank")}
            style={{
              ...styles.tabBtn,
              ...(method === "bank" ? styles.tabBtnActive : {}),
            }}
          >
            Bank Transfer
          </button>
        </div>

        {method === "upi" && (
          <div style={styles.qrSection}>
            <div style={styles.qrFrame}>
              {fetching ? (
                <span style={styles.qrEmpty}>Loading…</span>
              ) : qrSrc ? (
                <img
  src={qrSrc}
  alt="Payment QR"
  style={styles.qrImg}
  onLoad={() => console.log("Loaded")}
  onError={(e) => {
    console.log("Image failed");
    // console.log(e.target.src);
  }}
/>
              ) : (
                <div style={styles.qrEmptyBox}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                    stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="3" height="3" rx="0.5" />
                    <rect x="18" y="14" width="3" height="3" rx="0.5" />
                    <rect x="14" y="18" width="3" height="3" rx="0.5" />
                    <rect x="18" y="18" width="3" height="3" rx="0.5" />
                  </svg>
                  <span style={styles.qrEmpty}>No QR available</span>
                </div>
              )}
            </div>

            {scanner?.upiId && (
              <div style={styles.upiRow}>
                <span style={styles.upiLabel}>UPI</span>
                <span style={styles.upiVal}>{scanner.upiId}</span>
                <button
                  style={styles.copyBtn}
                  onClick={() => {
                    navigator.clipboard.writeText(scanner.upiId);
                    toast.success("UPI ID copied");
                  }}
                >
                  Copy
                </button>
              </div>
            )}
            <span style={styles.qrLabel}>Scan &amp; pay, then fill details below</span>
          </div>
        )}

        {method === "bank" && (
          <div style={styles.bankSection}>
            {fetching ? (
              <span style={styles.qrEmpty}>Loading…</span>
            ) : bankDetails ? (
              <div style={styles.bankCard}>
                {[
                  { label: "Account Holder", value: bankDetails.accountHolderName },
                  { label: "Account Number", value: bankDetails.accountNumber },
                  { label: "IFSC Code", value: bankDetails.ifscCode },
                  { label: "Bank Name", value: bankDetails.bankName },
                ].map((row) => (
                  <div key={row.label} style={styles.bankRow}>
                    <span style={styles.bankLabel}>{row.label}</span>
                    <span style={styles.bankVal}>{row.value || "—"}</span>
                    <button
                      style={styles.copyBtn}
                      onClick={() => {
                        navigator.clipboard.writeText(row.value || "");
                        toast.success(`${row.label} copied`);
                      }}
                    >
                      Copy
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.qrEmptyBox}>
                <span style={styles.qrEmpty}>No bank details available</span>
              </div>
            )}
            <span style={styles.qrLabel}>Transfer funds, then fill details below</span>
          </div>
        )}

        <div style={styles.field}>
          <label style={styles.label}>Amount (₹)</label>
          <input
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={styles.input}
            onFocus={(e) => (e.target.style.borderColor = "rgba(0,0,0,0.4)")}
            onBlur={(e)  => (e.target.style.borderColor = "rgba(0,0,0,0.2)")}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Transaction ID</label>
          <input
            type="text"
            placeholder={method === "bank" ? "Enter reference / UTR number" : "Enter UTR / transaction ID"}
            value={txnId}
            onChange={(e) => setTxnId(e.target.value)}
            style={styles.input}
            onFocus={(e) => (e.target.style.borderColor = "rgba(0,0,0,0.4)")}
            onBlur={(e)  => (e.target.style.borderColor = "rgba(0,0,0,0.2)")}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Payment screenshot</label>

          {preview && (
            <div style={styles.previewWrap}>
              <img src={preview} alt="Screenshot preview" style={styles.previewImg} />
              <button style={styles.removeBtn} onClick={clearFile}>✕ Remove</button>
            </div>
          )}

          {!preview && (
            <label style={styles.fileLabel}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M2 12l3-4 2.5 3 3-4 3.5 5H2z"
                  fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                <circle cx="11" cy="4" r="1.5" stroke="currentColor" strokeWidth="1.2" />
                <rect x="1" y="1" width="14" height="14" rx="2"
                  stroke="currentColor" strokeWidth="1.2" />
              </svg>
              <span>{file ? file.name : "Choose screenshot…"}</span>
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            </label>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !isReady}
          style={{
            ...styles.button,
            opacity: loading || !isReady ? 0.5 : 1,
            cursor: loading || !isReady ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Processing…" : "Submit deposit"}
        </button>

        {!isReady && !fetching && (
          <p style={styles.noScanner}>
            {method === "upi"
              ? "No payment scanner assigned. Please contact support."
              : "No bank details available. Please contact support."}
          </p>
        )}
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
  heading: { textAlign: "center", marginBottom: "1.75rem" },
  h1: { fontSize: "22px", fontWeight: 500, color: "#1a1a18", margin: "0 0 4px", letterSpacing: "-0.3px" },
  subtitle: { fontSize: "13px", color: "#888780", margin: 0 },
  card: {
    background: "#fff",
    border: "0.5px solid rgba(0,0,0,0.12)",
    borderRadius: "12px",
    padding: "1.5rem",
    width: "100%",
    maxWidth: "440px",
  },
  tabRow: {
    display: "flex",
    gap: 6,
    marginBottom: "1.25rem",
    background: "#f0efe9",
    borderRadius: 8,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    padding: "8px 0",
    fontSize: 13,
    fontWeight: 500,
    color: "#888780",
    background: "transparent",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    transition: "background 0.15s, color 0.15s",
  },
  tabBtnActive: {
    background: "#1a1a18",
    color: "#fff",
  },
  qrSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    paddingBottom: "1.25rem",
    marginBottom: "1.25rem",
    borderBottom: "0.5px solid rgba(0,0,0,0.1)",
    gap: 8,
  },
  qrFrame: {
    width: "180px",
    height: "180px",
    borderRadius: "10px",
    border: "0.5px solid rgba(0,0,0,0.1)",
    background: "#f7f7f5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  qrImg: { width: "100%", height: "100%", objectFit: "contain" },
  qrEmptyBox: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6 },
  qrEmpty: { fontSize: "13px", color: "#aaa" },
  qrLabel: { fontSize: "12px", color: "#aaa" },
  upiRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "#f7f7f5",
    border: "0.5px solid rgba(0,0,0,0.1)",
    borderRadius: 8,
    padding: "6px 12px",
    marginTop: 2,
  },
  upiLabel: { fontSize: 11, color: "#aaa", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" },
  upiVal: { fontSize: 13, color: "#1a1a18", fontFamily: "monospace", flex: 1 },
  copyBtn: {
    fontSize: 11,
    padding: "3px 8px",
    border: "0.5px solid rgba(0,0,0,0.15)",
    borderRadius: 5,
    background: "#fff",
    color: "#5f5e5a",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  bankSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    paddingBottom: "1.25rem",
    marginBottom: "1.25rem",
    borderBottom: "0.5px solid rgba(0,0,0,0.1)",
    gap: 8,
  },
  bankCard: {
    width: "100%",
    background: "#f7f7f5",
    border: "0.5px solid rgba(0,0,0,0.1)",
    borderRadius: 10,
    padding: "10px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  bankRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  bankLabel: {
    fontSize: 10,
    color: "#aaa",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    width: 110,
    flexShrink: 0,
  },
  bankVal: {
    fontSize: 13,
    color: "#1a1a18",
    fontFamily: "monospace",
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  field: { display: "flex", flexDirection: "column", gap: "5px", marginBottom: "12px" },
  label: { fontSize: "12px", fontWeight: 500, color: "#5f5e5a" },
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
    transition: "border-color 0.15s",
  },
  fileLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "9px 12px",
    border: "0.5px solid rgba(0,0,0,0.15)",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    color: "#5f5e5a",
    background: "#f7f7f5",
  },
  previewWrap: { position: "relative", borderRadius: 8, overflow: "hidden", border: "0.5px solid rgba(0,0,0,0.1)" },
  previewImg: { width: "100%", maxHeight: 160, objectFit: "cover", display: "block" },
  removeBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    fontSize: 11,
    padding: "3px 8px",
    background: "rgba(0,0,0,0.55)",
    color: "#fff",
    border: "none",
    borderRadius: 5,
    cursor: "pointer",
  },
  button: {
    width: "100%",
    padding: "10px",
    marginTop: "4px",
    background: "#1a1a18",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 500,
    color: "#fff",
    transition: "opacity 0.15s",
  },
  noScanner: { marginTop: 10, fontSize: 12, color: "#c0392b", textAlign: "center" },
};

export default DepositPage;