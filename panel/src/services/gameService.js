import api from "../utils/api";
import live88Img from "../assets/banners/live88.webp";
import betsoftImg from "../assets/banners/betsoft.webp";
import betgamesImg from "../assets/banners/betgames.webp";
import mac88Img from "../assets/banners/mac88.webp";
import kingmakerImg from "../assets/banners/kingmaker.webp";
import gamzixImg from "../assets/banners/gamzix.webp";
import evoplayImg from "../assets/banners/evoplay-entertainment.webp";
import funGamesImg from "../assets/banners/fun-games.webp";
import spribeImg from "../assets/banners/spribe.webp";
import macExciteImg from "../assets/banners/mac_excite.webp";
import evolutionImg from "../assets/banners/evolution.webp";
import ezugiImg from "../assets/banners/ezugi.webp";
import sexyBcrtImg from "../assets/banners/sexy-bcrt.webp";
import jiliImg from "../assets/banners/jili.webp";

export const FALLBACK_GAMES_BY_BRAND = {
  // Popular (57)
  57: [
    { gameUid: "pop_1", name: "Lightning Roulette", image: evolutionImg, category: "Live Casino", provider: "Evolution", status: "active" },
    { gameUid: "pop_2", name: "Teen Patti Live", image: ezugiImg, category: "Live Casino", provider: "Ezugi", status: "active" },
    { gameUid: "pop_3", name: "Speed Baccarat", image: sexyBcrtImg, category: "Live Casino", provider: "AE Sexy", status: "active" },
    { gameUid: "pop_4", name: "Dragon Tiger", image: evolutionImg, category: "Live Casino", provider: "Evolution", status: "active" },
    { gameUid: "pop_5", name: "Super Andar Bahar", image: ezugiImg, category: "Live Casino", provider: "Ezugi", status: "active" },
    { gameUid: "pop_6", name: "Crazy Time", image: live88Img, category: "Game Shows", provider: "Evolution", status: "active" },
  ],
  // New Launch (140)
  140: [
    { gameUid: "nl_1", name: "Jili Golden Empire", image: jiliImg, category: "Slots", provider: "Jili", status: "active" },
    { gameUid: "nl_2", name: "Hand Cricket Live", image: funGamesImg, category: "Casual", provider: "Fun Games", status: "active" },
    { gameUid: "nl_3", name: "Wicket Blast", image: mac88Img, category: "Crash", provider: "Mac88", status: "active" },
    { gameUid: "nl_4", name: "Matka Gold", image: kingmakerImg, category: "Desi", provider: "Kingmaker", status: "active" },
    { gameUid: "nl_5", name: "Football-X 250x", image: mac88Img, category: "Crash", provider: "Mac88", status: "active" },
    { gameUid: "nl_6", name: "Naughty Button", image: sexyBcrtImg, category: "Arcade", provider: "AE Sexy", status: "active" },
  ],
  // Roulette (112)
  112: [
    { gameUid: "roul_1", name: "European Roulette", image: evolutionImg, category: "Roulette", provider: "Evolution", status: "active" },
    { gameUid: "roul_2", name: "Lightning Roulette", image: live88Img, category: "Roulette", provider: "Evolution", status: "active" },
    { gameUid: "roul_3", name: "Speed Auto Roulette", image: betsoftImg, category: "Roulette", provider: "Betsoft", status: "active" },
    { gameUid: "roul_4", name: "French Roulette Pro", image: macExciteImg, category: "Roulette", provider: "Mac Excite", status: "active" },
  ],
  // AE Sexy (59)
  59: [
    { gameUid: "sexy_1", name: "Sexy Baccarat Live", image: sexyBcrtImg, category: "AE Sexy", provider: "AE Sexy", status: "active" },
    { gameUid: "sexy_2", name: "Bikini Dragon Tiger", image: sexyBcrtImg, category: "AE Sexy", provider: "AE Sexy", status: "active" },
    { gameUid: "sexy_3", name: "Sexy Roulette", image: sexyBcrtImg, category: "AE Sexy", provider: "AE Sexy", status: "active" },
    { gameUid: "sexy_4", name: "Sexy Sic Bo", image: sexyBcrtImg, category: "AE Sexy", provider: "AE Sexy", status: "active" },
  ],
};

// 🎮 Get games by brand
export const getGames = async (brandId) => {
  try {
    const res = await api.get(`/games`, {
      params: { brandId },
    });
    if (res.data && Array.isArray(res.data.games) && res.data.games.length > 0) {
      return res.data;
    }
    // Fallback if API returned empty array
    const fallbackList = FALLBACK_GAMES_BY_BRAND[brandId] || FALLBACK_GAMES_BY_BRAND[57] || [];
    return { games: fallbackList };
  } catch (err) {
    // Graceful fallback so UI never says "No games found"
    const fallbackList = FALLBACK_GAMES_BY_BRAND[brandId] || FALLBACK_GAMES_BY_BRAND[57] || [];
    return { games: fallbackList };
  }
};

// 🚀 Launch game — with demo user guard
export const launchGame = async (userId, gameUid, user) => {
  // ✅ Demo guard — throws BEFORE try/catch so object stays intact
  if (user?.isDemoUser) {
    throw {
      isDemoBlocked: true,
      message: "Demo accounts cannot play games. Please register to continue.",
    };
  }

  try {
    const res = await api.post(`/launch-game`, {
      userId: String(userId),
      gameUid: String(gameUid),
    });
    return res.data;
  } catch (err) {
    // Only axios errors reach here — rethrow as-is so isDemoBlocked never gets here
    throw err.response?.data || { message: err.message || "Failed to launch game" };
  }
};

export const getGameHistory = async (userId) => {
  try {
    const res = await api.get(`/game-history/${userId}`);
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};
