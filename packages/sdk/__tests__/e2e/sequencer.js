class AlphabeticalSequencer {
  sort(tests) {
    return [...tests].sort((a, b) => a.path.localeCompare(b.path));
  }

  shard(tests) {
    return tests;
  }

  cacheResults() {}
}

module.exports = AlphabeticalSequencer;
