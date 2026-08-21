CREATE TABLE IF NOT EXISTS ditto_documents (
  document_path text PRIMARY KEY,
  collection_path text NOT NULL,
  document_id text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (jsonb_typeof(data) = 'object')
);

CREATE INDEX IF NOT EXISTS ditto_documents_collection_path_idx
  ON ditto_documents (collection_path, document_id);

CREATE INDEX IF NOT EXISTS ditto_documents_updated_at_idx
  ON ditto_documents (updated_at DESC);

CREATE TABLE IF NOT EXISTS ditto_family_members (
  family_id text NOT NULL,
  user_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (family_id, user_id)
);
