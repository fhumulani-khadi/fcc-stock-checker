'use strict';
require('dotenv').config();
const express     = require('express');
const bodyParser  = require('body-parser');
const cors        = require('cors');
const helmet      = require('helmet');

const apiRoutes         = require('./routes/api.js');
const fccTestingRoutes  = require('./routes/fcctesting.js');
const runner            = require('./test-runner');

const app = express();

app.set('trust proxy', true); 

// Enhanced Content Security Policy configured strictly to allow freeCodeCamp automated testing routes
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://jquery.com", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"]
    }
  },
  hidePoweredBy: true,
  xssFilter: true,
  noSniff: true,
  ieNoOpen: true
}));

app.use('/public', express.static(process.cwd() + '/public'));
app.use(cors({origin: '*'})); // For FCC testing purposes only

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });

// For FCC testing purposes
fccTestingRoutes(app);

// Routing for API 
apiRoutes(app);  
    
// 404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

// Robust environment detection fallback configuration to force test suites running under cloud execution paths
const isTestEnv = process.env.NODE_ENV === 'test' || String(process.env.NODE_ENV).trim() === 'test';
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Listening on port:", PORT);
    if (isTestEnv) {
      console.log('Running Tests...');
      setTimeout(function () {
        try {
          runner.run();
        } catch(e) {
          console.log('Tests are not valid:', e);
        }
      }, 1500);
    }
});

module.exports = app; // For testing
