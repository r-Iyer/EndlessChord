async function initializeDatabase(Channel, Song) {
  const channelCount = await Channel.countDocuments();
  await Song.deleteMany({});
  console.log('[DB] Songs collection cleared');
  if (channelCount === 0) {
    console.log('[DB] No channels found, seeding...');
    const hindiChannel = new Channel({
      name: 'Hindi Hits',
      description: 'Popular Hindi music from Bollywood and beyond',
      language: 'hindi',
      genre: 'various',
      seedSongs: []
    });
    const englishChannel = new Channel({
      name: 'English Pop',
      description: 'Top English pop hits from around the world',
      language: 'english',
      genre: 'pop',
      seedSongs: []
    });
    await Promise.all([
      hindiChannel.save(),
      englishChannel.save()
    ]);
    console.log('[DB] Channels seeded.');
  }
}

module.exports = { initializeDatabase };
