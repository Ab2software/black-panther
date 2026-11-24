    const axios = require("axios");

    const MATCH_API = "https://redtechapi.xyz/match-details.php";

    const fetchMatchDetails = async (matchId, sport = "cricket") => {
    try {
        // console.log(`Calling PHP API: match=${matchId}, sportsname=${sport}`);

        const response = await axios.get(MATCH_API, {
        params: {
            match:      matchId,
            sportsname: sport,
        },
        timeout: 10000,
        });

        console.log("PHP API status:", response.status);

        return response.data;
    } catch (error) {
        console.error("Match Service Error:", error.message);
        console.error("Upstream response:", error.response?.data);
        throw new Error(
        `Failed to fetch match details: ${error.response?.data?.message || error.message}`
        );
    }
    };

    module.exports = { fetchMatchDetails };