import fs from 'node:fs/promises';
import path from 'node:path';

const ACCOUNT_ID = 'bef34a5ee69678e46332813cb7610012';
const API_ROOT = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream`;
const ASSETS_DIR = path.resolve('i  a m/a s s e t s/d j  s e t s');
const TOKEN_FILE = '/private/tmp/.codex-cloudflare-stream-token';
const MANIFEST_FILE = path.resolve('cloudflare-stream-djset-upload-manifest.json');
const CHUNK_SIZE = 5_242_880;
const CONCURRENCY = 1;
const MAX_CHUNK_ATTEMPTS = 20;
const READY_POLL_INTERVAL_MS = 30_000;

const token = (await fs.readFile(TOKEN_FILE, 'utf8')).trim();
const authHeaders = { Authorization: `Bearer ${token}`, 'Tus-Resumable': '1.0.0' };

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function readManifest() {
  try {
    return JSON.parse(await fs.readFile(MANIFEST_FILE, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return { accountId: ACCOUNT_ID, createdAt: new Date().toISOString(), files: {} };
  }
}

const manifest = await readManifest();

async function saveManifest() {
  manifest.updatedAt = new Date().toISOString();
  await fs.writeFile(MANIFEST_FILE, `${JSON.stringify(manifest, null, 2)}\n`);
}

async function createUpload(fileName, size) {
  const displayName = fileName.trim();
  const name = Buffer.from(displayName).toString('base64');
  const response = await fetch(API_ROOT, {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Upload-Length': String(size),
      'Upload-Metadata': `name ${name}`,
      'Upload-Creator': 'universal-mind-dj-sets',
    },
  });
  if (response.status !== 201) {
    throw new Error(`Could not create upload (${response.status}): ${await response.text()}`);
  }
  const location = response.headers.get('location');
  const uid = response.headers.get('stream-media-id');
  if (!location) throw new Error('Cloudflare did not return a tus upload URL');
  return { location, uid, displayName };
}

async function getOffset(location) {
  const response = await fetch(location, { method: 'HEAD', headers: authHeaders });
  if (!response.ok) throw new Error(`Could not resume upload (${response.status})`);
  return Number(response.headers.get('upload-offset') || 0);
}

async function uploadChunk(record, chunk, length) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_CHUNK_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(record.location, {
        method: 'PATCH',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': String(record.offset),
        },
        body: chunk,
      });

      if (response.status === 204) {
        return Number(response.headers.get('upload-offset') || record.offset + length);
      }

      const responseBody = await response.text();
      lastError = new Error(`Chunk failed (${response.status}): ${responseBody}`);
      if (response.status < 500 && response.status !== 429) throw lastError;
    } catch (error) {
      lastError = error;
    }

    if (attempt === MAX_CHUNK_ATTEMPTS) break;

    try {
      const serverOffset = await getOffset(record.location);
      if (serverOffset > record.offset) return serverOffset;
    } catch {
      // The supervisor will keep this file first if Cloudflare remains unavailable.
    }

    const retryDelay = Math.min(5_000 * attempt, 60_000);
    console.warn(`RETRY ${attempt}/${MAX_CHUNK_ATTEMPTS} at ${record.offset} in ${retryDelay / 1000}s`);
    await sleep(retryDelay);
  }

  throw lastError;
}

async function uploadFile(fileName) {
  const filePath = path.join(ASSETS_DIR, fileName);
  const { size } = await fs.stat(filePath);
  const record = manifest.files[fileName] ||= { fileName, size, status: 'queued' };
  if (record.status === 'uploaded' && record.offset === size) {
    console.log(`SKIP ${fileName}`);
    return;
  }

  if (!record.location) {
    Object.assign(record, await createUpload(fileName, size), {
      status: 'uploading',
      offset: 0,
      startedAt: new Date().toISOString(),
    });
    await saveManifest();
  } else {
    record.offset = await getOffset(record.location);
    record.status = 'uploading';
    delete record.error;
    await saveManifest();
  }

  const handle = await fs.open(filePath, 'r');
  try {
    while (record.offset < size) {
      const length = Math.min(CHUNK_SIZE, size - record.offset);
      const chunk = Buffer.allocUnsafe(length);
      const { bytesRead } = await handle.read(chunk, 0, length, record.offset);
      if (bytesRead !== length) throw new Error(`Short read at ${record.offset}`);
      record.offset = await uploadChunk(record, chunk, length);
      record.percent = Number(((record.offset / size) * 100).toFixed(1));
      await saveManifest();
      console.log(`${String(record.percent).padStart(5)}% ${fileName}`);
    }
  } finally {
    await handle.close();
  }

  record.status = 'uploaded';
  record.completedAt = new Date().toISOString();
  await saveManifest();
  console.log(`DONE ${fileName}`);
}

async function waitUntilReady(fileName) {
  const record = manifest.files[fileName];
  if (!record?.uid) throw new Error(`No Cloudflare UID recorded for ${fileName}`);

  while (true) {
    try {
      const response = await fetch(`${API_ROOT}/${record.uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Status check failed (${response.status})`);

      const payload = await response.json();
      const video = payload.result;
      if (video?.readyToStream === true) {
        record.readyToStream = true;
        record.readyAt = new Date().toISOString();
        await saveManifest();
        console.log(`READY ${fileName}`);
        return;
      }

      if (video?.status?.state === 'error') {
        throw new Error(`Cloudflare processing failed for ${fileName}`);
      }

      console.log(`PROCESSING ${fileName}; checking again in ${READY_POLL_INTERVAL_MS / 1000}s`);
    } catch (error) {
      console.warn(`STATUS ${fileName}: ${error.message}`);
    }

    await sleep(READY_POLL_INTERVAL_MS);
  }
}

async function prepareDeferredUpload(fileName) {
  const record = manifest.files[fileName];
  if (!record?.uid) return;

  try {
    const response = await fetch(`${API_ROOT}/${record.uid}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      const payload = await response.json();
      if (payload.result?.readyToStream === true) {
        record.readyToStream = true;
        record.readyAt = new Date().toISOString();
        await saveManifest();
        console.log(`READY ${fileName}`);
        return;
      }
    }
  } catch {
    // A fresh upload below is safer than waiting indefinitely on a stale session.
  }

  record.supersededUploads ||= [];
  record.supersededUploads.push({
    uid: record.uid,
    location: record.location,
    offset: record.offset,
    status: record.status,
    supersededAt: new Date().toISOString(),
  });
  delete record.uid;
  delete record.location;
  delete record.completedAt;
  delete record.readyToStream;
  delete record.readyAt;
  delete record.error;
  record.status = 'queued';
  record.offset = 0;
  record.percent = 0;
  await saveManifest();
  console.log(`REPLACE stale Cloudflare session for ${fileName}`);
}

const fileNames = (await fs.readdir(ASSETS_DIR))
  .filter((name) => name.toLowerCase().endsWith('.mp4'))
  .sort((a, b) => a.localeCompare(b));

if (fileNames.length !== 7) {
  throw new Error(`Expected 7 MP4 files in ${ASSETS_DIR}, found ${fileNames.length}`);
}

manifest.expectedFiles = fileNames;
await saveManifest();
console.log(`Uploading ${fileNames.length} DJ sets with concurrency ${CONCURRENCY}`);

const completedValidationFile = fileNames.find((name) => name.includes('Carl Cox'));
const deferredFiles = [
  fileNames.find((name) => name.trimStart().startsWith('Sasha')),
  fileNames.find((name) => name.startsWith('Ben Bo')),
];

if (!completedValidationFile || deferredFiles.some((fileName) => !fileName)) {
  throw new Error('Could not identify the Carl Cox, Sasha, and Ben Bohmer validation files');
}

const remainingFiles = fileNames.filter((fileName) => (
  fileName !== completedValidationFile && !deferredFiles.includes(fileName)
));

async function uploadInOrder(files) {
  for (const fileName of files) {
    try {
      await uploadFile(fileName);
    } catch (error) {
      const record = manifest.files[fileName] ||= { fileName };
      record.status = 'failed';
      record.error = error.message;
      await saveManifest();
      console.error(`FAIL ${fileName}: ${error.message}`);
      throw error;
    }
  }
}

console.log('Priority order: remaining four DJ sets -> Sasha -> Ben Bohmer');
await waitUntilReady(completedValidationFile);
await uploadInOrder(remainingFiles);
await Promise.all(remainingFiles.map((fileName) => waitUntilReady(fileName)));
console.log('Remaining four DJ sets are ready; releasing Sasha and Ben Bohmer.');

for (const fileName of deferredFiles) {
  await prepareDeferredUpload(fileName);
  if (manifest.files[fileName]?.readyToStream !== true) {
    await uploadInOrder([fileName]);
    await waitUntilReady(fileName);
  }
}

const uploaded = Object.values(manifest.files).filter((file) => file.status === 'uploaded').length;
const failed = Object.values(manifest.files).filter((file) => file.status === 'failed').length;
console.log(`Batch complete: ${uploaded} uploaded, ${failed} failed`);
if (failed) process.exitCode = 1;
