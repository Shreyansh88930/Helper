// Install the 'ws' package by running: npm install ws
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 }); // WebSocket Server running on port 8080

wss.on('connection', (ws) => {
    console.log('New client connected.');

    // When a client sends a message
    ws.on('message', (message) => {
        const locationData = JSON.parse(message);
        console.log('Received location data:', locationData);

        // Broadcast the location update to all other clients (volunteers)
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message); // Send location data to all connected clients
            }
        });
    });

    ws.on('close', () => {
        console.log('Client disconnected.');
    });
});
