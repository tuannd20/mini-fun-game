const { countSymbols } = require('./dice');

/**
 * Calculate payout for a bet
 * @param {string} symbol - The symbol the player bet on
 * @param {string[]} diceResults - Array of 3 dice results
 * @param {number} betAmount - Amount bet
 * @returns {number} Payout amount (0 if lost, betAmount * occurrences if won)
 */
function calculatePayout(symbol, diceResults, betAmount) {
  const symbolCounts = countSymbols(diceResults);
  const occurrences = symbolCounts[symbol] || 0;
  
  if (occurrences > 0) {
    // Player wins: 1:1 payout for each occurrence
    return betAmount * occurrences;
  }
  
  // Player loses
  return 0;
}

/**
 * Determine bet status (won/lost)
 * @param {string} symbol - The symbol the player bet on
 * @param {string[]} diceResults - Array of 3 dice results
 * @returns {string} 'won' or 'lost'
 */
function getBetStatus(symbol, diceResults) {
  const symbolCounts = countSymbols(diceResults);
  return symbolCounts[symbol] > 0 ? 'won' : 'lost';
}

module.exports = {
  calculatePayout,
  getBetStatus,
};

