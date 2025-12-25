# Christmas Bau Cua Game - Complete Business Analyst Specification

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Phase 1: User Management & Authentication](#phase-1-user-management--authentication)
4. [Phase 2: Game Flow & Round Management](#phase-2-game-flow--round-management)
5. [Phase 3: Betting System](#phase-3-betting-system)
6. [Phase 4: Dice Rolling & Results](#phase-4-dice-rolling--results)
7. [Phase 5: Results Display & Round Completion](#phase-5-results-display--round-completion)
8. [Phase 6: Admin Interface & Features](#phase-6-admin-interface--features)
9. [Phase 7: Player Interface & Experience](#phase-7-player-interface--experience)
10. [Phase 8: Data Persistence & State Management](#phase-8-data-persistence--state-management)
11. [Phase 9: Testing Strategy & Acceptance Criteria](#phase-9-testing-strategy--acceptance-criteria)
12. [Phase 10: UI/UX Specifications](#phase-10-uiux-specifications)
13. [Phase 11: Security & Validation](#phase-11-security--validation)
14. [Phase 12: Error Messages & User Feedback](#phase-12-error-messages--user-feedback)

---

## Project Overview

### Description

A multiplayer Christmas-themed Bau Cua Tom Ca (Crab, Shrimp, Fish) game designed for internal team play during the holiday season. The game features admin-controlled gameplay, real-time multiplayer functionality, and a structured betting system.

### Target Audience

- Internal team members (3-4 players per game)
- Admin/facilitator role
- Casual gaming environment

### Technology Stack

- **Frontend**: React (with Hooks)
- **Styling**: Tailwind CSS
- **State Management**: React State (useState, useReducer)
- **Storage**: Window Storage API (persistent, key-value store)
- **Architecture**: Component-based, MVC pattern

### Key Features

- Real-time multiplayer gameplay (3-4 players)
- Admin-controlled game flow
- Structured betting system with predefined amounts
- Automatic payout calculation
- Player management system
- Round history tracking
- Responsive design

---

## System Architecture

### User Roles

#### 1. Admin

**Responsibilities:**

- Approve/reject player registrations
- Start and manage game rounds
- Roll the dice
- Close results popups
- Remove players when necessary
- Monitor game state and player balances
- Access to complete round history

**Restrictions:**

- Cannot place bets
- Cannot participate as a player

#### 2. Player

**Responsibilities:**

- Register with username and coin amount
- Place bets during betting phase
- View game results
- Manage personal balance
- Leave game voluntarily

**Restrictions:**

- Cannot start rounds
- Cannot roll dice
- Cannot approve other players
- Cannot access admin controls

---

## Phase 1: User Management & Authentication

### 1.1 Player Registration System

#### User Story

> **As a player**, I want to register with a username and initial coin amount so that I can participate in the game.

#### Functional Requirements

**FR-1.1.1: Registration Form**

- Input field: Username (text, required, 3-50 characters, alphanumeric + spaces)
- Input field: Initial Coins (number, required, min: 2000, max: 10000, step: 1000)
- Dropdown/Slider for coin selection: [2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000]
- Button: "Join Game" (disabled if validation fails)
- Validation messages displayed inline

**FR-1.1.2: Player Registration Validation**

```
RULE: Username uniqueness
- Check if username already exists in active players list
- Display error: "Username already taken, please choose another"

RULE: Coin amount validation
- Must be between 2,000 and 10,000
- Must be in increments of 1,000
- Display error if outside range or invalid increment

RULE: Required fields
- Both username and coin amount must be filled
- Display error: "Please fill in all required fields"
```

**FR-1.1.3: Registration Submission**

- On "Join Game" click:
  - Create pending player object: `{username, requestedCoins, status: 'pending', timestamp}`
  - Add to pending players queue
  - Display waiting screen: "Waiting for admin approval..."
  - Show pending status indicator (yellow badge)

#### Test Cases

| Test ID  | Test Case                             | Expected Result                                        |
| -------- | ------------------------------------- | ------------------------------------------------------ |
| TC-1.1.1 | Valid Registration                    | Player added to pending list, waiting screen displayed |
| TC-1.1.2 | Username Already Exists               | Error: "Username already taken, please choose another" |
| TC-1.1.3 | Invalid Coin Amount - Too Low         | Error: "Minimum coins is 2,000"                        |
| TC-1.1.4 | Invalid Coin Amount - Too High        | Error: "Maximum coins is 10,000"                       |
| TC-1.1.5 | Invalid Coin Amount - Wrong Increment | Only valid increments available in dropdown            |

---

### 1.2 Admin Approval System

#### User Story

> **As an admin**, I want to review and approve/reject player registration requests so that I can control who joins the game.

#### Functional Requirements

**FR-1.2.1: Pending Players List Display**

- Display section: "Pending Players" (visible only to admin)
- For each pending player show:
  - Username
  - Requested coins amount
  - Timestamp of request
  - Action buttons: "Approve" (green) and "Reject" (red)
- Sort by timestamp (oldest first)

**FR-1.2.2: Approve Player Action**

```
When admin clicks "Approve":
  1. Move player from pending list to active players list
  2. Update player status: 'pending' -> 'active'
  3. Initialize player with requested coin amount
  4. Notify player: "You have been approved! Game balance: X coins"
  5. Update player count
  6. Check if minimum players requirement met (3 players)
```

**FR-1.2.3: Reject Player Action**

```
When admin clicks "Reject":
  1. Remove player from pending list
  2. Show player: "Your request was not approved. Please try again later."
  3. Return player to registration screen
```

**FR-1.2.4: Active Players Management**

- Display section: "Active Players" (visible to admin)
- For each active player show:
  - Username
  - Current coin balance
  - Status indicator (active/betting/waiting)
  - Action button: "Remove" (red X icon)

**FR-1.2.5: Remove Player Action**

```
When admin clicks "Remove" on active player:
  1. Show confirmation dialog: "Remove [username] from game?"
  2. If confirmed:
     - Remove player from active players list
     - Notify player: "You have been removed from the game by admin"
     - Return player to registration screen
     - If game in progress and removed player has active bets, refund bets
     - Update player count
```

#### Test Cases

| Test ID  | Test Case                      | Expected Result                                       |
| -------- | ------------------------------ | ----------------------------------------------------- |
| TC-1.2.1 | Approve Player Successfully    | Player moves to active list, receives success message |
| TC-1.2.2 | Reject Player                  | Player removed from pending, sees rejection message   |
| TC-1.2.3 | Remove Active Player           | Player removed, count decreases                       |
| TC-1.2.4 | Remove Player with Active Bets | Bets refunded, player removed                         |

---

### 1.3 Automatic Player Removal

#### User Story

> **As the system**, I want to automatically remove players with zero coins so that the game maintains active participants only.

#### Functional Requirements

**FR-1.3.1: Zero Balance Detection**

```
Trigger: After each round results are calculated
Check: For each active player, if balance <= 0
Action: Automatically remove player from game

Process:
  1. Identify players with balance = 0
  2. Display notification to player: "You have run out of coins. Better luck next time! 🎄"
  3. Remove player from active players list
  4. Update player count
  5. Log removal event to game history
```

**FR-1.3.2: Low Balance Warning**

```
Display warning when player balance < 2000:
  - Show yellow warning badge on player card
  - Message: "⚠️ Low balance! Win the next round or you'll be removed."
```

#### Test Cases

| Test ID  | Test Case                            | Expected Result                                            |
| -------- | ------------------------------------ | ---------------------------------------------------------- |
| TC-1.3.1 | Auto-Remove Player with Zero Balance | Player removed, sees notification, returns to registration |
| TC-1.3.2 | Low Balance Warning Display          | Yellow warning badge appears with message                  |

---

## Phase 2: Game Flow & Round Management

### 2.1 Game State Management

#### Game States

```
STATES:
1. WAITING_FOR_PLAYERS: Less than 3 players active
2. READY_TO_START: 3-4 players active, waiting for admin to start
3. BETTING_PHASE: Round started, 30-second countdown active
4. BETTING_CLOSED: Countdown expired, waiting for admin to roll dice
5. ROLLING_DICE: Dice animation in progress
6. SHOWING_RESULTS: Results popup displayed
7. ROUND_ENDED: Results acknowledged, ready for next round

STATE TRANSITIONS:
WAITING_FOR_PLAYERS -> READY_TO_START (when 3-4 players active)
READY_TO_START -> BETTING_PHASE (admin clicks "Start Round")
BETTING_PHASE -> BETTING_CLOSED (30-second timer expires)
BETTING_CLOSED -> ROLLING_DICE (admin clicks "Lucky Dice")
ROLLING_DICE -> SHOWING_RESULTS (dice animation completes)
SHOWING_RESULTS -> ROUND_ENDED (admin closes results popup)
ROUND_ENDED -> READY_TO_START (if 3-4 players still active)
ROUND_ENDED -> WAITING_FOR_PLAYERS (if < 3 players remain)
```

---

### 2.2 Minimum Player Requirement

#### User Story

> **As the system**, I want to ensure 3-4 players are present before starting a round to maintain game balance.

#### Functional Requirements

**FR-2.2.1: Player Count Validation**

```
Continuous Check:
- Count active players in real-time
- Display player count: "Players: X/4" or "Players: X (min 3 required)"
- Enable/disable "Start Round" button based on count

RULE: Minimum Players
- If active players < 3:
  - Display: "Waiting for more players... (Need at least 3)"
  - "Start Round" button disabled

- If active players >= 3 and <= 4:
  - Display: "Ready to start! Players: X"
  - "Start Round" button enabled (green, pulsing animation)

- If active players > 4:
  - New players cannot join (show message: "Game room full")
```

**FR-2.2.2: Mid-Round Player Count Check**

```
During active round:
- If player count drops below 3 (due to removal or auto-removal):
  - Cancel current round
  - Refund all active bets
  - Display: "Round cancelled - not enough players"
  - Return to WAITING_FOR_PLAYERS state
```

#### Test Cases

| Test ID  | Test Case                                 | Expected Result                |
| -------- | ----------------------------------------- | ------------------------------ |
| TC-2.2.1 | Cannot Start with 2 Players               | "Start Round" button disabled  |
| TC-2.2.2 | Can Start with 3 Players                  | "Start Round" button enabled   |
| TC-2.2.3 | Round Cancellation Due to Player Shortage | Round cancelled, bets refunded |

---

### 2.3 Start Round Process

#### User Story

> **As an admin**, I want to start a new round when ready so that players can begin betting.

#### Functional Requirements

**FR-2.3.1: Start Round Button**

```
Admin Interface:
- Button: "🎄 Start Round"
- Position: Prominent at top of admin panel
- State: Enabled only when 3-4 active players
- Visual: Green background, pulsing glow animation when enabled
```

**FR-2.3.2: Round Initialization**

```
When admin clicks "Start Round":
  1. Increment round number (starting from 1)
  2. Change game state: READY_TO_START -> BETTING_PHASE
  3. Initialize 30-second countdown timer
  4. Display to all players: "🎲 Round X Started! Place your bets!"
  5. Enable betting board for all players
  6. Start countdown display: "Time remaining: 30s"
  7. Hide "Start Round" button
  8. Create new round object in database:
     {
       roundNumber: X,
       startTime: timestamp,
       bettingDeadline: timestamp + 30s,
       status: 'betting',
       players: [array of active players],
       bets: {}
     }
```

#### Test Cases

| Test ID  | Test Case                                    | Expected Result                             |
| -------- | -------------------------------------------- | ------------------------------------------- |
| TC-2.3.1 | Successfully Start Round                     | Round starts, timer begins, betting enabled |
| TC-2.3.2 | Cannot Start Round with Insufficient Players | Button remains disabled                     |

---

### 2.4 Betting Phase & Countdown Timer

#### User Story

> **As a player**, I want 30 seconds to place my bets so that I have adequate time to strategize.

#### Functional Requirements

**FR-2.4.1: Countdown Timer Display**

```
Timer Visual Design:
- Position: Top center of screen, highly visible
- Display format: "⏱️ Time Remaining: XXs"
- Color coding:
  - 30-21 seconds: Green background
  - 20-11 seconds: Yellow background
  - 10-1 seconds: Red background, pulsing animation
  - 0 seconds: "BETTING CLOSED" in red

Timer Behavior:
- Update every second (countdown from 30 to 0)
- Play tick sound at 10 seconds and below (optional)
- Play alarm sound when reaching 0
```

**FR-2.4.2: Betting Board Interaction**

```
During Betting Phase (0-30 seconds):
- All animal betting squares are enabled
- Players can place, modify, or clear bets
- Display current bets in real-time
- Show total bet amount for each player
- Display remaining balance after bets

Visual Feedback:
- Selected squares have glowing border
- Bet amounts display in bold on each square
- Total bets summary: "Total Bet: X / Balance: Y"
```

**FR-2.4.3: Countdown Expiration**

```
When timer reaches 0:
  1. Change game state: BETTING_PHASE -> BETTING_CLOSED
  2. Disable all betting boards for all players
  3. Lock in all current bets (no further modifications)
  4. Display: "BETTING CLOSED - Waiting for dice roll..."
  5. Show "🎲 Lucky Dice" button to admin
  6. Save all bet data to round object
  7. Calculate total bets per player for validation
```

**FR-2.4.4: No Bets Scenario**

```
If timer expires and a player has placed no bets:
  - Player sits out this round
  - Display to player: "You didn't place any bets this round"
  - Player's balance remains unchanged
  - Player can participate in next round
```

#### Test Cases

| Test ID  | Test Case                          | Expected Result                                  |
| -------- | ---------------------------------- | ------------------------------------------------ |
| TC-2.4.1 | Timer Countdown Normal Flow        | Timer counts down with color changes             |
| TC-2.4.2 | Betting Locked After Timer Expires | Betting board disabled, no modifications allowed |
| TC-2.4.3 | Player Sits Out Round              | Player with no bets sits out, balance unchanged  |
| TC-2.4.4 | Bets Locked In At Expiration       | All bets saved and locked                        |

---

## Phase 3: Betting System

### 3.1 Betting Rules & Constraints

#### User Story

> **As a player**, I want to place bets with predefined amounts so that betting is simple and fair.

#### Functional Requirements

**FR-3.1.1: Available Bet Amounts**

```
Bet Amount Options: [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, "All In"]

UI Design:
- Display as buttons below each animal square
- Buttons in grid layout: 2 rows × 5 columns
- Row 1: 1000, 2000, 3000, 4000, 5000
- Row 2: 6000, 7000, 8000, 9000, All In
- "All In" button has distinctive color (gold/orange)
```

**FR-3.1.2: Minimum Bet Rule**

```
RULE: Minimum bet per square is 1,000 coins

Validation:
- Bet buttons for amounts < 1000 are not displayed
- Custom input not allowed (only preset buttons)
- If player balance < 1000: Display "Insufficient funds to bet"
```

**FR-3.1.3: Multiple Animal Betting**

```
ALLOWED:
- Player can bet on multiple different animals in same round
- Example: 2000 on Deer + 3000 on Fish + 1000 on Crab = Valid

CONSTRAINT:
- Total of all bets cannot exceed player's current balance
- If attempting to exceed:
  - Show error: "Total bets exceed your balance!"
  - Prevent bet from being placed
  - Suggest reducing or clearing some bets
```

**FR-3.1.4: All-In Betting Rules**

```
RULE: When "All In" is selected, player can only bet on ONE animal

All-In Behavior:
  1. When player clicks "All In" on any animal:
     - Set bet amount = player's entire current balance
     - Disable "All In" buttons on ALL other animals
     - Disable all other bet amount buttons on other animals
     - Display warning: "⚠️ All-In! You've bet everything on [Animal]!"

  2. If player clicks another bet amount button:
     - Show error: "You've gone All-In! Clear bet to change."

  3. To change All-In bet:
     - Must click "Clear" button on that animal first
     - Then can place new bets normally

Visual Indicators:
- All-In square has golden glowing border
- Other squares are dimmed/grayed out
- Large "ALL IN" badge displayed on selected square
```

**FR-3.1.5: Bet Modification During Betting Phase**

```
Players can modify bets freely during 30-second betting phase:

Overwrite Existing Bet:
- Clicking new amount on same animal replaces previous amount
- Example: Had 2000 on Deer → Click 5000 → Now have 5000 on Deer

Clear Individual Bet:
- Each animal square has "×" clear button
- Clicking "×" removes bet from that animal
- Refunds bet amount to available balance

Clear All Bets:
- Global "Clear All Bets" button above betting board
- Removes all bets from all animals
- Refunds all bet amounts to available balance
```

#### Test Cases

| Test ID  | Test Case                                   | Expected Result                         |
| -------- | ------------------------------------------- | --------------------------------------- |
| TC-3.1.1 | Place Valid Bet                             | Bet placed, balance updated             |
| TC-3.1.2 | Place Multiple Bets                         | All bets tracked, total calculated      |
| TC-3.1.3 | Prevent Exceeding Balance                   | Error message, bet not placed           |
| TC-3.1.4 | All-In Restricts Other Bets                 | Other animals disabled                  |
| TC-3.1.5 | Cannot Bet on Multiple Animals After All-In | Error message displayed                 |
| TC-3.1.6 | Modify Bet Amount                           | New amount replaces old                 |
| TC-3.1.7 | Clear Individual Bet                        | Bet removed, balance refunded           |
| TC-3.1.8 | Clear All Bets                              | All bets removed, full balance restored |
| TC-3.1.9 | Insufficient Funds                          | Warning message, buttons disabled       |

---

### 3.2 Betting UI Components

#### Functional Requirements

**FR-3.2.1: Animal Betting Square Design**

```
Each of 6 animal squares displays:

Header Section:
- Large animal emoji (80px)
- Animal name in bold

Bet Display Section:
- Current bet amount (large font, bold)
- Format: "฿ X,XXX" (with thousand separator)
- Color: Green if bet placed, gray if no bet

Bet Buttons Section:
- Grid of 10 buttons (5x2) for bet amounts
- Button style: Rounded, clear labels
- Active: Blue background, white text
- Disabled: Gray background, gray text
- Hover: Darker blue, slight scale animation

Clear Button:
- Small "×" button in top-right corner
- Only visible when bet is placed
- Red color on hover

State Indicators:
- Default: Light border
- Bet Placed: Green glowing border
- All-In: Gold pulsing border
- Disabled: Gray overlay with reduced opacity
```

**FR-3.2.2: Betting Summary Panel**

```
Display above betting board:

Current Round Info:
- "Round X" with round number
- Round status indicator

Player Balance Summary:
- Current Balance: X,XXX coins
- Total Bets: X,XXX coins
- Available: X,XXX coins
- Color: Green if bets valid, Red if exceeding

Visual Progress Bar:
- Show proportion of balance bet vs available
- Green (available) / Blue (bet)

Action Buttons:
- "Clear All Bets" (red)
- Auto-calculate: "Max Bet Available: X,XXX"
```

**FR-3.2.3: Bet Confirmation Feedback**

```
When bet is placed:
- Immediate visual update on square
- Brief success animation (green glow pulse)
- Sound effect (optional): Coin clink sound
- Update balance summary instantly

When bet is invalid:
- Shake animation on the button
- Error message in red banner above board
- Sound effect (optional): Error beep
- Message auto-dismisses after 3 seconds
```

#### Test Cases

| Test ID  | Test Case                        | Expected Result                                   |
| -------- | -------------------------------- | ------------------------------------------------- |
| TC-3.2.1 | Visual Feedback on Bet Placement | Green glow animation, balance updates             |
| TC-3.2.2 | Visual Feedback on Invalid Bet   | Button shakes, error banner displays              |
| TC-3.2.3 | All-In Visual Indication         | Gold border, "ALL IN" badge, other squares dimmed |

---

## Phase 4: Dice Rolling & Results

### 4.1 Lucky Dice Button

#### User Story

> **As an admin**, I want to roll the dice after betting closes so that the game can determine winners.

#### Functional Requirements

**FR-4.1.1: Lucky Dice Button Appearance**

```
Button Display:
- Button text: "🎲 Lucky Dice"
- Position: Center of admin screen, large and prominent
- Size: Large (300px width, 80px height)
- Style:
  - Red-to-green gradient background
  - White text, bold, 24px font
  - Pulsing glow animation
  - Christmas sparkle effects around button

Visibility:
- Hidden during: WAITING_FOR_PLAYERS, READY_TO_START, BETTING_PHASE
- Visible during: BETTING_CLOSED state only
- Hidden again after: Dice roll initiated

Behavior:
- Single-click only (disabled after first click to prevent double-rolling)
- Loading state while dice are rolling
```

**FR-4.1.2: Dice Roll Initiation**

```
When admin clicks "Lucky Dice":
  1. Change game state: BETTING_CLOSED -> ROLLING_DICE
  2. Disable "Lucky Dice" button immediately
  3. Display to all players: "🎲 Rolling the dice..."
  4. Start dice animation (15 cycles of random changes)
  5. Generate 3 random dice results (final results)
  6. Store results in round object
  7. After animation completes (1.5 seconds):
     - Display final dice results
     - Calculate all player results
     - Show results popup
```

#### Test Cases

| Test ID  | Test Case                                      | Expected Result                    |
| -------- | ---------------------------------------------- | ---------------------------------- |
| TC-4.1.1 | Lucky Dice Button Appears After Betting Closes | Button visible and pulsing         |
| TC-4.1.2 | Dice Roll Starts Successfully                  | Animation starts, players notified |
| TC-4.1.3 | Cannot Double-Click Lucky Dice                 | Second click has no effect         |

---

### 4.2 Dice Animation

#### Functional Requirements

**FR-4.2.1: Dice Roll Animation Sequence**

```
Animation Parameters:
- Duration: 1.5 seconds total
- Cycles: 15 rapid changes (100ms per change)
- Visual: All 3 dice flip through random animals simultaneously

Animation Stages:
Stage 1 (0-1.5s): Rapid Random Changes
  - Every 100ms, all 3 dice show random animal
  - Dice have spinning/rotation animation
  - Sound effect (optional): Rolling dice sound

Stage 2 (1.5s): Slow Down
  - Dice changes slow to 200ms intervals
  - 3 final changes before stopping

Stage 3 (End): Final Results
  - Dice settle on final random results
  - Brief "bounce" animation on landing
  - Sound effect (optional): Dice landing sound
  - Highlight winning dice (if any match player bets)
```

**FR-4.2.2: Random Result Generation**

```
Algorithm:
  For each of 3 dice:
    result = random animal from [Deer, Gourd, Chicken, Shrimp, Crab, Fish]

  Store: [die1Result, die2Result, die3Result]

Constraints:
- Each die is independent (can have 3 of same animal)
- True random selection (no weighting or bias)
- Results generated at start of animation (not predictable)

Display:
- Each die shows corresponding animal emoji at 80px size
- Dice arranged horizontally with spacing
- Winning animals have golden glow effect
```

**FR-4.2.3: Dice Display Area**

```
Layout:
- Position: Center of screen, above betting board
- 3 dice in horizontal row
- Each die: 120px × 120px square
- Background: White with rounded corners
- Border: 3px solid gray, thickens to gold if winning

During Animation:
- Dice have rotation/wobble effect
- Background changes rapidly

After Results:
- Dice are stationary
- Winning dice have gold border and glow
- Results remain visible until popup is closed
```

#### Test Cases

| Test ID  | Test Case                 | Expected Result                      |
| -------- | ------------------------- | ------------------------------------ |
| TC-4.2.1 | Animation Plays Correctly | 1.5s animation with 15+ combinations |
| TC-4.2.2 | Final Results Display     | Correct animals displayed            |
| TC-4.2.3 | Winning Dice Highlighted  | Matching dice have gold glow         |

---

### 4.3 Payout Calculation

#### User Story

> **As the system**, I want to calculate winnings accurately based on bet amounts and dice results so that players receive correct payouts.

#### Functional Requirements

**FR-4.3.1: Payout Formula**

```
For each animal bet by player:
  Count = Number of times animal appears in 3 dice results (0, 1, 2, or 3)

  If Count = 0:
    Player loses the bet amount
    Loss = -betAmount

  If Count >= 1:
    Player wins bet amount × count
    Win = betAmount × count
    Net = (betAmount × count) - betAmount = betAmount × (count - 1)

    Note: Player gets their original bet back plus winnings

Total Net Change = Sum of all individual bet results

Examples:
1. Bet 2000 on Deer, 1 Deer appears:
   Win = 2000 × 1 = 2000
   Net = 2000 - 2000 = 0 (break even)

2. Bet 2000 on Deer, 2 Deer appear:
   Win = 2000 × 2 = 4000
   Net = 4000 - 2000 = +2000

3. Bet 2000 on Deer, 3 Deer appear:
   Win = 2000 × 3 = 6000
   Net = 6000 - 2000 = +4000

4. Bet 2000 on Deer, 0 Deer appear:
   Loss = -2000
   Net = -2000
```

**FR-4.3.2: Multi-Bet Calculation Example**

```
Player "Tom" bets:
- 2000 on Deer
- 3000 on Fish
- 1000 on Crab

Dice results: [Deer, Fish, Fish]

Calculations:
- Deer: Appears 1 time → 2000 × 1 = 2000 win, Net = 0
- Fish: Appears 2 times → 3000 × 2 = 6000 win, Net = +3000
- Crab: Appears 0 times → Loss = -1000

Total Net = 0 + 3000 - 1000 = +2000

Tom's new balance = Old balance + 2000
```

**FR-4.3.3: Balance Update Process**

```
For each player after dice results:
  1. Retrieve player's bets for this round
  2. Count occurrences of each bet animal in dice results
  3. Calculate net change for each bet
  4. Sum total net change
  5. Update player balance: newBalance = oldBalance + netChange
  6. Save transaction record:
     {
       roundNumber,
       playerId,
       bets: {animal: amount},
       diceResults: [d1, d2, d3],
       netChange,
       newBalance
     }
  7. Check if newBalance = 0 → trigger auto-removal
```

#### Test Cases

| Test ID  | Test Case                            | Expected Result               |
| -------- | ------------------------------------ | ----------------------------- |
| TC-4.3.1 | Single Bet Win - 1 Match             | Net = 0 (break even)          |
| TC-4.3.2 | Single Bet Win - 2 Matches           | Net = +betAmount              |
| TC-4.3.3 | Single Bet Win - 3 Matches (Jackpot) | Net = +2×betAmount            |
| TC-4.3.4 | Single Bet Loss - 0 Matches          | Net = -betAmount              |
| TC-4.3.5 | Multiple Bets Mixed Results          | Correct total net calculated  |
| TC-4.3.6 | All Bets Lost                        | Negative net, balance reduced |
| TC-4.3.7 | All-In Win                           | Balance doubled or more       |
| TC-4.3.8 | All-In Loss Triggers Auto-Removal    | Balance = 0, player removed   |

---

## Phase 5: Results Display & Round Completion

### 5.1 Results Popup

#### User Story

> **As a player**, I want to see detailed round results in a popup so that I understand what I won or lost.
>
> **As an admin**, I want to control when the results popup closes so that all players have time to review results.

#### Functional Requirements

**FR-5.1.1: Results Popup Design**

```
Popup Layout:
- Size: Large modal, 800px wide, auto height
- Position: Center of screen, overlay with dark background
- Header: "🎄 Round X Results 🎄"
- Subtitle: "Dice Results: [emoji] [emoji] [emoji]"

Main Content Sections:

1. Dice Results Display (Top)
   - Large display of 3 dice with final results
   - Winning animals have gold glow/border

2. Winners Section (if any)
   - Table showing winners with winnings
   - Sorted by highest winnings first

3. All Players Summary
   - Table with all player results
   - Color coded (green positive, red negative)

4. Special Notifications
   - Jackpot notifications
   - Player elimination notices

Footer:
- Close button (admin only): "Close Results" (large, red)
- For players: "Waiting for admin to close results..."
```

**FR-5.1.2: Popup Display Trigger**

- Displays after dice animation completes
- Shown to all players simultaneously
- Modal (cannot be dismissed by clicking outside)

**FR-5.1.3: Admin Close Control**

- Only admin can close the popup
- Popup remains until admin manually closes it
- No auto-close behavior

#### Test Cases

| Test ID  | Test Case                              | Expected Result                 |
| -------- | -------------------------------------- | ------------------------------- |
| TC-5.1.1 | Results Popup Displays After Dice Roll | Popup shows for all players     |
| TC-5.1.2 | Winners Section Shows Correct Data     | Winners listed accurately       |
| TC-5.1.3 | All Players Summary Accurate           | All results displayed correctly |
| TC-5.1.4 | Jackpot Notification                   | Special message for 3x wins     |
| TC-5.1.5 | Player Elimination Notification        | Elimination notice displayed    |
| TC-5.1.6 | Only Admin Can Close Popup             | Players cannot close            |
| TC-5.1.7 | Popup Does Not Auto-Close              | Remains visible indefinitely    |

---

### 5.2 Next Round Preparation

#### Functional Requirements

**FR-5.2.1: Post-Results State Check**

- Validate player count (minimum 3 required)
- Clean up previous round data
- Reset betting boards
- Update game state

**FR-5.2.2: Continuous Game Flow**

- If sufficient players: Ready for next round
- Round counter increments sequentially
- No need to re-approve players

#### Test Cases

| Test ID  | Test Case                     | Expected Result                 |
| -------- | ----------------------------- | ------------------------------- |
| TC-5.2.1 | Sufficient Players - Continue | Ready for next round            |
| TC-5.2.2 | Insufficient Players - Wait   | Show waiting message            |
| TC-5.2.3 | Data Cleanup After Round      | All previous data cleared       |
| TC-5.2.4 | Round Counter Increments      | Sequential numbering maintained |

---

## Phase 6: Admin Interface & Features

### 6.1 Admin Dashboard Layout

#### Components

- Game Control Panel (Start/Cancel Round, Lucky Dice)
- Pending Players List (with Approve/Reject actions)
- Active Players List (with Remove action)
- Game State Display (dice, timer)
- Round History (complete game records)

### 6.2 Round History System

#### Data Structure

```javascript
{
  roundNumber: integer,
  startTime: timestamp,
  endTime: timestamp,
  diceResults: [animal1, animal2, animal3],
  participants: [{username, bets, netChange, newBalance}],
  winners: [usernames],
  totalBetsPlaced: number
}
```

#### Features

- Expandable round details
- Filter by player
- Export history as JSON
- Persistent storage

### 6.3 Emergency Controls

#### Available Controls

- Cancel Round (refunds all bets)
- Force Remove All Bets
- Adjust Player Balance (with reason required)
- Reset Game (nuclear option)

---

## Phase 7: Player Interface & Experience

### 7.1 Player Leave Functionality

#### Requirements

- Leave button always visible (except during results)
- Confirmation dialog with refund information
- Auto-cancel round if drops below 3 players

### 7.2 Player Balance & Status Display

#### Components

- Current balance (prominent display)
- Status indicator (Active/Betting/Waiting)
- Low balance warning (< 2000 coins)
- Real-time updates with animations

### 7.3 Player Results History

#### Personal Statistics

- Total rounds played
- Win rate
- Best win / Worst loss
- Favorite animal
- Lucky animal (highest win rate)

---

## Phase 8: Data Persistence & State Management

### 8.1 Storage Structure

#### Storage Keys

```
'game-state' - Current round and game state
'active-players' - List of active players
'pending-players' - List of pending approvals
'round-history' - Complete game history
'current-bets-roundX' - Per-player bets for round X
'player-history-[username]' - Individual player stats
```

### 8.2 Error Handling & Recovery

#### Error Types

- Storage save/load failures
- State corruption detection
- Network disconnection handling
- Concurrent modification conflicts

#### Recovery Mechanisms

- Retry with exponential backoff
- Fallback to default values
- State validation and repair
- User notifications and options

---

## Phase 9: Testing Strategy & Acceptance Criteria

### 9.1 Integration Test Scenarios

#### Scenario 1: Complete Game Flow - Happy Path

```
1. Three players register and get approved
2. Admin starts Round 1
3. Players place bets during 30-second window
4. Admin rolls dice
5. System calculates payouts correctly
6. Results displayed in popup
7. Admin closes results
8. Game ready for Round 2
```

#### Scenario 2: Player Elimination Flow

```
1. Player goes All-In on losing animal
2. Balance reaches 0
3. Auto-removal triggered
4. Player returned to registration
```

#### Scenario 3: Mid-Round Admin Actions

```
1. Admin removes player with active bets
2. Bets refunded
3. If < 3 players remain, round cancelled
```

### 9.2 User Acceptance Criteria

#### UAC Categories

- ✅ Player Registration & Approval
- ✅ Game Start Conditions
- ✅ Betting Mechanics
- ✅ Dice Roll & Results
- ✅ Player Management
- ✅ Admin Controls
- ✅ Data Persistence

### 9.3 Performance Criteria

```
Response Times:
- Bet placement: < 100ms
- Balance update: < 200ms
- Dice animation: 1.5s (fixed)
- Results calculation: < 500ms
- Storage operations: < 1s
- Page load: < 3s

Synchronization:
- State updates: Within 2 seconds
- Polling interval: 2 seconds

Concurrency:
- Support 1 admin + 4 players simultaneously
- Handle 20+ rounds without degradation
```

---

## Phase 10: UI/UX Specifications

### 10.1 Visual Design System

#### Color Palette

```
Primary Colors:
- Christmas Red: #C41E3A
- Christmas Green: #165B33
- Gold: #FFD700
- White: #FFFFFF

Status Indicators:
- Green: Active/Ready
- Yellow: Waiting/Warning
- Blue: In Progress
- Red: Error/Rolling
- Purple: Results Display
```

#### Typography

```
Font Family: 'Inter', system-ui, sans-serif
Sizes: H1(32px), H2(24px), H3(20px), Body(16px)
Special: Balance(28px), Timer(36px), Dice(80px emoji)
```

#### Spacing

```
Scale: xs(4px), sm(8px), md(16px), lg(24px), xl(32px)
Container: max-width 1200px
Grid: 3 columns × 2 rows (betting board)
```

### 10.2 Animation & Transitions

```
Standard: 200ms ease-in-out
Button Hover: scale(1.05)
Balance Change: 1000ms count-up/down
Dice Roll: 1500ms spinning animation
Popup: 300ms fade + scale
```

### 10.3 Responsive Design

#### Breakpoints

- Mobile: < 768px (single column)
- Tablet: 768px - 1024px (2 columns)
- Desktop: > 1024px (3 columns)

#### Touch Targets

- Minimum: 44px × 44px
- Increased spacing on mobile
- Swipe gestures for history

---

## Phase 11: Security & Validation

### 11.1 Input Validation

```
Username: 3-50 chars, alphanumeric + spaces + -_
Coins: 2000-10000, increments of 1000
Bets: 1000 minimum, <= player balance
Admin Adjustments: -10000 to +10000, reason required
```

### 11.2 Security Considerations

```
- Dice results: crypto.random (unpredictable)
- Bet modifications: Only during betting phase
- Timestamp validation: All state changes
- Rate limiting: Max 10 actions/second/player
- Data integrity: Type and range validation
```

---

## Phase 12: Error Messages & User Feedback

### 12.1 Error Message Catalog

#### Categories

- Registration Errors (username, coins)
- Betting Errors (balance, timing, all-in)
- Game Flow Errors (players, room full)
- System Errors (storage, connection, sync)

### 12.2 Success Messages

```
- Player Approved (with confetti)
- Bet Placed (toast notification)
- Round Win (celebration)
- Jackpot (special animation)
```

### 12.3 Loading States

```
- Page Load (spinning ornament)
- Dice Rolling (flip animation)
- Calculating Results (spinning coin)
- Saving Data (pulsing dot)
- Reconnecting (pulsing yellow)
```

---
