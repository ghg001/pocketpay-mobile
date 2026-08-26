class EventSource {
  constructor() {
    throw new Error(
      "Horizon streaming (EventSource/SSE) is not supported in this app. " +
        "See src/shims/eventsource.js.",
    );
  }
}

module.exports = EventSource;
module.exports.EventSource = EventSource;
module.exports.default = EventSource;
