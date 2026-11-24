import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Trophy, Dices, ReceiptText, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function BottomNav({ onOpenAuth, onOpenAccount }) {
  const location = useLocation();
  const auth = useAuth() || {};
  const user = auth.user;

  const navItems = [
    { label: "Home", path: "/", icon: Home },
    { label: "Sports", path: "/sports", icon: Trophy },
    { label: "Casino", path: "/casino", icon: Dices },
    { label: "My Bets", path: "/my-bets", icon: ReceiptText },
    { label: "Account", path: "/account", icon: User },
  ];

  return (
    <>
      <nav className="shiva-mobile-bottom-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`shiva-bnav-item ${isActive ? "active" : ""}`}
            >
              {isActive && <span className="shiva-bnav-pill" />}
              <Icon size={19} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <style>{`
        .shiva-mobile-bottom-nav {
          display: none;
        }

        @media (max-width: 768px) {
          .shiva-mobile-bottom-nav {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 54px;
            background: linear-gradient(180deg, #0b4c3e 0%, #062b23 100%);
            border-top: 1.5px solid #ca8a04;
            box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.45);
            z-index: 995;
            align-items: center;
            justify-content: space-around;
            padding-bottom: env(safe-area-inset-bottom, 0px);
            pointer-events: auto;
          }

          .shiva-bnav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 2px;
            color: #94a3b8;
            font-size: 10px;
            font-weight: 700;
            text-decoration: none;
            background: none;
            border: none;
            cursor: pointer;
            flex: 1;
            height: 100%;
            position: relative;
            transition: color 0.12s ease;
            -webkit-tap-highlight-color: transparent;
            user-select: none;
          }

          .shiva-bnav-item:hover,
          .shiva-bnav-item:active {
            color: #facc15;
          }

          .shiva-bnav-item.active {
            color: #facc15;
            font-weight: 900;
          }

          .shiva-bnav-pill {
            position: absolute;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 28px;
            height: 2.5px;
            background: #facc15;
            border-radius: 0 0 3px 3px;
            box-shadow: 0 1px 6px #facc15;
          }
        }
      `}</style>
    </>
  );
}
