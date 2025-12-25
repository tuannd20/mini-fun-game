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

// Session configuration
const sessionMiddleware = session({
	secret: process.env.SESSION_SECRET || "your-secret-key-change-this",
	resave: false,
	saveUninitialized: false,
	cookie: {
		secure: process.env.NODE_ENV === "production",
		maxAge: 24 * 60 * 60 * 1000, // 24 hours
	},
});

app.use(sessionMiddleware);

const io = new Server(server);
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
			// Game will start in "waiting" status until admin presses start button
		});
	} catch (error) {
		console.error("Failed to start server:", error);
		process.exit(1);
	}
}
// Start the application
startServer();
