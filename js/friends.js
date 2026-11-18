import { sb } from './supa.js';
export async function loadFriends(me) {
  const { data } = await sb.from('friendships').select('id,requester,addressee,status'); const rows = data || [];
  const ids = [...new Set(rows.map((r) => (r.requester === me.id ? r.addressee : r.requester)))], names = {};
  if (ids.length) { const { data: p } = await sb.from('profiles').select('id,username').in('id', ids); (p || []).forEach((x) => (names[x.id] = x.username)); }
  return rows.map((r) => { const id = r.requester === me.id ? r.addressee : r.requester; return { fid: r.id, id, name: names[id] || '?', status: r.status, incoming: r.addressee === me.id && r.status === 'pending' }; });
}
// Presence on a global channel so friends can see who is online.
export function trackOnline(me, onChange) {
  const ch = sb.channel('online', { config: { presence: { key: me.id } } });
  ch.on('presence', { event: 'sync' }, () => onChange && onChange(new Set(Object.keys(ch.presenceState()))));
  ch.subscribe((s) => { if (s === 'SUBSCRIBED') ch.track({ name: me.name }); });
}
