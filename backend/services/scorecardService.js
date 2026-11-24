// services/score.service.js

const axios = require("axios");

const PROXY_URL = "https://redtechapi.xyz/score-proxy.php";

const getScorecard = async (sport, eventId) => {
  const response = await axios.get(PROXY_URL, {
    params: {
      sport,
      event_id: eventId,
    },
    responseType: "text",
    timeout: 15000,
  });

  return response.data;
};

module.exports = {
  getScorecard,
};