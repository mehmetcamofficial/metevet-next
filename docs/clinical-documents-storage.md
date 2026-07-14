# Clinical documents storage

Migration `20260716000000_document_generation_module.sql` creates or hardens the private `clinical-documents` bucket. It permits PDF files up to 10 MB, rejects anonymous access, and uses RLS for authenticated staff reads, clinical uploads, and administrator deletes.

After deployment, confirm in Supabase Dashboard → Storage that **Public bucket** is disabled. Downloads must use server-created signed URLs with a short expiry; never copy a permanent object URL into application data.
