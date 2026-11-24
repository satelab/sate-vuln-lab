const bcrypt = require('bcrypt');
const db = require('./database');

(async () => {
  const hash = await bcrypt.hash('password123', 10);
  db.run('INSERT OR IGNORE INTO users (email, password) VALUES (?, ?)',
    ['test@example.com', hash], (err) => {
      console.log(err || 'Seeded: test@example.com / password123');
    });
})();