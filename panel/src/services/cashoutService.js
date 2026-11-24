import api from "../utils/api";

/**
 * Submit a cashout request for a pending bet.
 *
 * @param {string} betId          - The bet's betId field (string, not _id)
 * @param {number} cashOutValue   - The cashout value shown to the user
 * @returns {Promise<{ success, data: { bet, wallet }, message }>}
 */
export const cashOutBet = async (betId, cashOutValue) => {
  const response = await api.post("/bets/cashout", { betId, cashOutValue });
  return response.data;
};