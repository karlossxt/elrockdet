-- ==================================================
-- EL ROCK DE TODOS LOS DÍAS — Likes de notas
-- Pegar y ejecutar en: Supabase Dashboard > SQL Editor
-- ==================================================

create table if not exists public.nota_likes (
    slug       text primary key,
    likes      integer not null default 0,
    updated_at timestamptz not null default now()
);

create or replace function public.get_likes(p_slug text)
returns integer
language sql stable security definer set search_path = public as $$
    select coalesce((select likes from nota_likes where slug = p_slug), 0);
$$;

create or replace function public.add_like(p_slug text)
returns integer
language plpgsql security definer set search_path = public as $$
declare
    v_count integer;
begin
    insert into nota_likes (slug, likes) values (p_slug, 1)
    on conflict (slug) do update
        set likes = nota_likes.likes + 1,
            updated_at = now()
    returning likes into v_count;
    return v_count;
end;
$$;

alter table public.nota_likes enable row level security;

drop policy if exists "lectura publica" on public.nota_likes;
create policy "lectura publica" on public.nota_likes for select using (true);

revoke all on public.nota_likes from anon, authenticated;
grant select on public.nota_likes to anon;

grant execute on function public.get_likes(text) to anon;
grant execute on function public.add_like(text) to anon;
