const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  this.timeout(5000); 

  suite('GET /api/stock-prices/ => stockData object', function() {
    
    test('Viewing one stock: GET request to /api/stock-prices/', function(done) {
      chai.request(server)
        .get('/api/stock-prices/')
        .query({ stock: 'goog' })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.property(res.body, 'stockData');
          assert.property(res.body.stockData, 'stock');
          assert.property(res.body.stockData, 'price');
          assert.property(res.body.stockData, 'likes');
          assert.equal(res.body.stockData.stock, 'GOOG');
          done();
        });
    });

    test('Viewing one stock and liking it: GET request to /api/stock-prices/', function(done) {
      chai.request(server)
        .get('/api/stock-prices/')
        .query({ stock: 'msft', like: true })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body.stockData.stock, 'MSFT');
          assert.isAtLeast(res.body.stockData.likes, 1);
          done();
        });
    });

    test('Viewing the same stock and liking it again: GET request to /api/stock-prices/', function(done) {
      chai.request(server)
        .get('/api/stock-prices/')
        .query({ stock: 'msft' })
        .end(function(err, res1) {
          const initialLikes = res1.body.stockData.likes;
          chai.request(server)
            .get('/api/stock-prices/')
            .query({ stock: 'msft', like: true })
            .end(function(err, res2) {
              assert.equal(res2.status, 200);
              assert.equal(res2.body.stockData.likes, initialLikes);
              done();
            });
        });
    });

    test('Viewing two stocks: GET request to /api/stock-prices/', function(done) {
      chai.request(server)
        .get('/api/stock-prices/')
        .query({ stock: ['goog', 'msft'] })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.isArray(res.body.stockData);
          assert.equal(res.body.stockData.length, 2);
          assert.equal(res.body.stockData[0].stock, 'GOOG');
          assert.equal(res.body.stockData[1].stock, 'MSFT');
          assert.property(res.body.stockData[0], 'rel_likes');
          assert.property(res.body.stockData[1], 'rel_likes');
          done();
        });
    });

    test('Viewing two stocks and liking them: GET request to /api/stock-prices/', function(done) {
      chai.request(server)
        .get('/api/stock-prices/')
        .query({ stock: ['aapl', 'amzn'], like: true })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.isArray(res.body.stockData);
          assert.equal(res.body.stockData.length, 2);
          assert.property(res.body.stockData[0], 'rel_likes');
          assert.property(res.body.stockData[1], 'rel_likes');
          done();
        });
    });

  });
});
