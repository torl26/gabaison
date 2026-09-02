alter table public.match_requests
  drop constraint match_requests_status_check;

alter table public.match_requests
  add constraint match_requests_status_check
  check (status in ('pending', 'accepted', 'rejected', 'cancelled'));

create or replace function public.enforce_match_request_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.student_id is distinct from old.student_id
     or new.mentor_id is distinct from old.mentor_id
     or new.category_id is distinct from old.category_id then
    raise exception 'student_id, mentor_id, and category_id cannot be changed';
  end if;

  if new.status is distinct from old.status then
    if auth.uid() = old.mentor_id then
      if new.status not in ('accepted', 'rejected') then
        raise exception 'mentor can only change status to accepted or rejected';
      end if;
    elsif auth.uid() = old.student_id then
      if old.status <> 'pending' or new.status <> 'cancelled' then
        raise exception 'student can only cancel a pending request';
      end if;
    else
      raise exception 'only the mentor or student on this request can change its status';
    end if;
  end if;

  return new;
end;
$$;