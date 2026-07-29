DO $$
DECLARE
  existing citizen_data.consent_documents%ROWTYPE;
BEGIN
  SELECT * INTO existing
  FROM citizen_data.consent_documents
  WHERE version = 'arrival-consent-v2';

  IF FOUND THEN
    IF existing.copy_sha256 <> 'bde47bba7b74e006d41efc36ac455cf6aa1790f151e20613a6d86779fde96503'
       OR existing.status <> 'published' THEN
      RAISE EXCEPTION 'arrival-consent-v2 does not match the approved published copy';
    END IF;
    RETURN;
  END IF;

  INSERT INTO citizen_data.consent_documents
    (id, version, copy_sha256, status, jurisdiction, published_at, created_at)
  VALUES
    ('ee447e46-cd36-4493-b5ca-16dacc06af08'::uuid,
     'arrival-consent-v2',
     'bde47bba7b74e006d41efc36ac455cf6aa1790f151e20613a6d86779fde96503',
     'published', 'AU', now(), now());
END
$$;
