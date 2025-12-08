const Sequencer = require('@jest/test-sequencer').default;

class CustomSequencer extends Sequencer {
  /**
   * Sort tests alphabetically by their path
   * This ensures numbered test files (01-, 02-, etc.) run in order
   */
  sort(tests) {
    return [...tests].sort((a, b) => {
      return a.path.localeCompare(b.path);
    });
  }
}

module.exports = CustomSequencer;

