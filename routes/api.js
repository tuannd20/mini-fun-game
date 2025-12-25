const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { getUserById } = require("../controllers/userController");
const { getGameState, getAllPlayers } = require("../controllers/gameController");

// Get current user info
router.get("/user", requireAuth, async (req, res) => {
	try {
		const user = await getUserById(req.session.userId);
		res.json({
			id: user._id.toString(),
			username: user.username,
			balance: user.balance,
			total_wins: user.total_wins,
			total_losses: user.total_losses,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// Get game state
router.get("/game/state", requireAuth, async (req, res) => {
	try {
		const gameState = await getGameState();
		res.json(gameState);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// Get all players
router.get("/players", requireAuth, async (req, res) => {
	try {
		const players = await getAllPlayers();
		res.json(players);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

module.exports = router;
