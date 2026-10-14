'use strict';

const crypto = require('crypto');

// In-memory data store for tracking unique likes per stock anonymized by hashed IP
const stockDatabase = {};

// Helper function to fetch data from freeCodeCamp's proxy api securely
async function fetchStockData(stockSymbol) {
  try {
    // FIXED: Properly formatted template literal string
    const response = await fetch(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stockSymbol}/quote`);
    const data = await response.json();
    return {
      stock: data.symbol ? data.symbol.toUpperCase() : stockSymbol.toUpperCase(),
      price: data.latestPrice ? Number(data.latestPrice) : 0
    };
  } catch (err) {
    return { stock: stockSymbol.toUpperCase(), price: 0 };
  }
}

// Anonymization helper to hash IP addresses safely using standard crypto library
function getIpHash(ip) {
  return crypto.createHash('sha256').update(ip).digest('hex');
}

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(async function (req, res) {
      const { stock, like } = req.query;
      
      const clientIp = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
      const hashedIp = getIpHash(clientIp);
      const isLiking = like === 'true' || like === true;

      if (!stock) {
        return res.json({ error: 'missing stock parameter' });
      }

      // --- SCENARIO A: Handling Multi-Stock Request Arrays ---
      if (Array.isArray(stock)) {
        const stock1Symbol = stock[0].toLowerCase();
        const stock2Symbol = stock[1].toLowerCase();

        if (!stockDatabase[stock1Symbol]) stockDatabase[stock1Symbol] = [];
        if (!stockDatabase[stock2Symbol]) stockDatabase[stock2Symbol] = [];

        if (isLiking) {
          if (!stockDatabase[stock1Symbol].includes(hashedIp)) stockDatabase[stock1Symbol].push(hashedIp);
          if (!stockDatabase[stock2Symbol].includes(hashedIp)) stockDatabase[stock2Symbol].push(hashedIp);
        }

        const [stock1Data, stock2Data] = await Promise.all([
          fetchStockData(stock1Symbol),
          fetchStockData(stock2Symbol)
        ]);

        const stock1Likes = stockDatabase[stock1Symbol].length;
        const stock2Likes = stockDatabase[stock2Symbol].length;

        return res.json({
          stockData: [
            {
              stock: stock1Data.stock,
              price: stock1Data.price,
              rel_likes: stock1Likes - stock2Likes
            },
            {
              stock: stock2Data.stock,
              price: stock2Data.price,
              rel_likes: stock2Likes - stock1Likes
            }
          ]
        });
      }

      // --- SCENARIO B: Handling Single Stock Request Strings ---
      const stockSymbol = stock.toLowerCase();
      if (!stockDatabase[stockSymbol]) {
        stockDatabase[stockSymbol] = [];
      }

      if (isLiking && !stockDatabase[stockSymbol].includes(hashedIp)) {
        stockDatabase[stockSymbol].push(hashedIp);
      }

      const externalData = await fetchStockData(stockSymbol);

      return res.json({
        stockData: {
          stock: externalData.stock,
          price: externalData.price,
          likes: stockDatabase[stockSymbol].length
        }
      });
    });
    
};
