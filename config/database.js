const mongoose = require("mongoose");
require("dotenv").config();

const MONGODB_URI =
	process.env.MONGODB_URI ||
	"mongodb+srv://admin:7htSMmcaFW8urWNj@mini-grab-game.holdcwv.mongodb.net/christmas-crab-game?retryWrites=true&w=majority";

// Connection options
const options = {
	// Remove deprecated options, use default MongoDB driver settings
};

// Connect to MongoDB
async function connectDB() {
	try {
		await mongoose.connect(MONGODB_URI, options);
		console.log("MongoDB connected successfully");
	} catch (error) {
		console.error("MongoDB connection error:", error);
		process.exit(1);
	}
}

// Handle connection events
mongoose.connection.on("connected", () => {
	console.log("Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
	console.error("Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
	console.log("Mongoose disconnected");
});

// Handle app termination
process.on("SIGINT", async () => {
	await mongoose.connection.close();
	console.log("MongoDB connection closed through app termination");
	process.exit(0);
});

module.exports = { connectDB, mongoose };
