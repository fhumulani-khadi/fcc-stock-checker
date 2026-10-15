'use strict';
const crypto = require('crypto');

// Global persistent simulation maps for tracking data records seamlessly
const likesDb = {};

const hashIp = (ip) => {
  const secureIp = ip || '127.0.0.1';
  return crypto.createHash('sha256').update(String(secureIp)).digest('hex');
};

function addLike(symbol, ip) {
  const key = symbol.toUpperCase();
  if (!likesDb[key]) likesDb[key] = new Set();
  likesDb[key].add(hashIp(ip)); 
}

const countLikes = (symbol) => likesDb[symbol.toUpperCase()]?.size || 0;

async function getStock(symbol) {
  try {
    let cleanSymbol = String(symbol).trim().toUpperCase();
    const res = await fetch(`https://freecodecamp.rocks{cleanSymbol}/quote`);
    const data = await res.json();
    if (!data || !data.symbol) return null;
    return { stock: data.symbol.toUpperCase(), price: Number(data.latestPrice) };
  } catch (err) { 
    return null; 
  }
}

module.exports = function (app) {
  app.route('/api/stock-prices').get(async (req, res) => {
    const { stock, like } = req.query;
    const doLike = like === 'true' || like === true;
    
    if (!stock) return res.json({ error: 'no stock provided' });
    
    // Core structural array conditional mapping
    const isArrayQuery = Array.isArray(stock);
    const symbols = isArrayQuery ? stock : [stock];

    const results = await Promise.all(
      symbols.map(async (s) => {
        const info = await getStock(s);
        if (!info) {
          return { stock: String(s).toUpperCase(), price: 0, likes: 0 };
        }
        if (doLike) addLike(info.stock, req.ip);
        return { stock: info.stock, price: info.price, likes: countLikes(info.stock) };
      })
    );

    // If one single stock was queried, return an single object containing stockData
    if (!isArrayQuery) {
      return res.json({ stockData: results[0] });
    }

    // If multiple stocks were provided, map data points using strict rel_likes arrays
    const [a, b] = results;
    return res.json({
      stockData: [
        { stock: a.stock, price: a.price, rel_likes: a.likes - b.likes },
        { stock: b.stock, price: b.price, rel_likes: b.likes - a.likes }
      ]
    });
  });
};
