const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(__dirname));

app.get('/manifest.json', (req,res)=>{
  res.json({
    "name": "Tsubasa Meet PRO",
    "short_name": "Tsubasa PRO",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#0a2540",
    "theme_color": "#0a2540",
    "icons": [
      { "src": "/logo.svg", "sizes": "512x512", "type": "image/svg+xml", "purpose": "any maskable" }
    ]
  });
});

app.get('/', (req,res)=>{
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Si no tienes index.html, esto es fallback
app.get('/index.html', (req,res)=>{
  res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', socket => {
  socket.on('join', room => {
    socket.join(room);
    socket.to(room).emit('user-joined', socket.id);
  });
  socket.on('signal', data => {
    io.to(data.to).emit('signal', { from: socket.id, signal: data.signal });
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, ()=>console.log('Tsubasa PRO ON '+PORT));
