import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const ACCOUNT_ID = 'bef34a5ee69678e46332813cb7610012';
const TOKEN_PATH = '/private/tmp/.codex-cloudflare-stream-token';
const SOURCE_DIR = path.join(ROOT, 'i  a m', 'a s s e t s');
const MANIFEST_PATH = path.join(ROOT, 'cloudflare-stream-fashion-priority-manifest.json');
const ENDPOINT = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream`;
const CHUNK_SIZE = 5_242_880;
const CONCURRENCY = 2;
const FILE_NAMES = [
  'Chanel - Paris 2020.mp4',
  'Dolce & Gabbanna - Sicily 2019.mp4',
];

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function fetchWithRetry(url, options, attempts = 8) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url, options);
      if (response.ok || response.status === 409 || response.status === 412) return response;
      const detail = await response.text();
      throw new Error(`${response.status} ${response.statusText}: ${detail.slice(0, 500)}`);
    } catch (error) {
      lastError = error;
      if (attempt === attempts - 1) break;
      await sleep(Math.min(60_000, 2_000 * (2 ** attempt)));
    }
  }
  throw lastError;
}

async function readManifest() {
  try {
    return JSON.parse(await fs.readFile(MANIFEST_PATH, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return {
      accountId: ACCOUNT_ID,
      createdAt: new Date().toISOString(),
      files: {},
      expectedFiles: FILE_NAMES,
    };
  }
}

async function writeManifest(manifest) {
  manifest.updatedAt = new Date().toISOString();
  const temporaryPath = `${MANIFEST_PATH}.tmp`;
  await fs.writeFile(temporaryPath, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });
  await fs.rename(temporaryPath, MANIFEST_PATH);
}

function uploadMetadata(fileName) {
  return [
    `name ${Buffer.from(fileName).toString('base64')}`,
    `filetype ${Buffer.from('video/mp4').toString('base64')}`,
  ].join(',');
}

async function serverOffset(record, token) {
  const response = await fetchWithRetry(record.location, {
    method: 'HEAD',
    headers: {
      Authorization: `Bearer ${token}`,
      'Tus-Resumable': '1.0.0',
    },
  });
  const offset = Number(response.headers.get('upload-offset'));
  if (!Number.isFinite(offset)) throw new Error(`Cloudflare did not return an upload offset for ${record.fileName}.`);
  return offset;
}

async function createUpload(fileName, size, token) {
  const response = await fetchWithRetry(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Tus-Resumable': '1.0.0',
      'Upload-Length': String(size),
      'Upload-Creator': 'universal-mind-fashion-priority',
      'Upload-Metadata': uploadMetadata(fileName),
    },
  });
  const location = response.headers.get('location');
  const uid = response.headers.get('stream-media-id');
  if (!location || !uid) throw new Error(`Cloudflare did not return an upload URL and video ID for ${fileName}.`);
  return { location, uid };
}

async function uploadFile(fileName, manifest, token) {
  const filePath = path.join(SOURCE_DIR, fileName);
  const stat = await fs.stat(filePath);
  const size = stat.size;
  let record = manifest.files[fileName];

  if (record?.status === 'uploaded' && record.offset === size) {
    console.log(`Already uploaded: ${fileName}`);
    return;
  }

  if (!record?.location) {
    const created = await createUpload(fileName, size, token);
    record = manifest.files[fileName] = {
      fileName,
      size,
      status: 'uploading',
      offset: 0,
      percent: 0,
      startedAt: new Date().toISOString(),
      ...created,
    };
    await writeManifest(manifest);
  } else {
    record.offset = await serverOffset(record, token);
    record.status = 'uploading';
    await writeManifest(manifest);
  }

  const handle = await fs.open(filePath, 'r');
  try {
    while (record.offset < size) {
      const offset = record.offset;
      const length = Math.min(CHUNK_SIZE, size - offset);
      const chunk = Buffer.allocUnsafe(length);
      const { bytesRead } = await handle.read(chunk, 0, length, offset);
      if (bytesRead !== length) throw new Error(`Short read for ${fileName} at byte ${offset}.`);

      const response = await fetchWithRetry(record.location, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Tus-Resumable': '1.0.0',
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': String(offset),
        },
        body: chunk,
      });

      if (response.status === 409 || response.status === 412) {
        record.offset = await serverOffset(record, token);
        continue;
      }

      record.offset = Number(response.headers.get('upload-offset')) || offset + length;
      record.percent = Number(((record.offset / size) * 100).toFixed(1));
      record.status = record.offset >= size ? 'uploaded' : 'uploading';
      if (record.status === 'uploaded') record.uploadedAt = new Date().toISOString();
      await writeManifest(manifest);
      console.log(`${String(record.percent).padStart(5)}% ${fileName}`);
    }
  } finally {
    await handle.close();
  }
}

const token = (await fs.readFile(TOKEN_PATH, 'utf8')).trim();
if (!token) throw new Error(`Cloudflare token is empty: ${TOKEN_PATH}`);

const manifest = await readManifest();
const queue = [...FILE_NAMES];
console.log(`Uploading ${queue.length} priority fashion videos with concurrency ${CONCURRENCY}`);

async function worker() {
  while (queue.length) {
    const fileName = queue.shift();
    await uploadFile(fileName, manifest, token);
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
console.log('Priority fashion uploads complete.');
