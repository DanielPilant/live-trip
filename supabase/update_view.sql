drop view if exists site_crowd_levels;

create or replace view site_crowd_levels as
select 
  s.id,
  s.name,
  s.description,
  s.location,
  s."Polygon" as polygon,
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
