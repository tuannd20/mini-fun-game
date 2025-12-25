const express = require('express');
const router = express.Router();
const { createOrGetUser } = require('../controllers/userController');
const { requireAuth, requireGuest } = require('../middleware/auth');

// Home page - username entry
router.get('/', requireGuest, (req, res) => {
  res.render('join', { error: null });
});

// Join game - POST username
router.post('/join', requireGuest, async (req, res) => {
  try {
    const { username, fcAmount } = req.body;
    
    if (!username || username.trim().length === 0) {
      return res.render('join', { error: 'Username is required' });
    }

    // Validate FC amount
    const fc = parseInt(fcAmount);
    if (!fcAmount || isNaN(fc) || fc < 1) {
      return res.render('join', { error: 'FC amount must be at least 1' });
    }
    if (fc > 100000) {
      return res.render('join', { error: 'FC amount cannot exceed 100,000' });
    }

    const user = await createOrGetUser(username, fc);
    
    // Set session
    req.session.userId = user._id.toString();
    req.session.username = user.username;
    
    res.redirect('/game');
  } catch (error) {
    res.render('join', { error: error.message });
  }
});

// Game page
router.get('/game', requireAuth, (req, res) => {
  res.render('index', {
    username: req.session.username,
    userId: req.session.userId,
  });
});

// Logout
router.post('/logout', requireAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/');
  });
});

module.exports = router;

