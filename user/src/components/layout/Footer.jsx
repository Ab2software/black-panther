import React from "react";
import { ShieldCheck, Lock, Award, HeartHandshake } from "lucide-react";

export default function Footer() {
  return (
    <footer
      style={{
        background: "#06090f",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        padding: "24px 12px 90px",
        color: "#94a3b8",
        fontSize: "12.5px",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Trust Badges Bar */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "20px",
            paddingBottom: "32px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            marginBottom: "32px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "rgba(212, 175, 55, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#d4af37",
              }}
            >
              <ShieldCheck size={22} />
            </div>
            <div>
              <div style={{ color: "#ffffff", fontWeight: 700, fontSize: "14px" }}>256-Bit SSL Encrypted</div>
              <div style={{ fontSize: "11px", color: "#64748b" }}>Bank-grade security & privacy</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "rgba(34, 197, 94, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#4ade80",
              }}
            >
              <Award size={22} />
            </div>
            <div>
              <div style={{ color: "#ffffff", fontWeight: 700, fontSize: "14px" }}>Instant UPI Settlement</div>
              <div style={{ fontSize: "11px", color: "#64748b" }}>Withdrawals processed in 5 mins</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "rgba(239, 68, 68, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#f87171",
              }}
            >
              <HeartHandshake size={22} />
            </div>
            <div>
              <div style={{ color: "#ffffff", fontWeight: 700, fontSize: "14px" }}>Responsible Gaming 18+</div>
              <div style={{ fontSize: "11px", color: "#64748b" }}>Play strictly within your limits</div>
            </div>
          </div>
        </div>

        {/* Accepted Payment Methods */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>
            Accepted Payment Methods
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            {["UPI", "Google Pay", "PhonePe", "Paytm", "IMPS Bank Transfer", "USDT Crypto"].map((method) => (
              <span
                key={method}
                style={{
                  padding: "6px 14px",
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#cbd5e1",
                }}
              >
                {method}
              </span>
            ))}
          </div>
        </div>

        {/* Legal & Disclaimer */}
        <div style={{ textAlign: "center", fontSize: "12px", color: "#64748b", lineHeight: 1.6 }}>
          <p style={{ margin: "0 0 8px 0" }}>
            Black Panther Exchange operates under fair play standards. Back/Lay odds are market-driven with zero hidden brokerage.
          </p>
          <p style={{ margin: 0 }}>
            © {new Date().getFullYear()} Black Panther Exchange. All rights reserved. 18+ Only.
          </p>
        </div>
      </div>
    </footer>
  );
}

