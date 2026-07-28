-- The original schema had a SELECT policy on conversations but no way to ever
-- CREATE one, so accepting an interest could never actually unlock a chat.
-- A SECURITY DEFINER trigger creates the conversation server-side when an
-- interest transitions to 'accepted', so no client-side INSERT policy on
-- conversations is needed at all (prevents anyone fabricating a conversation).

create or replace function public.create_conversation_on_interest_accept()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'accepted' and (old.status is distinct from 'accepted') then
    insert into public.conversations (interest_id) values (new.id)
    on conflict (interest_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists interests_accepted_create_conversation on public.interests;

create trigger interests_accepted_create_conversation
  after update on public.interests
  for each row
  execute function public.create_conversation_on_interest_accept();

-- Enable realtime so chat messages appear live without polling.
alter publication supabase_realtime add table public.messages;
