const { connectDB } = require("../config/database");
const User = require("./User");
const Game = require("./Game");
const Bet = require("./Bet");

// Initialize database connection
const initDatabase = async () => {
	try {
		await connectDB();
		console.log("Database models initialized successfully.");
	} catch (error) {
		console.error("Unable to initialize database:", error);
		throw error;
	}
};

module.exports = {
	User,
	Game,
	Bet,
	initDatabase,
};
