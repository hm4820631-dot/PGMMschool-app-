-- Supabase > SQL Editor-এ পুরোটা পেস্ট করে Run করুন

create table students (
  id uuid primary key default gen_random_uuid(),
  roll_no text unique not null, name text not null, grade text,
  dob date, guardian_phone text, location text,
  created_at timestamptz default now());

create table teachers (
  id uuid primary key default gen_random_uuid(),
  name text not null, phone text, subject text,
  grade_group text,      -- যে ক্লাসের স্টুডেন্ট দেখবেন (ফাঁকা = সব)
  device_user_id text,   -- ভবিষ্যতে ফেস স্ক্যানার ডিভাইসের আইডি
  created_at timestamptz default now());

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null check (role in ('admin','teacher','student')),
  student_id uuid references students(id),
  teacher_id uuid references teachers(id),
  created_at timestamptz default now());

create table fees (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  month text, amount numeric, paid boolean default false,
  created_at timestamptz default now());

create table results (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  exam_name text, subject text, marks numeric, total numeric,
  uploaded_by uuid default auth.uid(),
  created_at timestamptz default now());

create table salaries (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references teachers(id) on delete cascade,
  month text, amount numeric, paid boolean default false,
  created_at timestamptz default now());

create table attendance (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references teachers(id) on delete cascade,
  att_date date, in_time time, out_time time,
  created_at timestamptz default now());

-- helper functions
create function my_role() returns text language sql security definer stable set search_path=public
  as $$ select role from profiles where id=auth.uid() $$;
create function my_student() returns uuid language sql security definer stable set search_path=public
  as $$ select student_id from profiles where id=auth.uid() $$;
create function my_teacher() returns uuid language sql security definer stable set search_path=public
  as $$ select teacher_id from profiles where id=auth.uid() $$;
create function my_grade() returns text language sql security definer stable set search_path=public
  as $$ select t.grade_group from teachers t where t.id=my_teacher() $$;

-- RLS চালু + অ্যাডমিন সবকিছু পারবে
do $$ declare t text; begin
  foreach t in array array['students','teachers','profiles','fees','results','salaries','attendance'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "admin all" on %I for all using (my_role()=''admin'') with check (my_role()=''admin'')', t);
  end loop; end $$;

-- স্টুডেন্ট/অভিভাবক: শুধু নিজের তথ্য
create policy "own student" on students for select using (id = my_student());
create policy "own fees" on fees for select using (student_id = my_student());
create policy "own results" on results for select using (student_id = my_student());

-- শিক্ষক: নিজের গ্রুপের স্টুডেন্ট, রেজাল্ট দেখা/আপলোড; ফি-এর কোনো policy নেই = দেখতে পারবে না
create policy "teacher students" on students for select
  using (my_role()='teacher' and (my_grade() is null or my_grade()='' or grade = my_grade()));
create policy "teacher results read" on results for select using (my_role()='teacher');
create policy "teacher results add" on results for insert with check (my_role()='teacher');
create policy "teacher self" on teachers for select using (id = my_teacher());
create policy "teacher salary" on salaries for select using (teacher_id = my_teacher());
create policy "teacher attendance" on attendance for select using (teacher_id = my_teacher());

-- প্রত্যেকে নিজের profile দেখতে পারবে
create policy "own profile" on profiles for select using (id = auth.uid());

-- প্রথম অ্যাডমিন বানাতে: Authentication > Users থেকে ইউজার তৈরি করে তার UID দিয়ে চালান
-- insert into profiles (id, role) values ('এখানে-UID', 'admin');
