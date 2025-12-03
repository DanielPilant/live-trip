-- Create Sites Table
create table sites (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  location jsonb not null, -- { "lat": number, "lng": number }
  crowd_level text check (crowd_level in ('low', 'moderate', 'high', 'critical')) default 'low',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Reports Table
create table reports (
  id uuid default gen_random_uuid() primary key,
  site_id uuid references sites(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text,
  crowd_level text check (crowd_level in ('low', 'moderate', 'high', 'critical')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Unique constraint: one report per user per site
  unique(site_id, user_id)
);

-- Enable RLS
alter table sites enable row level security;
alter table reports enable row level security;

-- Policies
create policy "Public sites are viewable by everyone" on sites
  for select using (true);

create policy "Public reports are viewable by everyone" on reports
  for select using (true);

create policy "Authenticated users can insert reports" on reports
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own reports" on reports
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can delete their own reports" on reports
  for delete using (auth.uid() = user_id);

-- Create a view that aggregates recent reports to calculate crowd levels
-- This takes the majority crowd level from reports updated within 2 hours
-- and returns it alongside the site data
create or replace view site_crowd_levels as
select 
  s.id,
  s.name,
  s.description,
  s.location,
  coalesce(
    (
      select crowd_level
      from (
        select 
          crowd_level,
          count(*) as vote_count
        from reports
        where reports.site_id = s.id
          and reports.updated_at > now() - interval '2 hours'
        group by crowd_level
        order by vote_count desc
        limit 1
      ) crowd_votes
    ),
    s.crowd_level
  ) as crowd_level,
  s.created_at,
  (
    select count(*)
    from reports
    where reports.site_id = s.id
      and reports.updated_at > now() - interval '2 hours'
  ) as recent_report_count
from sites s;

-- -- Seed Data (JCT - Machon Lev)
-- INSERT INTO sites (name, description, location, crowd_level)
-- VALUES (
--   'JCT - Machon Lev',
--   'Jerusalem College of Technology main campus',
--   '{"lat": 31.7658, "lng": 35.1911}',
--   'low'
-- );

