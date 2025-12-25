const mongoose = require("mongoose");

const betSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		gameId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Game",
			required: true,
		},
		symbol: {
			type: String,
			required: true,
		},
		amount: {
			type: Number,
			required: true,
			min: 1,
		},
		payout: {
			type: Number,
			default: 0,
			min: 0,
		},
		status: {
			type: String,
			enum: ["pending", "won", "lost"],
			default: "pending",
		},
	},
	{
		timestamps: true,
	}
);

// Create indexes for faster queries
betSchema.index({ userId: 1 });
betSchema.index({ gameId: 1 });
betSchema.index({ status: 1 });

const Bet = mongoose.model("Bet", betSchema);

module.exports = Bet;
