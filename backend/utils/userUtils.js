const { getUserHistoryInDb } = require("../helpers/userHelpers");

const getUserHistorySongIds = async (userId) => {
  const userHistory = await getUserHistoryInDb(userId);
  return new Set(userHistory.history.map((entry) => entry.songId.toString()));
}

module.exports = { getUserHistorySongIds };