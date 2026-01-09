// public/socket.js
const socket = io();

const params = new URLSearchParams(window.location.search);
const mode = params.get('mode') || 'display';
const room = params.get('room');

window.CINEMA = { mode, room, socket };

// ===== DISPLAY MODE =====
if (mode === 'display') {
  socket.emit('join-display');

  socket.on('display-ready', ({ room, qr }) => {
    // عرض QR
    const qrBox = document.createElement('div');
    qrBox.style.position = 'fixed';
    qrBox.style.right = '20px';
    qrBox.style.bottom = '20px';
    qrBox.style.background = '#111';
    qrBox.style.padding = '12px';
    qrBox.style.borderRadius = '12px';
    qrBox.style.zIndex = '9999';
    qrBox.innerHTML = `
      <img src="${qr}" style="width:140px;display:block"/>
      <small style="display:block;text-align:center;margin-top:6px;color:#aaa">
        Scan to control
      </small>
    `;
    document.body.appendChild(qrBox);
  });

  socket.on('play-movie', async ({ movieId }) => {
    // استخدم نفس منطقك الحالي
    const API_KEY = 'f5b55c70e58214ca052308349faccf96';
    const BASE_URL = 'https://api.themoviedb.org/3';

    const res = await fetch(
      `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&append_to_response=videos,credits`
    );
    const data = await res.json();
    localStorage.setItem('selectedMovie', JSON.stringify(data));
    window.location.href = 'movie.html';
  });

  socket.on('controller-status', ({ enabled }) => {
    console.log('Controller enabled:', enabled);
  });
}

// ===== CONTROLLER MODE =====
if (mode === 'controller' && room) {
  socket.emit('join-controller', { room });

  // تعطيل التنقل المحلي
  window.addEventListener('click', (e) => {
    const card = e.target.closest('.movie-card');
    if (!card) return;
    e.preventDefault();
  }, true);
}
