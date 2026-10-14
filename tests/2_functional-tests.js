const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {

  test('Viewing one stock', function(done) {
        chai.request(server)
          .get('/api/stock-prices')
          .query({stock: 'goog'})
          .end(function(err, res){
            assert.equal(res.body['stockData']['stock'].toUpperCase(), 'GOOG')
            assert.isNotNull(res.body['stockData']['price'])
            assert.isNotNull(res.body['stockData']['likes'])
            done();
          });
        });
        
        test('Viewing one stock and liking it', function(done) {
          chai.request(server)
          .get('/api/stock-prices')
          .query({stock: 'goog', like: true})
          .end(function(err, res){
            assert.equal(res.body['stockData']['stock'], 'GOOG')
            assert.equal(res.body['stockData']['likes'], 1)
            done();
          });
        });
        
        test('Viewing the same stock and liking it again', function(done) {
          chai.request(server)
          .get('/api/stock-prices')
          .query({stock: 'goog', like: true})
          .end(function(err, res){
            assert.equal(res.body.error, 'Only 1 Like per IP Allowed');
            done()
          });
        });
        
        test('Viewing two stocks', function(done) {
          chai.request(server)
            .get('/api/stock-prices')
            .query({ stock: ['msft', 'goog'] })
            .end(function(err, res) {
              assert.isNull(err);
              assert.equal(res.status, 200);

              const stockData = res.body.stockData;
              assert.isArray(stockData);
              assert.equal(stockData.length, 2);

              const msftData = stockData.find(item => item.stock === 'MSFT');
              const googData = stockData.find(item => item.stock === 'GOOG');

              assert.isObject(msftData);
              assert.equal(msftData.stock.toUpperCase(), 'MSFT')
              assert.exists(msftData.price);
              assert.exists(msftData.rel_likes); 

              assert.isObject(googData);
              assert.equal(googData.stock.toUpperCase(), 'GOOG')
              assert.exists(googData.price);
              assert.exists(googData.rel_likes); 
              
              done();
            });
        });
        
        test('Viewing two stocks and liking them', function(done) {
          chai.request(server)
          .get('/api/stock-prices')
          .query({stock: ['spot', 'amzn'], like: true})
          .end(function(err, res){
            assert.isNull(err);
              assert.equal(res.status, 200);

              const stockData = res.body.stockData;
              assert.isArray(stockData);
              assert.equal(stockData.length, 2);

              const spotData = stockData.find(item => item.stock === 'SPOT');
              const amznData = stockData.find(item => item.stock === 'AMZN');

              assert.isObject(spotData);
              assert.equal(spotData.stock.toUpperCase(), 'SPOT')
              assert.exists(spotData.price);
              assert.equal(spotData.rel_likes, 0); 

              assert.isObject(amznData);
              assert.equal(amznData.stock.toUpperCase(), 'AMZN')
              assert.exists(amznData.price);
              assert.equal(amznData.rel_likes, 0); 
            done()
          });
        });

});


