// src/components/common/ToastProvider.jsx
import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { setToastHandler } from "../../utils/toast";

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    setTimeout(() => removeToast(id), 4000);
  }, [removeToast]);

  useEffect(() => {
    setToastHandler(addToast);
  }, [addToast]);

  return (
    <>
      {children}

      {createPortal(
        <div className="toast-stack">
          {toasts.map((t) => (
            <div key={t.id} className={`toast-card ${t.type}`} onClick={() => removeToast(t.id)}>
              <div className="toast-body">
                <span className="toast-indicator" />
                {t.message}
              </div>
              <div className="toast-progress-container">
                <div className="toast-progress-bar" />
              </div>
            </div>
          ))}
        </div>,
        document.body
      )}

      <style>{`
        .toast-stack {
          position: fixed;
          top: 24px;
          right: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          z-index: 10000;
          pointer-events: none;
        }

        .toast-card {
          pointer-events: auto;
          background: #1a1b1e;
          color: #ffffff;
          min-width: 280px;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          box-shadow: 0 12px 32px rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.05);
          animation: toastIn 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28);
          transition: transform 0.2s ease;
        }

        .toast-card:hover { transform: scale(1.02); }

        .toast-body {
          padding: 14px 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          font-weight: 500;
        }

        .toast-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .success .toast-indicator { background: #2ecc71; box-shadow: 0 0 8px #2ecc71; }
        .error .toast-indicator { background: #e74c3c; box-shadow: 0 0 8px #e74c3c; }
        .info .toast-indicator { background: #3498db; box-shadow: 0 0 8px #3498db; }

        .toast-progress-container {
          height: 3px;
          width: 100%;
          background: rgba(255,255,255,0.1);
        }

        .toast-progress-bar {
          height: 100%;
          width: 100%;
          background: rgba(255,255,255,0.4);
          animation: progressDrain 4s linear forwards;
        }

        @keyframes toastIn {
          from { opacity: 0; transform: translateX(40px) scale(0.9); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }

        @keyframes progressDrain {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </>
  );
};

export default ToastProvider;