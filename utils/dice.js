// Christmas symbols - belike design characters
const SYMBOLS = ["reindeer", "potion", "shrimp", "crab", "fish", "chicken"];

/**
 * Roll 3 dice and return the results
 * @returns {string[]} Array of 3 symbol names
 */
function rollDice() {
	const results = [];
	for (let i = 0; i < 3; i++) {
		const randomIndex = Math.floor(Math.random() * SYMBOLS.length);
		results.push(SYMBOLS[randomIndex]);
	}
	return results;
}

/**
 * Count occurrences of each symbol in dice results
 * @param {string[]} diceResults - Array of 3 symbol names
 * @returns {Object} Object with symbol counts
 */
function countSymbols(diceResults) {
	const counts = {};
	SYMBOLS.forEach((symbol) => {
		counts[symbol] = 0;
	});

	diceResults.forEach((symbol) => {
		if (counts.hasOwnProperty(symbol)) {
			counts[symbol]++;
		}
	});

	return counts;
}

module.exports = {
	SYMBOLS,
	rollDice,
	countSymbols,
};
