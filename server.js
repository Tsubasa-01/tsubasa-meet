const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.get('/manifest.json', (req, res) => {
  res.json({
    "name": "Tsubasa Meet PRO",
    "short_name": "Tsubasa PRO",
    "description": "Videollamadas PRO estilo Google Meet",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#0a0e1a",
    "theme_color": "#3b82f6",
    "icons": [{ "src": "https://cdn-icons-png.flaticon.com/512/1380/1380338.png", "sizes": "512x512", "type": "image/png" }]
  });
});

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#0a0e1a">
<title>Tsubasa Meet PRO</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
<style>body{font-family:'Inter';background:#0a0e1a}</style>
</head>
<body class="text-white min-h-screen flex flex-col">
<div id="lobby" class="flex-1 flex items-center justify-center p-4">
  <div class="w-full max-w-[420px] bg-[#151a2b] rounded-[28px] p-8 border border-white/10 shadow-2xl">
    <div class="flex items-center gap-3 mb-8">
      <div class="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-xl">📹</div>
      <div><h1 class="font-bold text-lg leading-none">Tsubasa Meet <span class="text-blue-400">PRO</span></h1><p class="text-[11px] text-white/40">Chrome App Edition</p></div>
      <span class="ml-auto text-[11px] bg-green-500/15 text-green-400 px-3 py-1 rounded-full border border-green-500/20">● Live</span>
    </div>
    <label class="text-xs text-white/50">Tu nombre</label>
    <input id="name" placeholder="Ej: Jhon" class="w-full mt-1 mb-4 p-4 rounded-2xl bg-[#0a0e1a] border border-white/10 outline-none focus:border-blue-500"/>
    <label class="text-xs text-white/50">Sala</label>
    <input id="room" placeholder="Ej: clase1" class="w-full mt-1 mb-6 p-4 rounded-2xl bg-[#0a0e1a] border border-white/10 outline-none focus:border-blue-500"/>
    <button onclick="join()" class="w-full bg-blue-500 hover:bg-blue-600 p-4 rounded-2xl font-bold transition">Unirse ahora →</button>
    <div class="grid grid-cols-3 gap-2 mt-6 text-[10px] text-white/30 text-center">
      <div>✓ Sin límite</div><div>✓ Pantalla</div><div>✓ Chat</div>
    </div>
  </div>
</div>

<div id="meet" class="hidden h-screen flex-col bg-[#0a0e1a]">
  <header class="h-14 px-4 flex items-center justify-between border-b border-white/10 bg-[#0f1424]">
    <div class="font-bold flex items-center gap-2">📹 Tsubasa Meet <span class="text-blue-400">PRO</span></div>
    <div class="flex items-center gap-3 text-xs"><span id="timer" class="text-white/60">00:00</span><span id="count" class="bg-white/10 px-3 py-1 rounded-full">1 persona</span></div>
  </header>
  <div id="grid" class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 p-3 overflow-auto"></div>
  <div class="p-3 flex justify-center">
    <div class="bg-[#1c2238] rounded-full px-2 py-2 flex items-center gap-1 border border-white/10 shadow-xl">
      <button id="micBtn" class="w-12 h-12 rounded-full bg-white/10 flex flex-col items-center justify-center"><span>🎤</span></button>
      <button id="camBtn" class="w-12 h-12 rounded-full bg-white/10 flex flex-col items-center justify-center"><span>📷</span></button>
      <button onclick="toggleChat()" class="w-12 h-12 rounded-full bg-white/10">💬</button>
      <button onclick="share()" class="w-12 h-12 rounded-full bg-white/10">🖥️</button>
      <button onclick="leave()" class="ml-2 bg-red-500 px-6 h-12 rounded-full font-bold">Salir</button>
    </div>
  </div>
  <div id="chat" class="hidden absolute bottom-20 right-4 w-80 h-80 bg-[#151a2b] rounded-2xl border border-white/10 flex flex-col">
    <div class="p-3 border-b border-white/10 font-bold text-sm">Chat</div>
    <div id="msgs" class="flex-1 p-3 overflow-auto text-sm space-y-2"></div>
    <div class="p-2 flex gap-2"><input id="msgInput" placeholder="Mensaje..." class="flex-1 p-2 rounded-xl bg-[#0a0e1a] border border-white/10 text-sm"/><button onclick="sendMsg()" class="bg-blue-500 px-3 rounded-xl">➤</button></div>
  </div>
</div>

<script src="/socket.io/socket.io.js"></script>
<script>
const socket = io(); let localStream, peers={}, myName, myRoom, timerInt, sec=0;
function join(){ myName=document.getElementById('name').value||'Anónimo'; myRoom=document.getElementById('room').value||'general'; if(!myRoom) return; document.getElementById('lobby').classList.add('hidden'); document.getElementById('meet').classList.remove('hidden'); document.getElementById('meet').classList.add('flex'); start(); }
async function start(){
  localStream = await navigator.mediaDevices.getUserMedia({video:true,audio:true});
  addVideo(localStream, myName+' (Tú)', true);
  socket.emit('join-room', myRoom, myName);
  timerInt=setInterval(()=>{sec++; document.getElementById('timer').innerText=new Date(sec*1000).toISOString().substr(11,8)},1000);
  document.getElementById('micBtn').onclick=()=>{ localStream.getAudioTracks()[0].enabled=!localStream.getAudioTracks()[0].enabled; document.getElementById('micBtn').style.opacity=localStream.getAudioTracks()[0].enabled?1:.4 };
  document.getElementById('camBtn').onclick=()=>{ localStream.getVideoTracks()[0].enabled=!localStream.getVideoTracks()[0].enabled; document.getElementById('camBtn').style.opacity=localStream.getVideoTracks()[0].enabled?1:.4 };
}
function addVideo(stream, name, isLocal=false){
  const grid=document.getElementById('grid'); const div=document.createElement('div'); div.className='video-card bg-[#151a2b] rounded-2xl overflow-hidden relative aspect-video border border-white/10';
  div.innerHTML=\`<video autoplay playsinline \${isLocal?'muted':''} class="w-full h-full object-cover"></video><div class="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex justify-between"><span class="text-sm">\${name}</span><span class="text-xs">🎤</span></div>\`;
  div.querySelector('video').srcObject=stream; grid.appendChild(div); updateCount();
}
function updateCount(){ document.getElementById('count').innerText=document.getElementById('grid').children.length+' personas'; }
socket.on('user-connected', async (id, name)=>{ const pc=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'}]}); peers[id]=pc; localStream.getTracks().forEach(t=>pc.addTrack(t,localStream)); pc.onicecandidate=e=>{ if(e.candidate) socket.emit('signal', id, {candidate:e.candidate}) }; pc.ontrack=e=>addVideo(e.streams[0], name); const offer=await pc.createOffer(); await pc.setLocalDescription(offer); socket.emit('signal', id, {sdp:offer}); });
socket.on('signal', async (from, data)=>{ let pc=peers[from]; if(!pc){ pc=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'}]}); peers[from]=pc; localStream.getTracks().forEach(t=>pc.addTrack(t,localStream)); pc.onicecandidate=e=>{ if(e.candidate) socket.emit('signal', from, {candidate:e.candidate}) }; pc.ontrack=e=>addVideo(e.streams[0], from); } if(data.sdp){ await pc.setRemoteDescription(data.sdp); if(data.sdp.type==='offer'){ const ans=await pc.createAnswer(); await pc.setLocalDescription(ans); socket.emit('signal', from, {sdp:ans}); } } if(data.candidate) await pc.addIceCandidate(data.candidate); });
socket.on('user-disconnected', id=>{ if(peers[id]){ peers[id].close(); delete peers[id]; } });
socket.on('chat-msg', (name, msg)=>{ const m=document.getElementById('msgs'); m.innerHTML+=\`<div><b>\${name}:</b> \${msg}</div>\`; m.scrollTop=m.scrollHeight; });
function toggleChat(){ document.getElementById('chat').classList.toggle('hidden'); }
function sendMsg(){ const i=document.getElementById('msgInput'); if(!i.value) return; socket.emit('chat-msg', myRoom, myName, i.value); i.value=''; }
function share(){ navigator.mediaDevices.getDisplayMedia({video:true}).then(s=>{ const track=s.getVideoTracks()[0]; Object.values(peers).forEach(pc=>{ const sender=pc.getSenders().find(s=>s.track.kind==='video'); if(sender) sender.replaceTrack(track); }); track.onended=()=>{ const vt=localStream.getVideoTracks()[0]; Object.values(peers).forEach(pc=>{ const sender=pc.getSenders().find(s=>s.track.kind==='video'); if(sender) sender.replaceTrack(vt); }); }; }); }
function leave(){ location.reload(); }
</script>
</body>
</html>
  `);
});

io.on('connection', socket => {
  socket.on('join-room', (room, name) => {
    socket.join(room);
    socket.to(room).emit('user-connected', socket.id, name);
    socket.on('signal', (to, data) => { io.to(to).emit('signal', socket.id, data); });
    socket.on('chat-msg', (room, name, msg) => { io.to(room).emit('chat-msg', name, msg); });
    socket.on('disconnect', () => { socket.to(room).emit('user-disconnected', socket.id); });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Tsubasa PRO running on '+PORT));
