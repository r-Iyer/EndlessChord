/**
* Ensure the channel’s genres/langs are arrays.
*/
const normalizeBaseFields = (channel) => {
  // Defensive: handle null/undefined or empty strings gracefully
  const baseGenres = Array.isArray(channel.genre)
    ? channel.genre
    : channel.genre ? [channel.genre] : [];
  const baseLangs = Array.isArray(channel.language)
    ? channel.language
    : channel.language ? [channel.language] : [];
  
  return { baseGenres, baseLangs };
};

/**
* Create a dummy channel with the search query as description and language as various
*/
const createChannelWithSearchQuery = (searchQuery) => {
  const searchChannel = {
    name: "",
    language: "various",
    description: searchQuery || "",  // Defensive: ensure string
    genre: [] 
  };
  return searchChannel;
};

module.exports = {
  normalizeBaseFields,
  createChannelWithSearchQuery
};
