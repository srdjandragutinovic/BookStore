const express = require('express');
const cors = require('cors');
const logger = require('./middleware/logger');
const bookRoutes = require('./routes/books');
const WebSocket = require('ws');
const broadcastUpdate = require('./utils/broadcast'); // Import broadcastUpdate

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(logger);

// Routes
app.use('/books', bookRoutes);

// Create HTTP server
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('New WebSocket connection');

  // Send a welcome message to the client
  ws.send(JSON.stringify({ type: 'message', content: 'Connected to WebSocket server' }));

  // Handle messages from the client (if needed)
  ws.on('message', (message) => {
    console.log('Received:', message.toString());
  });

  // Handle client disconnection
  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});

// Pass the WebSocket server to the routes
app.locals.wss = wss;
app.locals.broadcastUpdate = broadcastUpdate;