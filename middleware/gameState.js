/**
 * Middleware to validate game state for betting
 */
function validateBettingState(req, res, next) {
  // This will be used in socket handlers, not HTTP routes
  // Placeholder for future HTTP API validation
  next();
}

module.exports = {
  validateBettingState,
};

