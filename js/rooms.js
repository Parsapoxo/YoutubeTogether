import { sb } from './supa.js';
import { randomCode } from './common.js';
export async function createRoom(me, videoId) {
  for (let i = 0; i < 5; i++) {
    const code = randomCode(), row = { code, host: me.id };
    if (videoId) Object.assign(row, { video_id: videoId, time: 0, playing: false, ts: Date.now() });
    const { error } = await sb.from('rooms').insert(row); if (!error) { location.href = 'room.html?code=' + code; return true; }
  }
  return false;
}
export async function roomExists(code) { const { data } = await sb.from('rooms').select('code').eq('code', code).maybeSingle(); return !!data; }
