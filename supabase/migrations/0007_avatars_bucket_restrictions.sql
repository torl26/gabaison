-- Defense in depth: enforce the avatar file type/size rules at the storage
-- layer too, since client-side validation alone can be bypassed by calling
-- the Storage API directly. image/svg+xml is deliberately excluded — SVGs
-- can embed <script> and would be served back verbatim from this public
-- bucket (stored XSS).
update storage.buckets
set
  allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
  file_size_limit = 5242880
where id = 'avatars';
