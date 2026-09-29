create table if not exists public.terms (
  id text primary key,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  student_slug text not null,
  name text not null,
  start_date date,
  end_date date,
  level integer,
  term_number integer not null default 1,
  readiness_decision text,
  readiness_decision_note text not null default '',
  readiness_decision_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint terms_level_valid check (level is null or (level between 1 and 10)),
  constraint terms_term_number_valid check (term_number between 1 and 2),
  constraint terms_readiness_decision_valid check (
    readiness_decision is null
    or readiness_decision in (
      'ADVANCE_TO_NEXT_TERM',
      'CONTINUE_CURRENT_TERM',
      'TARGETED_REVIEW_BEFORE_ADVANCE'
    )
  ),
  constraint terms_teacher_student_fk
    foreign key (teacher_id, student_slug)
    references public.students (teacher_id, slug)
    on delete cascade
);

create index if not exists terms_teacher_id_idx on public.terms (teacher_id);
create index if not exists terms_teacher_student_idx on public.terms (teacher_id, student_slug);

alter table public.terms enable row level security;

revoke all on table public.terms from anon;
grant select, insert, update, delete on table public.terms to authenticated;

drop policy if exists "terms_select" on public.terms;
create policy "terms_select"
on public.terms
for select
to authenticated
using ((teacher_id = auth.uid()) or is_admin(auth.uid()));

drop policy if exists "terms_insert" on public.terms;
create policy "terms_insert"
on public.terms
for insert
to authenticated
with check ((teacher_id = auth.uid()) or is_admin(auth.uid()));

drop policy if exists "terms_update" on public.terms;
create policy "terms_update"
on public.terms
for update
to authenticated
using ((teacher_id = auth.uid()) or is_admin(auth.uid()))
with check ((teacher_id = auth.uid()) or is_admin(auth.uid()));

drop policy if exists "terms_delete" on public.terms;
create policy "terms_delete"
on public.terms
for delete
to authenticated
using ((teacher_id = auth.uid()) or is_admin(auth.uid()));
