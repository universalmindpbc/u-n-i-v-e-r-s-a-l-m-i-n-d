import fs from "node:fs/promises";

const manifestPath = "/private/tmp/cloudflare-stream-new-videos-20260827-manifest.json";
const customerHost = "customer-1vpwglz3v6fiyaas.cloudflarestream.com";
const waitForAll = process.argv.includes("--wait");
const pollMs = 45_000;

const parseIsoDuration = (value) => {
  const match = String(value || "").match(/^PT(?:(\d+)H)?(?:(\d+)M)?([\d.]+)S$/);
  if (!match) return 0;
  return (Number(match[1] || 0) * 3600) + (Number(match[2] || 0) * 60) + Number(match[3] || 0);
};

const refresh = async () => {
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  let ready = 0;
  for (const [id, record] of Object.entries(manifest.files || {})) {
    const base = `https://${customerHost}/${record.uid}/manifest`;
    try {
      const [mpdResponse, hlsResponse] = await Promise.all([
        fetch(`${base}/video.mpd`, { headers: { Accept: "application/dash+xml" } }),
        fetch(`${base}/video.m3u8`, { headers: { Accept: "application/vnd.apple.mpegurl" } }),
      ]);
      if (!mpdResponse.ok || !hlsResponse.ok) {
        record.status = "encoding";
        record.readyToStream = false;
        record.httpStatus = { dash: mpdResponse.status, hls: hlsResponse.status };
        continue;
      }
      const [mpd, hls] = await Promise.all([mpdResponse.text(), hlsResponse.text()]);
      const duration = parseIsoDuration(mpd.match(/mediaPresentationDuration="([^"]+)"/)?.[1]);
      if (!(duration > 0) || !hls.includes("#EXTM3U") || !hls.includes("#EXT-X-STREAM-INF")) {
        record.status = "encoding";
        record.readyToStream = false;
        record.error = "Public manifests are incomplete";
        continue;
      }
      record.duration = duration;
      record.status = "ready";
      record.readyToStream = true;
      record.hls = `${base}/video.m3u8`;
      record.dash = `${base}/video.mpd`;
      record.httpStatus = { dash: mpdResponse.status, hls: hlsResponse.status };
      delete record.error;
      ready += 1;
    } catch (error) {
      record.status = "encoding";
      record.readyToStream = false;
      record.error = error.message;
    }
    console.log(`${record.readyToStream ? "READY" : "WAIT "} ${id}`);
  }
  manifest.readyCount = ready;
  manifest.updatedAt = new Date().toISOString();
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`STREAM STATUS ${ready}/${Object.keys(manifest.files || {}).length} Ready`);
  return { ready, total: Object.keys(manifest.files || {}).length };
};

for (;;) {
  const result = await refresh();
  if (!waitForAll || result.ready === result.total) break;
  await new Promise((resolve) => setTimeout(resolve, pollMs));
}
