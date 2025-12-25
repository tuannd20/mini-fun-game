const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
	{
		username: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			maxlength: 20,
		},
		balance: {
			type: Number,
			default: parseInt(process.env.INITIAL_BALANCE) || 10000,
			required: true,
			min: 0,
		},
		total_wins: {
			type: Number,
			default: 0,
			min: 0,
		},
		total_losses: {
			type: Number,
			default: 0,
			min: 0,
		},
		role: {
			type: String,
			enum: ["user", "admin"],
			default: "user",
			required: true,
		},
	},
	{
		timestamps: true,
	}
);

// Create index on username for faster lookups
userSchema.index({ username: 1 });

const User = mongoose.model("User", userSchema);

module.exports = User;
