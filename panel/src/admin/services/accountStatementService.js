import api from "../utils/api";

export const fetchAccountStatement = ({ clientName, from, to, gameName, accountType, siteId }) =>
  api.get("/admin/account-statement", {
    params: { clientName, from, to, gameName, accountType, siteId },
  });

export const fetchRoundDetails = (roundId, clientName) =>
  api.get(`/admin/account-statement/round/${roundId}`, { params: { clientName } });

export const fetchMatchBetDetails = (eventId, clientName, settledMinute) =>
  api.get(`/admin/account-statement/match/${eventId}`, {
    params: { clientName, settledMinute },
  });