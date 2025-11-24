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
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
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

-- -- Seed Data (JCT - Machon Lev)
-- INSERT INTO sites (name, description, location, crowd_level)
-- VALUES (
--   'JCT - Machon Lev',
--   'Jerusalem College of Technology main campus',
--   '{"lat": 31.7658, "lng": 35.1911}',
--   'low'
-- );

