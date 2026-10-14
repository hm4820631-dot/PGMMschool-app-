-- schema.sql চালানোর পরে এটি চালান (প্রোফাইল ছবির জন্য)

alter table students add column if not exists photo_path text;
alter table teachers add column if not exists photo_path text;

-- Private bucket (ছবি সবার জন্য খোলা নয়)
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', false)
on conflict (id) do nothing;

-- অ্যাডমিন সব ছবি আপলোড/বদল/মোছা করতে পারবে
create policy "avatars admin" on storage.objects for all
  using (bucket_id = 'avatars' and my_role() = 'admin')
  with check (bucket_id = 'avatars' and my_role() = 'admin');

-- স্টুডেন্ট শুধু নিজের ছবি দেখবে
create policy "avatars own student" on storage.objects for select
  using (bucket_id = 'avatars' and name = 'students/' || my_student()::text || '.jpg');

-- শিক্ষক স্টুডেন্টদের ছবি দেখবে (RLS অনুযায়ী যাদের তালিকা পায়)
create policy "avatars teacher sees students" on storage.objects for select
  using (bucket_id = 'avatars' and my_role() = 'teacher' and name like 'students/%');

-- শিক্ষক নিজের ছবি দেখবে
create policy "avatars own teacher" on storage.objects for select
  using (bucket_id = 'avatars' and name = 'teachers/' || my_teacher()::text || '.jpg');
