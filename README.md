# YoutubeTogether
Watch YouTube videos in sync with friends. Static site (GitHub Pages) using the YouTube IFrame API and PeerJS (WebRTC).

- `index.html` login/register, `home.html` friends + rooms, `room.html` watch room.
- Accounts are stored locally in your browser; friends talk peer-to-peer, so both people must be online to send requests/invites.
- A room lives as long as its host keeps the tab open.
- Version lives in `js/version.js`; update `CHANGELOG.md` on every change.
