const express = require('express');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

const userProfile = { username: 'alice', email: 'alice@example.com' };
const activeSessions = new Map();

app.get('/login', (req, res) => {
  const sessionId = crypto.randomBytes(16).toString('hex');
  const csrfToken = crypto.randomBytes(32).toString('hex');

  activeSessions.set(sessionId, {
    username: userProfile.username,
    csrfToken: csrfToken
  });

  // Protection 1: SameSite=Lax restricts cross-site cookie attachment
  res.cookie('session_id', sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false
  });

  res.redirect('/');
});

app.get('/', (req, res) => {
  const sessionId = req.cookies.session_id;
  const session = activeSessions.get(sessionId);

  res.send(`
    <html>
      <body style="font-family: sans-serif; max-width: 500px; margin: 40px auto;">
        <h2>Secured App (Base Debian)</h2>
        <p><strong>Logged in:</strong> ${session ? session.username : 'None (<a href="/login">Log in</a>)'}</p>
        <p><strong>Current Email:</strong> ${userProfile.email}</p>
        <hr/>
        <form method="POST" action="/change-email">
          <!-- Protection 2: Synchronizer Token Pattern -->
          <input type="hidden" name="_csrf" value="${session ? session.csrfToken : ''}" />
          <label>New Email:</label><br/>
          <input type="email" name="email" required style="width: 100%; padding: 8px; margin: 8px 0;"/><br/>
          <button type="submit" style="padding: 8px 16px;">Update Email</button>
        </form>
      </body>
    </html>
  `);
});

app.post('/change-email', (req, res) => {
  const sessionId = req.cookies.session_id;
  const session = activeSessions.get(sessionId);

  if (!session) {
    return res.status(401).send('Unauthorized');
  }

  const incomingToken = req.body._csrf;
  if (
    !incomingToken ||
    !session.csrfToken ||
    !crypto.timingSafeEqual(Buffer.from(incomingToken), Buffer.from(session.csrfToken))
  ) {
    return res.status(403).send('Forbidden: CSRF token invalid');
  }

  userProfile.email = req.body.email;
  res.send(`Email updated: ${userProfile.email}. <a href="/">Back</a>`);
});

app.listen(3001, '0.0.0.0', () => {
  console.log('Secure service running on port 3001');
});