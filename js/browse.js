import { $, showVersion, toast, esc, randomCode } from './common.js';
import { requireUser } from './auth.js';
import { sb } from './supa.js';
showVersion(); const me = await requireUser();
let channels = [], sel = 0;
async function load() {
  try { const c = JSON.parse(sessionStorage.getItem('ytt_feed') || 'null'); if (c && Date.now() - c.t < 6e5) return c.d; } catch (e) {}
  const { data, error } = await sb.functions.invoke('yt-feed'); if (error || !data) throw new Error((error && error.message) || 'No data');
  try { sessionStorage.setItem('ytt_feed', JSON.stringify({ t: Date.now(), d: data.channels })); } catch (e) {}
  return data.channels;
}
function render() {
  $('#chips').innerHTML = channels.map((c, i) => `<button class="chip ${i === sel ? 'on' : ''}" data-i="${i}">${c.avatar ? `<img src="${esc(c.avatar)}" alt="">` : ''}${esc(c.name)}</button>`).join('');
  const c = channels[sel], vids = (c.videos || []).filter((v) => /^[\w-]{11}$/.test(v.id));
  $('#status').textContent = vids.length ? '' : 'No videos could be loaded for this channel' + (c.error ? ' (' + c.error + ')' : '') + '.';
  $('#grid').innerHTML = vids.map((v) => `<div class="vid"><img loading="lazy" src="https://i.ytimg.com/vi/${v.id}/mqdefault.jpg" alt=""><div><p>${esc(v.title)}</p><button data-v="${v.id}">Youtube Together</button></div></div>`).join('');
}
$('#chips').onclick = (e) => { const b = e.target.closest('button'); if (b) { sel = +b.dataset.i; render(); } };
$('#grid').onclick = async (e) => {
  const b = e.target.closest('button'); if (!b) return; b.disabled = true;
  for (let i = 0; i < 5; i++) {
    const code = randomCode(); const { error } = await sb.from('rooms').insert({ code, host: me.id, video_id: b.dataset.v, time: 0, playing: false, ts: Date.now() });
    if (!error) return (location.href = 'room.html?code=' + code);
  }
  toast('Could not create a room'); b.disabled = false;
};
try { channels = await load(); render(); } catch (e) { $('#status').textContent = 'Could not load videos: ' + e.message; }
