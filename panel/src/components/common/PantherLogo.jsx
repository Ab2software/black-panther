import React from "react";

export default function PantherLogo({ size = 36, showText = true, compact = false }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: compact ? "6px" : "10px",
        userSelect: "none",
        flexShrink: 0,
      }}
    >
      {/* Panther Emblem Icon */}
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: `${Math.round(size * 0.28)}px`,
          background: "linear-gradient(135deg, #181926 0%, #0d0f17 50%, #08090f 100%)",
          border: "1.5px solid rgba(212, 175, 55, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 16px rgba(212, 175, 55, 0.35)",
          position: "relative",
          flexShrink: 0,
        }}
      >
        <svg
          width={Math.round(size * 0.72)}
          height={Math.round(size * 0.72)}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="goldPantherGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF2B2" />
              <stop offset="50%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#997A15" />
            </linearGradient>
            <linearGradient id="eyeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22D3EE" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
          </defs>

          {/* Panther Ears */}
          <polygon points="18,36 10,12 36,24" fill="url(#goldPantherGrad)" opacity="0.95" />
          <polygon points="82,36 90,12 64,24" fill="url(#goldPantherGrad)" opacity="0.95" />
          <polygon points="20,32 16,18 32,25" fill="#0d0f17" />
          <polygon points="80,32 84,18 68,25" fill="#0d0f17" />

          {/* Forehead & Crown */}
          <polygon points="32,20 50,30 68,20 50,14" fill="url(#goldPantherGrad)" />
          <polygon points="36,26 50,38 64,26 50,22" fill="#121520" />

          {/* Cheeks & Jaw Structure */}
          <polygon points="12,42 28,34 32,56 16,56" fill="url(#goldPantherGrad)" />
          <polygon points="88,42 72,34 68,56 84,56" fill="url(#goldPantherGrad)" />

          {/* Piercing Panther Eyes */}
          <polygon points="28,42 40,40 38,46 26,46" fill="url(#eyeGlow)" />
          <polygon points="72,42 60,40 62,46 74,46" fill="url(#eyeGlow)" />

          {/* Eye Pupils / Highlights */}
          <circle cx="34" cy="43" r="1.5" fill="#FFFFFF" />
          <circle cx="66" cy="43" r="1.5" fill="#FFFFFF" />

          {/* Snout & Nose Bridge */}
          <polygon points="46,36 54,36 52,58 48,58" fill="url(#goldPantherGrad)" />
          <polygon points="42,58 58,58 50,68" fill="url(#goldPantherGrad)" />

          {/* Whisker Lines */}
          <path d="M 22 62 L 38 64" stroke="url(#goldPantherGrad)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 18 68 L 36 69" stroke="url(#goldPantherGrad)" strokeWidth="2" strokeLinecap="round" />
          <path d="M 78 62 L 62 64" stroke="url(#goldPantherGrad)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 82 68 L 64 69" stroke="url(#goldPantherGrad)" strokeWidth="2" strokeLinecap="round" />

          {/* Fangs & Chin */}
          <polygon points="44,68 47,78 50,70" fill="#FFFFFF" />
          <polygon points="56,68 53,78 50,70" fill="#FFFFFF" />
          <polygon points="42,74 58,74 50,88" fill="url(#goldPantherGrad)" />
        </svg>
      </div>

      {/* Typography Label */}
      {showText && (
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }} className={compact ? "logo-text-full" : ""}>
          <div
            style={{
              fontSize: `${Math.max(15, Math.round(size * 0.46))}px`,
              fontWeight: 900,
              letterSpacing: "0.8px",
              color: "#FFFFFF",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span>BLACK</span>
            <span
              style={{
                background: "linear-gradient(135deg, #FFE082 0%, #D4AF37 50%, #B38F1B 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              PANTHER
            </span>
          </div>

          <span
            style={{
              fontSize: `${Math.max(8.5, Math.round(size * 0.2))}px`,
              fontWeight: 800,
              color: "#94A3B8",
              letterSpacing: "1.8px",
              textTransform: "uppercase",
              marginTop: "2px",
            }}
          >
            SPORTS & CASINO
          </span>
        </div>
      )}
    </div>
  );
}
