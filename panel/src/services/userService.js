// services/userService.js
import api from "../utils/api";

// PUBLIC — no auth needed. Used when the user is NOT logged in.
export const getPublicWhatsapp = async () => {
  const response = await api.get("/public/whatsapp");
  return response.data;
};

// LOGGED-IN USER — returns their assigned admin's WhatsApp number.
export const getAssignedWhatsapp = async () => {
  const response = await api.get("/whatsapp/assigned");
  return response.data;
};