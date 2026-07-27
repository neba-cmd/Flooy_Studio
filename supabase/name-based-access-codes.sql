-- RUN ONCE in Supabase SQL Editor if schema.sql was already installed.
-- Changes codes from six digits to three name characters plus three digits.

alter table public.customer_galleries
  alter column access_code drop default;

alter table public.customer_galleries
  drop constraint if exists customer_galleries_access_code_check;

drop function if exists public.generate_gallery_access_code();

create or replace function public.generate_gallery_access_code(p_customer_name text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_name text;
  name_prefix text;
  candidate text;
begin
  clean_name := regexp_replace(upper(coalesce(p_customer_name, '')), '[^A-Z0-9]', '', 'g');
  name_prefix := rpad(substr(coalesce(nullif(clean_name, ''), 'PIC'), 1, 3), 3, 'X');

  loop
    candidate := name_prefix || lpad(floor(random() * 1000)::integer::text, 3, '0');
    exit when not exists (
      select 1 from public.customer_galleries where access_code = candidate
    );
  end loop;
  return candidate;
end;
$$;

create or replace function public.set_gallery_access_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.access_code is null or trim(new.access_code) = '' then
    new.access_code := public.generate_gallery_access_code(new.customer_name);
  end if;
  return new;
end;
$$;

drop trigger if exists set_customer_gallery_access_code on public.customer_galleries;
create trigger set_customer_gallery_access_code
before insert on public.customer_galleries
for each row execute function public.set_gallery_access_code();

-- Give any existing galleries a new name-based code.
do $$
declare
  gallery record;
begin
  for gallery in select id, customer_name from public.customer_galleries loop
    update public.customer_galleries
    set access_code = public.generate_gallery_access_code(gallery.customer_name)
    where id = gallery.id;
  end loop;
end;
$$;

alter table public.customer_galleries
  add constraint customer_galleries_access_code_check
  check (access_code ~ '^[A-Z0-9]{6}$');

revoke all on function public.generate_gallery_access_code(text) from public;
grant execute on function public.generate_gallery_access_code(text) to authenticated;
