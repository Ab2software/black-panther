import React from "react";
import { useNavigate } from "react-router-dom";
const CheckBonus = () => {
  const navigate = useNavigate();

  return (
    <>
      <div className="bonus-page">
        <div className="bonus-header">
          <h1>Check Bonus</h1>
          <p>Your available rewards and bonus details will appear here.</p>
        </div>

        <div className="bonus-empty">
          <div className="bonus-icon">🎁</div>

          <h2>No Bonus Available</h2>

          <p>
            You currently don’t have any active bonus or promotional rewards.
          </p>

          <button className="bonus-btn" onClick={() => navigate("/")}>
            Explore Games
          </button>
        </div>
      </div>

      <style>{`
        .bonus-page {
          min-height: 100vh;
          width: 100%;
          background: #f5f7fa;
          padding: 40px 24px;
          box-sizing: border-box;
        }

        .bonus-header {
          margin-bottom: 40px;
        }

        .bonus-header h1 {
          font-size: 34px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 10px;
        }

        .bonus-header p {
          font-size: 16px;
          color: #64748b;
          margin: 0;
        }

        .bonus-empty {
          width: 100%;
          min-height: 70vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          background: #ffffff;
          border-radius: 20px;
          padding: 50px 20px;
          border: 1px solid #e2e8f0;
        }

        .bonus-icon {
          width: 110px;
          height: 110px;
          border-radius: 50%;
          background: #eef2ff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          margin-bottom: 24px;
        }

        .bonus-empty h2 {
          font-size: 28px;
          color: #0f172a;
          margin-bottom: 12px;
          font-weight: 700;
        }

        .bonus-empty p {
          max-width: 500px;
          font-size: 16px;
          line-height: 1.7;
          color: #64748b;
          margin-bottom: 28px;
        }

        .bonus-btn {
          border: none;
          outline: none;
          background: #2f5661;
          color: #fff;
          padding: 14px 28px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .bonus-btn:hover {
          background: #24454e;
          transform: translateY(-1px);
        }

        @media (max-width: 768px) {
          .bonus-page {
            padding: 24px 16px;
          }

          .bonus-header h1 {
            font-size: 28px;
          }

          .bonus-empty {
            min-height: 60vh;
            padding: 40px 16px;
          }

          .bonus-icon {
            width: 90px;
            height: 90px;
            font-size: 40px;
          }

          .bonus-empty h2 {
            font-size: 24px;
          }

          .bonus-empty p {
            font-size: 15px;
          }

          .bonus-btn {
            width: 100%;
            max-width: 280px;
          }
        }
      `}</style>
    </>
  );
};

export default CheckBonus;