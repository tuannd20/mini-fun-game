# Christmas Crab Game 🦀🎄

A fun multiplayer Christmas-themed betting game based on the traditional Bau Cua Tom Ca (Crab, Shrimp, Fish) game. Perfect for internal team entertainment during the holiday season!

## Features

- 🎄 **Christmas-themed symbols**: Reindeer, Tree, Santa, Snowflake, Candy Cane, and Gift
- 👥 **Multiplayer support**: Real-time gameplay with Socket.io
- 💰 **Betting system**: Place bets on your favorite symbols
- 🎲 **Automated dice rolling**: System automatically rolls dice after betting timer
- 📊 **Player tracking**: See all players' balances and stats
- 🎨 **Beautiful UI**: Modern design with TailwindCSS matching the reference image

## Tech Stack

- **Backend**: Node.js + Express
- **View Engine**: EJS
- **Styling**: TailwindCSS
- **Real-time**: Socket.io
- **Database**: SQLite with Sequelize ORM
- **Session Management**: express-session

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (optional, defaults are provided):
```bash
PORT=3000
SESSION_SECRET=your-secret-key-change-this-in-production
NODE_ENV=development
INITIAL_BALANCE=10000
BETTING_TIMER=30
MIN_BET=1
MAX_BET=1000
```

3. Build TailwindCSS (if you modify styles):
```bash
npm run build-css
```

## Running the Game

Start the server:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

The game will be available at `http://localhost:3000`

## How to Play

1. **Join the Game**: Enter your username on the home page
2. **Place Bets**: Click on a symbol square and set your bet amount
3. **Wait for Results**: The system will automatically roll the dice after the betting timer expires
4. **Win or Lose**: If your symbol appears in the dice results, you win! (1:1 payout for each occurrence)

## Game Rules

- Players can bet on multiple symbols in one round
- Minimum bet: 1 coin (configurable via `MIN_BET`)
- Maximum bet: 1000 coins (configurable via `MAX_BET`)
- Betting phase lasts 30 seconds (configurable via `BETTING_TIMER`)
- If your symbol appears in the dice results, you win the bet amount × number of occurrences
- House collects all bets on symbols that didn't appear

## Project Structure

```
mini-game/
├── server.js              # Express server + Socket.io setup
├── config/
│   ├── database.js       # Database configuration
│   └── socket.js         # Socket.io event handlers
├── models/               # Sequelize models (User, Game, Bet)
├── controllers/          # Game logic, user management
├── routes/               # Express routes
├── views/                # EJS templates
├── public/               # Static files (CSS, JS, images)
├── middleware/           # Auth and validation middleware
└── utils/                # Dice rolling and payout utilities
```

## Development

To watch and rebuild TailwindCSS during development:
```bash
npm run build-css
```

This will watch for changes and automatically rebuild the CSS file.

## License

ISC

