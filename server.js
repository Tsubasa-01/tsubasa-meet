const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.get('/manifest.json', (req, res) => {
  res.json({
    "name": "Tsubasa Meet",
    "short_name": "TsubasaMeet",
    "description": "Videollamadas gratis estilo Google Meet",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#000000",
    "theme_color": "#000000",
    "icons": [{ "src": "https://cdn-icons-png.flaticon.com/512/1380/1380338.png", "sizes": "512x512", "type": "image/png" }]
  });
});

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html><html><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="manifest" href="/manifest.json">
<title>Tsubasa Meet</title>
<style>body{margin:0;font-family:sans-serif;background:#000;color:#fff;display:flex;flex-direction:column;height:100vh}header{padding:15px;background:#111;text-align:center;font-weight:bold}video{width:100%;height:45%;background:#222;object-fit:cover}button{padding:15px;margin:10px;background:#4285f4;color:#fff;border:none;border-radius:10px;font-size:16px}input{padding:12px;margin:10px;border-radius:8px;border:none}</style>
</head><body>
<header>TSUBASA MEET</header>
<input id="room" placeholder="Nombre de sala ej: clase1">
<button onclick="join()">Unirse a Videollamada</button>
<video id="local" autoplay muted playsinline></video>
<video id="remote" autoplay playsinline></video>
<script src="/socket.io/socket.io.js"></script>
<script>
const socket=io();let pc,localStream;
async function join(){
 const room=document.getElementById('room').value||'tsubasa';
 localStream=await navigator.mediaDevices.getUserMedia({video:true,audio:true});
 document.getElementById('local').srcObject=localStream;
 socket.emit('join',room);
}
socket.on('joined',async()=>{
 pc=new RTCPeerConnection();localStream.getTracks().forEach(t=>pc.addTrack(t,localStream));
 pc.onicecandidate=e=>{if(e.candidate)socket.emit('candidate',e.candidate)};
 pc.ontrack=e=>document.getElementById('remote').srcObject=e.streams[0];
 const offer=await pc.createOffer();await pc.setLocalDescription(offer);socket.emit('offer',offer);
});
socket.on('offer',async(offer)=>{
 pc=new RTCPeerConnection();localStream.getTracks().forEach(t=>pc.addTrack(t,localStream));
 pc.onicecandidate=e=>{if(e.candidate)socket.emit('candidate',e.candidate)};
 pc.ontrack=e=>document.getElementById('remote').srcObject=e.streams[0];
 await pc.setRemoteDescription(offer);const ans=await pc.createAnswer();await pc.setLocalDescription(ans);socket.emit('answer',ans);
});
socket.on('answer',a=>pc.setRemoteDescription(a));
socket.on('candidate',c=>pc.addIceCandidate(c));
</script>
</body></html>`);
});

io.on('connection', socket => {
  socket.on('join', room => { socket.join(room); socket.to(room).emit('joined'); });
  socket.on('offer', o => socket.broadcast.emit('offer', o));
  socket.on('answer', a => socket.broadcast.emit('answer', a));
  socket.on('candidate', c => socket.broadcast.emit('candidate', c));
});

server.listen(process.env.PORT||3000, ()=>console.log('Live'));
