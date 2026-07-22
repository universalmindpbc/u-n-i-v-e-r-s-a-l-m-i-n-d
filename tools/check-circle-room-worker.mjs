const endpoint = String(process.argv[2] || "").replace(/\/+$/, "");
if (!endpoint) throw new Error("Usage: node tools/check-circle-room-worker.mjs <worker-endpoint>");

async function request(path, options = {}) {
  const response = await fetch(`${endpoint}${path}`, {
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    ...options,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${path} returned ${response.status}: ${payload.error || "unknown error"}`);
  return payload;
}

const catalogue = await request("/audio-rooms");
const expectedIds = [
  "img",
  "wme",
  "north-bondi-rsl",
  "nagnata",
  "aime",
  "black-rainbow",
  "headspace",
  "phoenix",
];
const receivedIds = (catalogue.circles || []).map((circle) => circle.id);
if (catalogue.capacity !== 9) throw new Error(`Expected capacity 9, received ${catalogue.capacity}`);
if (JSON.stringify(receivedIds) !== JSON.stringify(expectedIds)) {
  throw new Error(`Unexpected Circle catalogue: ${receivedIds.join(", ")}`);
}

const presenceSessionId = `circle-presence-${Date.now()}`;
const presenceAssignment = await request("/audio-rooms/join", {
  method: "POST",
  body: JSON.stringify({ circle_id: "img", session_id: presenceSessionId }),
});
const presenceUrl = new URL(presenceAssignment.presence_url);
presenceUrl.protocol = presenceUrl.protocol === "https:" ? "wss:" : "ws:";
presenceUrl.searchParams.set("circle_id", presenceAssignment.circle_id);
presenceUrl.searchParams.set("session_id", presenceSessionId);
presenceUrl.searchParams.set("reservation_id", presenceAssignment.reservation_id);
const presenceSummary = await new Promise((resolve, reject) => {
  const socket = new WebSocket(presenceUrl);
  const timer = setTimeout(() => {
    socket.close();
    reject(new Error("Presence WebSocket did not publish a live count."));
  }, 5000);
  socket.addEventListener("message", (event) => {
    clearTimeout(timer);
    const message = JSON.parse(event.data);
    socket.close(1000, "check-complete");
    resolve(message.circle);
  }, { once: true });
  socket.addEventListener("error", () => {
    clearTimeout(timer);
    reject(new Error("Presence WebSocket failed."));
  }, { once: true });
});
if (presenceSummary.id !== "img" || presenceSummary.live_count !== 1 || presenceSummary.rooms[0]?.count !== 1) {
  throw new Error("Presence WebSocket did not report the connected member.");
}
await request("/audio-rooms/leave", {
  method: "POST",
  body: JSON.stringify({
    circle_id: presenceAssignment.circle_id,
    session_id: presenceSessionId,
    reservation_id: presenceAssignment.reservation_id,
  }),
});

const reservationRunId = Date.now();
const reservations = await Promise.all(Array.from({ length: 10 }, async (_, index) => {
  const sessionId = `circle-check-${reservationRunId}-${index}`;
  const assignment = await request("/audio-rooms/join", {
    method: "POST",
    body: JSON.stringify({ circle_id: "wme", session_id: sessionId }),
  });
  return { ...assignment, sessionId };
}));

reservations.forEach((assignment, index) => {
  if (!String(assignment.token || "").startsWith("007")) throw new Error(`Reservation ${index + 1} is missing an Agora token.`);
});
const roomOne = reservations.filter((assignment) => assignment.room_number === 1);
const roomTwo = reservations.filter((assignment) => assignment.room_number === 2);
const roomOneOccupancies = roomOne.map((assignment) => assignment.occupancy).sort((left, right) => left - right);
if (roomOne.length !== 9 || JSON.stringify(roomOneOccupancies) !== JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
  throw new Error("Concurrent seat allocation did not fill room one to exactly nine people.");
}
if (roomTwo.length !== 1 || roomTwo[0].occupancy !== 1) {
  throw new Error("The tenth person was not assigned to a new nine-seat room.");
}

await Promise.all(reservations.map((assignment) => request("/audio-rooms/leave", {
  method: "POST",
  body: JSON.stringify({
    circle_id: assignment.circle_id,
    session_id: assignment.sessionId,
    reservation_id: assignment.reservation_id,
  }),
})));

console.log("Circle Worker check passed: 8 communities, live presence, 9-seat cap, tenth person assigned to room 2, secure tokens returned.");
