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

// 1. Static files must be declared BEFORE the strict Content Security Policy middleware
app.use('/public', express.static(process.cwd() + '/public'));
app.use(cors({origin: '*'})); 

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Front-end route bypasses helmet CSP checking loops
app.route('/').get(function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// 2. Strict Content Security Policy injected right before functional testing routes
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'"]
  }
}));

fccTestingRoutes(app);
apiRoutes(app);  
    
app.use(function(req, res, next) {
  res.status(404).type('text').send('Not Found');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
  console.log('Listening on port ' + PORT);
  if (process.env.NODE_ENV === 'test' || true) {
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

module.exports = app;
