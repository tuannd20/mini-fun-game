const { Game, Bet, User } = require("../models");
const { rollDice, countSymbols } = require("../utils/dice");
const { calculatePayout, getBetStatus } = require("../utils/payout");
const { calculateOptimalDiceResults } = require("../utils/oddsCalculator");

let currentGame = null;
let gameTimer = null;
let bettingEndTime = null;

const BETTING_DURATION = parseInt(process.env.BETTING_TIMER) || 30; // seconds
const ROLLING_DURATION = 3; // seconds for dice animation
const RESULTS_DURATION = 5; // seconds to show results

/**
 * Get or create current game
 */
async function getCurrentGame() {
	if (!currentGame || currentGame.status === "results") {
		// Create new game
		if (currentGame && currentGame.status === "results") {
			currentGame.ended_at = new Date();
			await currentGame.save();
		}
		currentGame = await Game.create({
			status: "waiting",
		});
	}
	return currentGame;
}

/**
 * Start betting phase
 */
async function startBettingPhase(io) {
	// Clear any existing timer
	if (gameTimer) {
		clearInterval(gameTimer);
		gameTimer = null;
	}

	const game = await getCurrentGame();
	game.status = "betting";
	game.started_at = new Date();
	await game.save();

	// Set betting timer
	bettingEndTime = Date.now() + BETTING_DURATION * 1000;

	// Emit timer updates every second
	gameTimer = setInterval(() => {
		const timeLeft = Math.max(0, Math.ceil((bettingEndTime - Date.now()) / 1000));
		io.emit("betting-timer", { timeLeft, totalTime: BETTING_DURATION });

		if (timeLeft === 0) {
			clearInterval(gameTimer);
			gameTimer = null;
			// Betting time expired - disable betting but don't auto-start rolling
			// Admin must manually start the rolling phase
			io.emit("betting-expired", { message: "Betting time expired" });
		}
	}, 1000);

	io.emit("game-state", { status: "betting", gameId: game._id.toString() });
}

/**
 * Start rolling phase
 */
async function startRollingPhase(io) {
	const game = await getCurrentGame();
	game.status = "rolling";
	await game.save();

	io.emit("game-state", { status: "rolling", gameId: game._id.toString() });
	io.emit("dice-roll", { message: "Rolling dice..." });

	// Wait for animation, then calculate optimal dice results
	setTimeout(async () => {
		// Get previous winning symbols from the last completed game
		let previousWinners = [];
		try {
			const lastGame = await Game.findOne({
				ended_at: { $ne: null },
				winning_symbols: { $exists: true, $ne: [] },
			})
				.sort({ ended_at: -1 })
				.limit(1);

			if (lastGame && lastGame.winning_symbols) {
				previousWinners = lastGame.winning_symbols;
			}
		} catch (error) {
			console.error("Error fetching previous winners:", error);
		}

		// Calculate optimal dice results based on bets and admin rules
		let diceResults;
		try {
			diceResults = await calculateOptimalDiceResults(
				game._id.toString(),
				previousWinners
			);
		} catch (error) {
			console.error("Error calculating optimal dice results:", error);
			// Fallback to random roll if calculation fails
			diceResults = rollDice();
		}

		const symbolCounts = countSymbols(diceResults);

		// Extract winning symbols (symbols that appear in dice results)
		const winningSymbols = Object.keys(symbolCounts).filter(
			(symbol) => symbolCounts[symbol] > 0
		);

		game.dice_results = diceResults;
		game.winning_symbols = winningSymbols;
		game.status = "results";
		await game.save();

		// Process payouts and get winners
		const winners = await processPayouts(game, diceResults, io);

		// Show results
		io.emit("game-result", {
			diceResults,
			symbolCounts,
			winners,
			gameId: game._id.toString(),
		});

		// After showing results, return to waiting status (admin must start next round)
		setTimeout(async () => {
			game.status = "waiting";
			game.ended_at = new Date();
			await game.save();
			io.emit("game-state", { status: "waiting", gameId: game._id.toString() });

			// Emit updated game history after round completes
			try {
				const history = await getGameHistory(10);
				io.emit("game-history", history);
			} catch (error) {
				console.error("Error getting game history:", error);
			}
		}, RESULTS_DURATION * 1000);
	}, ROLLING_DURATION * 1000);
}

/**
 * Process payouts for all bets in the game
 */
async function processPayouts(game, diceResults, io) {
	const bets = await Bet.find({
		gameId: game._id,
		status: "pending",
	}).populate("userId");

	const winners = [];

	for (const bet of bets) {
		const payout = calculatePayout(bet.symbol, diceResults, bet.amount);
		const status = getBetStatus(bet.symbol, diceResults);

		bet.payout = payout;
		bet.status = status;
		await bet.save();

		// Update user balance
		const user = bet.userId; // populated User document
		if (status === "won") {
			user.balance += payout;
			user.total_wins += 1;

			// Add to winners array
			winners.push({
				userId: user._id.toString(),
				username: user.username,
				symbol: bet.symbol,
				betAmount: bet.amount,
				payout: payout,
			});
		} else {
			user.total_losses += 1;
		}
		await user.save();

		// Emit balance update
		io.emit("player-update", {
			userId: user._id.toString(),
			username: user.username,
			balance: user.balance,
		});
	}

	return winners;
}

/**
 * Place a bet
 */
async function placeBet(userId, symbol, amount) {
	const game = await getCurrentGame();

	if (game.status !== "betting") {
		throw new Error("Betting is not active");
	}

	// Check if betting time has expired
	if (bettingEndTime && Date.now() >= bettingEndTime) {
		throw new Error("Betting time has expired");
	}

	const user = await User.findById(userId);
	if (!user) {
		throw new Error("User not found");
	}

	if (user.balance < amount) {
		throw new Error("Insufficient balance");
	}

	const minBet = parseInt(process.env.MIN_BET) || 1;
	const maxBet = parseInt(process.env.MAX_BET) || 1000;

	if (amount < minBet || amount > maxBet) {
		throw new Error(`Bet amount must be between ${minBet} and ${maxBet}`);
	}

	// Deduct bet amount from balance
	user.balance -= amount;
	await user.save();

	// Create bet
	const bet = await Bet.create({
		userId: userId,
		gameId: game._id,
		symbol,
		amount,
		status: "pending",
	});

	return bet;
}

/**
 * Get game state
 */
async function getGameState() {
	if (!currentGame) {
		return { status: "waiting" };
	}

	const game = await Game.findById(currentGame._id);

	// Get bets separately since we don't have a direct relationship
	const bets = await Bet.find({ gameId: game._id }).populate("userId");

	return {
		status: game.status,
		gameId: game._id.toString(),
		diceResults: game.dice_results,
		bets: bets,
	};
}

/**
 * Get all players
 */
async function getAllPlayers() {
	const users = await User.find().sort({ balance: -1 });

	return users.map((user) => ({
		id: user._id.toString(),
		username: user.username,
		balance: user.balance,
		total_wins: user.total_wins,
		total_losses: user.total_losses,
	}));
}

/**
 * Get game history
 */
async function getGameHistory(limit = 10) {
	const games = await Game.find({
		status: "results",
		ended_at: { $ne: null },
	})
		.sort({ ended_at: -1 })
		.limit(limit);

	const history = await Promise.all(
		games.map(async (game) => {
			// Get bets for this game
			const bets = await Bet.find({ gameId: game._id }).populate("userId");
			const winningBets = bets.filter((bet) => bet.status === "won");

			// Count symbols in dice results
			const symbolCounts = {};
			if (game.dice_results) {
				game.dice_results.forEach((symbol) => {
					symbolCounts[symbol] = (symbolCounts[symbol] || 0) + 1;
				});
			}

			return {
				gameId: game._id.toString(),
				diceResults: game.dice_results || [],
				symbolCounts,
				started_at: game.started_at,
				ended_at: game.ended_at,
				totalBets: bets.length,
				totalWinners: winningBets.length,
				totalPayout: winningBets.reduce((sum, bet) => sum + bet.payout, 0),
			};
		})
	);

	return history;
}

module.exports = {
	getCurrentGame,
	startBettingPhase,
	startRollingPhase,
	placeBet,
	getGameState,
	getAllPlayers,
	getGameHistory,
};
