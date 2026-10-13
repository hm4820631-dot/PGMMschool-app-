-- Run this whole file once in Supabase: SQL Editor -> New query -> Run

create table students (
  id uuid primary key default gen_random_uuid(),
  roll_no text unique not null,
  name text not null,
  grade text,
  dob date not null,
  guardian_phone text,
  created_at timestamptz default now()
);
create table teachers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text,
  phone text,
  created_at timestamptz default now()
);
create table fees (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  title text not null,
  amount numeric not null,
  paid numeric not null default 0,
  due_date date
);
create table exams (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  exam_name text not null,
  subject text not null,
  marks numeric not null,
  max_marks numeric not null default 100,
  exam_date date
);

-- Only signed-in staff can read/write tables directly
alter table students enable row level security;
alter table teachers enable row level security;
alter table fees enable row level security;
alter table exams enable row level security;
create policy staff_all on students for all to authenticated using (true) with check (true);
create policy staff_all on teachers for all to authenticated using (true) with check (true);
create policy staff_all on fees for all to authenticated using (true) with check (true);
create policy staff_all on exams for all to authenticated using (true) with check (true);

-- Student portal: roll number + date of birth returns ONLY that student's data
create function student_portal(p_roll text, p_dob date) returns json
language sql security definer set search_path = public as $$
  select json_build_object(
    'student', json_build_object('name', s.name, 'roll_no', s.roll_no, 'grade', s.grade),
    'fees', coalesce((select json_agg(json_build_object('title', f.title, 'amount', f.amount, 'paid', f.paid, 'due_date', f.due_date) order by f.due_date) from fees f where f.student_id = s.id), '[]'::json),
    'exams', coalesce((select json_agg(json_build_object('exam_name', e.exam_name, 'subject', e.subject, 'marks', e.marks, 'max_marks', e.max_marks, 'exam_date', e.exam_date) order by e.exam_date) from exams e where e.student_id = s.id), '[]'::json)
  )
  from students s where s.roll_no = p_roll and s.dob = p_dob;
$$;
revoke all on function student_portal(text, date) from public;
grant execute on function student_portal(text, date) to anon, authenticated;
