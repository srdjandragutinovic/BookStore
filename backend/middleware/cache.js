// middleware/cache.js
const cache = new Map();

const cacheMiddleware = (req, res, next) => {
  const cacheKey = req.originalUrl;

  // Check if the data is in the cache
  if (cache.has(cacheKey)) {
    console.log('Serving from cache');
    return res.json(cache.get(cacheKey));
  }

  // If not in cache, proceed to the route handler
  next();
};

module.exports = { cache, cacheMiddleware };