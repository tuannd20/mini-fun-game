// Game state
let socket;
let currentBalance = 0;
let selectedSymbol = null;
let betAmount = 100; // Default to first FC preset
let gameStatus = "waiting";
let players = [];
let myBets = {}; // Track bets placed by current user
let isAdmin = false; // Track if current user is admin
let gameHistory = []; // Track game history

// Initialize socket connection
function initSocket() {
	// Determine the Socket.IO server URL based on environment
	const isProduction = window.location.hostname.includes("vercel.app") || window.location.hostname === "mini-fun-game.vercel.app";

	if (isProduction) {
		// Use the production domain for Socket.IO connection
		// Prioritize polling for better serverless compatibility
		const protocol = window.location.protocol === "https:" ? "https:" : "http:";
		const host = window.location.hostname;
		socket = io(`${protocol}//${host}`, {
			transports: ["polling", "websocket"], // Polling first for serverless
			upgrade: true,
			rememberUpgrade: false, // Don't remember upgrade for serverless
			reconnection: true,
			reconnectionDelay: 1000,
			reconnectionDelayMax: 5000,
			reconnectionAttempts: Infinity,
			forceNew: false,
		});
	} else {
		// Local development - connect to current origin
		socket = io({
			transports: ["websocket", "polling"],
			upgrade: true,
			rememberUpgrade: true,
		});
	}

	// User info received
	socket.on("user-info", (data) => {
		currentBalance = data.balance;
		isAdmin = data.role === "admin";
		updateBalanceDisplay();
		updateStartButtonVisibility();
		updateBettingSectionVisibility();
		updateFCButtonStates();
		updateCloseButtonVisibility();
	});

	// Game state updates
	socket.on("game-state", (data) => {
		gameStatus = data.status;
		updateGameStatus();
		updateStartButtonVisibility();

		if (data.status === "betting") {
			enableBetting();
		} else if (data.status === "rolling") {
			disableBetting();
		} else if (data.status === "results") {
			disableBetting();
		} else if (data.status === "waiting") {
			disableBetting();
		}
	});

	// Betting timer updates
	socket.on("betting-timer", (data) => {
		updateTimer(data.timeLeft, data.totalTime);
		// Disable betting when timer reaches 0
		if (data.timeLeft === 0) {
			disableBetting();
		}
	});

	// Betting expired event
	socket.on("betting-expired", (data) => {
		disableBetting();
		updateStartButtonVisibility();
	});

	// Game started event
	socket.on("game-started", (data) => {
		updateStartButtonVisibility();
	});

	// Dice roll event
	socket.on("dice-roll", (data) => {
		startDiceAnimation();
	});

	// Game result
	socket.on("game-result", (data) => {
		showGameResults(data.diceResults, data.symbolCounts, data.winners || []);
	});

	// Game history
	socket.on("game-history", (data) => {
		gameHistory = data;
		renderGameHistory();
	});

	// Bet placed confirmation
	socket.on("bet-placed", (data) => {
		currentBalance = data.balance;
		updateBalanceDisplay();

		// Adjust bet amount if it exceeds new balance
		if (betAmount > currentBalance) {
			// Find the highest FC preset that player can afford
			const fcPresets = [100, 200, 400, 600, 1000];
			let maxAffordable = 100;
			for (let i = fcPresets.length - 1; i >= 0; i--) {
				if (currentBalance >= fcPresets[i]) {
					maxAffordable = fcPresets[i];
					break;
				}
			}
			betAmount = Math.min(maxAffordable, currentBalance);
			document.getElementById("bet-amount").value = betAmount;
		}

		updateFCButtonStates();

		// Update my bets tracking
		if (!myBets[data.symbol]) {
			myBets[data.symbol] = 0;
		}
		myBets[data.symbol] += data.amount;
		updateBetDisplay(data.symbol);

		// Show success message
		showMessage("Bet placed successfully!", "success");
	});

	// Bet error
	socket.on("bet-error", (data) => {
		showMessage(data.message, "error");
	});

	// Player updates
	socket.on("player-update", (data) => {
		// Update current user's balance if it's their own update
		if (data.userId === userId) {
			currentBalance = data.balance;
			updateBalanceDisplay();
			updateFCButtonStates();
		}
		updatePlayerBalance(data.userId, data.balance);
	});

	// Players list
	socket.on("players-list", (data) => {
		players = data;
		renderPlayers();
	});

	// Player joined
	socket.on("player-joined", (data) => {
		// Refresh players list
		socket.emit("get-game-state");
	});

	// Error handler
	socket.on("error", (data) => {
		showMessage(data.message, "error");
	});

	// Join game on connect
	socket.on("connect", () => {
		socket.emit("join-game");
	});
}

// Update balance display
function updateBalanceDisplay() {
	document.getElementById("current-balance").textContent = `${currentBalance.toLocaleString()} Win`;
	document.getElementById("top-balance").textContent = `${currentBalance.toLocaleString()} Win`;
}

// Update game status
function updateGameStatus() {
	const statusEl = document.getElementById("game-status");
	const statusText = {
		waiting: "Waiting for game to start...",
		betting: "Place your bets!",
		rolling: "Rolling dice...",
		results: "Results!",
	};
	statusEl.textContent = statusText[gameStatus] || "Unknown status";
}

// Update start button visibility based on admin status and game state
function updateStartButtonVisibility() {
	const startButton = document.getElementById("btn-start-game");
	if (!startButton) return;

	if (isAdmin) {
		// Show button when game is waiting or when betting phase is active (to allow starting rolling)
		if (gameStatus === "waiting" || gameStatus === "betting") {
			startButton.style.display = "inline-block";
			startButton.disabled = false;
		} else {
			startButton.style.display = "none";
		}
	} else {
		startButton.style.display = "none";
	}
}

// Update betting section visibility based on admin status
function updateBettingSectionVisibility() {
	// Hide betting controls section for admins
	const bettingSection = document.getElementById("betting-section");
	if (bettingSection) {
		if (isAdmin) {
			bettingSection.style.display = "none";
		} else {
			bettingSection.style.display = "";
		}
	}

	// Hide bet amounts in betting grid cells for admins
	const betAmounts = document.querySelectorAll(".bet-amount");
	betAmounts.forEach((betAmount) => {
		if (isAdmin) {
			betAmount.style.display = "none";
		} else {
			betAmount.style.display = "";
		}
	});
}

// Update close button visibility for winners popup (admin only)
function updateCloseButtonVisibility() {
	const closeButton = document.getElementById("btn-close-winners");
	if (closeButton) {
		if (isAdmin) {
			closeButton.classList.remove("hidden");
		} else {
			closeButton.classList.add("hidden");
		}
	}
}

// Close winners popup (admin only)
function closeWinnersPopup() {
	if (!isAdmin) return;
	const winnersSection = document.getElementById("winners-section");
	if (winnersSection) {
		winnersSection.classList.add("hidden");
		winnersSection.classList.remove("flex");
		winnersSection.style.display = "none";
	}
}

// Update timer
function updateTimer(timeLeft, totalTime) {
	const timerBar = document.getElementById("timer-bar");
	const percentage = (timeLeft / totalTime) * 100;
	timerBar.style.width = `${percentage}%`;

	const timerText = document.getElementById("timer-text");
	timerText.textContent = `Thời gian còn lại để đặt cược: ${timeLeft}s`;
}

// Enable betting
function enableBetting() {
	document.getElementById("btn-place-bet").disabled = false;
	document.querySelectorAll(".betting-square").forEach((square) => {
		square.classList.add("cursor-pointer");
		square.classList.remove("opacity-50");
	});
	updateFCButtonStates();
}

// Disable betting
function disableBetting() {
	document.getElementById("btn-place-bet").disabled = true;
	document.querySelectorAll(".betting-square").forEach((square) => {
		square.classList.remove("cursor-pointer");
		square.classList.add("opacity-50");
	});
	// Disable all FC buttons when betting is disabled
	document.querySelectorAll(".fc-preset").forEach((btn) => {
		btn.disabled = true;
	});
	document.getElementById("btn-max").disabled = true;
}

// Update FC button states based on current balance
function updateFCButtonStates() {
	if (gameStatus !== "betting") {
		return;
	}

	const fcPresets = [100, 200, 400, 600, 1000];
	const maxButton = document.getElementById("btn-max");

	// Update FC preset buttons
	document.querySelectorAll(".fc-preset").forEach((btn) => {
		const amount = parseInt(btn.dataset.amount);
		if (currentBalance >= amount) {
			btn.disabled = false;
			// Highlight if this is the current bet amount
			if (amount === betAmount) {
				btn.classList.add("bg-yellow-600", "ring-2", "ring-yellow-400");
			} else {
				btn.classList.remove("bg-yellow-600", "ring-2", "ring-yellow-400");
			}
		} else {
			btn.disabled = true;
			btn.classList.remove("bg-yellow-600", "ring-2", "ring-yellow-400");
		}
	});

	// Update MAX button - enable if balance >= 100 (minimum bet)
	if (maxButton) {
		maxButton.disabled = currentBalance < 100;
	}
}

// Show game results
function showGameResults(diceResults, symbolCounts, winners = []) {
	const resultsEl = document.getElementById("dice-results");
	const winnersSection = document.getElementById("winners-section");
	const winnersList = document.getElementById("winners-list");

	resultsEl.classList.remove("hidden");

	const resultsHTML = diceResults
		.map((symbol) => {
			const imageHTML = getSymbolImage(symbol);
			return `${imageHTML} x${symbolCounts[symbol]}`;
		})
		.join(" | ");

	resultsEl.innerHTML = `Results: ${resultsHTML}`;

	// Display winners
	if (winners && winners.length > 0) {
		winnersSection.classList.remove("hidden");
		winnersSection.classList.add("flex");
		winnersSection.style.display = "flex";
		updateCloseButtonVisibility();
		winnersList.innerHTML = winners
			.map((winner) => {
				const symbolImage = getSymbolImage(winner.symbol);
				return `
					<div class="bg-green-800 rounded-lg p-5 flex items-center justify-between hover:bg-green-700 transition-colors">
						<div class="flex items-center space-x-4">
							${symbolImage}
							<div>
								<div class="font-bold text-xl">${winner.username}</div>
								<div class="text-base text-gray-300">${winner.symbol}</div>
							</div>
						</div>
						<div class="text-right">
							<div class="text-base text-gray-300">Bet: ${winner.betAmount.toLocaleString()} FC</div>
							<div class="text-xl font-bold text-yellow-300">Won: ${winner.payout.toLocaleString()} FC</div>
						</div>
					</div>
				`;
			})
			.join("");
	} else {
		winnersSection.classList.add("hidden");
		winnersSection.classList.remove("flex");
		winnersSection.style.display = "none";
		winnersList.innerHTML = '<div class="text-center text-xl text-gray-400 py-12">No winners this round</div>';
	}

	// Highlight winning squares
	Object.keys(symbolCounts).forEach((symbol) => {
		if (symbolCounts[symbol] > 0) {
			const square = document.querySelector(`[data-symbol="${symbol}"]`);
			if (square) {
				square.classList.add("border-green-400", "bg-green-900");
				setTimeout(() => {
					square.classList.remove("border-green-400", "bg-green-900");
				}, 5000);
			}
		}
	});

	// Highlight winning players in players list
	if (winners && winners.length > 0) {
		winners.forEach((winner) => {
			// Find and highlight winning players
			const playerElements = document.querySelectorAll("#players-list-left div, #players-list-right div");
			playerElements.forEach((el) => {
				const usernameEl = el.querySelector(".font-bold");
				if (usernameEl && usernameEl.textContent === winner.username) {
					el.classList.add("ring-2", "ring-yellow-400", "ring-opacity-75");
					setTimeout(() => {
						el.classList.remove("ring-2", "ring-yellow-400", "ring-opacity-75");
					}, 5000);
				}
			});
		});
	}

	// Auto-hide results after 5 seconds (only for non-admins, admins can close manually)
	if (!isAdmin) {
		setTimeout(() => {
			myBets = {};
			document.querySelectorAll('[id^="bet-"]').forEach((el) => {
				if (el.id.startsWith("bet-") && el.id !== "bet-amount") {
					el.textContent = "0";
				}
			});
			resultsEl.classList.add("hidden");
			winnersSection.classList.add("hidden");
			winnersSection.classList.remove("flex");
			winnersSection.style.display = "none";
		}, 5000);
	} else {
		// For admins, clear bet displays but keep winners popup open
		setTimeout(() => {
			myBets = {};
			document.querySelectorAll('[id^="bet-"]').forEach((el) => {
				if (el.id.startsWith("bet-") && el.id !== "bet-amount") {
					el.textContent = "0";
				}
			});
			resultsEl.classList.add("hidden");
		}, 5000);
	}
}

// Get symbol image HTML
function getSymbolImage(symbol) {
	const images = {
		reindeer: "/christmas-img/christmas-reindeer.png",
		potion: "/christmas-img/christmas-potion.png",
		shrimp: "/christmas-img/christmas-shrimp.png",
		crab: "/christmas-img/christmas-crab.png",
		fish: "/christmas-img/christmas-fish.png",
		chicken: "/christmas-img/christmas-chicken.png",
	};
	const imagePath = images[symbol] || "/christmas-img/christmas-reindeer.png";
	return `<img src="${imagePath}" alt="${symbol}" class="inline-block w-6 h-6 align-middle object-contain" style="image-rendering: auto;">`;
}

// Update bet display for a symbol
function updateBetDisplay(symbol) {
	const betEl = document.getElementById(`bet-${symbol}`);
	if (betEl) {
		betEl.textContent = myBets[symbol] || "0";
	}
}

// Render players
function renderPlayers() {
	const leftList = document.getElementById("players-list-left");
	const rightList = document.getElementById("players-list-right");

	leftList.innerHTML = "";
	rightList.innerHTML = "";

	const midPoint = Math.ceil(players.length / 2);

	players.forEach((player, index) => {
		const playerEl = document.createElement("div");
		playerEl.className = "bg-red-800 rounded p-3";
		playerEl.innerHTML = `
      <div class="flex items-center space-x-2">
        <div class="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
          <span>👤</span>
        </div>
        <div class="flex-1">
          <div class="font-bold text-sm">${player.username}</div>
          <div class="text-xs text-yellow-300">${player.balance.toLocaleString()} Win</div>
        </div>
      </div>
    `;

		if (index < midPoint) {
			leftList.appendChild(playerEl);
		} else {
			rightList.appendChild(playerEl);
		}
	});
}

// Update player balance
function updatePlayerBalance(userId, balance) {
	// This will be handled by players-list update
	socket.emit("get-game-state");
}

// Render game history
function renderGameHistory() {
	const historyList = document.getElementById("game-history-list");
	if (!historyList) return;

	if (gameHistory.length === 0) {
		historyList.innerHTML = '<div class="text-sm text-gray-400 text-center">No game history yet</div>';
		return;
	}

	historyList.innerHTML = gameHistory
		.map((game, index) => {
			const roundNumber = gameHistory.length - index;
			const date = new Date(game.ended_at);
			const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

			// Create dice results display
			const diceDisplay =
				game.diceResults && game.diceResults.length > 0
					? game.diceResults.map((symbol) => getSymbolImage(symbol)).join(" ")
					: "No results";

			return `
				<div class="bg-red-800 rounded p-3 cursor-pointer hover:bg-red-700 transition-colors" onclick="viewHistoryDetails('${
					game.gameId
				}')">
					<div class="flex items-center justify-between mb-2">
						<span class="font-bold text-sm">Round #${roundNumber}</span>
						<span class="text-xs text-gray-400">${timeStr}</span>
					</div>
					<div class="flex items-center space-x-2 mb-2">
						${diceDisplay}
					</div>
					<div class="flex items-center justify-between text-xs">
						<span class="text-yellow-300">Winners: ${game.totalWinners}</span>
						<span class="text-green-300">Total Payout: ${game.totalPayout.toLocaleString()}</span>
					</div>
				</div>
			`;
		})
		.join("");
}

// View history details (can be expanded later)
function viewHistoryDetails(gameId) {
	// For now, just log - can be expanded to show modal with full details
	console.log("Viewing history for game:", gameId);
}

// Show message
function showMessage(message, type) {
	// Simple alert for now, can be enhanced with toast notifications
	if (type === "error") {
		alert("Error: " + message);
	} else {
		console.log(message);
	}
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
	initSocket();

	// Initialize bet amount display
	document.getElementById("bet-amount").value = betAmount;

	// Betting square click handlers
	document.querySelectorAll(".betting-square").forEach((square) => {
		square.addEventListener("click", () => {
			if (gameStatus !== "betting") return;

			// Remove previous selection
			document.querySelectorAll(".betting-square").forEach((s) => {
				s.classList.remove("border-yellow-400", "ring-4", "ring-yellow-300");
			});

			// Select this square
			selectedSymbol = square.dataset.symbol;
			square.classList.add("border-yellow-400", "ring-4", "ring-yellow-300");
		});
	});

	// Place bet button
	document.getElementById("btn-place-bet").addEventListener("click", () => {
		if (gameStatus !== "betting") {
			showMessage("Betting is not active", "error");
			return;
		}

		if (!selectedSymbol) {
			showMessage("Please select a symbol first", "error");
			return;
		}

		if (betAmount > currentBalance) {
			showMessage("Insufficient balance", "error");
			return;
		}

		socket.emit("place-bet", {
			symbol: selectedSymbol,
			amount: betAmount,
		});
	});

	// MAX button - set to maximum available FC (up to 1000)
	document.getElementById("btn-max").addEventListener("click", () => {
		if (gameStatus !== "betting") return;

		// Find the highest FC preset that player can afford
		const fcPresets = [100, 200, 400, 600, 1000];
		let maxAffordable = 100; // Default to minimum

		for (let i = fcPresets.length - 1; i >= 0; i--) {
			if (currentBalance >= fcPresets[i]) {
				maxAffordable = fcPresets[i];
				break;
			}
		}

		betAmount = Math.min(maxAffordable, currentBalance);
		document.getElementById("bet-amount").value = betAmount;

		// Highlight the selected FC button
		document.querySelectorAll(".fc-preset").forEach((btn) => {
			btn.classList.remove("bg-yellow-600", "ring-2", "ring-yellow-400");
		});
		const selectedBtn = document.querySelector(`.fc-preset[data-amount="${betAmount}"]`);
		if (selectedBtn) {
			selectedBtn.classList.add("bg-yellow-600", "ring-2", "ring-yellow-400");
		}
	});

	// FC preset buttons
	document.querySelectorAll(".fc-preset").forEach((btn) => {
		btn.addEventListener("click", () => {
			if (gameStatus !== "betting") return;
			if (btn.disabled) return;

			const amount = parseInt(btn.dataset.amount);
			if (currentBalance >= amount) {
				betAmount = amount;
				document.getElementById("bet-amount").value = betAmount;

				// Highlight selected button
				document.querySelectorAll(".fc-preset").forEach((b) => {
					b.classList.remove("bg-yellow-600", "ring-2", "ring-yellow-400");
				});
				btn.classList.add("bg-yellow-600", "ring-2", "ring-yellow-400");
			}
		});
	});

	// Start game button (admin only)
	const startButton = document.getElementById("btn-start-game");
	if (startButton) {
		startButton.addEventListener("click", () => {
			if (!isAdmin) {
				showMessage("Only admins can start the game", "error");
				return;
			}
			socket.emit("start-game");
		});
	}
});
