-- Limit file size on inscricoes bucket to 5MB
UPDATE storage.buckets
SET file_size_limit = 5242880 -- 5MB in bytes
WHERE id = 'inscricoes';

-- Limit file size on produtos bucket to 10MB
UPDATE storage.buckets
SET file_size_limit = 10485760 -- 10MB in bytes
WHERE id = 'produtos';

-- Restrict allowed MIME types on inscricoes bucket
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'inscricoes';

UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'produtos';
