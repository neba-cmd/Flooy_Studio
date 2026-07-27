-- RUN ONCE in Supabase SQL Editor on an existing installation.
-- Restricts helper functions to the roles that actually need them.
-- Every check is conditional so this migration also works on fresh projects
-- where an optional helper function has not been installed.

do $$
begin
  if to_regprocedure('public.generate_gallery_access_code(text,text)') is not null then
    revoke all on function public.generate_gallery_access_code(text, text)
    from public, anon, authenticated;
  end if;

  if to_regprocedure('public.generate_gallery_access_code(text)') is not null then
    revoke all on function public.generate_gallery_access_code(text)
    from public, anon, authenticated;
  end if;

  if to_regprocedure('public.set_gallery_access_code()') is not null then
    revoke all on function public.set_gallery_access_code()
    from public, anon, authenticated;
  end if;

  if to_regprocedure('public.create_photographer_profile()') is not null then
    revoke all on function public.create_photographer_profile()
    from public, anon, authenticated;
  end if;

  if to_regprocedure('public.ensure_photographer_profile()') is not null then
    revoke all on function public.ensure_photographer_profile()
    from public, anon;

    grant execute on function public.ensure_photographer_profile()
    to authenticated;
  end if;
end
$$;
