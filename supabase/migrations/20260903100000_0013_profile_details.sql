-- Richer profile fields.
--
-- RLS lets a user update their own profiles row directly from the client, so
-- every limit the form enforces is repeated here as a check constraint.
-- CHECK cannot contain a subquery, so per-element length limits are expressed
-- as a bound on the joined string instead of a scan over unnest().

alter table public.profiles
  add column headline text not null default '',
  add column affiliation text not null default '',
  add column title text not null default '',
  add column experience_years integer,
  add column availability text not null default '',
  add column accepting boolean not null default true,
  add column skills text[] not null default '{}',
  add column topics text[] not null default '{}',
  add column github_url text,
  add column x_url text,
  add column website_url text;

comment on column public.profiles.headline is 'One-line catchphrase shown on cards and lists';
comment on column public.profiles.affiliation is 'School (student) or company (mentor)';
comment on column public.profiles.title is 'Grade (student) or job title (mentor)';
comment on column public.profiles.experience_years is 'Years of experience; mentors only';
comment on column public.profiles.availability is 'Free-text availability, e.g. 平日夜・週末';
comment on column public.profiles.accepting is 'Whether this mentor currently takes new requests';
comment on column public.profiles.skills is 'Free-form skill tags';
comment on column public.profiles.topics is 'Concrete things this user can be consulted about';

alter table public.profiles
  add constraint profiles_headline_length check (char_length(headline) <= 60),
  add constraint profiles_affiliation_length check (char_length(affiliation) <= 100),
  add constraint profiles_title_length check (char_length(title) <= 50),
  add constraint profiles_experience_years_range
    check (experience_years is null or experience_years between 0 and 80),
  add constraint profiles_availability_length check (char_length(availability) <= 100),
  add constraint profiles_skills_limits
    check (cardinality(skills) <= 20 and char_length(array_to_string(skills, ',')) <= 600),
  add constraint profiles_topics_limits
    check (cardinality(topics) <= 5 and char_length(array_to_string(topics, ',')) <= 500),
  add constraint profiles_github_url_format
    check (github_url is null or github_url ~ '^https://'),
  add constraint profiles_x_url_format
    check (x_url is null or x_url ~ '^https://'),
  add constraint profiles_website_url_format
    check (website_url is null or website_url ~ '^https://');

-- Supports filtering mentors by skill tag (skills @> array['React']).
create index profiles_skills_idx on public.profiles using gin (skills);
