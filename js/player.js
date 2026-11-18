// YouTube IFrame API wrapper. Local user actions call handlers; remote actions are applied "silently".
let yt, remote = false, h = {}, lastT = 0, lastTs = 0, lastPlaying = false;
const silent = (fn) => { remote = true; fn(); setTimeout(() => (remote = false), 800); };
export function initPlayer(id, handlers) {
  h = handlers;
  return new Promise((res) => {
    const go = () => { yt = new YT.Player(id, { width: '100%', height: '100%', playerVars: { rel: 0, playsinline: 1 }, events: { onReady: () => { poll(); res(); }, onStateChange: (e) => { if (remote) return; if (e.data === 1) h.play(yt.getCurrentTime()); else if (e.data === 2) h.pause(yt.getCurrentTime()); } } }); };
    window.YT && YT.Player ? go() : (window.onYouTubeIframeAPIReady = go);
  });
}
function poll() {
  setInterval(() => {
    if (!yt.getCurrentTime) return; const t = yt.getCurrentTime(), now = Date.now();
    const exp = lastT + (lastPlaying ? (now - lastTs) / 1000 : 0);
    if (!remote && lastTs && Math.abs(t - exp) > 1.5) h.seek(t);
    lastT = t; lastTs = now; lastPlaying = yt.getPlayerState() === 1;
  }, 500);
}
export const load = (id, t = 0) => silent(() => yt.loadVideoById(id, t));
export const play = (t) => silent(() => { if (Math.abs(yt.getCurrentTime() - t) > 1) yt.seekTo(t, true); yt.playVideo(); });
export const pause = (t) => silent(() => { yt.pauseVideo(); yt.seekTo(t, true); });
export const seek = (t) => silent(() => yt.seekTo(t, true));
export const state = () => ({ id: (yt.getVideoData && yt.getVideoData().video_id) || null, time: yt.getCurrentTime(), playing: yt.getPlayerState() === 1 });
