const express = require('express');
const https = require('https');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const privateKey = fs.readFileSync('server.key', 'utf8');
const certificate = fs.readFileSync('server.crt', 'utf8');
const credentials = { key: privateKey, cert: certificate, passphrase: 'ravixdhanush' };

const server = https.createServer(credentials, app); 
const io = socketIo(server);


app.use(express.static(path.join(__dirname, 'public')));

// ACtive Aucions is an array for keeping track of all AUctions..

const activeAuctions = {}; 

// Listen for socket connections
io.on('connection', socket => {
  // WE Are Starting the  auction here
  socket.on('startAuction', auctionId => {
    if (!activeAuctions[auctionId]) {
      activeAuctions[auctionId] = {
        highestBid: 0,
        highestBidder: null,
        endTime: Date.now() + 30000 // 30 seconds 
      };
      io.to(auctionId).emit('auctionStarted', auctionId, activeAuctions[auctionId].endTime);
      startTimer(auctionId);
    }
  });

  // NEW BID IS CHECKED, IF IT IS GREATER THAN THE PREVIOUS HIGHEST BID
  socket.on('newBid', ({ auctionId, bid }) => {
    const auction = activeAuctions[auctionId];
    if (auction && bid > auction.highestBid) {
      auction.highestBid = bid;
      auction.highestBidder = socket.id;
      io.to(auctionId).emit('newHighestBid', { auctionId, highestBid: bid, highestBidder: socket.id });
    }
  });

  // TIMER IS STARTED WHEN THE AUCTION STARTS. AND THIS TIME IS DISPLAYED ON THE SCREEN
  function startTimer(auctionId) {
    const auction = activeAuctions[auctionId];
    if (auction) {
      auction.timer = setInterval(() => {
        const timeRemaining = Math.max(0, auction.endTime - Date.now());
        io.to(auctionId).emit('timerUpdate', auctionId, timeRemaining);
        if (timeRemaining === 0) {
          clearInterval(auction.timer);
          io.to(auctionId).emit('auctionEnded', auctionId);
          delete activeAuctions[auctionId];
        }
      }, 1000);
    }
  }

  // IF THERE ARE NO CLIENTS, CLOE THE AUCTION
  socket.on('disconnect', () => {
    //
    for (const auctionId in activeAuctions) {
      if (activeAuctions.hasOwnProperty(auctionId) && activeAuctions[auctionId].timer) {
        clearInterval(activeAuctions[auctionId].timer);
        delete activeAuctions[auctionId];
      }
    }
  });
  
  // specific rooms
  socket.on('joinRoom', room => {
    socket.join(room);
  });
});

// Start the server
const port = process.env.PORT || 8000;
const host = '0.0.0.0'; //
server.listen(port, host, () => {
  console.log(`Server is running on port ${port}`);
});
