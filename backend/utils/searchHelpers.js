const createSearchRegex = (searchQuery) => {
  const words = searchQuery.split(/\s+/)
  .filter(w => w.length > 2)
  .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`\\b(?:${words.join('|')})\\b`, 'i');
};

const buildSearchQuery = (searchRegex, excludeIds) => {
  const query = {
    $or: [
      { title: searchRegex },
      { artist: searchRegex },
      { composer: searchRegex },
      { description: searchRegex },
      { tags: searchRegex },
      { genre: { $in: [searchRegex] } },
      { language: { $in: [searchRegex] } }
    ]
  };
  
  if (excludeIds.length > 0) {
    query.videoId = { $nin: excludeIds };
  }
  
  return query;
};

module.exports = {
  createSearchRegex,
  buildSearchQuery
};
