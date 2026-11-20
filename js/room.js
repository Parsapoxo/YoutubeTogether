import { $, esc, toast, av, parseYouTubeId } from './common.js';
import { initShell } from './shell.js';
import { sb } from './supa.js';
import { loadFriends } from './friends.js';
import * as P from './player.js';
const code = (new URLSearchParams(location.search).get('code') || '').toUpperCase();
if (!/^[A-Z0-9]{6}$/.test(code)) location.href = 'home.html';
const me = await initShell(''); $('#code').textContent = code;
const status = (s) => { $('#status').hidden = !s; $('#status').textContent = s; };
const getRoom = async () => (await sb.from('rooms').select('*').eq('code', code).maybeSingle()).data;
if (!(await getRoom())) { $('#overlay').hidden = true; status('Room not found. Go back to the home page.'); throw new Error('no room'); }
try { const r = JSON.parse(localStorage.getItem('ytt_recent') || '[]').filter((c) => c !== code); r.unshift(code); localStorage.setItem('ytt_recent', JSON.stringify(r.slice(0, 12))); } catch (e) {}
let ch, leader = false;
$('#copy').onclick = () => { navigator.clipboard.writeText(`${location.origin}${location.pathname.replace('room.html', '')}home.html?join=${code}`); toast('Invite link copied'); };
$('#enter').onclick = start;
const send = (p) => ch && ch.send({ type: 'broadcast', event: 'sync', payload: p });
const save = (patch) => sb.from('rooms').update({ ...patch, ts: Date.now() }).eq('code', code).then(() => {});
function local(t, time) { const s = P.state(); send({ t, time, id: s.id }); save({ video_id: s.id, time, playing: t === 'play' || (t === 'seek' && s.playing) }); }
function apply(d) {
  if (!d) return;
  if (d.t === 'video' && /^[\w-]{11}$/.test(d.id)) P.load(d.id, 0);
  else if (d.t === 'tick') { const s = P.state(); if (d.playing && s.id === d.id && Math.abs(s.time - d.time) > 1.5) P.seek(d.time); }
  else if (typeof d.time === 'number') ({ play: P.play, pause: P.pause, seek: P.seek }[d.t] || (() => {}))(d.time);
}
function addMsg(name, text) {
  const box = $('#msgs'), d = document.createElement('div'); d.className = 'm'; d.innerHTML = `${av(name)}<div><b>${esc(name)}</b><div>${esc(text)}</div></div>`; box.appendChild(d);
  while (box.children.length > 200) box.removeChild(box.firstChild); box.scrollTop = box.scrollHeight;
}
function sendChat() { const text = $('#chatin').value.trim(); if (!text || !ch) return; ch.send({ type: 'broadcast', event: 'chat', payload: { name: me.name, text } }); addMsg(me.name, text); $('#chatin').value = ''; }
$('#chatsend').onclick = sendChat; $('#chatin').addEventListener('keydown', (e) => { if (e.key === 'Enter') sendChat(); });
async function start() {
  $('#overlay').hidden = true; status('Connecting...');
  await P.initPlayer('player', { play: (t) => local('play', t), pause: (t) => local('pause', t), seek: (t) => local('seek', t) });
  ch = sb.channel('room:' + code, { config: { presence: { key: me.id }, broadcast: { self: false } } });
  ch.on('broadcast', { event: 'sync' }, ({ payload }) => apply(payload));
  ch.on('broadcast', { event: 'chat' }, ({ payload }) => payload && addMsg(String(payload.name || '?').slice(0, 20), String(payload.text || '').slice(0, 500)));
  ch.on('presence', { event: 'sync' }, () => {
    const st = ch.presenceState(), ks = Object.keys(st).sort(); leader = ks[0] === me.id; $('#count').textContent = ks.length;
    $('#users').innerHTML = ks.map((k) => `<div class="row" style="padding:5px 0">${av(st[k][0].name, 'on')}<span>${esc(st[k][0].name)}${k === me.id ? ' (you)' : ''}</span></div>`).join('');
  });
  ch.subscribe((s) => { if (s === 'SUBSCRIBED') { ch.track({ name: me.name }); status(''); $('#chatin').disabled = false; $('#chatsend').disabled = false; } });
  const r = await getRoom();
  if (r && r.video_id) { P.load(r.video_id, r.time + (r.playing ? (Date.now() - r.ts) / 1000 : 0)); if (!r.playing) setTimeout(() => P.pause(r.time), 1500); }
  setInterval(() => { const s = P.state(); if (leader && s.id) send({ t: 'tick', ...s }); }, 5000);
}
$('#load').onclick = () => {
  const id = parseYouTubeId($('#url').value); if (!id) return toast('Invalid YouTube link'); if (!ch) return toast('Join the room first');
  P.load(id, 0); send({ t: 'video', id }); save({ video_id: id, time: 0, playing: true }); $('#url').value = '';
};
$('#invite').onclick = async () => {
  const fr = (await loadFriends(me)).filter((f) => f.status === 'accepted'), on = window.online || new Set(), m = document.createElement('div'); m.className = 'modal';
  m.innerHTML = `<div class="md"><b style="font-size:18px">Invite friends</b>${fr.length ? fr.map((f) => `<div class="row">${av(f.name, on.has(f.id) ? 'on' : 'off')}<span style="flex:1">${esc(f.name)}</span><button class="btn p s" data-id="${f.id}">Send invite</button></div>`).join('') : '<div class="mu">Add friends first.</div>'}<button class="btn" data-close="1">Done</button></div>`;
  document.body.appendChild(m);
  m.onclick = async (e) => {
    if (e.target === m || e.target.dataset.close) return m.remove(); const b = e.target.closest('button[data-id]'); if (!b) return; b.disabled = true;
    const { error } = await sb.from('invites').insert({ from_user: me.id, to_user: b.dataset.id, code }); toast(error ? 'Could not send invite' : 'Invite sent');
  };
};
