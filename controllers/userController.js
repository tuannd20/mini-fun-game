const { User } = require("../models");

/**
 * Create or get user by username
 * @param {string} username - The username
 * @param {number} [fcAmount] - Optional FC amount to set as balance
 */
async function createOrGetUser(username, fcAmount) {
	if (!username || username.trim().length === 0) {
		throw new Error("Username is required");
	}

	if (username.length > 20) {
		throw new Error("Username must be 20 characters or less");
	}

	// Check if user exists
	let user = await User.findOne({ username: username.trim() });

	if (!user) {
		// Use FC amount if provided, otherwise use default initial balance
		const balance = fcAmount ? parseInt(fcAmount) : (parseInt(process.env.INITIAL_BALANCE) || 10000);
		user = await User.create({
			username: username.trim(),
			balance: balance,
		});
	} else {
		// Update existing user's balance if FC amount is provided
		if (fcAmount) {
			user.balance = parseInt(fcAmount);
			await user.save();
		}
	}

	return user;
}

/**
 * Get user by ID
 */
async function getUserById(userId) {
	const user = await User.findById(userId);
	if (!user) {
		throw new Error("User not found");
	}
	return user;
}

/**
 * Get user by username
 */
async function getUserByUsername(username) {
	const user = await User.findOne({ username });
	return user;
}

module.exports = {
	createOrGetUser,
	getUserById,
	getUserByUsername,
};
