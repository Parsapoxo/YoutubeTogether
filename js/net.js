// Thin PeerJS wrapper. Swap this file to change the realtime provider.
export const UP = 'ytt-u-', RP = 'ytt-r-';
export function createPeer(id) {
  return new Promise((res, rej) => { const p = id ? new Peer(id) : new Peer(); p.on('open', () => res(p)); p.on('error', rej); });
}
// Send one message to a user's peer and wait for an ack (null if offline).
export function contact(peer, name, msg) {
  return new Promise((res) => {
    const c = peer.connect(UP + name); let done = false;
    const fin = (v) => { if (done) return; done = true; clearTimeout(t); res(v); setTimeout(() => { try { c.close(); } catch (e) {} }, 300); };
    const t = setTimeout(() => fin(null), 4000);
    c.on('open', () => c.send(msg)); c.on('data', (d) => { if (d && d.t === 'ack') fin(d); }); c.on('error', () => fin(null));
  });
}
