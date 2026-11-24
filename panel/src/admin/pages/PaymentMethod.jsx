import React, { useEffect, useRef, useState } from "react";
import {
  addScanner,
  getAllScanners,
  setActiveScanner,
  deleteScanner,
} from "../services/adminAuthService";
import {
  getMyBankDetails,
  updateMyBankDetails,
} from "../services/adminBankService";

// ─── Payment Method Page ─────────────────────────────────────────────────────
// Combines the Payment Scanner (QR) management and Bank Details management,
// previously embedded in the Dashboard page.

const PaymentMethod = () => {
  const [loading, setLoading] = useState(true);

  // scanner — a list, since an admin can hold multiple QR codes
  const [scanners, setScanners] = useState([]);
  const [scannerFile, setScannerFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [upiId, setUpiId] = useState("");
  const [scannerLabel, setScannerLabel] = useState("");
  const [addingScanner, setAddingScanner] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [activatingId, setActivatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // bank details
  const [bankDetails, setBankDetails] = useState(null);
  const [bankForm, setBankForm] = useState({
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
  });
  const [savingBank, setSavingBank] = useState(false);
  const [bankDirty, setBankDirty] = useState(false);

  const fileInputRef = useRef(null);
  const admin = JSON.parse(localStorage.getItem("admin") || "{}");

  // Payment Scanner section is only relevant to plain "admin" accounts —
  // superadmin / owner manage scanners elsewhere (per-admin assignment),
  // so we hide this section for those roles.
  const isAdminRole = admin?.role === "admin";

  const canManageBank = ["owner", "admin", "superadmin"].includes(admin?.role);

  // ─── Fetch scanners (reusable — called after add/activate/delete) ─────────
  const fetchScanners = async () => {
    try {
      const res = await getAllScanners();
      if (res.success) setScanners(res.scanners || []);
    } catch (e) {
      console.log(e);
    }
  };

  // ─── Fetch ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isAdminRole) {
          await fetchScanners();
        }

        if (canManageBank) {
          const bankRes = await getMyBankDetails();
          if (bankRes.success && bankRes.bankDetails) {
            setBankDetails(bankRes.bankDetails);
            setBankForm({
              accountHolderName: bankRes.bankDetails.accountHolderName || "",
              accountNumber: bankRes.bankDetails.accountNumber || "",
              ifscCode: bankRes.bankDetails.ifscCode || "",
              bankName: bankRes.bankDetails.bankName || "",
            });
            setBankDirty(false);
          }
        }
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── File helpers ─────────────────────────────────────────────────────────

  const applyFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setScannerFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleFileChange = (e) => applyFile(e.target.files[0]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    applyFile(e.dataTransfer.files[0]);
  };

  const handleResetForm = () => {
    setScannerFile(null);
    setPreviewUrl(null);
    setUpiId("");
    setScannerLabel("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── Add scanner (every submit creates a NEW scanner, not an update) ──────

  const handleAddScanner = async () => {
    if (!upiId.trim()) return alert("UPI ID is required");
    if (!scannerFile) return alert("Please select a scanner image");

    setAddingScanner(true);
    try {
      const formData = new FormData();
      formData.append("upiId", upiId);
      formData.append("label", scannerLabel);
      formData.append("scannerImage", scannerFile);

      const res = await addScanner(formData);
      if (res.success) {
        handleResetForm();
        await fetchScanners();
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Upload failed");
    } finally {
      setAddingScanner(false);
    }
  };

  // ─── Activate / Delete ──────────────────────────────────────────────────

  const handleActivateScanner = async (scannerId) => {
    setActivatingId(scannerId);
    // optimistic update so the badge flips instantly
    setScanners((prev) =>
      prev.map((s) => ({ ...s, isActive: s._id === scannerId })),
    );
    try {
      const res = await setActiveScanner(scannerId);
      if (!res.success) await fetchScanners(); // roll back to server truth on failure
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to activate scanner");
      await fetchScanners();
    } finally {
      setActivatingId(null);
    }
  };

  const handleDeleteScanner = async (scannerId) => {
    if (!window.confirm("Delete this QR scanner? This can't be undone."))
      return;
    setDeletingId(scannerId);
    try {
      const res = await deleteScanner(scannerId);
      if (res.success) await fetchScanners();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete scanner");
    } finally {
      setDeletingId(null);
    }
  };

  const handleBankFieldChange = (field, value) => {
    setBankForm((prev) => {
      const next = { ...prev, [field]: value };
      const dirty = Object.keys(next).some(
        (k) => next[k] !== (bankDetails?.[k] || ""),
      );
      setBankDirty(dirty);
      return next;
    });
  };

  const handleResetBank = () => {
    setBankForm({
      accountHolderName: bankDetails?.accountHolderName || "",
      accountNumber: bankDetails?.accountNumber || "",
      ifscCode: bankDetails?.ifscCode || "",
      bankName: bankDetails?.bankName || "",
    });
    setBankDirty(false);
  };

  const handleSaveBank = async () => {
    const { accountHolderName, accountNumber, ifscCode, bankName } = bankForm;
    if (
      !accountHolderName.trim() ||
      !accountNumber.trim() ||
      !ifscCode.trim() ||
      !bankName.trim()
    ) {
      return alert("All bank fields are required");
    }
    if (!bankDirty) return alert("No changes to save");

    setSavingBank(true);
    try {
      const res = await updateMyBankDetails(bankForm);
      if (res.success) {
        alert(res.message);
        setBankDetails(res.bankDetails);
        setBankDirty(false);
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Update failed");
    } finally {
      setSavingBank(false);
    }
  };

  // ─── Derived ─────────────────────────────────────────────────────────────

  const imageSrc = previewUrl || null;
  const activeScanner = scanners.find((s) => s.isActive) || null;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--admin-page-bg)",
        padding: "24px 28px",
        fontFamily: "'IBM Plex Sans', sans-serif",
        color: "var(--admin-body-text)",
      }}
    >
      {/* ── Header ── */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            color: "var(--admin-muted-text)",
            letterSpacing: "0.06em",
            marginBottom: 6,
            textTransform: "uppercase",
          }}
        >
          admin / payment-method
        </div>
        <h1
          style={{ fontSize: 26, fontWeight: 700, color: "var(--admin-heading)", margin: 0, letterSpacing: "-0.02em" }}
        >
          Payment Method
        </h1>
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            color: "var(--admin-muted-text)",
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        >
          Manage the scanner and bank details shown to your users.
        </div>
      </div>

      {loading ? (
        <div
          style={{
            padding: 24,
            textAlign: "center",
            fontSize: 12,
            color: "#8a8880",
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        >
          Loading...
        </div>
      ) : (
        <>
          {/* ══════════════════════════════════════════
              PAYMENT SCANNER SECTION — ADMIN ONLY
              (hidden for superadmin / owner)
              Supports MULTIPLE QR codes with one active at a time.
          ══════════════════════════════════════════ */}
          {isAdminRole && (
            <div
              style={{
                background: "var(--admin-card-bg)",
                border: "1px solid var(--admin-border)",
                borderRadius: 12,
                overflow: "hidden",
                boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
              }}
            >
              {/* Section header bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 20px",
                  borderBottom: "1px solid #f0eee8",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#8a8880"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="3" height="3" rx="0.5" />
                    <rect x="18" y="14" width="3" height="3" rx="0.5" />
                    <rect x="14" y="18" width="3" height="3" rx="0.5" />
                    <rect x="18" y="18" width="3" height="3" rx="0.5" />
                  </svg>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "#111110" }}>
                    Payment Scanner
                  </span>
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 10,
                      color: "#b0aea6",
                    }}
                  >
                    {scanners.length ? `· ${scanners.length} uploaded` : ""}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {/* Active / no scanner badge */}
                  <span
                    style={{
                      fontSize: 10,
                      fontFamily: "'IBM Plex Mono', monospace",
                      padding: "3px 9px",
                      borderRadius: 20,
                      background: activeScanner ? "#eaf3de" : "#f5f4f0",
                      color: activeScanner ? "#3b6d11" : "#8a8880",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: "currentColor",
                        display: "inline-block",
                      }}
                    />
                    {activeScanner ? "Active scanner set" : "No active scanner"}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: 20 }}>
                <div
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 10,
                    color: "#8a8880",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 12,
                  }}
                >
                  Add New Scanner
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "200px 1fr",
                    gap: 28,
                    alignItems: "start",
                  }}
                >
                  {/* ── Left: QR upload zone ── */}
                  <div>
                    {/* Zone */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      style={{
                        width: 200,
                        height: 200,
                        border: isDragging
                          ? "2px dashed #111110"
                          : imageSrc
                            ? "1px solid #e8e6de"
                            : "1.5px dashed #ccc",
                        borderRadius: 10,
                        background: isDragging ? "#eeecea" : "#fafaf8",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        position: "relative",
                        overflow: "hidden",
                        transition: "border-color 0.2s, background 0.2s",
                      }}
                    >
                      {/* QR preview */}
                      {imageSrc && (
                        <img
                          src={imageSrc}
                          alt="QR Code"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      )}

                      {/* Empty placeholder */}
                      {!imageSrc && (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 8,
                            pointerEvents: "none",
                          }}
                        >
                          <svg
                            width="30"
                            height="30"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#c8c6be"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect x="3" y="3" width="7" height="7" rx="1" />
                            <rect x="14" y="3" width="7" height="7" rx="1" />
                            <rect x="3" y="14" width="7" height="7" rx="1" />
                            <rect x="14" y="14" width="3" height="3" rx="0.5" />
                            <rect x="18" y="14" width="3" height="3" rx="0.5" />
                            <rect x="14" y="18" width="3" height="3" rx="0.5" />
                            <rect x="18" y="18" width="3" height="3" rx="0.5" />
                          </svg>
                          <div
                            style={{
                              fontSize: 12,
                              color: "#8a8880",
                              textAlign: "center",
                              lineHeight: 1.5,
                            }}
                          >
                            Click or drag &amp; drop
                            <br />
                            to upload QR
                          </div>
                          <div style={{ fontSize: 10, color: "#b0aea6" }}>
                            PNG, JPG · max 2MB
                          </div>
                        </div>
                      )}

                      {/* New file indicator dot */}
                      {scannerFile && (
                        <div
                          style={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: "#ba7517",
                            border: "2px solid #fff",
                          }}
                        />
                      )}

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleFileChange}
                      />
                    </div>

                    {/* Selected file name */}
                    {scannerFile ? (
                      <div
                        style={{
                          marginTop: 8,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          background: "#faeeda",
                          border: "1px solid #f0d8a8",
                          borderRadius: 6,
                          padding: "5px 10px",
                          maxWidth: 200,
                        }}
                      >
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#854f0b"
                          strokeWidth="2"
                          strokeLinecap="round"
                        >
                          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                          <polyline points="13 2 13 9 20 9" />
                        </svg>
                        <span
                          style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: 10,
                            color: "#854f0b",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            flex: 1,
                          }}
                        >
                          {scannerFile.name}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setScannerFile(null);
                            setPreviewUrl(null);
                            if (fileInputRef.current)
                              fileInputRef.current.value = "";
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#ba7517",
                            padding: 0,
                            fontSize: 13,
                            lineHeight: 1,
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div
                        style={{
                          marginTop: 8,
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: 10,
                          color: "#b0aea6",
                        }}
                      >
                        No file selected
                      </div>
                    )}
                  </div>

                  {/* ── Right: Form ── */}
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 16 }}
                  >
                    {/* UPI ID */}
                    <div>
                      <div
                        style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: 10,
                          color: "#8a8880",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          marginBottom: 6,
                        }}
                      >
                        UPI ID <span style={{ color: "#c0392b" }}>*</span>
                      </div>
                      <input
                        type="text"
                        placeholder="yourname@upi"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        style={{
                          height: 40,
                          width: "100%",
                          border: "1px solid #ddd",
                          borderRadius: 6,
                          padding: "0 12px",
                          fontSize: 13,
                          fontFamily: "'IBM Plex Mono', monospace",
                          outline: "none",
                          background: "#fff",
                          color: "#111110",
                          boxSizing: "border-box",
                          transition: "border-color 0.15s",
                        }}
                        onFocus={(e) => (e.target.style.borderColor = "#111110")}
                        onBlur={(e) => (e.target.style.borderColor = "#ddd")}
                      />
                    </div>

                    {/* Label (optional) */}
                    <div>
                      <div
                        style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: 10,
                          color: "#8a8880",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          marginBottom: 6,
                        }}
                      >
                        Label (optional)
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. Scanner 2 - HDFC"
                        value={scannerLabel}
                        onChange={(e) => setScannerLabel(e.target.value)}
                        style={{
                          height: 40,
                          width: "100%",
                          border: "1px solid #ddd",
                          borderRadius: 6,
                          padding: "0 12px",
                          fontSize: 13,
                          fontFamily: "'IBM Plex Mono', monospace",
                          outline: "none",
                          background: "#fff",
                          color: "#111110",
                          boxSizing: "border-box",
                          transition: "border-color 0.15s",
                        }}
                        onFocus={(e) => (e.target.style.borderColor = "#111110")}
                        onBlur={(e) => (e.target.style.borderColor = "#ddd")}
                      />
                    </div>

                    {/* Divider */}
                    <div style={{ height: 1, background: "#f0eee8" }} />

                    {/* Buttons */}
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <button
                        onClick={handleAddScanner}
                        disabled={addingScanner}
                        style={{
                          height: 40,
                          padding: "0 20px",
                          background: "#111110",
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: addingScanner ? "not-allowed" : "pointer",
                          opacity: addingScanner ? 0.55 : 1,
                          fontFamily: "inherit",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          transition: "opacity 0.15s",
                        }}
                      >
                        {addingScanner && (
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            style={{ animation: "spin 1s linear infinite" }}
                          >
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                          </svg>
                        )}
                        {addingScanner ? "Adding..." : "Add Scanner"}
                      </button>

                      {(scannerFile || upiId || scannerLabel) && (
                        <button
                          onClick={handleResetForm}
                          style={{
                            height: 40,
                            padding: "0 16px",
                            background: "#fff",
                            border: "1px solid #e8e6de",
                            borderRadius: 6,
                            fontSize: 13,
                            color: "#555",
                            cursor: "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {/* Helper */}
                    <div
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 10,
                        color: "#b0aea6",
                        lineHeight: 1.8,
                      }}
                    >
                      The first scanner you add is auto-activated. After that,
                      activate any scanner below to switch what users see.
                    </div>
                  </div>
                </div>

                {/* ── My Scanners list ── */}
                {scanners.length > 0 && (
                  <>
                    <div
                      style={{ height: 1, background: "#f0eee8", margin: "22px 0" }}
                    />
                    <div
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 10,
                        color: "#8a8880",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        marginBottom: 12,
                      }}
                    >
                      My Scanners
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(180px, 1fr))",
                        gap: 12,
                      }}
                    >
                      {scanners.map((s) => {
                        const isBusy =
                          activatingId === s._id || deletingId === s._id;
                        return (
                          <div
                            key={s._id}
                            style={{
                              border: s.isActive
                                ? "1px solid #111110"
                                : "1px solid #e8e6de",
                              borderRadius: 8,
                              overflow: "hidden",
                              background: "#fafaf8",
                            }}
                          >
                            <div
                              style={{
                                width: "100%",
                                aspectRatio: "1 / 1",
                                background: "#fff",
                                borderBottom: "1px solid #f0eee8",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <img
                                src={s.scannerImageUrl}
                                alt={s.label || s.upiId}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "contain",
                                }}
                              />
                            </div>

                            <div
                              style={{
                                padding: 10,
                                display: "flex",
                                flexDirection: "column",
                                gap: 6,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 9,
                                  fontFamily: "'IBM Plex Mono', monospace",
                                  textTransform: "uppercase",
                                  padding: "2px 7px",
                                  borderRadius: 20,
                                  width: "fit-content",
                                  background: s.isActive ? "#eaf3de" : "#f0eee8",
                                  color: s.isActive ? "#3b6d11" : "#8a8880",
                                }}
                              >
                                {s.isActive ? "Active" : "Inactive"}
                              </span>

                              <div
                                style={{
                                  fontFamily: "'IBM Plex Mono', monospace",
                                  fontSize: 11,
                                  color: "#111110",
                                  wordBreak: "break-all",
                                }}
                              >
                                {s.upiId}
                              </div>

                              {s.label && (
                                <div style={{ fontSize: 10, color: "#8a8880" }}>
                                  {s.label}
                                </div>
                              )}

                              <div
                                style={{ display: "flex", gap: 6, marginTop: 4 }}
                              >
                                <button
                                  onClick={() => handleActivateScanner(s._id)}
                                  disabled={s.isActive || isBusy}
                                  style={{
                                    flex: 1,
                                    fontFamily: "'IBM Plex Mono', monospace",
                                    fontSize: 10,
                                    textTransform: "uppercase",
                                    padding: "6px 8px",
                                    borderRadius: 5,
                                    border: "1px solid #111110",
                                    background: s.isActive ? "#e8e6de" : "#fff",
                                    color: s.isActive ? "#8a8880" : "#111110",
                                    cursor:
                                      s.isActive || isBusy
                                        ? "not-allowed"
                                        : "pointer",
                                    opacity: isBusy ? 0.55 : 1,
                                  }}
                                >
                                  {s.isActive
                                    ? "Active"
                                    : activatingId === s._id
                                      ? "..."
                                      : "Activate"}
                                </button>
                                <button
                                  onClick={() => handleDeleteScanner(s._id)}
                                  disabled={isBusy}
                                  style={{
                                    fontFamily: "'IBM Plex Mono', monospace",
                                    fontSize: 10,
                                    textTransform: "uppercase",
                                    padding: "6px 8px",
                                    borderRadius: 5,
                                    border: "1px solid #f0d0cb",
                                    background: "#fff",
                                    color: "#c0392b",
                                    cursor: isBusy ? "not-allowed" : "pointer",
                                    opacity: isBusy ? 0.55 : 1,
                                  }}
                                >
                                  {deletingId === s._id ? "..." : "Delete"}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════
              BANK DETAILS SECTION — owner/admin/superadmin
          ══════════════════════════════════════════ */}
          {canManageBank && (
            <div
              style={{
                marginTop: isAdminRole ? 20 : 0,
                background: "var(--admin-card-bg)",
                border: "1px solid var(--admin-border)",
                borderRadius: 12,
                overflow: "hidden",
                boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 20px",
                  borderBottom: "1px solid #f0eee8",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#8a8880"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="10" width="18" height="10" rx="1" />
                    <path d="M3 10l9-6 9 6" />
                    <line x1="7" y1="14" x2="7" y2="16" />
                    <line x1="12" y1="14" x2="12" y2="16" />
                    <line x1="17" y1="14" x2="17" y2="16" />
                  </svg>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "#111110" }}>
                    Bank Details
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {bankDirty && (
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: "'IBM Plex Mono', monospace",
                        padding: "3px 9px",
                        borderRadius: 20,
                        background: "#faeeda",
                        color: "#854f0b",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: "currentColor",
                          display: "inline-block",
                        }}
                      />
                      Unsaved changes
                    </span>
                  )}

                  <span
                    style={{
                      fontSize: 10,
                      fontFamily: "'IBM Plex Mono', monospace",
                      padding: "3px 9px",
                      borderRadius: 20,
                      background: bankDetails?.accountNumber
                        ? "#eaf3de"
                        : "#f5f4f0",
                      color: bankDetails?.accountNumber ? "#3b6d11" : "#8a8880",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: "currentColor",
                        display: "inline-block",
                      }}
                    />
                    {bankDetails?.accountNumber ? "Active" : "Not set"}
                  </span>
                </div>
              </div>

              <div style={{ padding: 20 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 16,
                  }}
                >
                  {[
                    {
                      key: "accountHolderName",
                      label: "Account Holder Name",
                      placeholder: "John Doe",
                    },
                    {
                      key: "accountNumber",
                      label: "Account Number",
                      placeholder: "1234567890",
                    },
                    {
                      key: "ifscCode",
                      label: "IFSC Code",
                      placeholder: "SBIN0001234",
                    },
                    {
                      key: "bankName",
                      label: "Bank Name",
                      placeholder: "State Bank of India",
                    },
                  ].map(({ key, label, placeholder }) => {
                    const changed = bankForm[key] !== (bankDetails?.[key] || "");
                    return (
                      <div key={key}>
                        <div
                          style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: 10,
                            color: "#8a8880",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            marginBottom: 6,
                          }}
                        >
                          {label} <span style={{ color: "#c0392b" }}>*</span>
                        </div>
                        <input
                          type="text"
                          placeholder={placeholder}
                          value={bankForm[key]}
                          onChange={(e) =>
                            handleBankFieldChange(key, e.target.value)
                          }
                          style={{
                            height: 40,
                            width: "100%",
                            border: `1px solid ${changed ? "#f0d8a8" : "#ddd"}`,
                            borderRadius: 6,
                            padding: "0 12px",
                            fontSize: 13,
                            fontFamily: "'IBM Plex Mono', monospace",
                            outline: "none",
                            background: changed ? "#fffdf7" : "#fff",
                            color: "#111110",
                            boxSizing: "border-box",
                            transition: "border-color 0.15s, background 0.15s",
                          }}
                          onFocus={(e) =>
                            (e.target.style.borderColor = changed
                              ? "#ba7517"
                              : "#111110")
                          }
                          onBlur={(e) =>
                            (e.target.style.borderColor = changed
                              ? "#f0d8a8"
                              : "#ddd")
                          }
                        />
                      </div>
                    );
                  })}
                </div>

                <div
                  style={{ height: 1, background: "#f0eee8", margin: "18px 0" }}
                />

                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <button
                    onClick={handleSaveBank}
                    disabled={savingBank || !bankDirty}
                    style={{
                      height: 40,
                      padding: "0 20px",
                      background: bankDirty ? "#111110" : "#e8e6de",
                      color: bankDirty ? "#fff" : "#8a8880",
                      border: "none",
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: savingBank || !bankDirty ? "not-allowed" : "pointer",
                      opacity: savingBank ? 0.55 : 1,
                      fontFamily: "inherit",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      transition: "background 0.2s, color 0.2s, opacity 0.15s",
                    }}
                  >
                    {savingBank && (
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        style={{ animation: "spin 1s linear infinite" }}
                      >
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                    )}
                    {savingBank
                      ? "Saving..."
                      : bankDetails?.accountNumber
                        ? "Save Changes"
                        : "Save Bank Details"}
                  </button>

                  {bankDirty && (
                    <button
                      onClick={handleResetBank}
                      style={{
                        height: 40,
                        padding: "0 16px",
                        background: "#fff",
                        border: "1px solid #e8e6de",
                        borderRadius: 6,
                        fontSize: 13,
                        color: "#555",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      Discard
                    </button>
                  )}
                </div>

                <div
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 10,
                    color: "#b0aea6",
                    lineHeight: 1.8,
                    marginTop: 14,
                  }}
                >
                  These details are shown to your assigned users so they know
                  where to send deposits.
                </div>
              </div>
            </div>
          )}

          {!isAdminRole && !canManageBank && (
            <div
              style={{
                padding: 24,
                textAlign: "center",
                fontSize: 12,
                color: "#8a8880",
                fontFamily: "'IBM Plex Mono', monospace",
                background: "#fff",
                border: "1px solid #e8e6de",
                borderRadius: 8,
              }}
            >
              Nothing to configure for your role.
            </div>
          )}
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default PaymentMethod;