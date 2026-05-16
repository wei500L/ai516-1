-- Heart Cabin core schema.
-- Supabase/Postgres migration for rooms, guesses, diary access, pet chat,
-- image clue assets, and isolated markdown memory.

create extension if not exists pgcrypto;

do $$
begin
  create type public.room_visibility as enum ('private', 'unlisted', 'public');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.room_status as enum ('draft', 'active', 'archived', 'deleted');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.room_asset_type as enum ('image');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.room_asset_role as enum ('clue_image');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.pet_conversation_role as enum ('user', 'assistant');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.diary_entry_type as enum (
    'created_room',
    'guessed_room',
    'mutual_result',
    'pet_memory',
    'manual_note'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.diary_visibility as enum ('private', 'shared_by_request', 'shared');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.diary_access_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.memory_scope_type as enum ('user', 'room', 'relationship', 'pet');
exception when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '匿名小屋主人',
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  original_sentence text not null,
  hidden_meaning text not null,
  room_title text not null,
  public_title text not null,
  emotion_type text not null,
  visual_theme text not null default 'paper_cabin',
  room_json jsonb not null default '{}'::jsonb,
  visibility public.room_visibility not null default 'unlisted',
  status public.room_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rooms_public_title_not_empty check (length(trim(public_title)) > 0),
  constraint rooms_title_not_empty check (length(trim(room_title)) > 0)
);

drop trigger if exists set_rooms_updated_at on public.rooms;
create trigger set_rooms_updated_at
before update on public.rooms
for each row execute function public.set_updated_at();

create table if not exists public.room_assets (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null,
  public_url text,
  signed_url_strategy jsonb not null default '{"mode":"signed","ttl_seconds":3600}'::jsonb,
  asset_type public.room_asset_type not null default 'image',
  role public.room_asset_role not null default 'clue_image',
  safe_description text,
  created_at timestamptz not null default now(),
  constraint room_assets_storage_path_not_empty check (length(trim(storage_path)) > 0)
);

create table if not exists public.room_shares (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  share_token text not null unique,
  target_user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  constraint room_shares_token_not_empty check (length(trim(share_token)) >= 24)
);

create table if not exists public.guess_attempts (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  share_id uuid not null references public.room_shares(id) on delete cascade,
  player_id uuid references public.profiles(id) on delete set null,
  anonymous_id text,
  selected_object_ids text[] not null default array[]::text[],
  selected_choice_index integer,
  free_text_guess text,
  score numeric(6,2),
  affinity_score integer,
  hit_keywords text[] not null default array[]::text[],
  missed_keywords text[] not null default array[]::text[],
  title text,
  comment text,
  reveal_level integer not null default 0,
  owner_visibility_acknowledged_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint guess_attempts_one_player_identity check (
    (player_id is not null and anonymous_id is null)
    or (player_id is null and anonymous_id is not null)
  ),
  constraint guess_attempts_score_range check (score is null or (score >= 0 and score <= 100)),
  constraint guess_attempts_affinity_range check (affinity_score is null or (affinity_score >= 0 and affinity_score <= 100)),
  constraint guess_attempts_reveal_level_range check (reveal_level between 0 and 3)
);

create table if not exists public.pet_conversations (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  share_id uuid references public.room_shares(id) on delete set null,
  guess_attempt_id uuid references public.guess_attempts(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  role public.pet_conversation_role not null,
  content text not null,
  safe_summary text,
  hint_level integer not null default 0,
  created_at timestamptz not null default now(),
  constraint pet_conversations_content_not_empty check (length(trim(content)) > 0),
  constraint pet_conversations_hint_level_range check (hint_level between 0 and 3)
);

create table if not exists public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  guess_attempt_id uuid references public.guess_attempts(id) on delete set null,
  entry_type public.diary_entry_type not null,
  title text not null,
  markdown_content text not null default '',
  visibility public.diary_visibility not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint diary_entries_title_not_empty check (length(trim(title)) > 0)
);

drop trigger if exists set_diary_entries_updated_at on public.diary_entries;
create trigger set_diary_entries_updated_at
before update on public.diary_entries
for each row execute function public.set_updated_at();

create table if not exists public.diary_access_requests (
  id uuid primary key default gen_random_uuid(),
  diary_entry_id uuid not null references public.diary_entries(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  guess_attempt_id uuid not null references public.guess_attempts(id) on delete cascade,
  message text,
  status public.diary_access_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint diary_access_requests_status_response check (
    (status = 'pending' and responded_at is null)
    or (status <> 'pending' and responded_at is not null)
  ),
  constraint diary_access_requests_unique_open unique (diary_entry_id, requester_id, guess_attempt_id)
);

create table if not exists public.diary_comments (
  id uuid primary key default gen_random_uuid(),
  diary_entry_id uuid not null references public.diary_entries(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  constraint diary_comments_content_not_empty check (length(trim(content)) > 0)
);

create table if not exists public.memory_documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  scope_type public.memory_scope_type not null,
  scope_id uuid,
  markdown_content text not null default '',
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_memory_documents_updated_at on public.memory_documents;
create trigger set_memory_documents_updated_at
before update on public.memory_documents
for each row execute function public.set_updated_at();

create table if not exists public.relationship_scores (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references public.profiles(id) on delete cascade,
  user_b_id uuid not null references public.profiles(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  guess_attempt_id uuid not null references public.guess_attempts(id) on delete cascade,
  affinity_score integer not null,
  created_at timestamptz not null default now(),
  constraint relationship_scores_distinct_users check (user_a_id <> user_b_id),
  constraint relationship_scores_affinity_range check (affinity_score between 0 and 100),
  constraint relationship_scores_unique_attempt unique (guess_attempt_id)
);

create index if not exists rooms_creator_id_idx on public.rooms(creator_id);
create index if not exists rooms_status_visibility_idx on public.rooms(status, visibility);
create index if not exists room_assets_room_id_idx on public.room_assets(room_id);
create index if not exists room_shares_room_id_idx on public.room_shares(room_id);
create index if not exists room_shares_share_token_idx on public.room_shares(share_token);
create index if not exists guess_attempts_room_id_idx on public.guess_attempts(room_id);
create index if not exists guess_attempts_share_id_idx on public.guess_attempts(share_id);
create index if not exists guess_attempts_player_id_idx on public.guess_attempts(player_id);
create index if not exists pet_conversations_room_id_idx on public.pet_conversations(room_id);
create index if not exists pet_conversations_user_id_idx on public.pet_conversations(user_id);
create index if not exists diary_entries_owner_id_idx on public.diary_entries(owner_id);
create index if not exists diary_entries_room_id_idx on public.diary_entries(room_id);
create index if not exists diary_access_requests_owner_id_idx on public.diary_access_requests(owner_id);
create index if not exists diary_access_requests_requester_id_idx on public.diary_access_requests(requester_id);
create index if not exists diary_comments_diary_entry_id_idx on public.diary_comments(diary_entry_id);
create index if not exists memory_documents_owner_scope_idx on public.memory_documents(owner_id, scope_type, scope_id);
create index if not exists relationship_scores_users_idx on public.relationship_scores(user_a_id, user_b_id);

create or replace function public.is_room_creator(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.rooms r
    where r.id = p_room_id
      and r.creator_id = auth.uid()
      and r.status <> 'deleted'
  );
$$;

create or replace function public.is_active_share(p_share_id uuid, p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.room_shares s
    join public.rooms r on r.id = s.room_id
    where s.id = p_share_id
      and s.room_id = p_room_id
      and r.status = 'active'
      and (s.expires_at is null or s.expires_at > now())
      and (s.target_user_id is null or s.target_user_id = auth.uid())
  );
$$;

create or replace function public.can_reference_guess_attempt(
  p_guess_attempt_id uuid,
  p_room_id uuid,
  p_share_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.guess_attempts ga
    where ga.id = p_guess_attempt_id
      and ga.room_id = p_room_id
      and ga.share_id = p_share_id
      and (
        (auth.uid() is not null and ga.player_id = auth.uid())
        or (auth.uid() is null and ga.player_id is null)
      )
  );
$$;

create or replace function public.diary_access_threshold()
returns integer
language sql
immutable
as $$
  select 70;
$$;

create or replace function public.can_request_diary_access(
  p_diary_entry_id uuid,
  p_requester_id uuid,
  p_owner_id uuid,
  p_room_id uuid,
  p_guess_attempt_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.diary_entries de
    join public.guess_attempts ga on ga.id = p_guess_attempt_id
    join public.rooms r on r.id = p_room_id
    where de.id = p_diary_entry_id
      and de.owner_id = p_owner_id
      and de.room_id = p_room_id
      and de.visibility in ('shared_by_request', 'shared')
      and ga.room_id = p_room_id
      and ga.player_id = p_requester_id
      and ga.affinity_score >= public.diary_access_threshold()
      and r.creator_id = p_owner_id
      and p_requester_id = auth.uid()
      and p_requester_id <> p_owner_id
  );
$$;

create or replace function public.has_diary_access(p_diary_entry_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.diary_entries de
    where de.id = p_diary_entry_id
      and de.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.diary_access_requests dar
    where dar.diary_entry_id = p_diary_entry_id
      and dar.requester_id = auth.uid()
      and dar.status = 'approved'
  );
$$;

create or replace function public.get_room_play_payload(p_share_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_share public.room_shares%rowtype;
  v_room public.rooms%rowtype;
  v_assets jsonb;
  v_safe_room_json jsonb;
begin
  select *
  into v_share
  from public.room_shares s
  where s.share_token = p_share_token
    and (s.expires_at is null or s.expires_at > now())
    and (s.target_user_id is null or s.target_user_id = auth.uid());

  if not found then
    return null;
  end if;

  select *
  into v_room
  from public.rooms r
  where r.id = v_share.room_id
    and r.status = 'active'
    and r.visibility in ('unlisted', 'public');

  if not found then
    return null;
  end if;

  v_safe_room_json :=
    v_room.room_json
    - 'answer'
    - 'answers'
    - 'correct_answer'
    - 'correctAnswer'
    - 'original_sentence'
    - 'originalSentence'
    - 'hidden_meaning'
    - 'hiddenMeaning';

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', a.id,
        'room_id', a.room_id,
        'public_url', a.public_url,
        'signed_url_strategy', a.signed_url_strategy,
        'asset_type', a.asset_type,
        'role', a.role,
        'safe_description', a.safe_description,
        'created_at', a.created_at
      )
      order by a.created_at
    ),
    '[]'::jsonb
  )
  into v_assets
  from public.room_assets a
  where a.room_id = v_room.id;

  return jsonb_build_object(
    'share', jsonb_build_object(
      'id', v_share.id,
      'room_id', v_share.room_id,
      'expires_at', v_share.expires_at
    ),
    'room', jsonb_build_object(
      'id', v_room.id,
      'creator_id', v_room.creator_id,
      'public_title', v_room.public_title,
      'emotion_type', v_room.emotion_type,
      'visual_theme', v_room.visual_theme,
      'room_json', v_safe_room_json,
      'visibility', v_room.visibility,
      'status', v_room.status,
      'created_at', v_room.created_at,
      'updated_at', v_room.updated_at
    ),
    'assets', v_assets,
    'privacy_notice', '房间主人可以查看你提交的猜测内容和结果；提交前必须确认。'
  );
end;
$$;

comment on column public.rooms.original_sentence is 'Sensitive. Do not expose to play clients.';
comment on column public.rooms.hidden_meaning is 'Sensitive correct answer. Do not expose to play clients before reveal.';
comment on column public.guess_attempts.owner_visibility_acknowledged_at is 'Required proof that player saw the owner-can-view notice before submitting.';
comment on table public.memory_documents is 'Isolated markdown memory. Never use this as a shared diary table.';

alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_assets enable row level security;
alter table public.room_shares enable row level security;
alter table public.guess_attempts enable row level security;
alter table public.pet_conversations enable row level security;
alter table public.diary_entries enable row level security;
alter table public.diary_access_requests enable row level security;
alter table public.diary_comments enable row level security;
alter table public.memory_documents enable row level security;
alter table public.relationship_scores enable row level security;

drop policy if exists profiles_select_public on public.profiles;
create policy profiles_select_public
on public.profiles for select
to anon, authenticated
using (true);

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self
on public.profiles for insert
to authenticated
with check (id = auth.uid());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists rooms_select_creator on public.rooms;
create policy rooms_select_creator
on public.rooms for select
to authenticated
using (creator_id = auth.uid());

drop policy if exists rooms_insert_creator on public.rooms;
create policy rooms_insert_creator
on public.rooms for insert
to authenticated
with check (creator_id = auth.uid());

drop policy if exists rooms_update_creator on public.rooms;
create policy rooms_update_creator
on public.rooms for update
to authenticated
using (creator_id = auth.uid())
with check (creator_id = auth.uid());

drop policy if exists rooms_delete_creator on public.rooms;
create policy rooms_delete_creator
on public.rooms for delete
to authenticated
using (creator_id = auth.uid());

drop policy if exists room_assets_select_creator on public.room_assets;
create policy room_assets_select_creator
on public.room_assets for select
to authenticated
using (creator_id = auth.uid());

drop policy if exists room_assets_insert_creator on public.room_assets;
create policy room_assets_insert_creator
on public.room_assets for insert
to authenticated
with check (creator_id = auth.uid() and public.is_room_creator(room_id));

drop policy if exists room_assets_update_creator on public.room_assets;
create policy room_assets_update_creator
on public.room_assets for update
to authenticated
using (creator_id = auth.uid())
with check (creator_id = auth.uid() and public.is_room_creator(room_id));

drop policy if exists room_assets_delete_creator on public.room_assets;
create policy room_assets_delete_creator
on public.room_assets for delete
to authenticated
using (creator_id = auth.uid());

drop policy if exists room_shares_select_creator_or_target on public.room_shares;
create policy room_shares_select_creator_or_target
on public.room_shares for select
to authenticated
using (creator_id = auth.uid() or target_user_id = auth.uid());

drop policy if exists room_shares_insert_creator on public.room_shares;
create policy room_shares_insert_creator
on public.room_shares for insert
to authenticated
with check (creator_id = auth.uid() and public.is_room_creator(room_id));

drop policy if exists room_shares_update_creator on public.room_shares;
create policy room_shares_update_creator
on public.room_shares for update
to authenticated
using (creator_id = auth.uid())
with check (creator_id = auth.uid() and public.is_room_creator(room_id));

drop policy if exists room_shares_delete_creator on public.room_shares;
create policy room_shares_delete_creator
on public.room_shares for delete
to authenticated
using (creator_id = auth.uid());

drop policy if exists guess_attempts_select_creator_or_player on public.guess_attempts;
create policy guess_attempts_select_creator_or_player
on public.guess_attempts for select
to authenticated
using (
  player_id = auth.uid()
  or public.is_room_creator(room_id)
);

drop policy if exists guess_attempts_insert_active_share on public.guess_attempts;
create policy guess_attempts_insert_active_share
on public.guess_attempts for insert
to anon, authenticated
with check (
  public.is_active_share(share_id, room_id)
  and owner_visibility_acknowledged_at is not null
  and (
    (auth.uid() is not null and player_id = auth.uid() and anonymous_id is null)
    or (auth.uid() is null and player_id is null and anonymous_id is not null)
  )
);

drop policy if exists pet_conversations_select_self on public.pet_conversations;
create policy pet_conversations_select_self
on public.pet_conversations for select
to authenticated
using (user_id = auth.uid());

drop policy if exists pet_conversations_insert_user_message on public.pet_conversations;
create policy pet_conversations_insert_user_message
on public.pet_conversations for insert
to anon, authenticated
with check (
  role = 'user'
  and public.is_active_share(share_id, room_id)
  and (
    (auth.uid() is not null and user_id = auth.uid())
    or (auth.uid() is null and user_id is null)
  )
  and (
    guess_attempt_id is null
    or public.can_reference_guess_attempt(guess_attempt_id, room_id, share_id)
  )
);

drop policy if exists diary_entries_select_owner_or_approved on public.diary_entries;
create policy diary_entries_select_owner_or_approved
on public.diary_entries for select
to authenticated
using (public.has_diary_access(id));

drop policy if exists diary_entries_insert_owner on public.diary_entries;
create policy diary_entries_insert_owner
on public.diary_entries for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists diary_entries_update_owner on public.diary_entries;
create policy diary_entries_update_owner
on public.diary_entries for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists diary_entries_delete_owner on public.diary_entries;
create policy diary_entries_delete_owner
on public.diary_entries for delete
to authenticated
using (owner_id = auth.uid());

drop policy if exists diary_access_requests_select_owner_or_requester on public.diary_access_requests;
create policy diary_access_requests_select_owner_or_requester
on public.diary_access_requests for select
to authenticated
using (owner_id = auth.uid() or requester_id = auth.uid());

drop policy if exists diary_access_requests_insert_qualified_requester on public.diary_access_requests;
create policy diary_access_requests_insert_qualified_requester
on public.diary_access_requests for insert
to authenticated
with check (
  requester_id = auth.uid()
  and status = 'pending'
  and responded_at is null
  and public.can_request_diary_access(
    diary_entry_id,
    requester_id,
    owner_id,
    room_id,
    guess_attempt_id
  )
);

drop policy if exists diary_access_requests_update_owner_response on public.diary_access_requests;
create policy diary_access_requests_update_owner_response
on public.diary_access_requests for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid() and status in ('approved', 'rejected') and responded_at is not null);

drop policy if exists diary_comments_select_with_diary_access on public.diary_comments;
create policy diary_comments_select_with_diary_access
on public.diary_comments for select
to authenticated
using (public.has_diary_access(diary_entry_id));

drop policy if exists diary_comments_insert_with_diary_access on public.diary_comments;
create policy diary_comments_insert_with_diary_access
on public.diary_comments for insert
to authenticated
with check (
  author_id = auth.uid()
  and public.has_diary_access(diary_entry_id)
  and exists (
    select 1
    from public.diary_entries de
    where de.id = diary_entry_id
      and de.owner_id = owner_id
  )
);

drop policy if exists diary_comments_delete_author_or_owner on public.diary_comments;
create policy diary_comments_delete_author_or_owner
on public.diary_comments for delete
to authenticated
using (author_id = auth.uid() or owner_id = auth.uid());

drop policy if exists memory_documents_select_owner on public.memory_documents;
create policy memory_documents_select_owner
on public.memory_documents for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists memory_documents_insert_owner on public.memory_documents;
create policy memory_documents_insert_owner
on public.memory_documents for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists memory_documents_update_owner on public.memory_documents;
create policy memory_documents_update_owner
on public.memory_documents for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists memory_documents_delete_owner on public.memory_documents;
create policy memory_documents_delete_owner
on public.memory_documents for delete
to authenticated
using (owner_id = auth.uid());

drop policy if exists relationship_scores_select_participant on public.relationship_scores;
create policy relationship_scores_select_participant
on public.relationship_scores for select
to authenticated
using (user_a_id = auth.uid() or user_b_id = auth.uid());

revoke all on public.profiles from anon, authenticated;
revoke all on public.rooms from anon, authenticated;
revoke all on public.room_assets from anon, authenticated;
revoke all on public.room_shares from anon, authenticated;
revoke all on public.guess_attempts from anon, authenticated;
revoke all on public.pet_conversations from anon, authenticated;
revoke all on public.diary_entries from anon, authenticated;
revoke all on public.diary_access_requests from anon, authenticated;
revoke all on public.diary_comments from anon, authenticated;
revoke all on public.memory_documents from anon, authenticated;
revoke all on public.relationship_scores from anon, authenticated;

revoke all on function public.get_room_play_payload(text) from anon, authenticated;
revoke all on function public.diary_access_threshold() from anon, authenticated;
revoke all on function public.is_room_creator(uuid) from anon, authenticated;
revoke all on function public.is_active_share(uuid, uuid) from anon, authenticated;
revoke all on function public.can_reference_guess_attempt(uuid, uuid, uuid) from anon, authenticated;
revoke all on function public.can_request_diary_access(uuid, uuid, uuid, uuid, uuid) from anon, authenticated;
revoke all on function public.has_diary_access(uuid) from anon, authenticated;

grant usage on schema public to anon, authenticated;

grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;

grant select, insert, update, delete on public.rooms to authenticated;
grant select, insert, update, delete on public.room_assets to authenticated;
grant select, insert, update, delete on public.room_shares to authenticated;

grant select on public.guess_attempts to authenticated;
grant insert (
  room_id,
  share_id,
  player_id,
  anonymous_id,
  selected_object_ids,
  selected_choice_index,
  free_text_guess,
  owner_visibility_acknowledged_at
) on public.guess_attempts to anon, authenticated;

grant select on public.pet_conversations to authenticated;
grant insert (
  room_id,
  share_id,
  guess_attempt_id,
  user_id,
  role,
  content,
  hint_level
) on public.pet_conversations to anon, authenticated;

grant select, insert, update, delete on public.diary_entries to authenticated;
grant select, insert on public.diary_access_requests to authenticated;
grant update (status, responded_at) on public.diary_access_requests to authenticated;
grant select, insert, delete on public.diary_comments to authenticated;
grant select, insert, update, delete on public.memory_documents to authenticated;
grant select on public.relationship_scores to authenticated;

grant execute on function public.get_room_play_payload(text) to anon, authenticated;
grant execute on function public.diary_access_threshold() to anon, authenticated;
grant execute on function public.is_room_creator(uuid) to authenticated;
grant execute on function public.is_active_share(uuid, uuid) to anon, authenticated;
grant execute on function public.can_reference_guess_attempt(uuid, uuid, uuid) to anon, authenticated;
grant execute on function public.can_request_diary_access(uuid, uuid, uuid, uuid, uuid) to authenticated;
grant execute on function public.has_diary_access(uuid) to authenticated;

insert into storage.buckets (id, name, public)
values ('room-assets', 'room-assets', false)
on conflict (id) do update set public = false;

drop policy if exists room_assets_storage_owner_insert on storage.objects;
create policy room_assets_storage_owner_insert
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'room-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists room_assets_storage_owner_select on storage.objects;
create policy room_assets_storage_owner_select
on storage.objects for select
to authenticated
using (
  bucket_id = 'room-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists room_assets_storage_owner_update on storage.objects;
create policy room_assets_storage_owner_update
on storage.objects for update
to authenticated
using (
  bucket_id = 'room-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'room-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists room_assets_storage_owner_delete on storage.objects;
create policy room_assets_storage_owner_delete
on storage.objects for delete
to authenticated
using (
  bucket_id = 'room-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);
