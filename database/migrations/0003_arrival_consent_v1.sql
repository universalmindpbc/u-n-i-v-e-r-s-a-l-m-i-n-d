DO $$
DECLARE
  existing citizen_data.consent_documents%ROWTYPE;
BEGIN
  SELECT * INTO existing
  FROM citizen_data.consent_documents
  WHERE version = 'arrival-consent-v1';

  IF FOUND THEN
    IF existing.copy_sha256 <> '738aea649091259b573476e8fd25c558a7baefee5b657dea480659d8a03a9f9a'
       OR existing.status <> 'published' THEN
      RAISE EXCEPTION 'arrival-consent-v1 does not match the approved published copy';
    END IF;
    RETURN;
  END IF;

  INSERT INTO citizen_data.consent_documents
    (id, version, copy_sha256, status, jurisdiction, published_at, created_at)
  VALUES
    ('a6017f1d-0f3c-4efe-9c0d-0142dc6e78b1'::uuid,
     'arrival-consent-v1',
     '738aea649091259b573476e8fd25c558a7baefee5b657dea480659d8a03a9f9a',
     'published', 'AU', now(), now());
END
$$;
