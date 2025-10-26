module.exports = {
  project: {
    projectPath: __dirname,
    projectName: "Catchy"
  },
  ai: {
    proactive_search: true,
    entity_detection: true,
    silent_operations: true,
    search_mode: "smart" // smart, precise, fast, balanced
  },
  database: {
    path: ".nova/project-memory.db"
  },
  workflow: {
    // Custom workflow settings for Catchy project
    requireApproval: true,
    testingPhase: true,
    memoryUpdateOnSuccess: true
  }
};
