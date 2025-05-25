const createSearchRegex = (searchQuery) => {
  const words = searchQuery.split(/\s+/)
  .filter(w => w.length > 2)
  .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`\\b(?:${words.join('|')})\\b`, 'i');
};

const buildSearchQuery = (searchRegex, excludeIds) => ({
  $and: [
    {
      $or: [
        { title:       searchRegex },
        { artist:      searchRegex },
        { composer:    searchRegex },
        { description: searchRegex },
        { tags:        searchRegex },
        { genre:       searchRegex },
        { language:    searchRegex }
      ]
    },
    {
      videoId: { $nin: excludeIds }
    }
  ]
});


module.exports = {
  createSearchRegex,
  buildSearchQuery
};
