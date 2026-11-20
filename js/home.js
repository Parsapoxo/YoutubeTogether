import { $, esc, toast, parseYouTubeId } from './common.js';
import { initShell } from './shell.js';
import { sb } from './supa.js';
import { createRoom, roomExists } from './rooms.js';
const me = await initShell('home.html');
const h = new Date().getHours(); $('#greet').textContent = `${h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'}, ${me.name}`;
const jc = new URLSearchParams(location.search).get('join'); if (jc) location.href = 'room.html?code=' + jc.toUpperCase();
const mk = async (v) => { if (!(await createRoom(me, v))) toast('Could not create a room'); };
$('#create').onclick = () => mk();
$('#join').onclick = async () => { const c = $('#code').value.trim().toUpperCase(); (await roomExists(c)) ? (location.href = 'room.html?code=' + c) : toast('Room not found'); };
$('#go').onclick = () => { const v = parseYouTubeId($('#url').value); $('#urlerr').textContent = v ? '' : 'That doesn’t look like a YouTube link.'; if (v) mk(v); };
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
async function loadFeed() {
  try { const c = JSON.parse(sessionStorage.getItem('ytt_feed') || 'null'); if (c && Date.now() - c.t < 6e5) return c.d; } catch (e) {}
  const { data, error } = await sb.functions.invoke('yt-feed'); if (error || !data) throw new Error((error && error.message) || 'No data');
  try { sessionStorage.setItem('ytt_feed', JSON.stringify({ t: Date.now(), d: data.channels })); } catch (e) {}
  return data.channels;
}
const card = (v) => `<div class="card" data-v="${v.id}"><div class="th"><img loading="lazy" src="https://i.ytimg.com/vi/${v.id}/mqdefault.jpg" alt=""><span class="pi">▶</span></div><div class="hv"><button class="btn p s">Youtube Together</button></div><div class="cb"><b>${esc(v.title)}</b><span class="mu">${esc(v.ch)}</span></div></div>`;
let all = [];
function render() {
  const ok = (c) => c.videos.filter((v) => /^[\w-]{11}$/.test(v.id)).map((v) => ({ ...v, ch: c.name }));
  const picks = shuffle(all.flatMap((c) => shuffle(ok(c)).slice(0, 2)));
  $('#feed').innerHTML = (picks.length ? `<div class="page-h"><h2>Random picks</h2><button class="btn s" id="shuffle">↻ Shuffle</button></div><div class="strip" style="margin-top:12px">${picks.map(card).join('')}</div>` : '<div class="em">No videos could be loaded right now.</div>')
    + all.map((c) => ({ c, l: shuffle(ok(c)).slice(0, 8) })).filter((x) => x.l.length).map((x) => `<h2>${esc(x.c.name)}</h2><div class="strip">${x.l.map(card).join('')}</div>`).join('');
}
$('#feed').onclick = (e) => { if (e.target.closest('#shuffle')) return render(); const c = e.target.closest('[data-v]'); if (c) mk(c.dataset.v); };
try { all = await loadFeed(); render(); } catch (e) { $('#feed').innerHTML = `<div class="em">Could not load videos: ${esc(e.message)}</div>`; }
