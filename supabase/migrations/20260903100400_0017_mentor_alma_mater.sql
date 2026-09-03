-- Mentor alma mater fields, shown alongside their current affiliation/title.

alter table public.profiles
  add column alma_mater text not null default '',
  add column alma_mater_department text not null default '';

comment on column public.profiles.alma_mater is 'School the user graduated from; mentors only';
comment on column public.profiles.alma_mater_department is 'Department/faculty at alma_mater; mentors only';

alter table public.profiles
  add constraint profiles_alma_mater_length check (char_length(alma_mater) <= 100),
  add constraint profiles_alma_mater_department_length
    check (char_length(alma_mater_department) <= 50);
