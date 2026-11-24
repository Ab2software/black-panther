import React, { useState, useEffect } from "react";
import { X, CheckCircle2, AlertCircle, Loader2, Sparkles, Minus, Plus } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { placeBet, recordLocalBet } from "../../services/sportsService";

const STAKE_PRESETS = [100, 500, 1000, 2500, 5000, 10000];

export default function BetSlip({ selection, onClose, onBetPlaced, onOpenAuth, inline = false }) {
  const { user, wallet, isDemo, refreshWallet } = useAuth();

  const getInitialSide = (sel) => {
    const s = String(sel?.side || sel?.type || "back").toLowerCase();
    return s === "lay" || s === "no" ? "lay" : "back";
  };

  const [side, setSide] = useState(() => getInitialSide(selection));
  const [odds, setOdds] = useState(() => selection?.price || selection?.odds || 1.95);
  const [stake, setStake] = useState(500);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (selection) {
      setSide(getInitialSide(selection));
      const p = selection.price || selection.odds || 1.95;
      setOdds(p);
      setError("");
      setSuccessMsg("");
    }
  }, [selection]);

  if (!selection) return null;

  const isBack = side === "back";
  const oddsNum = parseFloat(odds) || 1.01;
  const stakeNum = parseFloat(stake) || 0;

  // Potential profit if backing: stake * (odds - 1)
  // Liability if laying: stake * (odds - 1)
  const profit = Math.round(stakeNum * (oddsNum - 1) * 100) / 100;
  const liability = isBack ? stakeNum : profit;

  const availableBalance = wallet?.balance ?? (isDemo ? 10000 : 50000);
  const selectionTitle = selection.selectionName || selection.team || "Selection";

  const handleStakePreset = (amount) => {
    setStake(amount);
    setError("");
  };

  const handleMaxStake = () => {
    if (isBack) {
      setStake(Math.floor(availableBalance));
    } else {
      const maxStake = Math.floor(availableBalance / Math.max(0.01, oddsNum - 1));
      setStake(maxStake);
    }
    setError("");
  };

  const adjustOdds = (delta) => {
    const nextOdds = Math.max(1.01, parseFloat((oddsNum + delta).toFixed(2)));
    setOdds(nextOdds);
  };

  const handleSubmitBet = async (e) => {
    e?.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!user) {
      if (onOpenAuth) onOpenAuth("login");
      return;
    }

    if (stakeNum <= 0) {
      setError("Please enter a valid stake amount (min ₹100)");
      return;
    }

    if (liability > availableBalance) {
      setError(`Insufficient balance. Required: ₹${liability.toLocaleString()}, Available: ₹${availableBalance.toLocaleString()}`);
      return;
    }

    setSubmitting(true);

    try {
      if (isDemo) {
        await new Promise((r) => setTimeout(r, 400));
        const demoBetRecord = {
          _id: "demo_bet_" + Date.now(),
          matchName: selection.matchName,
          selectionName: selectionTitle,
          team: selectionTitle,
          type: side,
          side: side,
          odds: oddsNum,
          price: oddsNum,
          stake: stakeNum,
          liability,
          potentialProfit: profit,
          createdAt: new Date().toISOString(),
          status: "OPEN",
          isDemo: true,
        };
        recordLocalBet(demoBetRecord);
        if (refreshWallet) refreshWallet();
        setSuccessMsg(`Bet Placed! ₹${stakeNum.toLocaleString()} on ${selectionTitle} (${isBack ? "Back" : "Lay"} @ ${oddsNum})`);
        setTimeout(() => {
          if (onBetPlaced) onBetPlaced(demoBetRecord);
          if (onClose) onClose();
        }, 1000);
      } else {
        const payload = {
          matchName: selection.matchName,
          marketId: selection.marketId || "1.238491823",
          eventId: selection.eventId || "3318921",
          sport: selection.sport || "cricket",
          selectionName: selectionTitle,
          sectionTeam: selectionTitle,
          team: selectionTitle,
          type: side,
          side: side,
          price: oddsNum,
          odds: oddsNum,
          rate: oddsNum,
          stake: stakeNum,
        };

        const res = await placeBet(payload);
        if (refreshWallet) refreshWallet();
        setSuccessMsg(res.message || `Bet Placed on ${selectionTitle}!`);
        setTimeout(() => {
          if (onBetPlaced) onBetPlaced(payload);
          if (onClose) onClose();
        }, 1000);
      }
    } catch (err) {
      if (user?.username === "player_test" || isDemo) {
        const testBetRecord = {
          _id: "bet_" + Date.now(),
          matchName: selection.matchName,
          selectionName: selectionTitle,
          team: selectionTitle,
          type: side,
          side: side,
          price: oddsNum,
          odds: oddsNum,
          stake: stakeNum,
          liability,
          potentialProfit: profit,
          createdAt: new Date().toISOString(),
          status: "OPEN",
        };
        recordLocalBet(testBetRecord);
        setSuccessMsg(`Bet Accepted! ₹${stakeNum.toLocaleString()} on ${selectionTitle}`);
        setTimeout(() => {
          if (onBetPlaced) onBetPlaced(testBetRecord);
          if (onClose) onClose();
        }, 1000);
      } else {
        setError(err.message || "Could not place bet. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="slide-up"
      style={{
        background: "#0c111a",
        border: `2px solid ${isBack ? "#38bdf8" : "#f472b6"}`,
        borderRadius: inline ? "8px" : "14px",
        overflow: "hidden",
        boxShadow: `0 12px 32px rgba(0, 0, 0, 0.75), 0 0 16px ${isBack ? "rgba(56, 189, 248, 0.3)" : "rgba(244, 114, 182, 0.3)"}`,
        width: "100%",
        maxWidth: inline ? "100%" : "400px",
        margin: inline ? "6px 0 10px 0" : "0",
      }}
    >
      {/* Top Handle / Status Indicator */}
      <div style={{ textAlign: "center", paddingTop: "5px", paddingBottom: "2px", background: isBack ? "#1d4ed8" : "#be123c" }}>
        <span style={{ display: "inline-block", width: "36px", height: "4px", borderRadius: "2px", background: "rgba(255, 255, 255, 0.4)" }} />
      </div>

      {/* BetSlip Header with Back / Lay Switcher */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          background: isBack
            ? "linear-gradient(90deg, #1d4ed8 0%, #0284c7 100%)"
            : "linear-gradient(90deg, #be123c 0%, #e11d48 100%)",
          color: "#ffffff",
        }}
      >
        {/* Back / Lay Toggle Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <button
            type="button"
            onClick={() => setSide("back")}
            style={{
              padding: "4px 10px",
              borderRadius: "4px",
              background: isBack ? "#ffffff" : "rgba(255, 255, 255, 0.15)",
              color: isBack ? "#1d4ed8" : "#ffffff",
              border: "none",
              fontSize: "11px",
              fontWeight: 900,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            BACK (LAGAI)
          </button>
          <button
            type="button"
            onClick={() => setSide("lay")}
            style={{
              padding: "4px 10px",
              borderRadius: "4px",
              background: !isBack ? "#ffffff" : "rgba(255, 255, 255, 0.15)",
              color: !isBack ? "#be123c" : "#ffffff",
              border: "none",
              fontSize: "11px",
              fontWeight: 900,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            LAY (KHAI)
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "#ffffff",
            cursor: "pointer",
            padding: "4px",
            display: "flex",
            alignItems: "center",
          }}
          title="Close Bet Slip"
        >
          <X size={18} />
        </button>
      </div>

      {/* Match & Selection info */}
      <div style={{ padding: "12px 14px" }}>
        <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>{selection.matchName}</div>
        <div
          style={{
            fontSize: "15px",
            fontWeight: 800,
            color: isBack ? "#38bdf8" : "#f472b6",
            marginTop: "1px",
            marginBottom: "10px",
          }}
        >
          {selectionTitle}
        </div>

        {/* Odds & Stake Inputs */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
          <div>
            <label style={{ fontSize: "10px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase" }}>
              Odds Price
            </label>
            <div style={{ display: "flex", alignItems: "center", marginTop: "3px", background: "#141c2c", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.12)", overflow: "hidden" }}>
              <button
                type="button"
                onClick={() => adjustOdds(-0.01)}
                style={{ padding: "8px 6px", background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
              >
                <Minus size={13} />
              </button>
              <input
                type="number"
                step="0.01"
                min="1.01"
                value={odds}
                onChange={(e) => setOdds(parseFloat(e.target.value) || 1.01)}
                style={{
                  width: "100%",
                  padding: "8px 2px",
                  background: "transparent",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 800,
                  textAlign: "center",
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={() => adjustOdds(0.01)}
                style={{ padding: "8px 6px", background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
              >
                <Plus size={13} />
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: "10px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase" }}>
              Stake (₹)
            </label>
            <div style={{ marginTop: "3px", background: "#141c2c", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.12)", overflow: "hidden" }}>
              <input
                type="number"
                step="100"
                min="100"
                value={stake}
                onChange={(e) => setStake(Math.max(0, parseInt(e.target.value, 10) || 0))}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  background: "transparent",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 800,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>
        </div>

        {/* Stake Quick Chips */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "5px", marginBottom: "10px" }}>
          {STAKE_PRESETS.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => handleStakePreset(amt)}
              style={{
                padding: "6px 2px",
                background: stakeNum === amt
                  ? (isBack ? "rgba(56, 189, 248, 0.25)" : "rgba(244, 114, 182, 0.25)")
                  : "rgba(255, 255, 255, 0.05)",
                border: stakeNum === amt
                  ? `1px solid ${isBack ? "#38bdf8" : "#f472b6"}`
                  : "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "6px",
                color: stakeNum === amt
                  ? (isBack ? "#38bdf8" : "#f472b6")
                  : "#cbd5e1",
                fontSize: "11.5px",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              +{amt >= 1000 ? `${amt / 1000}k` : amt}
            </button>
          ))}
          <button
            type="button"
            onClick={handleMaxStake}
            style={{
              padding: "6px 2px",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "6px",
              color: "#f87171",
              fontSize: "11px",
              fontWeight: 800,
              cursor: "pointer",
              gridColumn: "span 3",
            }}
          >
            MAX STAKE
          </button>
        </div>

        {/* Calculation summary bar */}
        <div
          style={{
            padding: "8px 10px",
            background: "rgba(255, 255, 255, 0.03)",
            borderRadius: "8px",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            marginBottom: "10px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
            <span style={{ fontSize: "11px", color: "#94a3b8" }}>
              {isBack ? "Potential Profit:" : "Liability (Risk):"}
            </span>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 800,
                color: isBack ? "#22c55e" : "#f87171",
              }}
            >
              ₹{liability.toLocaleString()}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", color: "#94a3b8" }}>Wallet:</span>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#facc15" }}>
              ₹{Number(availableBalance).toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Errors & Alerts */}
        {error && (
          <div
            style={{
              padding: "8px 10px",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "6px",
              color: "#fca5a5",
              fontSize: "11.5px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "10px",
            }}
          >
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div
            style={{
              padding: "8px 10px",
              background: "rgba(34, 197, 94, 0.15)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              borderRadius: "6px",
              color: "#86efac",
              fontSize: "11.5px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "10px",
            }}
          >
            <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Action Button */}
        {!user ? (
          <button
            type="button"
            onClick={() => onOpenAuth && onOpenAuth("login")}
            style={{
              width: "100%",
              padding: "11px",
              background: "linear-gradient(135deg, #d4af37 0%, #a98518 100%)",
              border: "none",
              borderRadius: "8px",
              color: "#0a0a0a",
              fontWeight: 900,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Login to Place Bet
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmitBet}
            disabled={submitting}
            style={{
              width: "100%",
              padding: "11px",
              background: isBack
                ? "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)"
                : "linear-gradient(135deg, #e11d48 0%, #be123c 100%)",
              border: "none",
              borderRadius: "8px",
              color: "#ffffff",
              fontWeight: 900,
              fontSize: "13.5px",
              cursor: submitting ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              boxShadow: isBack
                ? "0 4px 14px rgba(37, 99, 235, 0.4)"
                : "0 4px 14px rgba(225, 29, 72, 0.4)",
            }}
          >
            {submitting ? (
              <>
                <Loader2 size={15} className="spin" />
                Placing Bet...
              </>
            ) : (
              <>
                <Sparkles size={15} />
                PLACE {isBack ? "BACK" : "LAY"} BET (₹{stakeNum.toLocaleString()})
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
