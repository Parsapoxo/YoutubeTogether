# Changelog

All notable changes to this project are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning: [SemVer](https://semver.org/).

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
