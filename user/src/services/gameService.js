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

export const CURATED_GAMES = [
  // ── Live Casino ──
  {
    id: "evolution_lightning_roulette",
    name: "Lightning Roulette",
    category: "Live Casino",
    tab: "Roulette",
    provider: "Evolution",
    banner: evolutionImg,
    badge: "500X 🔥",
    players: "2,420",
    minBet: 50,
    maxBet: 500000,
    rtp: "97.3%",
    isLive: true,
    bgGradient: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
  },
  {
    id: "ezugi_teen_patti_live",
    name: "Teen Patti Live",
    category: "Live Casino",
    tab: "Popular",
    provider: "Ezugi",
    banner: ezugiImg,
    badge: "DESI LIVE",
    players: "3,150",
    minBet: 100,
    maxBet: 200000,
    rtp: "96.8%",
    isLive: true,
    bgGradient: "linear-gradient(135deg, #450a0a 0%, #7f1d1d 100%)",
  },
  {
    id: "pragmatic_speed_baccarat",
    name: "Speed Baccarat A",
    category: "Live Casino",
    tab: "Popular",
    provider: "Pragmatic Play",
    banner: live88Img,
    badge: "VIP FAST",
    players: "1,890",
    minBet: 100,
    maxBet: 400000,
    rtp: "98.9%",
    isLive: true,
    bgGradient: "linear-gradient(135deg, #1e3a8a 0%, #172554 100%)",
  },
  {
    id: "evolution_dragon_tiger",
    name: "Dragon Tiger Live",
    category: "Live Casino",
    tab: "Popular",
    provider: "Evolution",
    banner: evolutionImg,
    badge: "TOP LIVE",
    players: "1,640",
    minBet: 50,
    maxBet: 150000,
    rtp: "96.2%",
    isLive: true,
    bgGradient: "linear-gradient(135deg, #581c87 0%, #3b0764 100%)",
  },
  {
    id: "ezugi_super_andar_bahar",
    name: "Super Andar Bahar",
    category: "Live Casino",
    tab: "Popular",
    provider: "Ezugi",
    banner: ezugiImg,
    badge: "POPULAR",
    players: "2,840",
    minBet: 100,
    maxBet: 250000,
    rtp: "97.8%",
    isLive: true,
    bgGradient: "linear-gradient(135deg, #14532d 0%, #052e16 100%)",
  },
  {
    id: "evolution_crazy_time",
    name: "Crazy Time",
    category: "Game Shows",
    tab: "Popular",
    provider: "Evolution",
    banner: evolutionImg,
    badge: "MEGA BONUS",
    players: "5,410",
    minBet: 50,
    maxBet: 250000,
    rtp: "96.0%",
    isLive: true,
    bgGradient: "linear-gradient(135deg, #831843 0%, #500724 100%)",
  },
  {
    id: "pragmatic_mega_wheel",
    name: "Mega Wheel 500x",
    category: "Game Shows",
    tab: "New Launch",
    provider: "Pragmatic Play",
    banner: betgamesImg,
    badge: "NEW",
    players: "1,980",
    minBet: 50,
    maxBet: 100000,
    rtp: "96.5%",
    isLive: true,
    bgGradient: "linear-gradient(135deg, #7c2d12 0%, #431407 100%)",
  },

  // ── Crash & Aviator ──
  {
    id: "spribe_aviator",
    name: "Aviator Crash",
    category: "Aviator",
    tab: "Popular",
    provider: "Spribe",
    banner: spribeImg,
    badge: "HOT 🔥",
    players: "6,920",
    minBet: 10,
    maxBet: 100000,
    rtp: "97.0%",
    isCrash: true,
    bgGradient: "linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%)",
  },
  {
    id: "spribe_mines",
    name: "Diamond Mines",
    category: "Mini Games",
    tab: "New Launch",
    provider: "Spribe",
    banner: spribeImg,
    badge: "INSTANT",
    players: "2,350",
    minBet: 20,
    maxBet: 50000,
    rtp: "97.0%",
    isCrash: true,
    bgGradient: "linear-gradient(135deg, #ea580c 0%, #9a3412 100%)",
  },
  {
    id: "spribe_plinko",
    name: "Plinko Rush",
    category: "Mini Games",
    tab: "New Launch",
    provider: "Spribe",
    banner: spribeImg,
    badge: "1000X",
    players: "1,870",
    minBet: 10,
    maxBet: 20000,
    rtp: "98.0%",
    isCrash: true,
    bgGradient: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
  },

  // ── Roulette ──
  {
    id: "betsoft_european_roulette",
    name: "European Roulette",
    category: "Roulette",
    tab: "Roulette",
    provider: "Betsoft",
    banner: betsoftImg,
    badge: "CLASSIC",
    players: "1,120",
    minBet: 20,
    maxBet: 100000,
    rtp: "97.3%",
    bgGradient: "linear-gradient(135deg, #115e59 0%, #042f2e 100%)",
  },
  {
    id: "live88_speed_roulette",
    name: "Speed Roulette VIP",
    category: "Roulette",
    tab: "Roulette",
    provider: "Live 88",
    banner: live88Img,
    badge: "20s SPIN",
    players: "1,450",
    minBet: 50,
    maxBet: 200000,
    rtp: "97.3%",
    isLive: true,
    bgGradient: "linear-gradient(135deg, #3730a3 0%, #1e1b4b 100%)",
  },
  {
    id: "kingmaker_american_roulette",
    name: "American Roulette Deluxe",
    category: "Roulette",
    tab: "Roulette",
    provider: "Kingmaker",
    banner: kingmakerImg,
    badge: "DOUBLE ZERO",
    players: "890",
    minBet: 25,
    maxBet: 50000,
    rtp: "94.7%",
    bgGradient: "linear-gradient(135deg, #713f12 0%, #3f2005 100%)",
  },

  // ── AE Sexy ──
  {
    id: "sexy_baccarat_classic",
    name: "Sexy Baccarat Classic",
    category: "Casino",
    tab: "AE Sexy",
    provider: "AE Sexy",
    banner: sexyBcrtImg,
    badge: "SEXY LIVE 👙",
    players: "3,890",
    minBet: 100,
    maxBet: 500000,
    rtp: "98.9%",
    isLive: true,
    bgGradient: "linear-gradient(135deg, #be185d 0%, #831843 100%)",
  },
  {
    id: "sexy_dragon_tiger",
    name: "Sexy Dragon Tiger",
    category: "Casino",
    tab: "AE Sexy",
    provider: "AE Sexy",
    banner: sexyBcrtImg,
    badge: "FAST DEAL",
    players: "2,140",
    minBet: 50,
    maxBet: 200000,
    rtp: "96.2%",
    isLive: true,
    bgGradient: "linear-gradient(135deg, #9d174d 0%, #700735 100%)",
  },
  {
    id: "sexy_roulette",
    name: "AE Sexy Roulette",
    category: "Roulette",
    tab: "AE Sexy",
    provider: "AE Sexy",
    banner: sexyBcrtImg,
    badge: "LIVE DEALER",
    players: "1,760",
    minBet: 50,
    maxBet: 150000,
    rtp: "97.3%",
    isLive: true,
    bgGradient: "linear-gradient(135deg, #881337 0%, #4c0519 100%)",
  },
  {
    id: "sexy_sic_bo",
    name: "Sexy Sic Bo Live",
    category: "Casino",
    tab: "AE Sexy",
    provider: "AE Sexy",
    banner: sexyBcrtImg,
    badge: "DICE SHAKER",
    players: "1,320",
    minBet: 50,
    maxBet: 100000,
    rtp: "97.2%",
    isLive: true,
    bgGradient: "linear-gradient(135deg, #9f1239 0%, #500724 100%)",
  },

  // ── Slots ──
  {
    id: "jili_fortune_gems",
    name: "Fortune Gems 2",
    category: "Slot Games",
    tab: "Slots",
    provider: "Jili",
    banner: jiliImg,
    badge: "HOT SLOT",
    players: "4,620",
    minBet: 10,
    maxBet: 50000,
    rtp: "97.0%",
    bgGradient: "linear-gradient(135deg, #a16207 0%, #713f12 100%)",
  },
  {
    id: "pragmatic_gates_of_olympus",
    name: "Gates of Olympus",
    category: "Slot Games",
    tab: "Slots",
    provider: "Pragmatic Play",
    banner: mac88Img,
    badge: "5000X",
    players: "5,890",
    minBet: 20,
    maxBet: 100000,
    rtp: "96.5%",
    bgGradient: "linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)",
  },
  {
    id: "pragmatic_sweet_bonanza",
    name: "Sweet Bonanza 1000",
    category: "Slot Games",
    tab: "Slots",
    provider: "Pragmatic Play",
    banner: mac88Img,
    badge: "TUMBLE WIN",
    players: "4,380",
    minBet: 20,
    maxBet: 80000,
    rtp: "96.5%",
    bgGradient: "linear-gradient(135deg, #db2777 0%, #be185d 100%)",
  },
  {
    id: "gamzix_buffalo_ice",
    name: "Buffalo Ice: Hold & Win",
    category: "Slot Games",
    tab: "Slots",
    provider: "Gamzix",
    banner: gamzixImg,
    badge: "JACKPOT",
    players: "2,190",
    minBet: 10,
    maxBet: 50000,
    rtp: "96.1%",
    bgGradient: "linear-gradient(135deg, #0369a1 0%, #075985 100%)",
  },
  {
    id: "evoplay_fruit_nova",
    name: "Fruit Nova Super",
    category: "Slot Games",
    tab: "Slots",
    provider: "Evoplay Entertainment",
    banner: evoplayImg,
    badge: "CLASSIC 777",
    players: "1,940",
    minBet: 10,
    maxBet: 40000,
    rtp: "96.0%",
    bgGradient: "linear-gradient(135deg, #701a75 0%, #4a044e 100%)",
  },

  // ── Color & Fun Games ──
  {
    id: "fun_games_color_prediction",
    name: "Color Prediction 30s",
    category: "Color Game",
    tab: "New Launch",
    provider: "Fun Games",
    banner: funGamesImg,
    badge: "FAST WIN",
    players: "3,740",
    minBet: 10,
    maxBet: 50000,
    rtp: "97.5%",
    bgGradient: "linear-gradient(135deg, #b45309 0%, #78350f 100%)",
  },
  {
    id: "kingmaker_3patti_gold",
    name: "3 Patti Gold Club",
    category: "Poker",
    tab: "Popular",
    provider: "Kingmaker",
    banner: kingmakerImg,
    badge: "DESI CARDS",
    players: "2,890",
    minBet: 50,
    maxBet: 150000,
    rtp: "96.4%",
    bgGradient: "linear-gradient(135deg, #4d7c0f 0%, #365314 100%)",
  },
];

// Fetch games with graceful fallback so UI is NEVER empty
export const fetchGamesCatalog = async (categoryOrTab = "all") => {
  try {
    const res = await api.get(`/games`, { params: { category: categoryOrTab } });
    if (res.data?.games && res.data.games.length > 0) {
      return res.data.games;
    }
  } catch (err) {
    // Graceful fallback to rich local catalog
  }

  const query = String(categoryOrTab || "all").toLowerCase().trim();
  if (query === "all" || query === "popular" || query === "home") {
    return CURATED_GAMES;
  }

  return CURATED_GAMES.filter((g) => {
    return (
      g.tab?.toLowerCase() === query ||
      g.category?.toLowerCase().includes(query) ||
      g.provider?.toLowerCase().includes(query)
    );
  });
};

// Filter games by tab ("Popular", "New Launch", "Roulette", "AE Sexy", "Slots")
export const getGamesByTab = (tab = "Popular") => {
  if (tab === "Popular") {
    return CURATED_GAMES.filter((g) => g.tab === "Popular");
  }
  if (tab === "New Launch") {
    return CURATED_GAMES.filter((g) => g.tab === "New Launch" || g.badge?.includes("NEW") || g.badge?.includes("1000X"));
  }
  if (tab === "Roulette") {
    return CURATED_GAMES.filter((g) => g.category?.includes("Roulette") || g.tab === "Roulette");
  }
  if (tab === "AE Sexy") {
    return CURATED_GAMES.filter((g) => g.provider === "AE Sexy" || g.tab === "AE Sexy");
  }
  if (tab === "Slots") {
    return CURATED_GAMES.filter((g) => g.category?.includes("Slot") || g.tab === "Slots");
  }
  return CURATED_GAMES;
};

// Get live games for the "Live Games" carousel
export const getLiveGames = () => {
  return CURATED_GAMES.filter((g) => g.isLive);
};

