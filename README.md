# YoutubeTogether
Watch YouTube videos in sync with friends. Static site (GitHub Pages) + Supabase (Auth, Postgres, Realtime).

Setup: create a Supabase project, disable "Confirm email", run `sql/schema.sql` in the SQL Editor, and put the project URL / publishable key in `js/config.js`.

Pages: `index.html` (login), `home.html` (friends, rooms, invites), `room.html` (watch room). Version lives in `js/version.js`; update `CHANGELOG.md` on every change.
