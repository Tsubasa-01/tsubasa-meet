const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tsubasa Meet</title>
<style>
body{margin:0;background:#111;color:#fff;font-family:sans-serif;display:flex;flex-direction:column;height:100vh}
#videos{display:flex;flex-wrap:wrap;flex:1;gap:8px;padding:8px;justify-content:center}
video{width:45%;max-width:400px;background:#000;border-radius:12px}
#controls{padding:12px;display:flex;gap:8px;justify-content:center;background:#000}
button{padding:12px 20px;border-radius:10px;border:0;font-weight:bold}
#join{background:#1e90ff;color:#fff}
</style>
</head>
<body>
<div id="videos"></div>
<div id="controls">
<input id="room" placeholder="sala: ej. tsubasa" style="padding:12px;border-radius:8px;border:0">
<button id="join">Entrar</button>
<button id="mute">Mute</button>
<button id="cam">Cam</button>
</div>
<script src="/socket.io/socket.io.js"></script>
<script>
let localStream, peers={}, socket, room;
const videos=document.getElementById('videos');
async function init(r){
 room=r;
 socket=io();
 socket.emit('join', room);
 socket.on('user-joined', async id=>{
   const pc=createPC(id); const offer=await pc.createOffer(); await pc.setLocalDescription(offer); socket.emit('signal',{to:id, data:{sdp:offer}});
 });
 socket.on('signal', async ({from, data})=>{
   let pc=peers[from]; if(!pc) pc=createPC(from);
   if(data.sdp){ await pc.setRemoteDescription(data.sdp); if(data.sdp.type==='offer'){ const ans=await pc.createAnswer(); await pc.setLocalDescription(ans); socket.emit('signal',{to:from, data:{sdp:ans}}); } }
   if(data.candidate) await pc.addIceCandidate(data.candidate);
 });
 socket.on('user-left', id=>{ if(peers[id]){peers[id].close(); delete peers[id]; document.getElementById(id)?.remove();} });
}
function createPC(id){
 const pc=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'}]});
 pc.onicecandidate=e=>{ if(e.candidate) socket.emit('signal',{to:id, data:{candidate:e.candidate}}); };
 pc.ontrack=e=>{ let v=document.getElementById(id); if(!v){ v=document.createElement('video'); v.id=id; v.autoplay=true; v.playsInline=true; videos.appendChild(v);} v.srcObject=e.streams[0]; };
 localStream.getTracks().forEach(t=>pc.addTrack(t, localStream)); peers[id]=pc; return pc;
}
document.getElementById('join').onclick=async()=>{
 const r=document.getElementById('room').value||'tsubasa';
 localStream=await navigator.mediaDevices.getUserMedia({video:true,audio:true});
 const v=document.createElement('video'); v.muted=true; v.autoplay=true; v.playsInline=true; v.srcObject=localStream; v.style.border='2px solid #1e90ff'; videos.appendChild(v);
 init(r);
};
document.getElementById('mute').onclick=()=>{ localStream.getAudioTracks().forEach(t=>t.enabled=!t.enabled); };
document.getElementById('cam').onclick=()=>{ localStream.getVideoTracks().forEach(t=>t.enabled=!t.enabled); };
</script>
</body>
</html>
  `);
});

io.on('connection', socket=>{
  socket.on('join', room=>{ socket.join(room); socket.to(room).emit('user-joined', socket.id); socket.room=room; });
  socket.on('signal', ({to, data})=>{ io.to(to).emit('signal', {from:socket.id, data}); });
  socket.on('disconnect', ()=>{ if(socket.room) socket.to(socket.room).emit('user-left', socket.id); });
});

const PORT=process.env.PORT||3000;
server.listen(PORT, ()=>console.log('listo en '+PORT));
