import { $, showVersion, toast, esc, parseYouTubeId, NAME_RE } from './common.js';
import { requireUser, loadData } from './auth.js';
import { createPeer, contact, RP } from './net.js';
import * as P from './player.js';
const q = new URLSearchParams(location.search), code = (q.get('code') || '').toUpperCase(), isHost = q.get('host') === '1';
if (!/^[A-Z0-9]{6}$/.test(code)) location.href = 'home.html';
const me = requireUser(); showVersion(); $('#code').textContent = code;
const status = (s) => ($('#status').textContent = s);
let peer, conns = [], hostConn;
$('#copy').onclick = () => { navigator.clipboard.writeText(`${location.origin}${location.pathname}?code=${code}`); toast('Invite link copied'); };
$('#enter').onclick = start;
function send(m) { if (isHost) conns.forEach((c) => c.open && c.send(m)); else if (hostConn && hostConn.open) hostConn.send(m); }
function apply(d) {
  if (d.t === 'video' && /^[\w-]{11}$/.test(d.id)) P.load(d.id, 0);
  else if (typeof d.time === 'number') ({ play: P.play, pause: P.pause, seek: P.seek }[d.t] || (() => {}))(d.time);
}
function renderUsers(list) {
  $('#count').textContent = list.length; $('#users').innerHTML = list.map((u) => `<div class="item"><span><span class="dot on"></span>${esc(u)}</span></div>`).join('');
}
function pushUsers() { const list = [me, ...conns.map((c) => c.meta)]; conns.forEach((c) => c.open && c.send({ t: 'users', list })); renderUsers(list); }
function onGuest(c) {
  c.on('data', (d) => {
    if (!d || typeof d !== 'object') return;
    if (d.t === 'join' && NAME_RE.test(d.name)) { c.meta = d.name; if (!conns.includes(c)) conns.push(c); c.send({ t: 'state', ...P.state() }); pushUsers(); }
    else if (['play', 'pause', 'seek', 'video'].includes(d.t) && conns.includes(c)) { conns.forEach((o) => o !== c && o.open && o.send(d)); apply(d); }
  });
  c.on('close', () => { conns = conns.filter((x) => x !== c); pushUsers(); });
}
function guestMsg(d) {
  if (!d) return;
  if (d.t === 'users') renderUsers(d.list.map(String));
  else if (d.t === 'state' && d.id) { P.load(d.id, d.time); if (!d.playing) setTimeout(() => P.pause(d.time), 1500); }
  else if (d.t === 'tick') { const s = P.state(); if (d.playing && s.id === d.id && Math.abs(s.time - d.time) > 1.5) P.seek(d.time); }
  else apply(d);
}
async function start() {
  $('#overlay').hidden = true; status('Connecting...');
  await P.initPlayer('player', { play: (t) => send({ t: 'play', time: t }), pause: (t) => send({ t: 'pause', time: t }), seek: (t) => send({ t: 'seek', time: t }) });
  try {
    if (isHost) {
      peer = await createPeer(RP + code); peer.on('connection', onGuest); peer.on('error', () => {}); renderUsers([me]); status('You are the host. Share the code or invite friends. The room closes when you leave.');
      setInterval(() => conns.length && send({ t: 'tick', ...P.state() }), 5000);
    } else {
      peer = await createPeer(); peer.on('error', () => {});
      hostConn = peer.connect(RP + code, { reliable: true });
      const t = setTimeout(() => status('Room not found or the host is offline.'), 8000);
      hostConn.on('open', () => { clearTimeout(t); status('Connected.'); hostConn.send({ t: 'join', name: me }); });
      hostConn.on('data', guestMsg); hostConn.on('close', () => status('The host left the room.'));
    }
  } catch (e) { return status(e.type === 'unavailable-id' ? 'This room code is already in use. Go back and create a new room.' : 'Network error: ' + e.type); }
  renderFriends();
}
function renderFriends() {
  const fr = Object.entries(loadData(me).friends).filter(([, s]) => s === 'accepted').map(([f]) => f);
  $('#friends').innerHTML = fr.length ? fr.map((f) => `<div class="item"><span>${esc(f)}</span><button data-f="${f}">Invite</button></div>`).join('') : 'No friends yet. Add some on the home page.';
}
$('#friends').onclick = async (e) => {
  const b = e.target.closest('button'); if (!b || !peer) return; b.disabled = true;
  const r = await contact(peer, b.dataset.f, { t: 'invite', from: me, code });
  toast(r ? 'Invite sent to ' + b.dataset.f : b.dataset.f + ' is offline'); b.disabled = false;
};
$('#load').onclick = () => {
  const id = parseYouTubeId($('#url').value); if (!id) return toast('Invalid YouTube link');
  if (!peer) return toast('Join the room first'); P.load(id, 0); send({ t: 'video', id }); $('#url').value = '';
};
