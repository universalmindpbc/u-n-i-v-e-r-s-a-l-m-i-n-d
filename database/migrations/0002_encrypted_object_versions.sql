BEGIN;

ALTER TABLE citizen_data.encrypted_objects
  ADD COLUMN object_version_id text;

COMMENT ON COLUMN citizen_data.encrypted_objects.object_version_id IS
  'Exact S3-compatible object version used for verified physical erasure. New versioned writes must record it.';

COMMIT;
