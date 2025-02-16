// utils/broadcast.js
const WebSocket = require('ws');

// Function to broadcast updates to all connected clients
const broadcastUpdate = (wss, data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

module.exports = broadcastUpdate;