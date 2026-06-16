const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const authenticateToken = async (req, res, next) => {
  try {
    const token = req.cookies.jwt_token;
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const tokenRecord = await query(
      'SELECT * FROM user_tokens WHERE token_hash = ? AND is_active = TRUE AND expires_at > NOW()',
      [require('crypto').createHash('sha256').update(token).digest('hex')]
    );

    if (tokenRecord.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const user = await query(
      'SELECT id, username, email, full_name, account_number, balance FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (user.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user[0];
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

module.exports = { authenticateToken };
