-- RUN ONCE in Supabase SQL Editor on an existing installation.
-- Changes gallery codes to: first name initial + last four phone digits.
-- Example: Nebiyu, +39 333 124 4821 -> N4821

alter table public.customer_galleries
  drop constraint if exists customer_galleries_access_code_check;

create or replace function public.generate_gallery_access_code(
  p_customer_name text,
  p_customer_phone text
)
returns text
language sql
security definer
set search_path = public
as $$
  select
    coalesce(
      nullif(substr(regexp_replace(upper(coalesce(p_customer_name, '')), '[^A-Z]', '', 'g'), 1, 1), ''),
      'X'
    )
    || right(regexp_replace(coalesce(p_customer_phone, ''), '[^0-9]', '', 'g'), 4);
$$;

create or replace function public.set_gallery_access_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if length(regexp_replace(coalesce(new.customer_phone, ''), '[^0-9]', '', 'g')) < 4 then
    raise exception 'Customer phone number must contain at least four digits';
  end if;

  new.access_code := public.generate_gallery_access_code(
    new.customer_name,
    new.customer_phone
  );
  return new;
end;
$$;

drop trigger if exists set_customer_gallery_access_code on public.customer_galleries;
create trigger set_customer_gallery_access_code
before insert or update of customer_name, customer_phone
on public.customer_galleries
for each row execute function public.set_gallery_access_code();

-- Existing galleries receive codes based on their saved names and phone numbers.
update public.customer_galleries
set access_code = public.generate_gallery_access_code(customer_name, customer_phone);

alter table public.customer_galleries
  add constraint customer_galleries_access_code_check
  check (access_code ~ '^[A-Z][0-9]{4}$');

drop function if exists public.generate_gallery_access_code(text);

revoke all on function public.generate_gallery_access_code(text, text)
from public, anon, authenticated;

revoke all on function public.set_gallery_access_code()
from public, anon, authenticated;
