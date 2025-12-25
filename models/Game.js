const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema(
	{
		status: {
			type: String,
			enum: ["waiting", "betting", "rolling", "results"],
			default: "waiting",
			required: true,
		},
		dice_results: {
			type: [String],
			default: null,
		},
		started_at: {
			type: Date,
			default: null,
		},
		ended_at: {
			type: Date,
			default: null,
		},
		winning_symbols: {
			type: [String],
			default: [],
		},
	},
	{
		timestamps: true,
	}
);

const Game = mongoose.model("Game", gameSchema);

module.exports = Game;
