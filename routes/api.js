'use strict';

const axios = require('axios');
const crypto = require('crypto');
const likesStore = {};

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(async function (req, res){
      try {
        const result = await processStocks(req);
        res.json(result);
      } catch (error) {
        if (error.message === 'Only 1 Like per IP Allowed') {
          return res.status(400).json({ error: 'Only 1 Like per IP Allowed' });
        }
        if (error.message === 'Invalid stock query') {
          return res.status(400).json({ error: 'Invalid stock query' });
        }
        return res.status(500).json({ error: 'Failed to retrieve stock data' });
      }
    });

  async function getStockData(stockName, like, ip) {
    const key = stockName.toUpperCase();
    if (!likesStore[key]) likesStore[key] = new Set();
      
    const clientIp = await anonymizeIp(ip.replace('::ffff:', ''));
  
    const requestUrl = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stockName}/quote`;
    try {
      const response = await axios.get(requestUrl, { timeout: 5000 });
      const { symbol, latestPrice } = response.data;
  
      if (like) {
        if (likesStore[key].has(clientIp)) {
          throw new Error('Only 1 Like per IP Allowed');
        }
        likesStore[key].add(clientIp);
      }
  
      return { stock: symbol, price: latestPrice, likes: likesStore[key].size };
    } catch (error) {
      if (error.message === 'Only 1 Like per IP Allowed') throw error;
      if (error.response) throw new Error('Stock not found or invalid response from API');
      if (error.request) throw new Error('No response from stock price API');
      throw new Error('Request setup failed');
    }
  }
  
  async function processStocks(req) {
    if (typeof req.query.stock === 'string') {
      const stockInfo = await getStockData(req.query.stock, req.query.like === 'true', req.ip);
      return {
        stockData: {
          stock: stockInfo.stock,
          price: Number(stockInfo.price.toFixed(2)),
          likes: stockInfo.likes
        }
      };
    } else if (Array.isArray(req.query.stock) && req.query.stock.length === 2) {
      const [stockOne, stockTwo] = await Promise.all([
        getStockData(req.query.stock[0], req.query.like === 'true', req.ip),
        getStockData(req.query.stock[1], req.query.like === 'true', req.ip)
      ]);
      stockOne.rel_likes = stockOne.likes - stockTwo.likes;
      stockTwo.rel_likes = stockTwo.likes - stockOne.likes;
      return {
        stockData: [
          { stock: stockOne.stock, price: Number(stockOne.price.toFixed(2)), rel_likes: stockOne.rel_likes },
          { stock: stockTwo.stock, price: Number(stockTwo.price.toFixed(2)), rel_likes: stockTwo.rel_likes }
        ]
      };
    } else {
      throw new Error('Invalid stock query');
    }
  }

  async function anonymizeIp(ip) {
  return crypto.createHash('sha256').update(ip).digest('hex');
}

};
