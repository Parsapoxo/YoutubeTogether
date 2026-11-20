# Changelog

All notable changes to this project are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning: [SemVer](https://semver.org/).

## [0.7.3] - 2026-11-20
### Fixed
- "Join room" overlay stayed on screen after clicking (the `hidden` attribute was overridden by CSS). Added a global `[hidden]` rule, which also fixes other hidden elements (badges, notices).
- Room now shows a clear message if the realtime connection fails.

## [0.7.2] - 2026-11-19
### Fixed
- Page flicker when switching between pages: sidebar and tab bar are now static HTML (name, avatar and badge come from a local cache first), theme is applied before first paint, and smooth page transitions are enabled.

## [0.7.1] - 2026-11-19
### Changed
- Removed the duplicate Profile item from the sidebar list; Profile is opened from the user block at the bottom of the sidebar (still a tab in the mobile bottom bar).

## [0.7.0] - 2026-11-19
### Added
- My rooms page: rooms you host (with a Close button) and rooms you visited recently (remembered in this browser), with thumbnails and Join buttons.
- Navigation item for My rooms; hosts can now delete their own rooms (RLS policy in `sql/schema.sql`).

## [0.6.0] - 2026-11-19
### Changed
- Full redesign using the VibeRoom template: sidebar navigation (bottom tab bar on mobile), dark/light theme, hero, video strips, cards, modals.
- Pages: Home, Friends (My friends / Online / Pending / Sent), Notifications (friend requests + room invites), Profile (theme, log out), Room (player, participants, chat, invite modal).
- Home shows random picks plus one strip per YouTuber; clicking a video starts a room with it. You can also paste a YouTube link to start a room.
- Login now returns you to the page you were opening (e.g. an invite link).
- Shared CSS is now `css/theme.css`; navigation is built by `js/shell.js`.

### Removed
- Old per-page stylesheets.

## [0.5.0] - 2026-11-19
### Changed
- Redesigned the Home page: top navigation bar, hero section, two-column layout (videos + friends/invites), polished cards and hover effects.
- Home now shows random videos from the YouTubers list (2 per channel, shuffled, with a Shuffle button); clicking one starts a room with that video.

### Removed
- Separate Browse page (`browse.html`), replaced by the Home page video picks.

## [0.4.0] - 2026-11-19
### Added
- Live chat inside rooms (Realtime Broadcast). Messages are not stored: they only appear for people currently in the room.

## [0.3.1] - 2026-11-19
### Changed
- Browse page button renamed to "Youtube Together" to match the project name.

## [0.3.0] - 2026-11-19
### Added
- Browse page (`browse.html`): curated YouTubers (AriaKeoXer, KeoxerGame, TheUpsideDownByKeoxer, Kouman, DogmNabash, MrBeast) with their latest videos; "Youtube Together" creates a room with that video, then invite friends from the room.
- Supabase Edge Function `yt-feed` (source in `supabase/functions/yt-feed/`) that reads channel feeds from a fixed allow-list.
- Link to the browse page on the home page.

### Fixed
- `sql/schema.sql` now includes the table GRANTs that were missing (caused 403 / "User not found").

## [0.2.1] - 2026-11-19
### Fixed
- Password field could not be typed into (keydown handler returned false and blocked input).

## [0.2.0] - 2026-11-18
### Added
- Supabase backend: real accounts that work from any device (Supabase Auth, username mapped to a synthetic email).
- Persistent friends system (requests are stored, no need to be online at the same time).
- Persistent room invites delivered in real time or on next visit.
- Online presence for friends and for room members.
- `sql/schema.sql` with tables and Row Level Security policies.

### Changed
- Rooms are now stored in the database and synced via Realtime Broadcast; they no longer close when the creator leaves.
- Late joiners receive the saved video state.

### Removed
- PeerJS / local-only accounts.

## [0.1.0] - 2026-11-18
### Added
- Initial multi-file project structure, local accounts, P2P friends and rooms, synchronized YouTube playback, version badge.
