'use strict';
const crypto = require('crypto');

// In-memory store: { GOOG: Set(hashedIps) }
const likesDb = {};

const hashIp = (ip) => {
  const cleanIp = ip ? String(ip).trim() : '127.0.0.1';
  return crypto.createHash('sha256').update(cleanIp).digest('hex');
};

function addLike(symbol, ip) {
  const key = symbol.toUpperCase();
  if (!likesDb[key]) likesDb[key] = new Set();
  likesDb[key].add(hashIp(ip)); // a Set means one like per IP
}

const countLikes = (symbol) => {
  const set = likesDb[symbol.toUpperCase()];
  return set ? set.size : 0;
};

async function getStock(symbol) {
  try {
    const cleanSymbol = String(symbol).trim().toUpperCase();
    const res = await fetch(
      https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${cleanSymbol}/quote
    );
    const data = await res.json();
    if (!data || !data.symbol) return null;
    return {
      stock: String(data.symbol).toUpperCase(),
      price: Number(data.latestPrice),
    };
  } catch (err) {
    return null;
  }
}

module.exports = function (app) {
  app.route('/api/stock-prices').get(async (req, res) => {
    const { stock, like } = req.query;

    if (!stock) return res.json({ error: 'no stock provided' });

    const doLike = String(like).toLowerCase() === 'true';
    const isArrayQuery = Array.isArray(stock);
    const symbols = isArrayQuery ? stock : [stock];

    // On Render, x-forwarded-for can hold several IPs separated by commas
    const clientIp = (
      req.headers['x-forwarded-for'] ||
      req.socket.remoteAddress ||
      req.ip ||
      ''
    )
      .toString()
      .split(',')[0]
      .trim();

    const results = await Promise.all(
      symbols.map(async (s) => {
        const info = await getStock(s);
        if (!info) {
          return { stock: String(s).toUpperCase(), price: 0, likes: 0 };
        }
        if (doLike) addLike(info.stock, clientIp);
        return {
          stock: info.stock,
          price: info.price,
          likes: countLikes(info.stock),
        };
      })
    );

    // One stock: { stockData: { stock, price, likes } }
    if (!isArrayQuery) {
      return res.json({ stockData: results[0] });
    }

    // Two stocks: { stockData: [ { stock, price, rel_likes }, ... ] }
    const [a, b] = results;
    return res.json({
      stockData: [
        { stock: a.stock, price: a.price, rel_likes: a.likes - b.likes },
        { stock: b.stock, price: b.price, rel_likes: b.likes - a.likes },
      ],
    });
  });
};
