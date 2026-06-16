const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const user = await query(
      'SELECT balance FROM users WHERE id = ?',
      [req.user.id]
    );

    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      balance: user[0].balance,
      accountNumber: req.user.account_number
    });

  } catch (error) {
    console.error('Balance check error:', error);
    res.status(500).json({ error: 'Failed to check balance' });
  }
});

router.post('/transfer', authenticateToken, async (req, res) => {
  try {
    const { toAccount, amount, description } = req.body;

    if (!toAccount || !amount) {
      return res.status(400).json({ error: 'Recipient account and amount are required' });
    }

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({ error: 'Invalid transfer amount' });
    }

    if (toAccount === req.user.account_number) {
      return res.status(400).json({ error: 'Cannot transfer to your own account' });
    }

    const connection = await require('../config/database').getConnection();
    
    try {
      await connection.beginTransaction();

      const [sender] = await connection.execute(
        'SELECT balance FROM users WHERE id = ? FOR UPDATE',
        [req.user.id]
      );

      if (sender[0].balance < transferAmount) {
        await connection.rollback();
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      const [recipient] = await connection.execute(
        'SELECT id, username FROM users WHERE account_number = ? FOR UPDATE',
        [toAccount]
      );

      if (recipient.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Recipient account not found' });
      }

      await connection.execute(
        'UPDATE users SET balance = balance - ? WHERE id = ?',
        [transferAmount, req.user.id]
      );

      await connection.execute(
        'UPDATE users SET balance = balance + ? WHERE account_number = ?',
        [transferAmount, toAccount]
      );

      await connection.execute(
        'INSERT INTO transactions (from_account, to_account, amount, description) VALUES (?, ?, ?, ?)',
        [req.user.account_number, toAccount, transferAmount, description || null]
      );

      await connection.commit();

      const [updatedSender] = await connection.execute(
        'SELECT balance FROM users WHERE id = ?',
        [req.user.id]
      );

      res.json({
        message: 'Transfer successful',
        amount: transferAmount,
        toAccount,
        toUsername: recipient[0].username,
        newBalance: updatedSender[0].balance
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ error: 'Transfer failed' });
  }
});

router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const transactions = await query(`
      SELECT 
        t.*,
        CASE 
          WHEN t.from_account = ? THEN 'sent'
          WHEN t.to_account = ? THEN 'received'
        END as transaction_direction
      FROM transactions t 
      WHERE t.from_account = ? OR t.to_account = ?
      ORDER BY t.created_at DESC
      LIMIT 50
    `, [req.user.account_number, req.user.account_number, req.user.account_number, req.user.account_number]);

    res.json({ transactions });

  } catch (error) {
    console.error('Transaction history error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

module.exports = router;
