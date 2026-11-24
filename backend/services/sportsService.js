const axios = require("axios");

const SPORTS_API = "https://redtechapi.xyz/testapi.php";
// const SPORTS_API = "";

const fetchSportsData = async (sport = "cricket") => {
  try {
    const response = await axios.get(SPORTS_API, {
      params: { sport }, // ✅ passes ?sport=cricket etc.
    });
    return response.data;
  } catch (error) {
    console.error("Sports API Error:", error.message);
    throw new Error("Failed to fetch sports data");
  }
};

module.exports = { fetchSportsData };