const { Bet } = require("../models");
const { SYMBOLS } = require("./dice");

// Configuration - can be overridden by environment variables
const LOW_BET_PERCENTAGE = parseFloat(process.env.LOW_BET_PERCENTAGE) || 0.1; // Bottom 10%
const BET_AMOUNT_WEIGHT = parseFloat(process.env.FC_BET_AMOUNT_WEIGHT) || 1.0;
const PLAYER_COUNT_WEIGHT = parseFloat(process.env.FC_PLAYER_COUNT_WEIGHT) || 100; // Player count weighted more

/**
 * Calculate FC odds for each symbol based on bets
 * @param {Array} bets - Array of bet documents
 * @returns {Object} Object with symbol stats: { symbol: { totalBetAmount, playerCount, fcOdds } }
 */
function calculateFCOdds(bets) {
	const symbolStats = {};

	// Initialize all symbols
	SYMBOLS.forEach((symbol) => {
		symbolStats[symbol] = {
			totalBetAmount: 0,
			playerCount: 0,
			playerIds: new Set(),
			fcOdds: 0,
		};
	});

	// Calculate stats for each symbol
	bets.forEach((bet) => {
		const symbol = bet.symbol;
		if (symbolStats[symbol]) {
			symbolStats[symbol].totalBetAmount += bet.amount;
			symbolStats[symbol].playerIds.add(bet.userId.toString());
		}
	});

	// Calculate player counts and FC odds
	Object.keys(symbolStats).forEach((symbol) => {
		symbolStats[symbol].playerCount = symbolStats[symbol].playerIds.size;
		symbolStats[symbol].fcOdds =
			symbolStats[symbol].totalBetAmount * BET_AMOUNT_WEIGHT + symbolStats[symbol].playerCount * PLAYER_COUNT_WEIGHT;
	});

	return symbolStats;
}

/**
 * Get eligible winning symbols based on FC odds and rules
 * @param {Object} symbolStats - Symbol statistics from calculateFCOdds
 * @param {Array} previousWinners - Array of symbols that won in previous round
 * @returns {Array} Array of eligible symbol names
 */
function getEligibleWinningSymbols(symbolStats, previousWinners = []) {
	// Convert to array and sort by FC odds
	const symbolsArray = Object.keys(symbolStats).map((symbol) => ({
		symbol,
		...symbolStats[symbol],
	}));

	// Sort by FC odds (ascending - lower is better)
	symbolsArray.sort((a, b) => a.fcOdds - b.fcOdds);

	// Calculate threshold for bottom percentage
	const thresholdIndex = Math.floor(symbolsArray.length * LOW_BET_PERCENTAGE);
	const thresholdFC = symbolsArray[thresholdIndex]?.fcOdds || 0;

	// Filter eligible symbols:
	// 1. Bottom 10% by FC odds (or equal to threshold)
	// 2. Not in previous winners
	const eligible = symbolsArray.filter((item) => {
		const isLowFC = item.fcOdds <= thresholdFC;
		const notPreviousWinner = !previousWinners.includes(item.symbol);
		return isLowFC && notPreviousWinner;
	});

	// If no eligible symbols (all were previous winners or all have high FC),
	// use all symbols except previous winners, or if all were previous winners, use all symbols
	if (eligible.length === 0) {
		const nonPreviousWinners = symbolsArray.filter((item) => !previousWinners.includes(item.symbol)).map((item) => item.symbol);

		// If all symbols were previous winners, allow all symbols (we have no choice)
		if (nonPreviousWinners.length === 0) {
			return symbolsArray.map((item) => item.symbol);
		}

		return nonPreviousWinners;
	}

	// Sort by priority: 0 bets > fewer players > lower FC > lower total bet
	eligible.sort((a, b) => {
		// Priority 1: Symbols with 0 bets (highest priority)
		if (a.totalBetAmount === 0 && b.totalBetAmount > 0) return -1;
		if (a.totalBetAmount > 0 && b.totalBetAmount === 0) return 1;

		// Priority 2: Fewer players
		if (a.playerCount !== b.playerCount) {
			return a.playerCount - b.playerCount;
		}

		// Priority 3: Lower total bet amount
		if (a.totalBetAmount !== b.totalBetAmount) {
			return a.totalBetAmount - b.totalBetAmount;
		}

		// Priority 4: Lower FC odds
		return a.fcOdds - b.fcOdds;
	});

	return eligible.map((item) => item.symbol);
}

/**
 * Generate optimal dice results based on eligible symbols
 * @param {Array} eligibleSymbols - Array of eligible symbol names
 * @param {Object} symbolStats - Symbol statistics
 * @returns {Array} Array of 3 symbol names for dice results
 */
function generateOptimalDiceResults(eligibleSymbols, symbolStats) {
	// If no eligible symbols, fallback to all symbols (shouldn't happen)
	if (eligibleSymbols.length === 0) {
		return [SYMBOLS[0], SYMBOLS[0], SYMBOLS[0]];
	}

	// If all symbols have same FC odds, ensure only one win per square
	// Check if all eligible symbols have the same FC odds
	const firstFC = symbolStats[eligibleSymbols[0]]?.fcOdds || 0;
	const allSameFC = eligibleSymbols.every((symbol) => symbolStats[symbol]?.fcOdds === firstFC);

	if (allSameFC && eligibleSymbols.length > 1) {
		// Each symbol appears only once
		const results = [];
		// Use up to 3 different symbols, one occurrence each
		for (let i = 0; i < Math.min(3, eligibleSymbols.length); i++) {
			results.push(eligibleSymbols[i]);
		}
		// Fill remaining slots with the first symbol if needed
		while (results.length < 3) {
			results.push(eligibleSymbols[0]);
		}
		return results;
	}

	// Normal case: prioritize symbols with lowest payout potential
	// Sort eligible symbols by potential payout (total bet amount * occurrences)
	const sortedByPayout = [...eligibleSymbols].sort((a, b) => {
		const payoutA = symbolStats[a]?.totalBetAmount || 0;
		const payoutB = symbolStats[b]?.totalBetAmount || 0;
		return payoutA - payoutB;
	});

	// Generate results: use the lowest payout symbols
	// Try to minimize total payout by using symbols with lowest bet amounts
	const results = [];
	const symbolCounts = {};

	// First, add one occurrence of the best symbol (lowest payout)
	const bestSymbol = sortedByPayout[0];
	results.push(bestSymbol);
	symbolCounts[bestSymbol] = 1;

	// Fill remaining 2 slots
	for (let i = 1; i < 3; i++) {
		// Prefer symbols that already appear (to minimize unique winners)
		// But also consider payout
		let chosenSymbol = bestSymbol; // Default to best symbol

		// If we can use a symbol that already appears and has low payout, do that
		for (const symbol of sortedByPayout) {
			if (symbolCounts[symbol] && symbolCounts[symbol] < 3) {
				chosenSymbol = symbol;
				break;
			}
		}

		// Otherwise, use the next best symbol
		if (chosenSymbol === bestSymbol && sortedByPayout.length > 1) {
			chosenSymbol = sortedByPayout[Math.min(i, sortedByPayout.length - 1)];
		}

		results.push(chosenSymbol);
		symbolCounts[chosenSymbol] = (symbolCounts[chosenSymbol] || 0) + 1;
	}

	return results;
}

/**
 * Calculate optimal dice results for admin to minimize losses
 * @param {string} gameId - Current game ID
 * @param {Array} previousWinners - Array of symbols that won in previous round
 * @returns {Promise<Array>} Array of 3 symbol names for dice results
 */
async function calculateOptimalDiceResults(gameId, previousWinners = []) {
	// Fetch all bets for the current game
	const bets = await Bet.find({
		gameId: gameId,
		status: "pending",
	});

	// Calculate FC odds for each symbol
	const symbolStats = calculateFCOdds(bets);

	// Get eligible winning symbols
	const eligibleSymbols = getEligibleWinningSymbols(symbolStats, previousWinners);

	// Generate optimal dice results
	const diceResults = generateOptimalDiceResults(eligibleSymbols, symbolStats);

	return diceResults;
}

module.exports = {
	calculateOptimalDiceResults,
	calculateFCOdds,
	getEligibleWinningSymbols,
	generateOptimalDiceResults,
};
