// middleware/cache.js
const cache = new Map();

const cacheMiddleware = (req, res, next) => {
  const cacheKey = req.originalUrl;

  if (cache.has(cacheKey)) {
    console.log('Serving from cache');
    return res.json(cache.get(cacheKey));
  }

  next();
};

module.exports = { cache, cacheMiddleware };