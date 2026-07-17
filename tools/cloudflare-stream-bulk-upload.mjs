import fs from 'node:fs/promises';
import path from 'node:path';

const ACCOUNT_ID = 'bef34a5ee69678e46332813cb7610012';
const API_ROOT = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream`;
const ASSETS_DIR = path.resolve('i  a m/a s s e t s');
const TOKEN_FILE = '/private/tmp/.codex-cloudflare-stream-token';
const MANIFEST_FILE = path.resolve('cloudflare-stream-upload-manifest.json');
const CHUNK_SIZE = 5_242_880;
const CONCURRENCY = 1;

const token = (await fs.readFile(TOKEN_FILE, 'utf8')).trim();
const authHeaders = { Authorization: `Bearer ${token}`, 'Tus-Resumable': '1.0.0' };

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
  const name = Buffer.from(fileName).toString('base64');
  const response = await fetch(API_ROOT, {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Upload-Length': String(size),
      'Upload-Metadata': `name ${name}`,
    },
  });
  if (response.status !== 201) {
    throw new Error(`Could not create upload (${response.status}): ${await response.text()}`);
  }
  const location = response.headers.get('location');
  const uid = response.headers.get('stream-media-id');
  if (!location) throw new Error('Cloudflare did not return a tus upload URL');
  return { location, uid };
}

async function getOffset(location) {
  const response = await fetch(location, { method: 'HEAD', headers: authHeaders });
  if (!response.ok) throw new Error(`Could not resume upload (${response.status})`);
  return Number(response.headers.get('upload-offset') || 0);
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
  }

  const handle = await fs.open(filePath, 'r');
  try {
    while (record.offset < size) {
      const length = Math.min(CHUNK_SIZE, size - record.offset);
      const chunk = Buffer.allocUnsafe(length);
      const { bytesRead } = await handle.read(chunk, 0, length, record.offset);
      if (bytesRead !== length) throw new Error(`Short read at ${record.offset}`);
      const response = await fetch(record.location, {
        method: 'PATCH',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': String(record.offset),
        },
        body: chunk,
      });
      if (response.status !== 204) {
        throw new Error(`Chunk failed (${response.status}): ${await response.text()}`);
      }
      record.offset = Number(response.headers.get('upload-offset') || record.offset + length);
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

const fileNames = (await fs.readdir(ASSETS_DIR))
  .filter((name) => name.toLowerCase().endsWith('.mp4'))
  .sort((a, b) => a.localeCompare(b));

if (fileNames.length !== 24) {
  throw new Error(`Expected 24 MP4 files in ${ASSETS_DIR}, found ${fileNames.length}`);
}

manifest.expectedFiles = fileNames;
await saveManifest();
console.log(`Uploading ${fileNames.length} videos with concurrency ${CONCURRENCY}`);

let nextIndex = 0;
async function worker() {
  while (nextIndex < fileNames.length) {
    const index = nextIndex++;
    const fileName = fileNames[index];
    try {
      await uploadFile(fileName);
    } catch (error) {
      const record = manifest.files[fileName] ||= { fileName };
      record.status = 'failed';
      record.error = error.message;
      await saveManifest();
      console.error(`FAIL ${fileName}: ${error.message}`);
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

const uploaded = Object.values(manifest.files).filter((file) => file.status === 'uploaded').length;
const failed = Object.values(manifest.files).filter((file) => file.status === 'failed').length;
console.log(`Batch complete: ${uploaded} uploaded, ${failed} failed`);
if (failed) process.exitCode = 1;
