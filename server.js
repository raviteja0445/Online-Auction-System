const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();

// Load SSL/TLS certificate and private key
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, 'cert', 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'cert', 'cert.pem'))
};

// Define a route
app.get('/', (req, res) => {
  res.send('Hello, this is a secure server!');
});

// Create HTTPS server
const server = https.createServer(sslOptions, app);

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

// Start the server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
