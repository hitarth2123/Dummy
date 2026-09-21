// Learning-path service boundary. Generation details remain backward-compatible while
// callers no longer depend on the mock-test service name.
const { upsertLearningPath, generateTopicMaterial } = require('./mockTest.service');

module.exports = { upsertLearningPath, generateTopicMaterial };
