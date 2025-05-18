const channelSeeds = require('./channelSeeds');

async function initializeDatabase(Channel, Song) {
  const channelCount = await Channel.countDocuments();
  await Song.deleteMany({});
  console.log('[DB] Songs collection cleared');
  if (channelCount === 0) {
    console.log('[DB] No channels found, seeding...');
    await Channel.insertMany(channelSeeds);
    console.log('[DB] Channels seeded.');
  } else {
    // Add any missing channels from channelSeeds
    for (const seed of channelSeeds) {
      const exists = await Channel.findOne({ name: seed.name });
      if (!exists) {
        await new Channel(seed).save();
        console.log(`[DB] Channel added: ${seed.name}`);
      }
    }
  }
}

module.exports = { initializeDatabase };
