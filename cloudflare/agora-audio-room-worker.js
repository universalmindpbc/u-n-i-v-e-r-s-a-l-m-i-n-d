import AgoraToken from "agora-token";

const { RtcTokenBuilder, RtcRole } = AgoraToken;

const ROOM_CAPACITY = 9;
const RESERVATION_TTL_MS = 30_000;
const DEFAULT_TOKEN_TTL_SECONDS = 3600;
const RESERVATION_PREFIX = "reservation:";

const CIRCLES = Object.freeze([
  { id: "img", name: "img", description: "models", emoji: "💃" },
  { id: "wme", name: "wme", description: "talent", emoji: "🌐" },
  { id: "north-bondi-rsl", name: "north bondi rsl", description: "veterans", emoji: "🎖️" },
  { id: "nagnata", name: "nagnata", description: "customers", emoji: "🩱" },
  { id: "aime", name: "aime", description: "first nations imagination", emoji: "🧘🏾‍♀️" },
  { id: "black-rainbow", name: "black rainbow", description: "first nations mental health", emoji: "🌈" },
  { id: "headspace", name: "headspace", description: "youth mental health", emoji: "🧩" },
  { id: "phoenix", name: "phoenix", description: "veterans mental health", emoji: "🐦‍🔥" },
]);

const CIRCLE_IDS = new Set(CIRCLES.map((circle) => circle.id));
const ALLOWED_ORIGINS = new Set([
  "https://staging.universalmind.tv",
  "https://universalmind.tv",
  "https://www.universalmind.tv",
  "http://127.0.0.1:8126",
  "http://localhost:8126",
]);

function cleanString(value, maxLength = 120) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function cleanCircleId(value) {
  const circleId = cleanString(value, 40).toLowerCase();
  return CIRCLE_IDS.has(circleId) ? circleId : "";
}

function cleanOpaqueId(value) {
  const id = cleanString(value, 120);
  return /^[a-zA-Z0-9_-]{8,120}$/.test(id) ? id : "";
}

function circleForId(circleId) {
  return CIRCLES.find((circle) => circle.id === circleId) || null;
}

function channelFor(circleId, roomNumber) {
  return `iam-circle-${circleId}-${String(roomNumber).padStart(3, "0")}`;
}

function randomUid() {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] || 1;
}

function originAllowed(request) {
  const origin = request.headers.get("Origin");
  return !origin || ALLOWED_ORIGINS.has(origin);
}

function corsHeaders(request) {
  const origin = request.headers.get("Origin");
  const allowedOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://universalmind.tv";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function jsonResponse(request, status, payload) {
  return Response.json(payload, {
    status,
    headers: {
      ...corsHeaders(request),
      "Cache-Control": "no-store, private",
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

async function readBody(request) {
  if (request.method !== "POST") return {};
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function internalRequest(path, body) {
  return new Request(`https://circle.internal${path}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function stubJson(stub, path, body) {
  const response = await stub.fetch(internalRequest(path, body));
  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}

function durableObjectFor(env, circleId) {
  return env.CIRCLE_ROOMS.getByName(circleId);
}

function tokenConfiguration(env) {
  return {
    appId: cleanString(env.AGORA_APP_ID, 64),
    appCertificate: cleanString(env.AGORA_APP_CERTIFICATE, 128),
    ttlSeconds: Math.max(300, Math.min(86_400, Number(env.AGORA_TOKEN_TTL_SECONDS) || DEFAULT_TOKEN_TTL_SECONDS)),
  };
}

async function handleCatalogue(request, env) {
  if (request.method !== "GET") return jsonResponse(request, 405, { error: "Method not allowed." });

  const summaries = await Promise.all(CIRCLES.map(async (circle) => {
    const stub = durableObjectFor(env, circle.id);
    const { response, payload } = await stubJson(stub, "/status");
    if (!response.ok) {
      return {
        ...circle,
        capacity: ROOM_CAPACITY,
        live_count: 0,
        room_count: 0,
        rooms: [],
        next_room: { number: 1, count: 0 },
      };
    }
    return { ...circle, ...payload, id: circle.id };
  }));

  return jsonResponse(request, 200, {
    version: "circle_rooms_v1",
    capacity: ROOM_CAPACITY,
    circles: summaries,
  });
}

async function handleJoin(request, env) {
  if (request.method !== "POST") return jsonResponse(request, 405, { error: "Method not allowed." });

  const body = await readBody(request);
  const circleId = cleanCircleId(body.circle_id || body.circleId);
  const sessionId = cleanOpaqueId(body.session_id || body.sessionId);
  if (!circleId || !sessionId) {
    return jsonResponse(request, 400, { error: "A valid Circle and session are required." });
  }

  const tokenConfig = tokenConfiguration(env);
  if (!tokenConfig.appId || !tokenConfig.appCertificate) {
    return jsonResponse(request, 503, {
      error: "Live Circle credentials are not configured.",
      required_vars: ["AGORA_APP_ID"],
      required_secrets: ["AGORA_APP_CERTIFICATE"],
    });
  }

  const stub = durableObjectFor(env, circleId);
  const { response, payload: assignment } = await stubJson(stub, "/join", {
    circle_id: circleId,
    session_id: sessionId,
  });
  if (!response.ok) return jsonResponse(request, response.status, assignment);

  const expiresAtSeconds = Math.floor(Date.now() / 1000) + tokenConfig.ttlSeconds;
  let token = "";
  try {
    token = RtcTokenBuilder.buildTokenWithUid(
      tokenConfig.appId,
      tokenConfig.appCertificate,
      assignment.channel,
      Number(assignment.uid),
      RtcRole.PUBLISHER,
      tokenConfig.ttlSeconds,
      tokenConfig.ttlSeconds
    );
  } catch {
    await stubJson(stub, "/leave", {
      circle_id: circleId,
      session_id: sessionId,
      reservation_id: assignment.reservation_id,
    });
    return jsonResponse(request, 503, { error: "A secure Circle token could not be created." });
  }

  const presenceUrl = new URL("/audio-rooms/presence", request.url);
  return jsonResponse(request, 200, {
    version: "circle_rooms_v1",
    app_id: tokenConfig.appId,
    token,
    token_expires_at: new Date(expiresAtSeconds * 1000).toISOString(),
    presence_url: presenceUrl.toString(),
    capacity: ROOM_CAPACITY,
    ...assignment,
  });
}

async function handleLeave(request, env) {
  if (request.method !== "POST") return jsonResponse(request, 405, { error: "Method not allowed." });
  const body = await readBody(request);
  const circleId = cleanCircleId(body.circle_id || body.circleId);
  const sessionId = cleanOpaqueId(body.session_id || body.sessionId);
  const reservationId = cleanOpaqueId(body.reservation_id || body.reservationId);
  if (!circleId || !sessionId || !reservationId) {
    return jsonResponse(request, 400, { error: "A valid Circle reservation is required." });
  }

  const stub = durableObjectFor(env, circleId);
  const { response, payload } = await stubJson(stub, "/leave", {
    circle_id: circleId,
    session_id: sessionId,
    reservation_id: reservationId,
  });
  return jsonResponse(request, response.status, payload);
}

async function handlePresence(request, env) {
  if (request.method !== "GET" || request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
    return jsonResponse(request, 426, { error: "A WebSocket connection is required." });
  }
  if (!originAllowed(request)) return jsonResponse(request, 403, { error: "Origin is not allowed." });

  const url = new URL(request.url);
  const circleId = cleanCircleId(url.searchParams.get("circle_id"));
  if (!circleId) return jsonResponse(request, 400, { error: "A valid Circle is required." });
  return durableObjectFor(env, circleId).fetch(request);
}

export class CircleRoom {
  constructor(state) {
    this.state = state;
    this.allocationTail = Promise.resolve();
  }

  activeMembers(excludeSocket = null) {
    return this.state.getWebSockets()
      .filter((socket) => socket !== excludeSocket)
      .map((socket) => {
        try {
          return socket.deserializeAttachment();
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  }

  async pendingReservations() {
    const entries = await this.state.storage.list({ prefix: RESERVATION_PREFIX });
    const now = Date.now();
    const active = [];
    const expiredKeys = [];
    entries.forEach((reservation, key) => {
      if (!reservation || Number(reservation.expiresAt) <= now) expiredKeys.push(key);
      else active.push(reservation);
    });
    if (expiredKeys.length) await this.state.storage.delete(expiredKeys);
    return active;
  }

  countsFor(members) {
    const counts = new Map();
    members.forEach((member) => {
      const roomNumber = Math.max(1, Number(member.roomNumber) || 1);
      counts.set(roomNumber, (counts.get(roomNumber) || 0) + 1);
    });
    return counts;
  }

  chooseRoom(counts) {
    const available = Array.from(counts.entries())
      .filter(([, count]) => count < ROOM_CAPACITY)
      .sort((left, right) => right[1] - left[1] || left[0] - right[0]);
    if (available.length) return available[0][0];
    const highestRoomNumber = Math.max(0, ...counts.keys());
    return highestRoomNumber + 1 || 1;
  }

  async summary(excludeSocket = null) {
    const activeMembers = this.activeMembers(excludeSocket);
    const pending = await this.pendingReservations();
    const liveCounts = this.countsFor(activeMembers);
    const allocationCounts = this.countsFor([...activeMembers, ...pending]);
    const nextRoomNumber = this.chooseRoom(allocationCounts);
    const rooms = Array.from(liveCounts.entries())
      .sort((left, right) => left[0] - right[0])
      .map(([number, count]) => ({ number, count, capacity: ROOM_CAPACITY }));
    return {
      id: activeMembers[0]?.circleId || pending[0]?.circleId || "",
      capacity: ROOM_CAPACITY,
      live_count: activeMembers.length,
      room_count: rooms.length,
      rooms,
      next_room: {
        number: nextRoomNumber,
        count: allocationCounts.get(nextRoomNumber) || 0,
        capacity: ROOM_CAPACITY,
      },
    };
  }

  async join(body) {
    const previousAllocation = this.allocationTail;
    let releaseAllocation;
    this.allocationTail = new Promise((resolve) => {
      releaseAllocation = resolve;
    });
    await previousAllocation;
    try {
      return await this.reserve(body);
    } finally {
      releaseAllocation();
    }
  }

  async reserve(body) {
    const circleId = cleanCircleId(body.circle_id);
    const sessionId = cleanOpaqueId(body.session_id);
    if (!circleId || !sessionId) return { status: 400, payload: { error: "Invalid Circle reservation." } };

    const activeMembers = this.activeMembers();
    const existingActive = activeMembers.find((member) => member.sessionId === sessionId);
    if (existingActive) {
      return {
        status: 200,
        payload: {
          circle_id: circleId,
          reservation_id: existingActive.reservationId,
          room_number: existingActive.roomNumber,
          channel: existingActive.channel,
          uid: existingActive.uid,
          occupancy: this.countsFor(activeMembers).get(existingActive.roomNumber) || 1,
        },
      };
    }

    const pending = await this.pendingReservations();
    const existingPending = pending.find((candidate) => candidate.sessionId === sessionId);
    if (existingPending) {
      const counts = this.countsFor([...activeMembers, ...pending]);
      return {
        status: 200,
        payload: {
          circle_id: circleId,
          reservation_id: existingPending.reservationId,
          room_number: existingPending.roomNumber,
          channel: existingPending.channel,
          uid: existingPending.uid,
          occupancy: counts.get(existingPending.roomNumber) || 1,
        },
      };
    }

    const allocationCounts = this.countsFor([...activeMembers, ...pending]);
    const roomNumber = this.chooseRoom(allocationCounts);
    const reservationId = crypto.randomUUID();
    const reservation = {
      reservationId,
      sessionId,
      circleId,
      roomNumber,
      channel: channelFor(circleId, roomNumber),
      uid: randomUid(),
      expiresAt: Date.now() + RESERVATION_TTL_MS,
    };
    await this.state.storage.put(`${RESERVATION_PREFIX}${reservationId}`, reservation);

    return {
      status: 200,
      payload: {
        circle_id: circleId,
        reservation_id: reservationId,
        room_number: roomNumber,
        channel: reservation.channel,
        uid: reservation.uid,
        occupancy: (allocationCounts.get(roomNumber) || 0) + 1,
      },
    };
  }

  async leave(body) {
    const sessionId = cleanOpaqueId(body.session_id);
    const reservationId = cleanOpaqueId(body.reservation_id);
    if (!sessionId || !reservationId) return { status: 400, payload: { error: "Invalid Circle reservation." } };

    const pendingKey = `${RESERVATION_PREFIX}${reservationId}`;
    const pending = await this.state.storage.get(pendingKey);
    if (pending?.sessionId === sessionId) await this.state.storage.delete(pendingKey);

    this.state.getWebSockets().forEach((socket) => {
      let attachment = null;
      try {
        attachment = socket.deserializeAttachment();
      } catch {
        return;
      }
      if (attachment?.sessionId === sessionId && attachment?.reservationId === reservationId) {
        socket.close(1000, "left-circle");
      }
    });
    return { status: 200, payload: { left: true } };
  }

  async connectPresence(request) {
    const url = new URL(request.url);
    const circleId = cleanCircleId(url.searchParams.get("circle_id"));
    const sessionId = cleanOpaqueId(url.searchParams.get("session_id"));
    const reservationId = cleanOpaqueId(url.searchParams.get("reservation_id"));
    if (!circleId || !sessionId || !reservationId) return new Response("Invalid reservation.", { status: 400 });

    const pendingKey = `${RESERVATION_PREFIX}${reservationId}`;
    const reservation = await this.state.storage.get(pendingKey);
    if (!reservation || reservation.sessionId !== sessionId || reservation.circleId !== circleId) {
      return new Response("Reservation expired.", { status: 410 });
    }
    const duplicate = this.activeMembers().some((member) => member.sessionId === sessionId);
    if (duplicate) return new Response("Session is already connected.", { status: 409 });

    await this.state.storage.delete(pendingKey);
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.serializeAttachment({
      reservationId,
      sessionId,
      circleId,
      roomNumber: reservation.roomNumber,
      channel: reservation.channel,
      uid: reservation.uid,
    });
    this.state.acceptWebSocket(server);
    await this.broadcastStatus();
    return new Response(null, { status: 101, webSocket: client });
  }

  async broadcastStatus(excludeSocket = null) {
    const circle = await this.summary(excludeSocket);
    const message = JSON.stringify({ type: "circle_status", circle });
    this.state.getWebSockets().forEach((socket) => {
      if (socket === excludeSocket) return;
      try {
        socket.send(message);
      } catch {
        // A later close event removes a disconnected socket from the live count.
      }
    });
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname.endsWith("/status") && request.method === "GET") {
      return Response.json(await this.summary());
    }
    if (url.pathname.endsWith("/join") && request.method === "POST") {
      const result = await this.join(await readBody(request));
      return Response.json(result.payload, { status: result.status });
    }
    if (url.pathname.endsWith("/leave") && request.method === "POST") {
      const result = await this.leave(await readBody(request));
      await this.broadcastStatus();
      return Response.json(result.payload, { status: result.status });
    }
    if (url.pathname.endsWith("/presence") && request.headers.get("Upgrade")?.toLowerCase() === "websocket") {
      return this.connectPresence(request);
    }
    return Response.json({ error: "Not found." }, { status: 404 });
  }

  async webSocketMessage(socket) {
    const circle = await this.summary();
    try {
      socket.send(JSON.stringify({ type: "circle_status", circle }));
    } catch {
      // The close handler is authoritative for presence cleanup.
    }
  }

  async webSocketClose(socket, code, reason) {
    try {
      socket.close(code, reason);
    } catch {
      // Cloudflare may already have completed the close handshake.
    }
    await this.broadcastStatus(socket);
  }

  async webSocketError(socket) {
    try {
      socket.close(1011, "presence-error");
    } catch {
      // The socket may already be closed.
    }
    await this.broadcastStatus(socket);
  }
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      if (!originAllowed(request)) return jsonResponse(request, 403, { error: "Origin is not allowed." });
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }
    if (!originAllowed(request)) return jsonResponse(request, 403, { error: "Origin is not allowed." });

    const url = new URL(request.url);
    if (url.pathname === "/audio-rooms") return handleCatalogue(request, env);
    if (url.pathname === "/audio-rooms/join") return handleJoin(request, env);
    if (url.pathname === "/audio-rooms/leave") return handleLeave(request, env);
    if (url.pathname === "/audio-rooms/presence") return handlePresence(request, env);
    if (url.pathname === "/agora-audio-token") {
      return jsonResponse(request, 410, { error: "Use /audio-rooms/join to enter a Circle." });
    }
    return jsonResponse(request, 404, { error: "Not found." });
  },
};
