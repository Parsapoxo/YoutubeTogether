import { $, showVersion, toast, esc, randomCode, NAME_RE } from './common.js';
import { requireUser, logout, loadData, saveData } from './auth.js';
import { createPeer, contact, UP } from './net.js';
const me = requireUser(); showVersion(); $('#me').textContent = me;
const online = {}; let peer;
$('#logout').onclick = () => { logout(); location.href = 'index.html'; };
$('#create').onclick = () => (location.href = `room.html?code=${randomCode()}&host=1`);
$('#join').onclick = () => { const c = $('#code').value.trim().toUpperCase(); c.length === 6 ? (location.href = 'room.html?code=' + c) : toast('Enter a 6-character room code'); };
function setStatus(f, s) { const d = loadData(me); if (s) d.friends[f] = s; else delete d.friends[f]; saveData(me, d); render(); }
function onMsg(c, d) {
  const f = d && d.from; if (!NAME_RE.test(f || '')) return c.send({ t: 'ack' });
  const fr = loadData(me).friends; let accepted = false;
  if (d.t === 'req') { if (fr[f] === 'accepted' || fr[f] === 'out') { setStatus(f, 'accepted'); accepted = true; } else if (fr[f] !== 'in') { setStatus(f, 'in'); toast(`${f} sent you a friend request`); } }
  else if (d.t === 'accept') { if (fr[f] === 'out') setStatus(f, 'accepted'); accepted = loadData(me).friends[f] === 'accepted'; }
  else if (d.t === 'invite' && fr[f] === 'accepted' && /^[A-Z0-9]{6}$/.test(d.code)) toast(`${f} invited you to a room`, { href: 'room.html?code=' + d.code, text: 'Join' });
  if (fr[f]) online[f] = Date.now(); c.send({ t: 'ack', accepted }); render();
}
async function refresh() {
  for (const [f, s] of Object.entries(loadData(me).friends)) {
    if (s === 'in') continue;
    const r = await contact(peer, f, { t: s === 'out' ? 'req' : 'hello', from: me });
    online[f] = r ? Date.now() : 0; if (r && s === 'out' && r.accepted) setStatus(f, 'accepted');
  }
  render();
}
function render() {
  const fr = Object.entries(loadData(me).friends);
  $('#list').innerHTML = fr.length ? fr.map(([f, s]) => {
    const on = online[f] > Date.now() - 40000;
    const act = s === 'in' ? `<span><button data-a="acc" data-f="${f}">Accept</button> <button class="ghost" data-a="rm" data-f="${f}">Decline</button></span>`
      : `<span>${s === 'out' ? '<span class="mut">Pending </span>' : ''}<button class="ghost" data-a="rm" data-f="${f}">Remove</button></span>`;
    return `<div class="item"><span><span class="dot ${on ? 'on' : ''}"></span>${esc(f)} ${s === 'in' ? '<span class="mut">(wants to be friends)</span>' : ''}</span>${act}</div>`;
  }).join('') : '<p class="mut">No friends yet.</p>';
}
$('#list').onclick = (e) => {
  const b = e.target.closest('button'); if (!b) return; const f = b.dataset.f;
  if (b.dataset.a === 'acc') { setStatus(f, 'accepted'); contact(peer, f, { t: 'accept', from: me }); } else if (confirm('Remove ' + f + '?')) setStatus(f, null);
};
$('#add').onclick = () => {
  const f = $('#fname').value.trim().toLowerCase();
  if (!NAME_RE.test(f) || f === me) return toast('Enter a valid username');
  if (loadData(me).friends[f]) return toast('Already in your list');
  setStatus(f, 'out'); $('#fname').value = ''; refresh(); toast('Request sent');
};
render();
createPeer(UP + me).then((p) => { peer = p; p.on('connection', (c) => c.on('data', (d) => onMsg(c, d))); p.on('error', () => {}); refresh(); setInterval(refresh, 15000); })
  .catch((e) => { $('#status').textContent = e.type === 'unavailable-id' ? 'This account is already open in another tab or device. Close it to use friends here.' : 'Could not reach the network (' + e.type + ')'; });
