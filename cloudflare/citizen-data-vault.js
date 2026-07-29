const encoder = new TextEncoder();

function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sha256Hex(value) {
  const bytes = typeof value === "string" ? encoder.encode(value) : value;
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function assertVaultDataClass(dataClass) {
  const allowed = new Set(["checkin_text", "inference_result", "conversation_turn", "citizen_export"]);
  if (!allowed.has(dataClass)) throw new Error("citizen_data_class_not_allowed");
}

export function createEnvelopeVault({
  keyManager,
  objectStore,
  objectKeyPrefix = "citizens",
  now = () => new Date(),
  randomBytes = (length) => crypto.getRandomValues(new Uint8Array(length)),
}) {
  if (!keyManager?.generateDataKey) throw new Error("citizen_data_key_manager_required");
  if (!objectStore?.put || !objectStore?.delete) throw new Error("citizen_data_object_store_required");
  if (!/^[a-z0-9][a-z0-9/_-]{0,79}$/i.test(objectKeyPrefix)) {
    throw new Error("citizen_data_object_prefix_invalid");
  }

  return Object.freeze({
    async storeJson({ citizenId, recordId, dataClass, value, contentType = "application/json" }) {
      assertVaultDataClass(dataClass);
      const plaintext = encoder.encode(JSON.stringify(value));
      const aad = encoder.encode(JSON.stringify({
        schema_version: "citizen_data_aad_v1",
        citizen_id: citizenId,
        record_id: recordId,
        data_class: dataClass,
      }));
      const iv = randomBytes(12);
      const generatedKey = await keyManager.generateDataKey({ citizenId, recordId, dataClass });
      const rawKey = generatedKey.plaintextKey;
      if (!(rawKey instanceof Uint8Array) || rawKey.byteLength !== 32) {
        throw new Error("citizen_data_invalid_plaintext_key");
      }

      try {
        const cryptoKey = await crypto.subtle.importKey("raw", rawKey, { name: "AES-GCM" }, false, ["encrypt"]);
        const encrypted = new Uint8Array(await crypto.subtle.encrypt(
          { name: "AES-GCM", iv, additionalData: aad, tagLength: 128 },
          cryptoKey,
          plaintext,
        ));
        const ciphertext = new Uint8Array(iv.byteLength + encrypted.byteLength);
        ciphertext.set(iv, 0);
        ciphertext.set(encrypted, iv.byteLength);
        const ciphertextSha256 = await sha256Hex(ciphertext);
        const objectKey = `${objectKeyPrefix}/${citizenId}/${dataClass}/${recordId}-${bytesToBase64Url(randomBytes(9))}.umenc`;
        const stored = await objectStore.put({
          objectKey,
          body: ciphertext,
          contentType: "application/octet-stream",
          metadata: {
            schema: "citizen-data-envelope-v1",
            ciphertext_sha256: ciphertextSha256,
          },
        });

        return {
          id: recordId,
          citizenId,
          dataClass,
          storageProvider: stored.provider,
          bucketName: stored.bucket,
          objectKey,
          objectVersionId: stored.versionId || null,
          ciphertextSha256,
          wrappedDataKey: generatedKey.wrappedKey,
          kmsKeyArn: generatedKey.keyArn,
          encryptionAlgorithm: "AES-256-GCM",
          aadSchemaVersion: "citizen_data_aad_v1",
          contentType,
          byteLength: ciphertext.byteLength,
          retentionClass: dataClass === "citizen_export" ? "export_temporary" : "citizen_controlled",
          createdAt: now().toISOString(),
        };
      } finally {
        rawKey.fill(0);
      }
    },

    async delete(storedObject) {
      if (!storedObject?.objectKey) return;
      await objectStore.delete({ objectKey: storedObject.objectKey, versionId: storedObject.objectVersionId || null });
    },
  });
}

export { sha256Hex };
