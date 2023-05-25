const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();

app.set('view engine', 'ejs');

// Middleware
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

let hashedPin = bcrypt.hashSync(process.env.PIN, 10);
let redirectURL = 'https://example.com';

app.get('/', (req, res) => {
  res.redirect(redirectURL);
});

app.get('/admin', (req, res) => {
  const pin = req.cookies?.pinLogin || "";

  if (pin === hashedPin) {
    res.render('admin', { redirectURL });
  } else {
    res.clearCookie('pinLogin');
    res.render('pin-login');
  }
});

app.post('/admin/login', (req, res) => {
  const { pin } = req.body;

  if (bcrypt.compareSync(pin, hashedPin)) {
    res.cookie('pinLogin', hashedPin, { maxAge: 600000, httpOnly: true });
  }
  res.redirect('/admin');
});

app.post('/admin/update', (req, res) => {
  const { newURL } = req.body;
  redirectURL = newURL;
  res.redirect('/admin');
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
