const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

const userProfile = { username: 'alice', email: 'alice@example.com' };

app.get('/login', (req, res) => {
  // Vulnerability: SameSite=None allows cross-site requests to include this session cookie
  res.cookie('session_user', userProfile.username, {
    httpOnly: true,
    sameSite: 'none',
    secure: false
  });
  res.redirect('/');
});

app.get('/', (req, res) => {
  const sessionUser = req.cookies.session_user;
  res.send(`
    <html>
      <body style="font-family: sans-serif; max-width: 500px; margin: 40px auto;">
        <h2>Vulnerable App (Base Debian)</h2>
        <p><strong>Logged in:</strong> ${sessionUser || 'None (<a href="/login">Log in</a>)'}</p>
        <p><strong>Current Email:</strong> ${userProfile.email}</p>
        <hr/>
        <form method="POST" action="/change-email">
          <label>New Email:</label><br/>
          <input type="email" name="email" required style="width: 100%; padding: 8px; margin: 8px 0;"/><br/>
          <button type="submit" style="padding: 8px 16px;">Update Email</button>
        </form>
      </body>
    </html>
  `);
});

app.post('/change-email', (req, res) => {
  const sessionUser = req.cookies.session_user;
  if (!sessionUser || sessionUser !== userProfile.username) {
    return res.status(401).send('Unauthorized');
  }
  userProfile.email = req.body.email;
  res.send(`Email updated: ${userProfile.email}. <a href="/">Back</a>`);
});

app.listen(3000, '0.0.0.0', () => {
  console.log('Vulnerable service running on port 3000');
});