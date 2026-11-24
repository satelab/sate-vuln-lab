const express = require('express');
const bcrypt = require('bcryptjs');
const path = require('path');
const rateLimit = require('express-rate-limit');
const db = require('./database');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---- RATE LIMITER SETUP ----
// Blocks an IP if they try to log in more than 5 times in 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: 'Too many login attempts from this IP, please try again after 15 minutes.',
  standardHeaders: true, 
  legacyHeaders: false, 
});

// ---- LOGIN ----
app.post('/login', loginLimiter, (req, res) => {
  // Decode the email so Burp Suite's %2e becomes a normal dot (.)
  const email = decodeURIComponent(req.body.email || '');
  const { password } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) return res.status(500).send('DB error');
    if (!user) return res.status(401).send('Invalid email or password');

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).send('Invalid email or password');

    res.send(`Welcome back, ${user.email}! ✅`);
  });
});

// ---- REGISTER ----
app.post('/register', async (req, res) => {
  // Decode the email here too
  const email = decodeURIComponent(req.body.email || '');
  const { password } = req.body;
  
  if (!email || !password) return res.status(400).send('Missing fields');

  const hash = await bcrypt.hash(password, 10);
  db.run('INSERT INTO users (email, password) VALUES (?, ?)',
    [email, hash],
    function (err) {
      if (err) return res.status(400).send('User already exists');
      res.send('User registered ✅');
    });
});

// ---- RESET ----
app.post('/reset', (req, res) => {
  // Decode the email here too
  const email = decodeURIComponent(req.body.email || '');
  res.json({ message: `Reset link would be emailed to ${email}` });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));