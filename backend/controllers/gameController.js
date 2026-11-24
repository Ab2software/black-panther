const axios = require("axios");
const User = require("../model/User");
const { encryptPayloadECB } = require("../utils/encrypt");
const GameTransaction = require("../model/GameTransaction");

const TOKEN = process.env.IGAMINGTOKEN;
const SECRET = process.env.IGAMINGSECRET;

// Example:
// IGAMINGSERVER=https://igamingapis.live/api/v1
const SERVER_URL =
  process.env.IGAMINGSERVER || "https://igamingapis.live/api/v1";

const BASE_URL = process.env.BASE_URL;

// =====================================================
// GET USER
// =====================================================
const getUserById = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      console.log("❌ User not found");
      return null;
    }

    return user;
  } catch (err) {
    console.log("❌ getUserById ERROR:", err);
    throw err;
  }
};

// =====================================================
// 🚫 UNAVAILABLE GAME TRACKING
// =====================================================

const unavailableGames = new Map();

const UNAVAILABLE_TTL_MS = 3 * 60 * 1000; // 3 minutes

function markGameUnavailable(gameUid) {
  unavailableGames.set(String(gameUid), Date.now());
}

function isGameUnavailable(gameUid) {
  const ts = unavailableGames.get(String(gameUid));

  if (!ts) return false;

  if (Date.now() - ts > UNAVAILABLE_TTL_MS) {
    unavailableGames.delete(String(gameUid));
    return false;
  }

  return true;
}

// =====================================================
// 🎮 LAUNCH GAME
// SoftAPI: POST /api/v1
// =====================================================

const launchGame = async (req, res) => {
  try {
    const userId = req.body.userId || req.body.user_id;
    const gameUid = req.body.gameUid || req.body.game_uid;

    if (!userId || !gameUid) {
      console.log("❌ Missing required fields");

      return res.status(400).json({
        error: "userId and gameUid are required",
      });
    }

    const user = await getUserById(userId);

    if (!user) {
      console.log("❌ USER NOT FOUND");

      return res.status(404).json({
        error: "User not found",
      });
    }

    if (user.isDemoUser) {
      console.log("⚠️ Demo user blocked");

      return res.status(403).json({
        success: false,
        isDemoBlocked: true,
        message:
          "Demo accounts cannot play games. Please register to continue.",
      });
    }

    // ==========================================
    // SOFTAPI LAUNCH PAYLOAD
    // ==========================================

    const payload = {
      user_id: String(user.providerUserId),
      balance: Number(user.wallet?.availableBalance || 0),
      game_uid: String(gameUid),
      token: TOKEN,
      timestamp: Date.now(),

      return: `${BASE_URL}/return`,
      callback: `${BASE_URL}/api/callback`,

      currency_code: "INR",
      language: "en",
    };

    console.log("🎮 Launch payload:", {
      user_id: payload.user_id,
      balance: payload.balance,
      game_uid: payload.game_uid,
      currency_code: payload.currency_code,
    });

    // ==========================================
    // AES-256-ECB + PKCS7 + BASE64
    // ==========================================

    const encrypted = encryptPayloadECB(payload, SECRET);

    // ==========================================
    // SOFTAPI DOCUMENTATION:
    //
    // POST https://igamingapis.live/api/v1
    //
    // {
    //   token: TOKEN,
    //   payload: encrypted
    // }
    // ==========================================

    const response = await axios.post(
      SERVER_URL,
      {
        token: TOKEN,
        payload: encrypted,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: 60000,
      }
    );

    console.log("🎮 SoftAPI launch response:");
    console.log(JSON.stringify(response.data, null, 2));

    // ==========================================
    // SUCCESS
    // ==========================================

    if (
      response.data?.code === 0 &&
      response.data?.data?.url
    ) {
      return res.json({
        success: true,
        url: response.data.data.url,
      });
    }

    // ==========================================
    // GAME NOT FOUND / UNAVAILABLE
    // ==========================================

    if (
      response.data?.code === 1 ||
      /game not found/i.test(response.data?.msg || "")
    ) {
      markGameUnavailable(gameUid);

      console.log(
        `🚫 Marked game ${gameUid} unavailable: ${response.data?.msg}`
      );
    }

    return res.status(400).json(response.data);
  } catch (err) {
    console.error("\n❌ LAUNCH GAME ERROR ❌");
    console.error("MESSAGE:", err.message);
    console.error("STACK:", err.stack);

    if (err.response) {
      console.error("\n📡 API ERROR RESPONSE:");
      console.error("STATUS:", err.response.status);
      console.error(
        "DATA:",
        JSON.stringify(err.response.data, null, 2)
      );
    }

    return res.status(500).json({
      error: err.message,
      details: err.response?.data || null,
    });
  }
};

// =====================================================
// 🎮 GET GAMES
// SoftAPI Games API
//
// GET /api/v1/games
//
// brand_id
// limit max 500
// offset pagination
// =====================================================

const vendorGamesCache = new Map();

const VENDOR_CACHE_TTL_MS = 5 * 60 * 1000;

// =====================================================
// FETCH ALL GAMES FROM SOFTAPI FOR BRAND
// =====================================================

async function fetchFullGameListFromVendor(brandId) {
  const cacheKey = String(brandId);

  const cached = vendorGamesCache.get(cacheKey);

  if (
    cached &&
    Date.now() - cached.timestamp < VENDOR_CACHE_TTL_MS
  ) {
    console.log(
      `[brand ${brandId}] returning ${cached.games.length} games from cache`
    );

    return cached.games;
  }

  // ==========================================
  // FETCH ALL PAGES
  // SoftAPI maximum limit = 500
  // ==========================================

  const allGames = [];

  let offset = 0;
  const limit = 500;

  while (true) {
    console.log(
      `[brand ${brandId}] fetching games offset=${offset}, limit=${limit}`
    );

    const response = await axios.get(
      `${SERVER_URL}/games`,
      {
        params: {
          token: TOKEN,
          brand_id: brandId,
          limit,
          offset,
        },

        headers: {
          Accept: "application/json",
        },

        timeout: 60000,
      }
    );

    if (response.data?.code !== 0) {
      const err = new Error(
        response.data?.msg || "Failed to fetch games"
      );

      err.raw = response.data;

      throw err;
    }

    const data = response.data?.data;

    if (!data || !Array.isArray(data.games)) {
      const err = new Error(
        "Invalid games data from SoftAPI"
      );

      err.raw = response.data;

      throw err;
    }

    const games = data.games;

    console.log(
      `[brand ${brandId}] received ${games.length} games`
    );

    allGames.push(...games);

    // ==========================================
    // STOP CONDITIONS
    // ==========================================

    // No more games
    if (games.length < limit) {
      break;
    }

    // If API gives total, use it
    if (
      typeof data.total === "number" &&
      allGames.length >= data.total
    ) {
      break;
    }

    offset += limit;

    // Safety protection
    if (offset > 100000) {
      console.log(
        "⚠️ Safety limit reached while fetching games"
      );
      break;
    }
  }

  // ==========================================
  // FORMAT GAMES
  // ==========================================

  const seen = new Set();

  const formatted = allGames
    .map((game) => {
      const gameUid =
        game.game_uid != null
          ? String(game.game_uid)
          : game.game_id != null
          ? String(game.game_id)
          : null;

      if (!gameUid) return null;

      return {
        name: game.name,
        game_uid: gameUid,
        category: game.category,
        provider: game.provider,
        brand_id: game.brand_id,
        image: game.logo,
        currency_supported:
          game.currency_supported,
      };
    })
    .filter((game) => {
      if (!game) return false;

      if (seen.has(game.game_uid)) {
        return false;
      }

      seen.add(game.game_uid);

      return true;
    });

  // ==========================================
  // CACHE
  // ==========================================

  vendorGamesCache.set(cacheKey, {
    games: formatted,
    timestamp: Date.now(),
  });

  console.log(
    `✅ [brand ${brandId}] total unique games: ${formatted.length}`
  );

  return formatted;
}

// =====================================================
// GET GAMES API
//
// Example:
// GET /games?brandId=59
// =====================================================

const getGames = async (req, res) => {
  try {
    const { brandId } = req.query;

    if (!brandId) {
      console.log("❌ brandId missing");

      return res.status(400).json({
        error: "brandId is required",
      });
    }

    // ==========================================
    // FETCH GAMES
    // ==========================================

    const allGames =
      await fetchFullGameListFromVendor(brandId);

    // ==========================================
    // REMOVE TEMPORARILY UNAVAILABLE GAMES
    // ==========================================

    const availableGames = allGames.filter(
      (game) => !isGameUnavailable(game.game_uid)
    );

    if (availableGames.length !== allGames.length) {
      console.log(
        `[brand ${brandId}] filtered out ${
          allGames.length - availableGames.length
        } unavailable game(s)`
      );
    }

    // ==========================================
    // CACHE HEADER
    // ==========================================

    res.set(
      "Cache-Control",
      "public, max-age=120"
    );

    return res.json({
      success: true,
      brand_id: String(brandId),
      games: availableGames,
      total: availableGames.length,
    });
  } catch (err) {
    console.error("\n❌ FETCH GAMES ERROR ❌");
    console.error("MESSAGE:", err.message);

    if (err.response) {
      console.error(
        "STATUS:",
        err.response.status
      );

      console.error(
        "DATA:",
        JSON.stringify(
          err.response.data,
          null,
          2
        )
      );
    }

    return res.status(500).json({
      error: "Failed to fetch games",
      details:
        err.response?.data ||
        err.raw ||
        err.message,
    });
  }
};

// =====================================================
// 🎮 GAME HISTORY
// =====================================================

const getGameHistory = async (req, res) => {
  try {
    console.log(req.params);

    const { userId } = req.params;

    if (!userId || userId.length !== 24) {
      console.log("❌ Invalid userId format");

      return res.status(400).json({
        success: false,
        error: "Invalid userId",
      });
    }

    const history = await GameTransaction.find({
      userId,
    })
      .sort({ createdAt: -1 })
      .limit(100);

    const formatted = history.map((item) => ({
      id: item._id,
      gameUid: item.gameUid,
      gameName:
        item.gameName || item.gameUid,
      gameRound: item.gameRound,
      betAmount: item.betAmount,
      winAmount: item.winAmount,
      balanceAfter: item.balanceAfter,
      result: item.result,
      playedAt: item.createdAt,
    }));

    return res.json({
      success: true,
      history: formatted,
    });
  } catch (err) {
    console.error("\n❌ HISTORY ERROR ❌");
    console.error("MESSAGE:", err.message);
    console.error("STACK:", err.stack);

    return res.status(500).json({
      success: false,
      error: "Failed to fetch history",
    });
  }
};

// =====================================================
// 🔎 GAME NAME LOOKUP
// =====================================================

function getGameNameByUid(gameUid) {
  const uid = String(gameUid);

  for (const { games } of vendorGamesCache.values()) {
    const match = games.find(
      (game) => game.game_uid === uid
    );

    if (match) {
      return match.name;
    }
  }

  return null;
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  launchGame,
  getGames,
  getGameHistory,
  getGameNameByUid,
};