DO $$
DECLARE
  existing citizen_data.consent_documents%ROWTYPE;
BEGIN
  SELECT * INTO existing
  FROM citizen_data.consent_documents
  WHERE version = 'arrival-consent-v3';

  IF FOUND THEN
    IF existing.copy_sha256 <> '52f5a4e51b6d4642e87b4ee05afd928c3a6f208a1ea949fe48c3900c45761bc1'
       OR existing.status <> 'published' THEN
      RAISE EXCEPTION 'arrival-consent-v3 does not match the approved published copy';
    END IF;
    RETURN;
  END IF;

  INSERT INTO citizen_data.consent_documents
    (id, version, copy_sha256, status, jurisdiction, published_at, created_at)
  VALUES
    ('438d3749-269e-4fa0-820a-b56f2b45368d'::uuid,
     'arrival-consent-v3',
     '52f5a4e51b6d4642e87b4ee05afd928c3a6f208a1ea949fe48c3900c45761bc1',
     'published', 'AU', now(), now());
END
$$;
