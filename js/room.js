import { $, showVersion, toast, esc, parseYouTubeId } from './common.js';
import { requireUser } from './auth.js';
import { sb } from './supa.js';
import { loadFriends, trackOnline } from './friends.js';
import * as P from './player.js';
const code = (new URLSearchParams(location.search).get('code') || '').toUpperCase();
showVersion(); const me = await requireUser(); $('#code').textContent = code;
const status = (s) => ($('#status').textContent = s), getRoom = async () => (await sb.from('rooms').select('*').eq('code', code).maybeSingle()).data;
if (!(await getRoom())) { $('#overlay').hidden = true; status('Room not found. Go back to the home page.'); throw new Error('no room'); }
let ch, leader = false; trackOnline(me);
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
async function start() {
  $('#overlay').hidden = true; status('Connecting...');
  await P.initPlayer('player', { play: (t) => local('play', t), pause: (t) => local('pause', t), seek: (t) => local('seek', t) });
  ch = sb.channel('room:' + code, { config: { presence: { key: me.id }, broadcast: { self: false } } });
  ch.on('broadcast', { event: 'sync' }, ({ payload }) => apply(payload));
  ch.on('presence', { event: 'sync' }, () => {
    const st = ch.presenceState(), ks = Object.keys(st).sort(); leader = ks[0] === me.id;
    $('#count').textContent = ks.length; $('#users').innerHTML = ks.map((k) => `<div class="item"><span><span class="dot on"></span>${esc(st[k][0].name)}</span></div>`).join('');
  });
  ch.subscribe((s) => { if (s === 'SUBSCRIBED') { ch.track({ name: me.name }); status('Connected. The room stays open even if the host leaves.'); } });
  const r = await getRoom();
  if (r && r.video_id) { P.load(r.video_id, r.time + (r.playing ? (Date.now() - r.ts) / 1000 : 0)); if (!r.playing) setTimeout(() => P.pause(r.time), 1500); }
  setInterval(() => { const s = P.state(); if (leader && s.id) send({ t: 'tick', ...s }); }, 5000);
  const fr = (await loadFriends(me)).filter((f) => f.status === 'accepted');
  $('#friends').innerHTML = fr.length ? fr.map((f) => `<div class="item"><span>${esc(f.name)}</span><button data-id="${f.id}">Invite</button></div>`).join('') : 'No friends yet.';
}
$('#friends').onclick = async (e) => {
  const b = e.target.closest('button'); if (!b) return; b.disabled = true;
  const { error } = await sb.from('invites').insert({ from_user: me.id, to_user: b.dataset.id, code }); toast(error ? 'Could not send invite' : 'Invite sent');
};
$('#load').onclick = () => {
  const id = parseYouTubeId($('#url').value); if (!id) return toast('Invalid YouTube link'); if (!ch) return toast('Join the room first');
  P.load(id, 0); send({ t: 'video', id }); save({ video_id: id, time: 0, playing: true }); $('#url').value = '';
};
