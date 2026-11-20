create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (username ~ '^[a-z0-9_]{3,16}$'),
  created_at timestamptz default now()
);
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, username) values (new.id, lower(new.raw_user_meta_data->>'username'));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create table public.friendships (
  id bigint generated always as identity primary key,
  requester uuid not null references public.profiles(id) on delete cascade,
  addressee uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted')),
  created_at timestamptz default now(),
  check (requester <> addressee)
);
create unique index friendships_pair on public.friendships (least(requester, addressee), greatest(requester, addressee));

create table public.rooms (
  code text primary key check (code ~ '^[A-Z0-9]{6}$'),
  host uuid not null references public.profiles(id),
  video_id text, time double precision default 0, playing boolean default false, ts bigint default 0,
  created_at timestamptz default now()
);
create table public.invites (
  id bigint generated always as identity primary key,
  from_user uuid not null references public.profiles(id) on delete cascade,
  to_user uuid not null references public.profiles(id) on delete cascade,
  code text not null,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.friendships enable row level security;
alter table public.rooms enable row level security;
alter table public.invites enable row level security;

create policy "profiles read" on public.profiles for select to authenticated using (true);
create policy "fr read" on public.friendships for select to authenticated using (auth.uid() in (requester, addressee));
create policy "fr insert" on public.friendships for insert to authenticated with check (requester = auth.uid() and status = 'pending');
create policy "fr accept" on public.friendships for update to authenticated using (addressee = auth.uid()) with check (addressee = auth.uid() and status = 'accepted');
create policy "fr delete" on public.friendships for delete to authenticated using (auth.uid() in (requester, addressee));
create policy "rooms read" on public.rooms for select to authenticated using (true);
create policy "rooms insert" on public.rooms for insert to authenticated with check (host = auth.uid());
create policy "rooms update" on public.rooms for update to authenticated using (true) with check (true);
create policy "inv read" on public.invites for select to authenticated using (auth.uid() in (from_user, to_user));
create policy "inv insert" on public.invites for insert to authenticated with check (
  from_user = auth.uid() and exists (select 1 from public.friendships f where f.status = 'accepted'
    and ((f.requester = auth.uid() and f.addressee = to_user) or (f.addressee = auth.uid() and f.requester = to_user))));
create policy "inv delete" on public.invites for delete to authenticated using (to_user = auth.uid());

alter publication supabase_realtime add table public.friendships, public.invites;

-- Table privileges (required: new projects do not grant these automatically). RLS above restricts rows.
revoke all on public.profiles, public.friendships, public.rooms, public.invites from anon, authenticated;
grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.friendships to authenticated;
grant select, insert, update on public.rooms to authenticated;
grant select, insert, delete on public.invites to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Hosts can close (delete) their own rooms.
grant delete on public.rooms to authenticated;
create policy "rooms delete" on public.rooms for delete to authenticated using (host = auth.uid());
