# Changelog

All notable changes to this project are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning: [SemVer](https://semver.org/).

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
