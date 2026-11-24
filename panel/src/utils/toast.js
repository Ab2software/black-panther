let toastHandler;

export const setToastHandler = (handler) => {
  toastHandler = handler;
};

export const toast = {
  success: (msg) => toastHandler?.(msg, "success"),
  error: (msg) => toastHandler?.(msg, "error"),
  info: (msg) => toastHandler?.(msg, "info"),
};