import { $, esc, toast } from './common.js';
import { initShell } from './shell.js';
import { sb } from './supa.js';
import { createRoom } from './rooms.js';
const me = await initShell('my-rooms.html');
$('#new').onclick = async () => { if (!(await createRoom(me))) toast('Could not create a room'); };
const ago = (d) => { const m = Math.max(0, Math.floor((Date.now() - new Date(d)) / 6e4)); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.floor(m / 60) + ' h ago' : Math.floor(m / 1440) + ' d ago'; };
const card = (r) => `<div class="card" style="cursor:default"><div class="th" ${r.video_id ? '' : 'style="background:linear-gradient(135deg,#3b2f9e,#1a1d46)"'}>${r.video_id ? `<img loading="lazy" src="https://i.ytimg.com/vi/${esc(r.video_id)}/mqdefault.jpg" alt="">` : ''}<span class="tag ${r.host === me.id ? 'h' : ''}" style="position:absolute;left:8px;top:8px">${r.host === me.id ? 'Host' : 'Visited'}</span></div>
<div class="cb"><b>Room ${esc(r.code)}</b><span class="mu">Created ${ago(r.created_at)}${r.video_id ? '' : ' · No video yet'}</span><div class="row" style="margin-top:8px"><button class="btn p s" data-a="join" data-c="${esc(r.code)}">Join room</button>${r.host === me.id ? `<button class="btn d s" data-a="del" data-c="${esc(r.code)}">Close</button>` : ''}</div></div></div>`;
async function load() {
  const rec = (() => { try { return JSON.parse(localStorage.getItem('ytt_recent') || '[]'); } catch (e) { return []; } })();
  const [mine, vis] = await Promise.all([
    sb.from('rooms').select('code,host,video_id,created_at').eq('host', me.id).order('created_at', { ascending: false }),
    rec.length ? sb.from('rooms').select('code,host,video_id,created_at').in('code', rec) : { data: [] },
  ]);
  const m = mine.data || [], v = (vis.data || []).filter((r) => r.host !== me.id).sort((a, b) => rec.indexOf(a.code) - rec.indexOf(b.code));
  $('#list').innerHTML = (m.length ? `<h2>Hosted by you</h2><div class="grid">${m.map(card).join('')}</div>` : '') + (v.length ? `<h2>Recently visited</h2><div class="grid">${v.map(card).join('')}</div>` : '') || '<div class="em" style="margin-top:14px">No rooms yet.</div>';
}
$('#list').onclick = async (e) => {
  const b = e.target.closest('[data-a]'); if (!b) return;
  if (b.dataset.a === 'join') return (location.href = 'room.html?code=' + b.dataset.c);
  if (!confirm('Close this room for everyone?')) return;
  const { error } = await sb.from('rooms').delete().eq('code', b.dataset.c); toast(error ? 'Could not close the room' : 'Room closed'); load();
};
load();
