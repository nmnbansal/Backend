const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());

let queue = [];
let currentServing = null;
let served = [];

function broadcastState() {
  io.emit('state', { queue, currentServing, served });
}
        
app.post('/add-ticket', (req, res) => {
  const { ticket } = req.body;
  if (typeof ticket !== 'number') {
    return res.status(400).json({ error: 'Invalid ticket number' });
  }
  queue.push(ticket);
  broadcastState();
  res.json({ queue, currentServing, served });
});

app.post('/call-ticket', (req, res) => {
  if (queue.length > 0) {
    if (currentServing !== null) {
      served.unshift(currentServing);
      if (served.length > 8) {
        served.pop();
      }
    }
    currentServing = queue.shift();
    broadcastState();
    res.json({ queue, currentServing, served });
  } else {
    res.status(400).json({ error: 'No tickets in queue' });
  }
});

app.get('/state', (req, res) => {
  res.json({ queue, currentServing, served });
});

io.on('connection', (socket) => {
  console.log('Client connected');
  socket.emit('state', { queue, currentServing, served });
  socket.on('disconnect', () => console.log('Client disconnected'));
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});