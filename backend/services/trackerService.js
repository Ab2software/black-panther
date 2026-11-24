
const axios = require("axios");

const PROXY_URL = "https://redtechapi.xyz/tracker.php";

const getTracker = async (eventId, eventTypeId) => {
  const response = await axios.get(PROXY_URL, {
    params: {
      event_id: eventId,
      event_type_id: eventTypeId,
    },
    timeout: 15000,
  });

  return response.data;
};

module.exports = {
  getTracker,
};