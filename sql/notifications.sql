-- Notifications feature setup
-- Run this once in the Supabase SQL editor.
--
-- If your `conversations.id` is not a uuid, change the conversation_id column
-- type below to match (e.g. bigint).

-- 1. Table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  conversation_id uuid references public.conversations(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, read_at, created_at desc);

-- 2. Row Level Security
alter table public.notifications enable row level security;

drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- No insert policy on purpose: rows are only created by the trigger below
-- (which runs as security definer and bypasses RLS).

-- 3. Trigger: insert a notification for the OTHER participant when a message
--    is created.
create or replace function public.handle_new_message_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  conv record;
  recipient uuid;
begin
  select owner_id, seeker_id
    into conv
    from public.conversations
    where id = NEW.conversation_id;

  if conv is null then
    return NEW;
  end if;

  if NEW.sender_id = conv.owner_id then
    recipient := conv.seeker_id;
  else
    recipient := conv.owner_id;
  end if;

  if recipient is null or recipient = NEW.sender_id then
    return NEW;
  end if;

  insert into public.notifications (user_id, type, conversation_id, sender_id)
  values (recipient, 'message', NEW.conversation_id, NEW.sender_id);

  return NEW;
end;
$$;

drop trigger if exists on_new_message_notify on public.messages;
create trigger on_new_message_notify
  after insert on public.messages
  for each row execute function public.handle_new_message_notification();

-- 4. Realtime: so the bell can react instantly.
alter publication supabase_realtime add table public.notifications;
