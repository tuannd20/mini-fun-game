const {
	placeBet,
	getGameState,
	getAllPlayers,
	startBettingPhase,
	startRollingPhase,
	getGameHistory,
} = require("../controllers/gameController");
const { getUserById } = require("../controllers/userController");

// Store active socket connections
const activeUsers = new Map();

function setupSocket(io) {
	// Socket.io authentication middleware
	io.use(async (socket, next) => {
		const session = socket.request.session;
		if (session && session.userId) {
			socket.userId = session.userId;
			socket.username = session.username;
			next();
		} else {
			next(new Error("Authentication failed"));
		}
	});

	io.on("connection", async (socket) => {
		console.log(`User connected: ${socket.username} (${socket.userId})`);

		// Add to active users
		activeUsers.set(socket.userId, {
			socketId: socket.id,
			userId: socket.userId,
			username: socket.username,
		});

		// Get user info and emit
		try {
			const user = await getUserById(socket.userId);
			socket.userRole = user.role; // Store role in socket for quick access
			socket.emit("user-info", {
				id: user._id.toString(),
				username: user.username,
				balance: user.balance,
				role: user.role,
			});
		} catch (error) {
			console.error("Error getting user info:", error);
		}

		// Send current game state
		try {
			const gameState = await getGameState();
			socket.emit("game-state", gameState);

			// Send current players
			const players = await getAllPlayers();
			socket.emit("players-list", players);

			// Send game history
			const history = await getGameHistory(10);
			socket.emit("game-history", history);
		} catch (error) {
			console.error("Error getting game state:", error);
		}

		// Join game room
		socket.on("join-game", async () => {
			try {
				const user = await getUserById(socket.userId);
				const players = await getAllPlayers();

				// Broadcast to all that a player joined
				io.emit("player-joined", {
					id: user._id.toString(),
					username: user.username,
					balance: user.balance,
				});

				// Send updated player list
				io.emit("players-list", players);
			} catch (error) {
				socket.emit("error", { message: error.message });
			}
		});

		// Place bet
		socket.on("place-bet", async (data) => {
			try {
				const { symbol, amount } = data;

				if (!symbol || !amount) {
					socket.emit("bet-error", { message: "Symbol and amount are required" });
					return;
				}

				const bet = await placeBet(socket.userId, symbol, parseInt(amount));

				// Get updated user balance
				const user = await getUserById(socket.userId);

				// Emit bet confirmation to the player
				socket.emit("bet-placed", {
					betId: bet._id.toString(),
					symbol: bet.symbol,
					amount: bet.amount,
					balance: user.balance,
				});

				// Broadcast bet to all players (without revealing amount for privacy, or with amount for transparency)
				io.emit("bet-update", {
					userId: socket.userId,
					username: socket.username,
					symbol: bet.symbol,
					amount: bet.amount,
				});

				// Update player balance broadcast
				io.emit("player-update", {
					userId: user._id.toString(),
					username: user.username,
					balance: user.balance,
				});
			} catch (error) {
				socket.emit("bet-error", { message: error.message });
				console.error("Error placing bet:", error);
			}
		});

		// Get game state
		socket.on("get-game-state", async () => {
			try {
				const gameState = await getGameState();
				socket.emit("game-state", gameState);
			} catch (error) {
				socket.emit("error", { message: error.message });
			}
		});

		// Get game history
		socket.on("get-game-history", async () => {
			try {
				const history = await getGameHistory(10);
				socket.emit("game-history", history);
			} catch (error) {
				socket.emit("error", { message: error.message });
			}
		});

		// Start game (admin only)
		socket.on("start-game", async () => {
			try {
				// Check if user is admin
				if (!socket.userRole || socket.userRole !== "admin") {
					socket.emit("error", { message: "Only admins can start the game" });
					return;
				}

				// Get current game state to determine what to start
				const gameState = await getGameState();

				if (gameState.status === "waiting") {
					// Start betting phase
					await startBettingPhase(io);
					io.emit("game-started", { phase: "betting", message: "Betting phase started" });
				} else if (gameState.status === "betting") {
					// Start rolling phase (betting time expired or admin wants to proceed)
					await startRollingPhase(io);
					io.emit("game-started", { phase: "rolling", message: "Rolling phase started" });
				} else {
					socket.emit("error", { message: "Cannot start game in current state" });
				}
			} catch (error) {
				socket.emit("error", { message: error.message });
				console.error("Error starting game:", error);
			}
		});

		// Disconnect
		socket.on("disconnect", () => {
			console.log(`User disconnected: ${socket.username} (${socket.userId})`);
			activeUsers.delete(socket.userId);

			// Broadcast player left
			io.emit("player-left", {
				userId: socket.userId,
				username: socket.username,
			});
		});
	});
}

module.exports = setupSocket;
