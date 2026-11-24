const axios = require("axios");

const PROXY_BASE_URL = "https://redtechapi.xyz/stream.php";
const REQUEST_TIMEOUT = 10000; // ms

// streamUrl is signed/time-limited, so keep this short
const CACHE_TTL_MS = 20 * 1000;
const streamCache = new Map();

function isValidId(val) {
  return typeof val === "string" && /^[A-Za-z0-9_-]+$/.test(val);
}

function getCacheKey(eventTypeId, eventId) {
  return `${eventTypeId}:${eventId}`;
}

/**
 * Calls your PHP proxy's combined "stream" action (chains getChannel -> getStreaming
 * on the proxy side) and returns the final streamUrl payload.
 */
const fetchStreamUrl = async (eventTypeId, eventId) => {
  if (!isValidId(eventTypeId) || !isValidId(eventId)) {
    const err = new Error("valid event_type_id and event_id are required");
    err.code = "INVALID_INPUT";
    throw err;
  }

  const cacheKey = getCacheKey(eventTypeId, eventId);
  const cached = streamCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.data;
  }

  let resp;
  try {
    resp = await axios.get(PROXY_BASE_URL, {
      params: {
        action: "stream",
        event_type_id: eventTypeId,
        event_id: eventId,
      },
      timeout: REQUEST_TIMEOUT,
      headers: { Accept: "application/json" },
    });
    console.log("Proxy Response:", resp.data);
  } catch (err) {
    console.error("Proxy Error:", {
      status: err.response?.status,
      data: err.response?.data,
      message: err.message,
      url: err.config?.url,
      params: err.config?.params,
    });

    const wrapped = new Error("Proxy stream request failed");
    wrapped.code = "UPSTREAM_ERROR";
    wrapped.cause = err.response?.data || err.message;
    throw wrapped;
  }

  if (!resp.data?.success || !resp.data?.streamUrl) {
    const err = new Error("Proxy returned unexpected response");
    err.code = "UPSTREAM_BAD_RESPONSE";
    err.raw = resp.data;
    throw err;
  }

  streamCache.set(cacheKey, { data: resp.data, ts: Date.now() });

  return resp.data;
};

module.exports = { fetchStreamUrl };
