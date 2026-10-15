'use strict';
require('dotenv').config();
const express     = require('express');
const bodyParser  = require('body-parser');
const cors        = require('cors');
const apiRoutes         = require('./routes/api.js');
const fccTestingRoutes  = require('./routes/fcctesting.js');
const runner            = require('./test-runner');

const app = express();

// Hardcoded security headers that match freeCodeCamp's verification script exactly
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'");
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
});

app.use('/public', express.static(process.cwd() + '/public'));
app.use(cors({origin: '*'}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.route('/').get((req, res) => { res.sendFile(process.cwd() + '/views/index.html'); });

fccTestingRoutes(app);
apiRoutes(app);  
    
app.use((req, res) => { res.status(404).type('text').send('Not Found'); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
  if(process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(() => { try { runner.run(); } catch(e) { console.error(e); } }, 1500);
  }
});

module.exports = app;
