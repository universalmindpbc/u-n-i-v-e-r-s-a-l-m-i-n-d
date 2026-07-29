BEGIN;

CREATE SCHEMA IF NOT EXISTS citizen_data;

COMMENT ON SCHEMA citizen_data IS
  'Consent-led Universal Mind citizen data. HAPPINESS rewards data is prohibited from this schema.';

CREATE OR REPLACE FUNCTION citizen_data.current_citizen_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN current_setting('app.current_citizen_id', true) ~*
      '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    THEN current_setting('app.current_citizen_id', true)::uuid
    ELSE NULL
  END
$$;

CREATE OR REPLACE FUNCTION citizen_data.reject_append_only_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION '% is append-only', TG_TABLE_NAME
    USING ERRCODE = '55000';
END
$$;

CREATE TABLE citizen_data.citizens (
  id uuid PRIMARY KEY,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'erasure_pending', 'erased')),
  residency_region text NOT NULL DEFAULT 'AU',
  created_at timestamptz NOT NULL,
  erased_at timestamptz,
  CHECK ((status = 'erased') = (erased_at IS NOT NULL))
);

COMMENT ON TABLE citizen_data.citizens IS
  'Pseudonymous citizen identity. Names, email addresses, IP addresses and device fingerprints do not belong here.';

CREATE TABLE citizen_data.consent_documents (
  id uuid PRIMARY KEY,
  version text NOT NULL UNIQUE,
  copy_sha256 char(64) NOT NULL
    CHECK (copy_sha256 ~ '^[0-9a-f]{64}$'),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'retired')),
  jurisdiction text NOT NULL DEFAULT 'AU',
  published_at timestamptz,
  retired_at timestamptz,
  created_at timestamptz NOT NULL,
  CHECK ((status = 'published') = (published_at IS NOT NULL AND retired_at IS NULL)
    OR status IN ('draft', 'retired'))
);

COMMENT ON TABLE citizen_data.consent_documents IS
  'Versioned evidence of the exact founder-approved consent copy. Draft records cannot authorise collection.';

CREATE TABLE citizen_data.consent_receipts (
  id uuid PRIMARY KEY,
  citizen_id uuid NOT NULL REFERENCES citizen_data.citizens(id) ON DELETE RESTRICT,
  document_id uuid NOT NULL REFERENCES citizen_data.consent_documents(id) ON DELETE RESTRICT,
  action text NOT NULL CHECK (action IN ('granted', 'withdrawn', 'superseded')),
  supersedes_receipt_id uuid REFERENCES citizen_data.consent_receipts(id) ON DELETE RESTRICT,
  evidence_nonce uuid NOT NULL UNIQUE,
  source text NOT NULL CHECK (source IN ('arrival_consent', 'my_data', 'policy_refresh')),
  occurred_at timestamptz NOT NULL,
  UNIQUE (id, citizen_id),
  CHECK ((action = 'granted' AND supersedes_receipt_id IS NULL)
    OR (action IN ('withdrawn', 'superseded') AND supersedes_receipt_id IS NOT NULL))
);

CREATE TABLE citizen_data.consent_receipt_purposes (
  receipt_id uuid NOT NULL,
  citizen_id uuid NOT NULL,
  purpose_code text NOT NULL CHECK (purpose_code IN (
    'core_checkin_processing',
    'cross_session_memory',
    'universal_one_conversation_memory',
    'consented_engagement_understanding',
    'deidentified_collective_learning'
  )),
  PRIMARY KEY (receipt_id, purpose_code),
  FOREIGN KEY (receipt_id, citizen_id)
    REFERENCES citizen_data.consent_receipts(id, citizen_id) ON DELETE RESTRICT
);

COMMENT ON TABLE citizen_data.consent_receipt_purposes IS
  'HAPPINESS permissions are intentionally absent. Rewards consent belongs to the separate rewards journey.';

CREATE TABLE citizen_data.browser_credentials (
  id uuid PRIMARY KEY,
  citizen_id uuid NOT NULL REFERENCES citizen_data.citizens(id) ON DELETE RESTRICT,
  token_sha256 char(64) NOT NULL UNIQUE
    CHECK (token_sha256 ~ '^[0-9a-f]{64}$'),
  created_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  last_used_at timestamptz,
  revoked_at timestamptz,
  CHECK (expires_at > created_at)
);

COMMENT ON TABLE citizen_data.browser_credentials IS
  'Hash of an opaque secure-cookie credential. Universal Mind does not create browser fingerprints.';

CREATE TABLE citizen_data.experience_sessions (
  id uuid PRIMARY KEY,
  citizen_id uuid NOT NULL REFERENCES citizen_data.citizens(id) ON DELETE RESTRICT,
  consent_receipt_id uuid NOT NULL,
  locale text,
  timezone text,
  started_at timestamptz NOT NULL,
  ended_at timestamptz,
  UNIQUE (id, citizen_id),
  FOREIGN KEY (consent_receipt_id, citizen_id)
    REFERENCES citizen_data.consent_receipts(id, citizen_id) ON DELETE RESTRICT,
  CHECK (ended_at IS NULL OR ended_at >= started_at)
);

CREATE TABLE citizen_data.encrypted_objects (
  id uuid PRIMARY KEY,
  citizen_id uuid NOT NULL REFERENCES citizen_data.citizens(id) ON DELETE RESTRICT,
  data_class text NOT NULL CHECK (data_class IN (
    'checkin_text',
    'inference_result',
    'conversation_turn',
    'citizen_export'
  )),
  storage_provider text NOT NULL CHECK (storage_provider IN (
    'aws_s3',
    'storj_s3',
    'synthetic_test'
  )),
  bucket_name text NOT NULL,
  object_key text NOT NULL,
  ciphertext_sha256 char(64) NOT NULL
    CHECK (ciphertext_sha256 ~ '^[0-9a-f]{64}$'),
  wrapped_data_key bytea NOT NULL,
  kms_key_arn text NOT NULL,
  encryption_algorithm text NOT NULL DEFAULT 'AES-256-GCM'
    CHECK (encryption_algorithm = 'AES-256-GCM'),
  aad_schema_version text NOT NULL DEFAULT 'citizen_data_aad_v1',
  content_type text NOT NULL,
  byte_length bigint NOT NULL CHECK (byte_length >= 0),
  retention_class text NOT NULL CHECK (retention_class IN (
    'citizen_controlled',
    'export_temporary',
    'audit_minimum'
  )),
  created_at timestamptz NOT NULL,
  deleted_at timestamptz,
  UNIQUE (id, citizen_id),
  UNIQUE (storage_provider, bucket_name, object_key)
);

COMMENT ON TABLE citizen_data.encrypted_objects IS
  'Envelope-encrypted payload catalogue. Plaintext check-ins, conversations and inference results are never database columns.';

CREATE TABLE citizen_data.checkins (
  id uuid PRIMARY KEY,
  citizen_id uuid NOT NULL REFERENCES citizen_data.citizens(id) ON DELETE RESTRICT,
  session_id uuid NOT NULL,
  consent_receipt_id uuid NOT NULL,
  payload_object_id uuid NOT NULL UNIQUE,
  idempotency_key uuid NOT NULL,
  client_created_at timestamptz,
  created_at timestamptz NOT NULL,
  deleted_at timestamptz,
  UNIQUE (id, citizen_id),
  FOREIGN KEY (session_id, citizen_id)
    REFERENCES citizen_data.experience_sessions(id, citizen_id) ON DELETE RESTRICT,
  FOREIGN KEY (consent_receipt_id, citizen_id)
    REFERENCES citizen_data.consent_receipts(id, citizen_id) ON DELETE RESTRICT,
  FOREIGN KEY (payload_object_id, citizen_id)
    REFERENCES citizen_data.encrypted_objects(id, citizen_id) ON DELETE RESTRICT,
  UNIQUE (citizen_id, idempotency_key)
);

CREATE TABLE citizen_data.conversation_threads (
  id uuid PRIMARY KEY,
  citizen_id uuid NOT NULL REFERENCES citizen_data.citizens(id) ON DELETE RESTRICT,
  session_id uuid NOT NULL,
  consent_receipt_id uuid NOT NULL,
  created_at timestamptz NOT NULL,
  closed_at timestamptz,
  deleted_at timestamptz,
  UNIQUE (id, citizen_id),
  FOREIGN KEY (session_id, citizen_id)
    REFERENCES citizen_data.experience_sessions(id, citizen_id) ON DELETE RESTRICT,
  FOREIGN KEY (consent_receipt_id, citizen_id)
    REFERENCES citizen_data.consent_receipts(id, citizen_id) ON DELETE RESTRICT
);

CREATE TABLE citizen_data.conversation_turns (
  id uuid PRIMARY KEY,
  citizen_id uuid NOT NULL REFERENCES citizen_data.citizens(id) ON DELETE RESTRICT,
  thread_id uuid NOT NULL,
  payload_object_id uuid NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ('citizen', 'universal_one')),
  ordinal integer NOT NULL CHECK (ordinal >= 0),
  created_at timestamptz NOT NULL,
  deleted_at timestamptz,
  FOREIGN KEY (thread_id, citizen_id)
    REFERENCES citizen_data.conversation_threads(id, citizen_id) ON DELETE RESTRICT,
  FOREIGN KEY (payload_object_id, citizen_id)
    REFERENCES citizen_data.encrypted_objects(id, citizen_id) ON DELETE RESTRICT,
  UNIQUE (thread_id, ordinal)
);

CREATE TABLE citizen_data.inference_runs (
  id uuid PRIMARY KEY,
  citizen_id uuid NOT NULL REFERENCES citizen_data.citizens(id) ON DELETE RESTRICT,
  checkin_id uuid,
  thread_id uuid,
  result_object_id uuid,
  model_name text NOT NULL,
  prompt_version text NOT NULL,
  prompt_sha256 char(64) NOT NULL CHECK (prompt_sha256 ~ '^[0-9a-f]{64}$'),
  provider_storage_enabled boolean NOT NULL DEFAULT false
    CHECK (provider_storage_enabled = false),
  status text NOT NULL CHECK (status IN ('queued', 'running', 'completed', 'failed', 'erased')),
  error_code text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL,
  FOREIGN KEY (checkin_id, citizen_id)
    REFERENCES citizen_data.checkins(id, citizen_id) ON DELETE RESTRICT,
  FOREIGN KEY (thread_id, citizen_id)
    REFERENCES citizen_data.conversation_threads(id, citizen_id) ON DELETE RESTRICT,
  FOREIGN KEY (result_object_id, citizen_id)
    REFERENCES citizen_data.encrypted_objects(id, citizen_id) ON DELETE RESTRICT,
  CHECK ((checkin_id IS NOT NULL)::integer + (thread_id IS NOT NULL)::integer = 1)
);

CREATE TABLE citizen_data.engagement_events (
  id uuid PRIMARY KEY,
  citizen_id uuid NOT NULL REFERENCES citizen_data.citizens(id) ON DELETE RESTRICT,
  session_id uuid NOT NULL,
  consent_receipt_id uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'content_started',
    'content_completed',
    'content_skipped',
    'content_liked',
    'room_entered'
  )),
  content_id text,
  duration_ms integer CHECK (duration_ms IS NULL OR duration_ms >= 0),
  completion_ratio numeric(5,4)
    CHECK (completion_ratio IS NULL OR completion_ratio BETWEEN 0 AND 1),
  occurred_at timestamptz NOT NULL,
  FOREIGN KEY (session_id, citizen_id)
    REFERENCES citizen_data.experience_sessions(id, citizen_id) ON DELETE RESTRICT,
  FOREIGN KEY (consent_receipt_id, citizen_id)
    REFERENCES citizen_data.consent_receipts(id, citizen_id) ON DELETE RESTRICT
);

COMMENT ON TABLE citizen_data.engagement_events IS
  'Allowlisted first-party events only. No free-text payload, third-party tracker identifier, IP address or device fingerprint.';

CREATE TABLE citizen_data.data_use_events (
  id uuid PRIMARY KEY,
  citizen_id uuid NOT NULL REFERENCES citizen_data.citizens(id) ON DELETE RESTRICT,
  purpose_code text NOT NULL,
  system_name text NOT NULL,
  operation text NOT NULL CHECK (operation IN (
    'collect',
    'infer',
    'remember',
    'retrieve',
    'export',
    'erase',
    'aggregate'
  )),
  source_record_type text NOT NULL,
  source_record_id uuid NOT NULL,
  occurred_at timestamptz NOT NULL
);

CREATE TABLE citizen_data.vector_projections (
  id uuid PRIMARY KEY,
  citizen_id uuid NOT NULL REFERENCES citizen_data.citizens(id) ON DELETE RESTRICT,
  source_object_id uuid NOT NULL,
  provider text NOT NULL CHECK (provider IN ('pinecone', 'vertex_rag')),
  namespace text NOT NULL,
  external_record_id text NOT NULL,
  projection_schema_version text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'active', 'delete_pending', 'deleted', 'failed')),
  created_at timestamptz NOT NULL,
  deleted_at timestamptz,
  FOREIGN KEY (source_object_id, citizen_id)
    REFERENCES citizen_data.encrypted_objects(id, citizen_id) ON DELETE RESTRICT,
  UNIQUE (provider, namespace, external_record_id)
);

COMMENT ON TABLE citizen_data.vector_projections IS
  'Revocable derivative index only. Vector databases are never the source of truth.';

CREATE TABLE citizen_data.data_rights_requests (
  id uuid PRIMARY KEY,
  citizen_id uuid NOT NULL REFERENCES citizen_data.citizens(id) ON DELETE RESTRICT,
  request_type text NOT NULL CHECK (request_type IN ('access', 'export', 'correct', 'erase')),
  status text NOT NULL CHECK (status IN ('received', 'processing', 'completed', 'failed', 'cancelled')),
  requested_at timestamptz NOT NULL,
  completed_at timestamptz,
  failure_code text,
  UNIQUE (id, citizen_id)
);

CREATE TABLE citizen_data.erasure_targets (
  id uuid PRIMARY KEY,
  citizen_id uuid NOT NULL REFERENCES citizen_data.citizens(id) ON DELETE RESTRICT,
  request_id uuid NOT NULL,
  target_system text NOT NULL CHECK (target_system IN (
    'postgres',
    'aws_s3',
    'storj_s3',
    'pinecone',
    'vertex_rag',
    'cache',
    'backup_expiry'
  )),
  target_reference text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'retained_until_expiry')),
  created_at timestamptz NOT NULL,
  completed_at timestamptz,
  failure_code text,
  FOREIGN KEY (request_id, citizen_id)
    REFERENCES citizen_data.data_rights_requests(id, citizen_id) ON DELETE RESTRICT
);

CREATE TABLE citizen_data.outbox_events (
  id uuid PRIMARY KEY,
  citizen_id uuid NOT NULL REFERENCES citizen_data.citizens(id) ON DELETE RESTRICT,
  event_type text NOT NULL CHECK (event_type IN (
    'checkin_recorded',
    'conversation_turn_recorded',
    'inference_requested',
    'export_requested',
    'erasure_requested',
    'projection_delete_requested'
  )),
  aggregate_type text NOT NULL,
  aggregate_id uuid NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL,
  published_at timestamptz,
  CHECK (octet_length(metadata::text) <= 4096)
);

COMMENT ON TABLE citizen_data.outbox_events IS
  'Metadata-only delivery queue. Raw check-ins, conversations and inference payloads are prohibited.';

CREATE INDEX consent_receipts_citizen_time_idx
  ON citizen_data.consent_receipts (citizen_id, occurred_at DESC);
CREATE INDEX sessions_citizen_time_idx
  ON citizen_data.experience_sessions (citizen_id, started_at DESC);
CREATE INDEX checkins_citizen_time_idx
  ON citizen_data.checkins (citizen_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX conversation_turns_thread_idx
  ON citizen_data.conversation_turns (thread_id, ordinal) WHERE deleted_at IS NULL;
CREATE INDEX inference_runs_citizen_time_idx
  ON citizen_data.inference_runs (citizen_id, created_at DESC);
CREATE INDEX engagement_events_citizen_time_idx
  ON citizen_data.engagement_events (citizen_id, occurred_at DESC);
CREATE INDEX data_use_events_citizen_time_idx
  ON citizen_data.data_use_events (citizen_id, occurred_at DESC);
CREATE INDEX outbox_unpublished_idx
  ON citizen_data.outbox_events (created_at) WHERE published_at IS NULL;

CREATE TRIGGER consent_receipts_append_only
BEFORE UPDATE OR DELETE ON citizen_data.consent_receipts
FOR EACH ROW EXECUTE FUNCTION citizen_data.reject_append_only_change();

CREATE TRIGGER consent_receipt_purposes_append_only
BEFORE UPDATE OR DELETE ON citizen_data.consent_receipt_purposes
FOR EACH ROW EXECUTE FUNCTION citizen_data.reject_append_only_change();

CREATE TRIGGER data_use_events_append_only
BEFORE UPDATE OR DELETE ON citizen_data.data_use_events
FOR EACH ROW EXECUTE FUNCTION citizen_data.reject_append_only_change();

ALTER TABLE citizen_data.citizens ENABLE ROW LEVEL SECURITY;
ALTER TABLE citizen_data.citizens FORCE ROW LEVEL SECURITY;
CREATE POLICY citizen_isolation ON citizen_data.citizens
  USING (id = citizen_data.current_citizen_id())
  WITH CHECK (id = citizen_data.current_citizen_id());

ALTER TABLE citizen_data.consent_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE citizen_data.consent_receipts FORCE ROW LEVEL SECURITY;
CREATE POLICY citizen_isolation ON citizen_data.consent_receipts
  USING (citizen_id = citizen_data.current_citizen_id())
  WITH CHECK (citizen_id = citizen_data.current_citizen_id());

ALTER TABLE citizen_data.consent_receipt_purposes ENABLE ROW LEVEL SECURITY;
ALTER TABLE citizen_data.consent_receipt_purposes FORCE ROW LEVEL SECURITY;
CREATE POLICY citizen_isolation ON citizen_data.consent_receipt_purposes
  USING (citizen_id = citizen_data.current_citizen_id())
  WITH CHECK (citizen_id = citizen_data.current_citizen_id());

ALTER TABLE citizen_data.browser_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE citizen_data.browser_credentials FORCE ROW LEVEL SECURITY;
CREATE POLICY citizen_isolation ON citizen_data.browser_credentials
  USING (citizen_id = citizen_data.current_citizen_id())
  WITH CHECK (citizen_id = citizen_data.current_citizen_id());

ALTER TABLE citizen_data.experience_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE citizen_data.experience_sessions FORCE ROW LEVEL SECURITY;
CREATE POLICY citizen_isolation ON citizen_data.experience_sessions
  USING (citizen_id = citizen_data.current_citizen_id())
  WITH CHECK (citizen_id = citizen_data.current_citizen_id());

ALTER TABLE citizen_data.encrypted_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE citizen_data.encrypted_objects FORCE ROW LEVEL SECURITY;
CREATE POLICY citizen_isolation ON citizen_data.encrypted_objects
  USING (citizen_id = citizen_data.current_citizen_id())
  WITH CHECK (citizen_id = citizen_data.current_citizen_id());

ALTER TABLE citizen_data.checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE citizen_data.checkins FORCE ROW LEVEL SECURITY;
CREATE POLICY citizen_isolation ON citizen_data.checkins
  USING (citizen_id = citizen_data.current_citizen_id())
  WITH CHECK (citizen_id = citizen_data.current_citizen_id());

ALTER TABLE citizen_data.conversation_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE citizen_data.conversation_threads FORCE ROW LEVEL SECURITY;
CREATE POLICY citizen_isolation ON citizen_data.conversation_threads
  USING (citizen_id = citizen_data.current_citizen_id())
  WITH CHECK (citizen_id = citizen_data.current_citizen_id());

ALTER TABLE citizen_data.conversation_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE citizen_data.conversation_turns FORCE ROW LEVEL SECURITY;
CREATE POLICY citizen_isolation ON citizen_data.conversation_turns
  USING (citizen_id = citizen_data.current_citizen_id())
  WITH CHECK (citizen_id = citizen_data.current_citizen_id());

ALTER TABLE citizen_data.inference_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE citizen_data.inference_runs FORCE ROW LEVEL SECURITY;
CREATE POLICY citizen_isolation ON citizen_data.inference_runs
  USING (citizen_id = citizen_data.current_citizen_id())
  WITH CHECK (citizen_id = citizen_data.current_citizen_id());

ALTER TABLE citizen_data.engagement_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE citizen_data.engagement_events FORCE ROW LEVEL SECURITY;
CREATE POLICY citizen_isolation ON citizen_data.engagement_events
  USING (citizen_id = citizen_data.current_citizen_id())
  WITH CHECK (citizen_id = citizen_data.current_citizen_id());

ALTER TABLE citizen_data.data_use_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE citizen_data.data_use_events FORCE ROW LEVEL SECURITY;
CREATE POLICY citizen_isolation ON citizen_data.data_use_events
  USING (citizen_id = citizen_data.current_citizen_id())
  WITH CHECK (citizen_id = citizen_data.current_citizen_id());

ALTER TABLE citizen_data.vector_projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE citizen_data.vector_projections FORCE ROW LEVEL SECURITY;
CREATE POLICY citizen_isolation ON citizen_data.vector_projections
  USING (citizen_id = citizen_data.current_citizen_id())
  WITH CHECK (citizen_id = citizen_data.current_citizen_id());

ALTER TABLE citizen_data.data_rights_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE citizen_data.data_rights_requests FORCE ROW LEVEL SECURITY;
CREATE POLICY citizen_isolation ON citizen_data.data_rights_requests
  USING (citizen_id = citizen_data.current_citizen_id())
  WITH CHECK (citizen_id = citizen_data.current_citizen_id());

ALTER TABLE citizen_data.erasure_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE citizen_data.erasure_targets FORCE ROW LEVEL SECURITY;
CREATE POLICY citizen_isolation ON citizen_data.erasure_targets
  USING (citizen_id = citizen_data.current_citizen_id())
  WITH CHECK (citizen_id = citizen_data.current_citizen_id());

ALTER TABLE citizen_data.outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE citizen_data.outbox_events FORCE ROW LEVEL SECURITY;
CREATE POLICY citizen_isolation ON citizen_data.outbox_events
  USING (citizen_id = citizen_data.current_citizen_id())
  WITH CHECK (citizen_id = citizen_data.current_citizen_id());

COMMIT;
