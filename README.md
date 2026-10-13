# School app (Supabase + GitHub Pages)

Staff page (`index.html`): add, search and sort students, teachers, fees and exams.
Student portal (`portal.html`): a student enters roll number + date of birth and sees only their own fees and exam results.

## Setup
1. **Supabase**: create a project at supabase.com.
2. SQL Editor -> New query -> paste all of `schema.sql` -> Run.
3. Authentication -> Users -> Add user (your staff email + password).
   Authentication -> Sign In / Providers -> turn OFF "Allow new users to sign up" (otherwise anyone could sign up as staff).
4. Project Settings -> API: copy the Project URL and anon public key into `config.js`.
5. **GitHub**: create a repo, upload all these files, then Settings -> Pages -> deploy from the `main` branch.
   (Or test locally: run `python3 -m http.server` in this folder and open http://localhost:8000.)

## Notes
- The anon key is meant to be public; the database rules in `schema.sql` are what protect your data.
- Roll number + date of birth is simple, not strong, protection. For real security later, give each student a Supabase login.
- Add more fields (phone, address, attendance): add the column in SQL, then add it to the lists at the top of `admin.js`.
