// middleware/logger.js
const morgan = require('morgan');

const logger = morgan('combined'); // Logs in Apache combined format

module.exports = logger;