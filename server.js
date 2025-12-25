const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const session = require("express-session");
const path = require("path");
require("dotenv").config();

const { initDatabase } = require("./models");
const indexRoutes = require("./routes/index");
const apiRoutes = require("./routes/api");
const setupSocket = require("./config/socket");

const app = express();
const server = http.createServer(app);

// Get production domain from environment or use default
const PRODUCTION_DOMAIN = process.env.PRODUCTION_DOMAIN || "mini-fun-game.vercel.app";
const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL;

// Session configuration
const sessionMiddleware = session({
	secret: process.env.SESSION_SECRET || "your-secret-key-change-this",
	resave: false,
	saveUninitialized: false,
	cookie: {
		secure: isProduction,
		sameSite: isProduction ? "none" : "lax",
		maxAge: 24 * 60 * 60 * 1000, // 24 hours
	},
});

app.use(sessionMiddleware);

// Configure Socket.IO with CORS for production
// For Vercel/serverless, prioritize polling transport as it works better than WebSockets
const io = new Server(server, {
	cors: {
		origin: isProduction ? [`https://${PRODUCTION_DOMAIN}`, `https://www.${PRODUCTION_DOMAIN}`] : "*",
		credentials: true,
		methods: ["GET", "POST"],
	},
	// Prioritize polling for serverless environments, fallback to websocket
	transports: process.env.VERCEL ? ["polling", "websocket"] : ["websocket", "polling"],
	allowEIO3: true, // Allow Engine.IO v3 clients
});

// Share session middleware with Socket.io
io.use((socket, next) => {
	sessionMiddleware(socket.request, {}, next);
});

const PORT = process.env.PORT || 3000;

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// CORS middleware for production
if (isProduction) {
	app.use((req, res, next) => {
		const origin = req.headers.origin;
		if (origin && (origin.includes(PRODUCTION_DOMAIN) || origin.includes("localhost"))) {
			res.setHeader("Access-Control-Allow-Origin", origin);
			res.setHeader("Access-Control-Allow-Credentials", "true");
		}
		next();
	});
}

// Make io available to routes
app.set("io", io);

// Routes
app.use("/", indexRoutes);
app.use("/api", apiRoutes);

// Setup Socket.io
setupSocket(io);

// Initialize database and start server
async function startServer() {
	try {
		// Initialize database connection
		await initDatabase();

		// Start server
		server.listen(PORT, () => {
			console.log(`Server running on http://localhost:${PORT}`);
			console.log(`Production mode: ${isProduction}`);
			if (isProduction) {
				console.log(`Production domain: ${PRODUCTION_DOMAIN}`);
			}
			// Game will start in "waiting" status until admin presses start button
		});
	} catch (error) {
		console.error("Failed to start server:", error);
		process.exit(1);
	}
}

// Export for Vercel serverless function
// Note: Socket.IO requires persistent connections which have limitations on Vercel
// The app will work for HTTP requests. For full Socket.IO support, consider:
// 1. Using polling transport (configured above)
// 2. Deploying Socket.IO to a separate service (Railway, Render, etc.)
// 3. Using Vercel's newer WebSocket features if available
if (process.env.VERCEL) {
	// Initialize database on module load (non-blocking)
	let dbInitialized = false;
	const initializeForVercel = async () => {
		if (!dbInitialized) {
			try {
				await initDatabase();
				dbInitialized = true;
				console.log("Database initialized for Vercel");
			} catch (error) {
				console.error("Failed to initialize database:", error);
			}
		}
	};
	initializeForVercel();

	// Export the Express app for Vercel
	// Vercel's @vercel/node will handle the HTTP server
	module.exports = app;
} else {
	// Start the application for local development
	startServer();
}
