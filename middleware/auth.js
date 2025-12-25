/**
 * Middleware to check if user is authenticated (has session user)
 */
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.redirect('/');
  }
  next();
}

/**
 * Middleware to check if user is not authenticated
 */
function requireGuest(req, res, next) {
  if (req.session && req.session.userId) {
    return res.redirect('/game');
  }
  next();
}

module.exports = {
  requireAuth,
  requireGuest,
};

