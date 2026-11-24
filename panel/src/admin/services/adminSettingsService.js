// services/adminSettingsService.js
import api from "../utils/api";

// Admin updates their OWN WhatsApp number (shown to users assigned to them)
export const updateUserWhatsapp = async (userId, whatsapp) => {
  const response = await api.patch(`/users/${userId}/whatsapp`, {
    whatsapp,
  });
  return response.data;
};