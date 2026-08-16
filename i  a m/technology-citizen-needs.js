const radarFrame = document.querySelector(".radar-frame");
const radar = document.querySelector("[data-radar]");
const sectorsLayer = document.querySelector("[data-radar-sectors]");
const gridLayer = document.querySelector("[data-radar-grid]");
const networkLayer = document.querySelector("[data-engine-network]");
const traceLayer = document.querySelector("[data-trace-layer]");
const needCardLeaderLayer = document.querySelector("[data-need-card-leader-layer]");
const domainHeaderLayer = document.querySelector("[data-domain-header-layer]");
const needLabelLayer = document.querySelector("[data-need-label-layer]");
const needCard = document.querySelector("[data-need-card]");
const cube = document.querySelector("[data-cube]");
const specialistCard = document.querySelector("[data-specialist-card]");
const specialistHorizons = document.querySelectorAll(".specialist-card__horizon");
const tensorOverlay = document.querySelector("[data-tensor-overlay]");
const tensorOpenButtons = document.querySelectorAll("[data-tensor-open]");
const tensorCloseButtons = document.querySelectorAll("[data-tensor-close]");
const tensorLayerTargets = document.querySelectorAll("[data-kernel-layer]");
const searchParams = new URLSearchParams(window.location.search);
const isEmbeddedDocument = window.self !== window.top;
const isHomepageRadarFrame = isEmbeddedDocument && searchParams.get("homepageRadar") === "1";
const isAdaptiveFrame = isEmbeddedDocument && (searchParams.get("adaptiveFrame") === "1" || searchParams.get("musicTelevisionFrame") === "1");
const shouldAutoOpenTensorKernel = searchParams.get("tensor") === "open";
const autoTensorKernelLayer = searchParams.get("kernelLayer") || searchParams.get("kernel");
const checkinValue = document.querySelector("[data-checkin-value]");
const checkinUpdated = document.querySelector("[data-checkin-updated]");
const checkinHeartRate = document.querySelector("[data-checkin-heart-rate]");
const checkinHeartRateValue = document.querySelector("[data-checkin-heart-rate-value]");
const currentHeartRateStorageKey = "iamCurrentCheckinHeartRateV1";
const globalNav = document.querySelector("[data-global-nav]");
const navOpenButtons = document.querySelectorAll("[data-nav-open]");
const navCloseButtons = document.querySelectorAll("[data-nav-close]");
const navItems = document.querySelectorAll("[data-nav-item]");
const navSubmenus = new Map(Array.from(document.querySelectorAll("[data-nav-submenu]"))
  .map((submenu) => [submenu.dataset.navSubmenu, submenu]));
const currentNavItem = document.body.dataset.currentNav || "technology";

if (!isEmbeddedDocument && window.location.search) {
  window.history.replaceState(window.history.state, "", window.location.pathname);
}

if (isHomepageRadarFrame) {
  document.documentElement.classList.add("is-homepage-radar-frame");
  document.body.classList.add("is-homepage-radar-frame");
}

if (isAdaptiveFrame) {
  document.documentElement.classList.add("is-adaptive-frame");
  document.body.classList.add("is-adaptive-frame");
}

const svgNamespace = "http://www.w3.org/2000/svg";
const innerRadius = 226;
const outerRadius = 510;
const labelBorderPadding = 8;
const layoutModeParam = searchParams.get("layout");
let layoutMode = layoutModeParam
  ? layoutModeParam === "1"
  : window.localStorage.getItem("citizenNeedsLayoutMode") === "1";
let layoutPanel;
let layoutOutput;
let layoutAudit;
let draggedLabel = null;
let activeNeedLabel = null;
let pinnedNeedCard = false;
let pinnedSpecialist = false;
let specialistHideTimer = null;
let inferenceVectorLayer = null;
let activeCheckinUpdatedValue = "";
let tensorKernelTrigger = null;
let tensorLayerClearTimer = null;
let tensorHoverLocked = false;
let tensorHoverUnlockTimer = null;
let homepageRadarInteractionsReady = !isHomepageRadarFrame;

function setActiveNavItem(itemName) {
  navItems.forEach((item) => {
    const isActive = item.dataset.navItem === itemName;
    item.classList.toggle("is-active", isActive);

    if (navSubmenus.has(item.dataset.navItem)) {
      item.setAttribute("aria-expanded", String(isActive));
    }
  });

  navSubmenus.forEach((submenu, name) => {
    submenu.classList.toggle("is-open", itemName === name && !submenu.hasAttribute("data-mobile-editorial-hidden"));
  });
}

function openGlobalNav(itemName = currentNavItem) {
  if (!globalNav) return;

  closeTensorKernel(false);
  setActiveNavItem(itemName);
  document.body.classList.add("nav-open");
  globalNav.classList.add("is-open");
  globalNav.setAttribute("aria-hidden", "false");
}

function closeGlobalNav() {
  if (!globalNav) return;

  document.body.classList.remove("nav-open");
  globalNav.classList.remove("is-open");
  globalNav.setAttribute("aria-hidden", "true");
}

function storedCheckinField(keys) {
  const stores = [window.sessionStorage, window.localStorage];

  for (const store of stores) {
    for (const key of keys) {
      try {
        const value = store?.getItem(key);
        if (value) return value;
      } catch (error) {
        continue;
      }
    }
  }

  return "";
}

function storedJsonField(keys) {
  const value = storedCheckinField(keys);
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function currentHeartRateRecord() {
  let record = null;
  try {
    const serialized = window.sessionStorage?.getItem(currentHeartRateStorageKey);
    record = serialized ? JSON.parse(serialized) : null;
  } catch {
    return null;
  }

  const heartRate = Math.round(Number(record?.heart_rate_bpm));
  const measuredAt = Number(record?.measured_at);
  const isValid = record?.schema_version === "iam_current_checkin_heart_rate_v1"
    && Number.isFinite(heartRate)
    && heartRate >= 30
    && heartRate <= 240
    && Number.isFinite(measuredAt)
    && measuredAt > 0
    && record?.measurement_duration_seconds === 10
    && record?.source === "shen_quick_hr"
    && record?.scope === "current_tab_session";

  return isValid ? { heartRate, measuredAt } : null;
}

function checkinFragment(value) {
  const cleaned = value?.trim().replace(/^i\s+am(?:\s+|$)/i, "") || "";
  return cleaned || "";
}

function relativeUpdatedLabel(date) {
  const diffSeconds = Math.round((Date.now() - date.getTime()) / 1000);
  const absoluteSeconds = Math.abs(diffSeconds);

  if (absoluteSeconds < 45) return "just now";

  const units = [
    { name: "year", seconds: 31536000 },
    { name: "month", seconds: 2592000 },
    { name: "day", seconds: 86400 },
    { name: "hour", seconds: 3600 },
    { name: "minute", seconds: 60 },
  ];
  const unit = units.find((item) => absoluteSeconds >= item.seconds) || units[units.length - 1];
  const amount = Math.max(1, Math.round(absoluteSeconds / unit.seconds));
  const label = `${amount} ${unit.name}${amount === 1 ? "" : "s"}`;

  return diffSeconds >= 0 ? `${label} ago` : `in ${label}`;
}

function updatedFragment(value) {
  const cleaned = value?.trim() || "";
  if (!cleaned) return "";

  const numericValue = Number(cleaned);
  const timestamp = Number.isFinite(numericValue)
    ? numericValue < 10000000000 ? numericValue * 1000 : numericValue
    : null;
  const date = timestamp ? new Date(timestamp) : new Date(cleaned);

  return Number.isNaN(date.getTime()) ? cleaned : relativeUpdatedLabel(date);
}

function refreshCheckinUpdated() {
  if (!activeCheckinUpdatedValue || !checkinUpdated) return;

  const nextUpdated = updatedFragment(activeCheckinUpdatedValue);
  if (nextUpdated) checkinUpdated.textContent = nextUpdated;
}

function highlightListFromValue(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  return value
    .split(/[|,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function latestInferenceRecord() {
  const storedInference = storedJsonField([
    "iamLatestInference",
    "citizenNeedsLatestInference",
  ]) || {};
  const queryHighlights = highlightListFromValue(searchParams.get("highlights"));
  const storedHighlights = highlightListFromValue(storedInference.highlights);
  const homepageFallbackHighlights = isHomepageRadarFrame
    ? ["Anxiety", "Connection", "Clarity", "Recovery"]
    : [];

  return {
    ...storedInference,
    checkin: searchParams.get("checkin") || searchParams.get("iam") || storedInference.checkin || "",
    updatedAt: searchParams.get("updated") || searchParams.get("updatedAt") || storedInference.updatedAt || "",
    highlights: queryHighlights.length ? queryHighlights : storedHighlights.length ? storedHighlights : homepageFallbackHighlights,
  };
}

function initCheckinStatus() {
  const inference = latestInferenceRecord();
  const incomingCheckin = searchParams.get("checkin") ||
    searchParams.get("iam") ||
    inference.checkin ||
    storedCheckinField([
      "iamLatestCheckinValue",
      "iamLatestCheckin",
      "citizenNeedsLatestCheckinValue",
      "citizenNeedsLatestCheckin",
    ]);
  const incomingUpdated = searchParams.get("updated") ||
    searchParams.get("updatedAt") ||
    String(inference.updatedAt || "") ||
    storedCheckinField([
      "iamLatestCheckinUpdated",
      "iamLatestCheckinUpdatedAt",
      "citizenNeedsLatestCheckinUpdated",
      "citizenNeedsLatestCheckinUpdatedAt",
    ]);
  const nextCheckin = checkinFragment(incomingCheckin) || (isHomepageRadarFrame ? "strong" : "");
  const nextUpdated = incomingUpdated || (isHomepageRadarFrame ? String(Date.now()) : "");
  const heartRateRecord = currentHeartRateRecord();

  if (nextCheckin && checkinValue) checkinValue.textContent = nextCheckin;
  if (heartRateRecord && checkinHeartRate && checkinHeartRateValue) {
    checkinHeartRateValue.textContent = String(heartRateRecord.heartRate);
    checkinHeartRate.hidden = false;
  }
  if (nextUpdated) {
    activeCheckinUpdatedValue = nextUpdated;
    refreshCheckinUpdated();
    window.setInterval(refreshCheckinUpdated, 30000);
  }

  return inference;
}

const geneTargetsByDomain = {
  Social: ["OXTR", "CD38"],
  Cognitive: ["DRD2", "NMDAR"],
  Emotional: ["SLC6A4"],
  Physiological: ["NR3C1"],
  "Clinical Risk": ["IL6", "DOCK2"],
  Threat: ["DRD2", "NR3C1", "IL6"],
};

function candidateTargetsForDomain(domainName) {
  const targets = geneTargetsByDomain[domainName] || [];
  return targets.map((target) => `${target} (TFBS)`);
}

function createNeedDetail(domainName, title, detail) {
  return {
    eyebrow: `${domainName} / Need State`,
    title: title.toUpperCase(),
    summary: detail.summary,
    roleTitle: "Current role",
    roles: detail.roles,
    researchHypothesis: {
      title: "Research Hypothesis",
      targetLabel: "Candidate Target:",
      candidateTargets: candidateTargetsForDomain(domainName),
    },
    notes: [
      {
        title: "Current MVP",
        body: "GPT analyses voluntary, opt in language and conversation to estimate the current relevance of this need.",
      },
      {
        title: "Research Roadmap",
        body: "Future versions investigate whether opt in, privacy first, multimodal physiological and optical signals improve inference of citizen needs.",
      },
    ],
  };
}

const needDetails = {
  Joy: {
    summary: "A positive emotional state associated with reward, openness and increased social availability.",
    roles: [
      "Positive affect",
      "Social openness",
      "Motivational lift",
    ],
  },
  Hope: {
    summary: "A future-oriented emotional state associated with optimism, agency and resilience.",
    roles: [
      "Emotional regulation",
      "Motivation",
      "Recovery potential",
    ],
  },
  Calm: {
    summary: "A regulated emotional state associated with steadiness, reduced reactivity and accessible self-control.",
    roles: [
      "Emotional regulation",
      "Safety signalling",
      "Recovery potential",
    ],
  },
  Curiosity: {
    summary: "An exploratory emotional state associated with openness, attention and readiness to learn.",
    roles: [
      "Exploratory attention",
      "Learning readiness",
      "Cognitive engagement",
    ],
  },
  Gratitude: {
    summary: "A prosocial emotional state associated with appreciation, perspective and relational warmth.",
    roles: [
      "Perspective broadening",
      "Social bonding",
      "Emotional regulation",
    ],
  },
  Love: {
    summary: "A relational emotional state associated with attachment, care and felt connection.",
    roles: [
      "Attachment signalling",
      "Social safety",
      "Care orientation",
    ],
  },
  Awe: {
    summary: "An expansive emotional state associated with wonder, perspective shift and reduced self-focus.",
    roles: [
      "Perspective shift",
      "Meaning expansion",
      "Attention broadening",
    ],
  },
  Purpose: {
    summary: "A meaning-oriented state associated with direction, values and sustained motivation.",
    roles: [
      "Meaning alignment",
      "Motivational continuity",
      "Future orientation",
    ],
  },
  "Self-actualisation": {
    summary: "A high-order growth state associated with agency, fulfilment and coherent self-expression.",
    roles: [
      "Personal growth",
      "Agency",
      "Identity coherence",
    ],
  },
  Trust: {
    summary: "A social confidence state associated with reliability, reduced defensive monitoring and openness to support.",
    roles: [
      "Safety signalling",
      "Relationship confidence",
      "Support access",
    ],
  },
  Belonging: {
    summary: "A social inclusion state associated with group fit, acceptance and reduced isolation pressure.",
    roles: [
      "Social inclusion",
      "Community attachment",
      "Isolation buffering",
    ],
  },
  Connection: {
    summary: "A social state associated with felt contact, mutual recognition and reduced isolation.",
    roles: [
      "Belonging",
      "Trust formation",
      "Support access",
    ],
  },
  Empathy: {
    summary: "A relational understanding state associated with perspective-taking, attunement and prosocial response.",
    roles: [
      "Perspective-taking",
      "Social attunement",
      "Care response",
    ],
  },
  "Psychological Safety": {
    summary: "A social safety state associated with permission to speak, participate and be seen without undue threat.",
    roles: [
      "Expression safety",
      "Trust formation",
      "Participation readiness",
    ],
  },
  "Self Transcendence": {
    summary: "A social and meaning state associated with service, connection beyond self and collective orientation.",
    roles: [
      "Collective orientation",
      "Meaning expansion",
      "Prosocial motivation",
    ],
  },
  Attention: {
    summary: "A cognitive allocation state associated with focus, signal selection and sustained engagement.",
    roles: [
      "Focus allocation",
      "Signal selection",
      "Task engagement",
    ],
  },
  "Mental Load": {
    summary: "A cognitive demand state where attention, working memory and decision-making capacity may be under strain.",
    roles: [
      "Working memory demand",
      "Decision pressure",
      "Capacity management",
    ],
  },
  Shame: {
    summary: "A self-conscious threat state associated with perceived exposure, social pain and withdrawal pressure.",
    roles: [
      "Social threat sensitivity",
      "Self-protection",
      "Support timing",
    ],
  },
  Rumination: {
    summary: "Repeated internally focused thinking that may reduce cognitive flexibility.",
    roles: [
      "Cognitive load",
      "Attention capture",
      "Flexibility constraint",
    ],
  },
  Motivation: {
    summary: "A goal-directed cognitive state associated with initiation, persistence and perceived value.",
    roles: [
      "Action initiation",
      "Goal persistence",
      "Value orientation",
    ],
  },
  "Executive Function": {
    summary: "A cognitive control state associated with planning, inhibition, switching and organised action.",
    roles: [
      "Planning",
      "Cognitive switching",
      "Behavioural organisation",
    ],
  },
  Clarity: {
    summary: "A cognitive state associated with reduced ambiguity, coherent attention and easier decision-making.",
    roles: [
      "Decision support",
      "Reduced ambiguity",
      "Cognitive coherence",
    ],
  },
  Arousal: {
    summary: "A physiological activation state associated with alertness, energy mobilisation and readiness to respond.",
    roles: [
      "Activation level",
      "Readiness",
      "Signal intensity",
    ],
  },
  Recovery: {
    summary: "A physiological restoration state associated with repair, downshift and renewed adaptive capacity.",
    roles: [
      "Restoration",
      "Down-regulation",
      "Capacity renewal",
    ],
  },
  "Sleep Pressure": {
    summary: "A physiological sleep-need state associated with accumulated fatigue and reduced recovery reserve.",
    roles: [
      "Rest requirement",
      "Recovery priority",
      "Energy regulation",
    ],
  },
  Stress: {
    summary: "A physiological demand state associated with mobilisation, strain and adaptive load.",
    roles: [
      "Demand response",
      "Load signalling",
      "Regulation pressure",
    ],
  },
  Hypervigilance: {
    summary: "A heightened monitoring state in which attention may bias toward potential threat or uncertainty.",
    roles: [
      "Safety scanning",
      "Threat detection",
      "Arousal regulation",
    ],
  },
  Avoidance: {
    summary: "A protective withdrawal pattern associated with reducing contact with perceived threat or overload.",
    roles: [
      "Threat reduction",
      "Exposure management",
      "Support timing",
    ],
  },
  Intrusions: {
    summary: "A disruptive recall state associated with unwanted mental content entering attention.",
    roles: [
      "Attention disruption",
      "Memory salience",
      "Safety monitoring",
    ],
  },
  "Emotional Numbing": {
    summary: "A reduced-feeling state associated with dampened emotional access and protective distance.",
    roles: [
      "Protective dampening",
      "Affect access",
      "Engagement readiness",
    ],
  },
  "Sleep Disturbance": {
    summary: "A rest-disruption state associated with fragmented sleep, reduced restoration and altered daytime capacity.",
    roles: [
      "Recovery disruption",
      "Energy regulation",
      "Daytime capacity",
    ],
  },
  "Startle Sensitivity": {
    summary: "A heightened reactivity state associated with rapid response to unexpected sensory or social cues.",
    roles: [
      "Reactivity",
      "Threat detection",
      "Arousal regulation",
    ],
  },
  Fear: {
    summary: "An immediate threat state associated with danger detection, protective action and narrowed attention.",
    roles: [
      "Danger detection",
      "Protective action",
      "Attention narrowing",
    ],
  },
  Fatigue: {
    summary: "A physiological depletion state associated with reduced energy, recovery need and lower adaptive capacity.",
    roles: [
      "Energy conservation",
      "Recovery prioritisation",
      "Signal moderation",
    ],
  },
  Anger: {
    summary: "A threat and boundary state associated with blocked goals, perceived injustice or protective mobilisation.",
    roles: [
      "Boundary signalling",
      "Protective mobilisation",
      "Action readiness",
    ],
  },
  Anxiety: {
    summary: "A future-oriented threat state associated with uncertainty, vigilance and anticipatory arousal.",
    roles: [
      "Threat anticipation",
      "Attention narrowing",
      "Safety seeking",
    ],
  },
  Loneliness: {
    summary: "A social pain state associated with perceived disconnection, unmet belonging and reduced felt support.",
    roles: [
      "Connection need",
      "Belonging signal",
      "Support access",
    ],
  },
};

const domains = [
  {
    name: "Emotional",
    start: -30,
    end: 30,
    color: "#ffd92e",
    header: { start: -24, end: 24, radius: 532 },
    labels: [
      { text: "Joy", angle: -24, radius: 430, dx: 0, dy: 2 },
      { text: "Calm", angle: -12, radius: 444, dx: 0, dy: 0 },
      { text: "Hope", angle: 0, radius: 456, dx: 0, dy: 0 },
      { text: "Curiosity", angle: 12, radius: 444, dx: 0, dy: 0 },
      { text: "Gratitude", angle: 18, radius: 398, dx: 0, dy: 2 },
      { text: "Love", angle: -18, radius: 370, dx: -2, dy: 0 },
      { text: "Awe", angle: 0, radius: 358, dx: 0, dy: 0 },
      { text: "Purpose", angle: 16, radius: 346, dx: -6, dy: 24 },
      { text: "Self-actualisation", angle: 0, radius: 274, dx: 0, dy: 10 },
    ],
  },
  {
    name: "Social",
    start: 30,
    end: 90,
    color: "#3df38b",
    header: { start: 42, end: 78, radius: 532 },
    labels: [
      { text: "Trust", angle: 42, radius: 450, dx: -8, dy: -2 },
      { text: "Belonging", angle: 54, radius: 456, dx: -10, dy: 2 },
      { text: "Connection", angle: 66, radius: 450, dx: -20, dy: 2 },
      { text: "Empathy", angle: 78, radius: 424, dx: -4, dy: -4 },
      { text: ["Psychological", "Safety"], angle: 84, radius: 390, dx: -26, dy: -2 },
      { text: ["Self", "Transcendence"], angle: 48, radius: 336, dx: -24, dy: 10 },
    ],
  },
  {
    name: "Cognitive",
    start: 90,
    end: 150,
    color: "#2b93ff",
    header: { start: 140, end: 100, radius: 552 },
    labels: [
      { text: "Attention", angle: 98, radius: 430, dx: -12, dy: 2 },
      { text: "Mental Load", angle: 110, radius: 438, dx: -12, dy: 2 },
      { text: "Rumination", angle: 122, radius: 432, dx: -10, dy: 0 },
      { text: "Motivation", angle: 131, radius: 437, dx: 0, dy: 0 },
      { text: ["Executive", "Function"], angle: 144, radius: 422, dx: 35, dy: 0 },
      { text: "Clarity", angle: 124, radius: 336, dx: -6, dy: 4 },
    ],
  },
  {
    name: "Physiological",
    start: 150,
    end: 210,
    color: "#c02cff",
    header: { start: 204, end: 156, radius: 556 },
    labels: [
      { text: "Arousal", angle: 160, radius: 370, dx: 0, dy: 0 },
      { text: "Recovery", angle: 175, radius: 395, dx: 0, dy: 0 },
      { text: "Sleep Pressure", angle: 195, radius: 400, dx: 0, dy: 0 },
      { text: "Stress", angle: 186, radius: 430, dx: 0, dy: 0 },
      { text: "Fatigue", angle: 180, radius: 462, dx: 0, dy: 0 },
    ],
  },
  {
    name: "Clinical Risk",
    start: 210,
    end: 270,
    color: "#ff8a00",
    header: { start: 260, end: 220, radius: 552 },
    labels: [
      { text: "Hypervigilance", angle: 263, radius: 420, dx: 0, dy: 0 },
      { text: "Avoidance", angle: 257, radius: 420, dx: 0, dy: 0 },
      { text: "Intrusions", angle: 246, radius: 405, dx: 0, dy: 0 },
      { text: ["Emotional", "Numbing"], angle: 239, radius: 405, dx: 0, dy: 0 },
      { text: ["Sleep", "Disturbance"], angle: 230, radius: 420, dx: 0, dy: 0 },
      { text: ["Startle", "Sensitivity"], angle: 221, radius: 420, dx: -10, dy: 12 },
    ],
  },
  {
    name: "Threat",
    start: 270,
    end: 330,
    color: "#ff3b30",
    header: { start: 282, end: 318, radius: 532 },
    labels: [
      { text: "Fear", angle: 282, radius: 416, dx: 10, dy: 6 },
      { text: "Anxiety", angle: 295, radius: 426, dx: 6, dy: 2 },
      { text: "Anger", angle: 304, radius: 420, dx: 0, dy: 0 },
      { text: "Shame", angle: 315, radius: 390, dx: -8, dy: 0 },
      { text: "Loneliness", angle: 323, radius: 400, dx: -30, dy: -4 },
    ],
  },
];

domains.forEach((domain) => {
  domain.labels.forEach((item) => {
    const detail = needDetails[labelText(item)];
    if (detail) {
      item.detail = createNeedDetail(domain.name, labelText(item), detail);
    }
  });
});

// The signal path uses the clear channel around the inner well, dipping inward
// in dense label sectors. Active labels remain the visual priority.
const tracePoints = [
  [-58, 318],
  [-42, 310],
  [-28, 235],
  [-10, 228],
  [10, 228],
  [30, 205],
  [48, 205],
  [66, 214],
  [84, 238],
  [102, 248],
  [122, 250],
  [142, 262],
  [162, 276],
  [182, 290],
  [202, 292],
  [224, 286],
  [246, 276],
  [268, 268],
  [290, 292],
  [312, 312],
  [330, 304],
];

function makeElement(name, attributes = {}) {
  const element = document.createElementNS(svgNamespace, name);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  return element;
}

function polar(angle, radius) {
  const radians = (angle - 90) * Math.PI / 180;
  return {
    x: Math.cos(radians) * radius,
    y: Math.sin(radians) * radius,
  };
}

function labelText(item) {
  return Array.isArray(item.text) ? item.text.join(" ") : item.text;
}

function labelPoint(item) {
  const point = polar(item.angle, item.radius);
  return {
    x: point.x + (item.dx || 0),
    y: point.y + (item.dy || 0),
  };
}

function highlightedLabelElement(match) {
  return Array.from(needLabelLayer.querySelectorAll(".need-label"))
    .find((item) => item.dataset.domain === match.domain.name && Number(item.dataset.labelIndex) === match.labelIndex);
}

function labelProtectionBox(label) {
  if (!label) return null;

  try {
    const box = label.getBBox();
    const paddingX = 16;
    const paddingY = 10;
    return {
      x: box.x - paddingX,
      y: box.y - paddingY,
      width: box.width + paddingX * 2,
      height: box.height + paddingY * 2,
    };
  } catch {
    return null;
  }
}

function segmentBoxEntryPoint(start, end, box) {
  if (!box) return null;

  const delta = {
    x: end.x - start.x,
    y: end.y - start.y,
  };
  let entry = 0;
  let exit = 1;

  const axes = [
    ["x", box.x, box.x + box.width],
    ["y", box.y, box.y + box.height],
  ];

  for (const [axis, min, max] of axes) {
    const startValue = start[axis];
    const deltaValue = delta[axis];

    if (Math.abs(deltaValue) < 0.0001) {
      if (startValue < min || startValue > max) return null;
      continue;
    }

    const first = (min - startValue) / deltaValue;
    const second = (max - startValue) / deltaValue;
    entry = Math.max(entry, Math.min(first, second));
    exit = Math.min(exit, Math.max(first, second));
    if (entry > exit) return null;
  }

  if (exit < 0 || entry > 1) return null;

  const t = clamp(entry, 0, 1);
  return {
    x: start.x + delta.x * t,
    y: start.y + delta.y * t,
  };
}

function vectorEndBeforeLabel(start, target, label) {
  const radius = Math.max(1, Math.hypot(target.x, target.y));
  const unit = {
    x: target.x / radius,
    y: target.y / radius,
  };
  const fallback = {
    x: target.x - unit.x * 34,
    y: target.y - unit.y * 34,
  };
  const entry = segmentBoxEntryPoint(start, target, labelProtectionBox(label));

  if (!entry) return fallback;

  return {
    x: entry.x - unit.x * 12,
    y: entry.y - unit.y * 12,
  };
}

function normalizedNeedKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function canonicalNeedKey(value) {
  const key = normalizedNeedKey(value);
  const aliases = {
    clarify: "clarity",
    "self transcendence": "self transcendence",
    "self actualisation": "self actualisation",
    "self actualization": "self actualisation",
  };

  return aliases[key] || key;
}

function domainLabelMatches(labelName) {
  const targetKey = canonicalNeedKey(labelName);

  for (const domain of domains) {
    const labelIndex = domain.labels.findIndex((item) => canonicalNeedKey(labelText(item)) === targetKey);
    if (labelIndex !== -1) {
      return {
        domain,
        item: domain.labels[labelIndex],
        labelIndex,
        label: labelText(domain.labels[labelIndex]),
      };
    }
  }

  return null;
}

function validHighlightMatches(inference) {
  const seen = new Set();
  const highlights = highlightListFromValue(inference?.highlights);
  const matches = [];

  highlights.forEach((highlight) => {
    const match = domainLabelMatches(highlight);
    if (!match || seen.has(match.label)) return;
    seen.add(match.label);
    matches.push(match);
  });

  return matches.slice(0, 4);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function cardSideForLabel(item) {
  return labelPoint(item).x < -24 ? "left" : "right";
}

function cardPositionForLabel(item) {
  const point = labelPoint(item);
  const side = cardSideForLabel(item);
  const xPercent = side === "right" ? 128 : -28;
  const yPercent = clamp(((point.y + 540) / 1080) * 100, 22, 78);

  return {
    xPercent,
    yPercent,
    side,
    svgPoint: {
      x: (xPercent / 100) * 1080 - 540,
      y: (yPercent / 100) * 1080 - 540,
    },
  };
}

function fitNeedCardToViewport(match) {
  if (!needCard || !radarFrame || !match || !needCard.classList.contains("is-visible")) return;

  const viewportPadding = 18;
  const sideGap = 34;
  const anchor = labelPoint(match.item);
  const anchorScreen = screenPointFromSvg({ x: anchor.x, y: anchor.y - 15 });
  const cardBox = needCard.getBoundingClientRect();
  const frameBox = radarFrame.getBoundingClientRect();
  const side = cardSideForLabel(match.item);
  const cardHalfWidth = cardBox.width / 2;
  const cardHalfHeight = cardBox.height / 2;
  const minCenterX = viewportPadding + cardHalfWidth;
  const maxCenterX = window.innerWidth - viewportPadding - cardHalfWidth;
  const minCenterY = viewportPadding + cardHalfHeight;
  const maxCenterY = window.innerHeight - viewportPadding - cardHalfHeight;
  const idealCenterX = side === "right"
    ? frameBox.right + sideGap + cardHalfWidth
    : frameBox.left - sideGap - cardHalfWidth;
  const centerX = clamp(idealCenterX, minCenterX, maxCenterX);
  const centerY = clamp(anchorScreen.y, minCenterY, maxCenterY);

  const xPercent = ((centerX - frameBox.left) / frameBox.width) * 100;
  const yPercent = ((centerY - frameBox.top) / frameBox.height) * 100;
  needCard.style.setProperty("--card-x", `${xPercent}%`);
  needCard.style.setProperty("--card-y", `${yPercent}%`);
  needCard.dataset.side = side;
}

function updateLabelElement(label, item) {
  const point = labelPoint(item);
  label.setAttribute("x", point.x);
  label.setAttribute("y", point.y);
  label.querySelectorAll("tspan").forEach((tspan) => {
    tspan.setAttribute("x", point.x);
  });
}

function wedgePath(startAngle, endAngle, inner, outer) {
  const startOuter = polar(startAngle, outer);
  const endOuter = polar(endAngle, outer);
  const startInner = polar(startAngle, inner);
  const endInner = polar(endAngle, inner);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${startOuter.x.toFixed(2)} ${startOuter.y.toFixed(2)}`,
    `A ${outer} ${outer} 0 ${largeArc} 1 ${endOuter.x.toFixed(2)} ${endOuter.y.toFixed(2)}`,
    `L ${endInner.x.toFixed(2)} ${endInner.y.toFixed(2)}`,
    `A ${inner} ${inner} 0 ${largeArc} 0 ${startInner.x.toFixed(2)} ${startInner.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

function arcPath(startAngle, endAngle, radius) {
  const start = polar(startAngle, radius);
  const end = polar(endAngle, radius);
  const sweep = endAngle >= startAngle ? 1 : 0;
  const delta = Math.abs(endAngle - startAngle);
  const largeArc = delta > 180 ? 1 : 0;

  return [
    `M ${start.x.toFixed(2)} ${start.y.toFixed(2)}`,
    `A ${radius} ${radius} 0 ${largeArc} ${sweep} ${end.x.toFixed(2)} ${end.y.toFixed(2)}`,
  ].join(" ");
}

function pointString(points) {
  return points
    .map(([angle, radius]) => {
      const point = polar(angle, radius);
      return `${point.x.toFixed(2)},${point.y.toFixed(2)}`;
    })
    .join(" ");
}

function addGrid() {
  [286, 346, 406, 466, 510].forEach((radius) => {
    gridLayer.append(makeElement("circle", {
      class: "grid-ring",
      r: radius,
    }));
  });

  for (let angle = 0; angle < 360; angle += 10) {
    const start = polar(angle, innerRadius);
    const end = polar(angle, outerRadius);
    gridLayer.append(makeElement("line", {
      class: "grid-line grid-line-minor",
      x1: start.x,
      y1: start.y,
      x2: end.x,
      y2: end.y,
    }));
  }

  domains.forEach((domain) => {
    [domain.start, domain.end].forEach((angle) => {
      const start = polar(angle, innerRadius);
      const end = polar(angle, outerRadius);
      gridLayer.append(makeElement("line", {
        class: "grid-line grid-line-major",
        x1: start.x,
        y1: start.y,
        x2: end.x,
        y2: end.y,
      }));
    });
  });
}

function addSectors() {
  const defs = radar.querySelector("defs");

  domains.forEach((domain) => {
    const headerPathId = `header-${domain.name.replace(/\s+/g, "-").toLowerCase()}`;
    defs.append(makeElement("path", {
      id: headerPathId,
      d: arcPath(domain.header.start, domain.header.end, domain.header.radius),
    }));

    const clipPath = makeElement("clipPath", {
      id: `clip-${domain.name.replace(/\s+/g, "-").toLowerCase()}`,
    });
    clipPath.append(makeElement("path", {
      d: wedgePath(domain.start + 2, domain.end - 2, innerRadius + 16, outerRadius - 18),
    }));
    defs.append(clipPath);

    const group = makeElement("g", {
      class: "sector",
      "data-domain": domain.name,
    });

    const fill = makeElement("path", {
      class: "sector-fill",
      d: wedgePath(domain.start, domain.end, innerRadius, outerRadius),
      fill: domain.color,
    });

    const hit = makeElement("path", {
      class: "sector-hit",
      d: wedgePath(domain.start, domain.end, innerRadius, outerRadius),
      "data-domain": domain.name,
    });

    group.append(fill, hit);
    sectorsLayer.append(group);

    const header = makeElement("text", {
      class: "domain-arc-label",
      "data-domain-header": domain.name,
      fill: domain.color,
    });
    const textPath = makeElement("textPath", {
      href: `#${headerPathId}`,
      startOffset: "50%",
      "text-anchor": "middle",
    });
    textPath.textContent = domain.name;
    header.append(textPath);
    domainHeaderLayer.append(header);

    const labelSet = makeElement("g", {
      class: "label-set",
      "data-domain": domain.name,
    });

    domain.labels.forEach((item, labelIndex) => {
      const point = labelPoint(item);
      const labelAttributes = {
        class: "need-label",
        "data-need-label": labelText(item),
        "data-domain": domain.name,
        "data-label-index": labelIndex,
        x: point.x,
        y: point.y,
      };

      if (item.detail) {
        labelAttributes["data-has-detail"] = "true";
        labelAttributes.tabindex = "0";
        labelAttributes.role = "button";
        labelAttributes["aria-label"] = `Show ${labelText(item)} detail`;
      }

      const need = makeElement("text", labelAttributes);

      const lines = Array.isArray(item.text) ? item.text : [item.text];
      lines.forEach((line, index) => {
        const tspan = makeElement("tspan", {
          x: point.x,
          dy: index === 0 ? 0 : 18,
        });
        tspan.textContent = line;
        need.append(tspan);
      });

      labelSet.append(need);
    });

    needLabelLayer.append(labelSet);
  });
}

function addTrace() {
  traceLayer.append(makeElement("polyline", {
    class: "trace-line",
    points: pointString(tracePoints),
  }));

  tracePoints.forEach(([angle, radius], index) => {
    const point = polar(angle, radius);
    traceLayer.append(makeElement("circle", {
      class: "trace-node",
      "data-trace-index": index,
      cx: point.x,
      cy: point.y,
      r: 6.5,
    }));
  });
}

function ensureInferenceVectorLayer() {
  if (inferenceVectorLayer) return inferenceVectorLayer;

  inferenceVectorLayer = makeElement("g", {
    class: "inference-vector-layer",
    "data-inference-vector-layer": "",
  });
  traceLayer.after(inferenceVectorLayer);

  return inferenceVectorLayer;
}

function clearInferenceHighlights() {
  radarFrame?.classList.remove("has-highlights");
  inferenceVectorLayer?.replaceChildren();
  publishHomepageHighlightState(false);

  sectorsLayer.querySelectorAll(".sector.has-highlight").forEach((sector) => sector.classList.remove("has-highlight"));
  domainHeaderLayer.querySelectorAll(".domain-arc-label.has-highlight").forEach((header) => header.classList.remove("has-highlight"));
  needLabelLayer.querySelectorAll(".label-set.has-highlight").forEach((labelSet) => labelSet.classList.remove("has-highlight"));
  needLabelLayer.querySelectorAll(".need-label.is-highlighted").forEach((label) => {
    label.classList.remove("is-highlighted");
    delete label.dataset.highlightIndex;
  });
}

function publishHomepageHighlightState(hasPhysiological) {
  if (!isHomepageRadarFrame) return;

  window.parent?.postMessage(
    { type: "iam:homepage-radar-highlights", hasPhysiological },
    window.location.origin,
  );
}

function drawInferenceVectors(matches) {
  const layer = ensureInferenceVectorLayer();
  layer.replaceChildren();

  matches.forEach((match, index) => {
    const target = labelPoint(match.item);
    const radius = Math.max(1, Math.hypot(target.x, target.y));
    const unit = {
      x: target.x / radius,
      y: target.y / radius,
    };
    const start = {
      x: unit.x * (innerRadius - 42),
      y: unit.y * (innerRadius - 42),
    };
    const end = vectorEndBeforeLabel(start, target, highlightedLabelElement(match));

    layer.append(makeElement("line", {
      class: "inference-vector-line",
      x1: start.x.toFixed(2),
      y1: start.y.toFixed(2),
      x2: end.x.toFixed(2),
      y2: end.y.toFixed(2),
      stroke: match.domain.color,
      pathLength: 1,
      "data-highlight-index": index,
    }));

    layer.append(makeElement("circle", {
      class: "inference-vector-node",
      cx: end.x.toFixed(2),
      cy: end.y.toFixed(2),
      r: 7.4,
      fill: match.domain.color,
      "data-highlight-index": index,
    }));
  });
}

function applyInferenceHighlights(inference) {
  const matches = validHighlightMatches(inference);
  clearInferenceHighlights();

  if (!matches.length) return;

  radarFrame?.classList.add("has-highlights");

  matches.forEach((match, index) => {
    const sector = Array.from(sectorsLayer.querySelectorAll(".sector"))
      .find((item) => item.dataset.domain === match.domain.name);
    const header = Array.from(domainHeaderLayer.querySelectorAll(".domain-arc-label"))
      .find((item) => item.dataset.domainHeader === match.domain.name);
    const labelSet = Array.from(needLabelLayer.querySelectorAll(".label-set"))
      .find((item) => item.dataset.domain === match.domain.name);
    const label = Array.from(needLabelLayer.querySelectorAll(".need-label"))
      .find((item) => item.dataset.domain === match.domain.name && Number(item.dataset.labelIndex) === match.labelIndex);

    sector?.classList.add("has-highlight");
    header?.classList.add("has-highlight");
    labelSet?.classList.add("has-highlight");

    if (label) {
      label.classList.add("is-highlighted");
      label.dataset.highlightIndex = String(index);
    }
  });

  drawInferenceVectors(matches);
  publishHomepageHighlightState(matches.some((match) => match.domain.name === "Physiological"));
}

function addNetwork() {
  const points = [0, 45, 90, 135, 180, 225, 270, 315].map((angle) => polar(angle, 172));

  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length];
    networkLayer.append(makeElement("line", {
      class: "engine-line",
      x1: point.x,
      y1: point.y,
      x2: next.x,
      y2: next.y,
    }));

    networkLayer.append(makeElement("line", {
      class: "engine-line engine-spoke",
      x1: point.x,
      y1: point.y,
      x2: 0,
      y2: 0,
    }));
  });

  points.forEach((point) => {
    networkLayer.append(makeElement("circle", {
      class: "engine-node",
      cx: point.x,
      cy: point.y,
      r: 14,
    }));
  });
}

function clearDomain() {
  if (!radarFrame) return;
  if (layoutMode) return;

  radarFrame.classList.remove("has-domain", "has-selected");
  delete radarFrame.dataset.activeDomain;
  if (isHomepageRadarFrame) {
    window.parent?.postMessage({ type: "iam:homepage-radar-domain", domain: "" }, window.location.origin);
  }
  domainHeaderLayer.querySelectorAll(".domain-arc-label").forEach((header) => header.classList.remove("is-active"));
  needLabelLayer.querySelectorAll(".label-set").forEach((labelSet) => labelSet.classList.remove("is-active"));
  hideNeedCard(true);
}

function canUseHomepageRadarInteractions() {
  return homepageRadarInteractionsReady;
}

function setDomain(domainName) {
  const domain = domains.find((item) => item.name === domainName);
  if (!radarFrame || !domain) return;

  if (activeNeedLabel && activeNeedLabel.dataset.domain !== domainName) {
    hideNeedCard(true);
  }

  radarFrame.classList.add("has-domain", "has-selected");
  radarFrame.dataset.activeDomain = domainName;

  domainHeaderLayer.querySelectorAll(".domain-arc-label").forEach((header) => {
    header.classList.toggle("is-active", header.dataset.domainHeader === domainName);
  });

  needLabelLayer.querySelectorAll(".label-set").forEach((labelSet) => {
    labelSet.classList.toggle("is-active", labelSet.dataset.domain === domainName);
  });

  if (isHomepageRadarFrame) {
    window.parent?.postMessage({ type: "iam:homepage-radar-domain", domain: domainName }, window.location.origin);
  }

  auditLabelLayout(domainName);
}

function setSpecialistState(visible) {
  radarFrame?.classList.toggle("is-specialist", visible);
  cube?.setAttribute("aria-expanded", String(visible));
  specialistCard?.setAttribute("aria-hidden", String(!visible));
  if (visible) {
    window.requestAnimationFrame(fitSpecialistCardToViewport);
  } else {
    clearActiveSpecialistHorizon();
    specialistCard?.style.removeProperty("--specialist-card-left");
    specialistCard?.style.removeProperty("--specialist-card-top");
  }
}

function cancelSpecialistHide() {
  window.clearTimeout(specialistHideTimer);
  specialistHideTimer = null;
}

function clearActiveSpecialistHorizon() {
  specialistHorizons.forEach((horizon) => horizon.classList.remove("is-active"));
  specialistCard?.classList.remove("has-active-horizon");
}

function toggleActiveSpecialistHorizon(horizon) {
  const alreadyActive = horizon.classList.contains("is-active");
  clearActiveSpecialistHorizon();
  if (!alreadyActive) {
    horizon.classList.add("is-active");
    specialistCard?.classList.add("has-active-horizon");
    window.requestAnimationFrame(fitSpecialistCardToViewport);
  }
}

function fitSpecialistCardToViewport() {
  if (!specialistCard || !radarFrame || !radarFrame.classList.contains("is-specialist")) return;

  if (!window.matchMedia("(max-width: 900px)").matches) {
    specialistCard.style.removeProperty("--specialist-card-left");
    specialistCard.style.removeProperty("--specialist-card-top");
    return;
  }

  const viewportPadding = 18;
  const frameBox = radarFrame.getBoundingClientRect();
  const cardBox = specialistCard.getBoundingClientRect();
  const maxTop = Math.max(viewportPadding, window.innerHeight - cardBox.height - viewportPadding);
  const preferredTop = frameBox.top + frameBox.height * 0.08;
  const top = clamp(preferredTop, viewportPadding, maxTop);
  const centerX = window.innerWidth / 2;
  const leftPercent = ((centerX - frameBox.left) / frameBox.width) * 100;
  const topPercent = ((top - frameBox.top) / frameBox.height) * 100;

  specialistCard.style.setProperty("--specialist-card-left", `${leftPercent}%`);
  specialistCard.style.setProperty("--specialist-card-top", `${topPercent}%`);
}

function showSpecialist(pinned = false) {
  if (radarFrame?.classList.contains("is-kernel-open")) return;

  cancelSpecialistHide();
  if (pinned === true) pinnedSpecialist = true;
  clearDomain();
  hideNeedCard(true);
  setSpecialistState(true);
}

function hideSpecialist(force = false) {
  const forceClose = force === true;
  if (pinnedSpecialist && !forceClose) return;
  pinnedSpecialist = false;
  setSpecialistState(false);
}

function scheduleSpecialistHide() {
  cancelSpecialistHide();
  specialistHideTimer = window.setTimeout(() => hideSpecialist(), 260);
}

function setTensorKernelState(visible) {
  if (!radarFrame || !tensorOverlay) return;

  radarFrame.classList.toggle("is-kernel-open", visible);
  document.body.classList.toggle("tensor-kernel-open", visible);
  tensorOverlay.setAttribute("aria-hidden", String(!visible));
  cube?.setAttribute("aria-expanded", String(visible));

  if (!visible) {
    unlockTensorKernelHover();
    clearTensorKernelLayer(true);
  }
}

function lockTensorKernelHover() {
  if (!tensorOverlay) return;
  window.clearTimeout(tensorHoverUnlockTimer);
  window.removeEventListener("pointermove", unlockTensorKernelHover);
  window.removeEventListener("keydown", unlockTensorKernelHover);
  tensorHoverLocked = true;
  tensorOverlay.dataset.hoverLocked = "true";
  clearTensorKernelLayer(true);

  tensorHoverUnlockTimer = window.setTimeout(() => {
    window.addEventListener("pointermove", unlockTensorKernelHover, { once: true, passive: true });
    window.addEventListener("keydown", unlockTensorKernelHover, { once: true });
  }, 260);
}

function unlockTensorKernelHover() {
  window.clearTimeout(tensorHoverUnlockTimer);
  tensorHoverUnlockTimer = null;
  window.removeEventListener("pointermove", unlockTensorKernelHover);
  window.removeEventListener("keydown", unlockTensorKernelHover);
  tensorHoverLocked = false;
  delete tensorOverlay?.dataset.hoverLocked;
}

function setTensorKernelLayer(layerName, force = false) {
  if (!tensorOverlay || !layerName) return;
  if (tensorHoverLocked && force !== true) return;
  window.clearTimeout(tensorLayerClearTimer);
  tensorLayerClearTimer = null;
  tensorOverlay.dataset.activeLayer = layerName;
}

function clearTensorKernelLayer(immediate = false) {
  window.clearTimeout(tensorLayerClearTimer);

  if (immediate === true) {
    tensorLayerClearTimer = null;
    delete tensorOverlay?.dataset.activeLayer;
    return;
  }

  tensorLayerClearTimer = window.setTimeout(() => {
    delete tensorOverlay?.dataset.activeLayer;
    tensorLayerClearTimer = null;
  }, 180);
}

function openTensorKernel(event) {
  event?.preventDefault();
  event?.stopPropagation();

  tensorKernelTrigger = event?.currentTarget || document.activeElement;
  hideSpecialist(true);
  clearDomain();
  hideNeedCard(true);
  setTensorKernelState(true);
  lockTensorKernelHover();

  window.requestAnimationFrame(() => {
    tensorCloseButtons[0]?.focus({ preventScroll: true });
  });
}

function closeTensorKernel(restoreFocus = true) {
  if (!radarFrame?.classList.contains("is-kernel-open")) return;

  setTensorKernelState(false);

  if (restoreFocus) {
    tensorKernelTrigger?.focus?.({ preventScroll: true });
  }
}

function toggleSpecialist(event) {
  event.preventDefault();
  event.stopPropagation();

  if (pinnedSpecialist && radarFrame?.classList.contains("is-specialist")) {
    hideSpecialist(true);
    return;
  }

  showSpecialist(true);
}

function getDomainLabel(label) {
  const domain = domains.find((item) => item.name === label.dataset.domain);
  if (!domain) return null;
  const item = domain.labels[Number(label.dataset.labelIndex)];
  return item ? { domain, item } : null;
}

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

function renderNeedCard(detail) {
  const fragment = document.createDocumentFragment();

  fragment.append(createTextElement("p", "need-card__eyebrow", detail.eyebrow));
  fragment.append(createTextElement("strong", "need-card__title", detail.title));
  fragment.append(createTextElement("span", "need-card__summary", detail.summary));
  fragment.append(createTextElement("p", "need-card__section-title", detail.roleTitle));

  const roleList = document.createElement("ul");
  roleList.className = "need-card__roles";
  detail.roles.forEach((role) => {
    roleList.append(createTextElement("li", "need-card__role", role));
  });
  fragment.append(roleList);

  const researchHypothesis = document.createElement("div");
  researchHypothesis.className = "need-card__research";
  researchHypothesis.append(createTextElement("p", "need-card__research-title", detail.researchHypothesis.title));
  researchHypothesis.append(createTextElement("p", "need-card__research-label", detail.researchHypothesis.targetLabel));
  const candidateTargets = document.createElement("ul");
  candidateTargets.className = "need-card__research-targets";
  detail.researchHypothesis.candidateTargets.forEach((target) => {
    candidateTargets.append(createTextElement("li", "need-card__research-target", target));
  });
  researchHypothesis.append(candidateTargets);
  fragment.append(researchHypothesis);

  const notes = document.createElement("div");
  notes.className = "need-card__notes";
  detail.notes.forEach((note) => {
    const noteBlock = document.createElement("div");
    noteBlock.className = "need-card__note";
    noteBlock.append(createTextElement("p", "need-card__note-title", note.title));
    noteBlock.append(createTextElement("p", "need-card__note-body", note.body));
    notes.append(noteBlock);
  });
  fragment.append(notes);

  needCard.replaceChildren(fragment);
}

function drawNeedCardLeader(match) {
  if (!needCardLeaderLayer) return;

  needCardLeaderLayer.replaceChildren();
  const anchor = labelPoint(match.item);
  const anchorStart = { x: anchor.x, y: anchor.y - 15 };
  const anchorScreen = screenPointFromSvg(anchorStart);
  const cardBox = needCard.getBoundingClientRect();
  const attachToLeftEdge = cardBox.left + cardBox.width / 2 > anchorScreen.x;
  const direction = attachToLeftEdge ? 1 : -1;
  const cardAnchor = cardBox.width && cardBox.height
    ? svgPointFromScreen(
      attachToLeftEdge ? cardBox.left + 18 : cardBox.right - 18,
      cardBox.top + 46,
    )
    : cardPositionForLabel(match.item).svgPoint;
  const controlA = {
    x: anchorStart.x + direction * 24,
    y: anchorStart.y - 38,
  };
  const controlB = {
    x: cardAnchor.x - direction * 62,
    y: cardAnchor.y - 8,
  };

  needCardLeaderLayer.append(makeElement("path", {
    class: "need-card-leader",
    d: [
      `M ${anchorStart.x.toFixed(2)} ${anchorStart.y.toFixed(2)}`,
      `C ${controlA.x.toFixed(2)} ${controlA.y.toFixed(2)}`,
      `${controlB.x.toFixed(2)} ${controlB.y.toFixed(2)}`,
      `${cardAnchor.x.toFixed(2)} ${cardAnchor.y.toFixed(2)}`,
    ].join(" "),
    pathLength: 1,
    stroke: match.domain.color,
  }));

  needCardLeaderLayer.append(makeElement("circle", {
    class: "need-card-anchor",
    cx: anchorStart.x,
    cy: anchorStart.y,
    r: 4.2,
    fill: match.domain.color,
  }));
}

function showNeedCard(label, pinned = false) {
  const match = getDomainLabel(label);
  if (!match?.item.detail || !needCard) return;

  const position = cardPositionForLabel(match.item);
  pinnedNeedCard = pinned;
  activeNeedLabel?.classList.remove("is-card-active");
  activeNeedLabel = label;
  activeNeedLabel.classList.add("is-card-active");

  setDomain(match.domain.name);
  renderNeedCard(match.item.detail);
  needCard.style.setProperty("--card-x", `${position.xPercent}%`);
  needCard.style.setProperty("--card-y", `${position.yPercent}%`);
  needCard.style.setProperty("--need-accent", match.domain.color);
  needCard.dataset.domain = match.domain.name;
  needCard.dataset.need = labelText(match.item);
  needCard.dataset.side = position.side;
  radarFrame?.classList.add("has-need-card");
  needCard.classList.add("is-visible");
  window.requestAnimationFrame(() => {
    fitNeedCardToViewport(match);
    drawNeedCardLeader(match);
  });
}

function hideNeedCard(force = false) {
  if (pinnedNeedCard && !force) return;

  pinnedNeedCard = false;
  activeNeedLabel?.classList.remove("is-card-active");
  activeNeedLabel = null;
  needCard?.classList.remove("is-visible");
  radarFrame?.classList.remove("has-need-card");
  needCardLeaderLayer?.replaceChildren();
}

function detailLabelFromEvent(event) {
  return event.target.closest?.(".need-label[data-has-detail='true']");
}

function svgPointFromEvent(event) {
  return svgPointFromScreen(event.clientX, event.clientY);
}

function screenPointFromSvg(svgPoint) {
  const point = radar.createSVGPoint();
  point.x = svgPoint.x;
  point.y = svgPoint.y;
  return point.matrixTransform(radar.getScreenCTM());
}

function svgPointFromScreen(clientX, clientY) {
  const point = radar.createSVGPoint();
  point.x = clientX;
  point.y = clientY;
  return point.matrixTransform(radar.getScreenCTM().inverse());
}

function beginLabelDrag(event) {
  const label = event.target.closest?.(".need-label");
  if (!layoutMode || !label) return;
  const match = getDomainLabel(label);
  if (!match) return;

  const pointer = svgPointFromEvent(event);
  const base = labelPoint(match.item);
  draggedLabel = {
    label,
    item: match.item,
    startPointer: pointer,
    startDx: match.item.dx || 0,
    startDy: match.item.dy || 0,
    startX: base.x,
    startY: base.y,
  };

  label.classList.add("is-dragging");
  label.setPointerCapture?.(event.pointerId);
  event.preventDefault();
}

function moveLabelDrag(event) {
  if (!draggedLabel) return;

  const pointer = svgPointFromEvent(event);
  draggedLabel.item.dx = Math.round(draggedLabel.startDx + pointer.x - draggedLabel.startPointer.x);
  draggedLabel.item.dy = Math.round(draggedLabel.startDy + pointer.y - draggedLabel.startPointer.y);
  updateLabelElement(draggedLabel.label, draggedLabel.item);
  refreshLayoutPanel();
}

function endLabelDrag() {
  if (!draggedLabel) return;

  draggedLabel.label.classList.remove("is-dragging");
  console.table(layoutRows());
  draggedLabel = null;
  auditLabelLayout();
}

function layoutRows() {
  return domains.flatMap((domain) => domain.labels.map((item) => ({
    domain: domain.name,
    label: labelText(item),
    angle: item.angle,
    radius: item.radius,
    dx: item.dx || 0,
    dy: item.dy || 0,
  })));
}

function layoutOffsets() {
  return domains.reduce((offsets, domain) => {
    offsets[domain.name] = domain.labels.reduce((domainOffsets, item) => {
      domainOffsets[labelText(item)] = {
        dx: item.dx || 0,
        dy: item.dy || 0,
      };
      return domainOffsets;
    }, {});
    return offsets;
  }, {});
}

function labelBoxes(domainName) {
  return Array.from(needLabelLayer.querySelectorAll(".need-label"))
    .filter((label) => !domainName || label.dataset.domain === domainName)
    .map((label) => {
      const box = label.getBBox();
      return {
        label,
        domain: label.dataset.domain,
        name: label.dataset.needLabel,
        x: box.x - labelBorderPadding,
        y: box.y - labelBorderPadding,
        width: box.width + labelBorderPadding * 2,
        height: box.height + labelBorderPadding * 2,
      };
    });
}

function boxesOverlap(first, second) {
  return first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y;
}

function normalizedAngle(angle) {
  return ((angle % 360) + 360) % 360;
}

function angleBetween(angle, start, end) {
  const normalized = normalizedAngle(angle);
  const normalizedStart = normalizedAngle(start);
  const normalizedEnd = normalizedAngle(end);
  if (normalizedStart <= normalizedEnd) {
    return normalized >= normalizedStart && normalized <= normalizedEnd;
  }
  return normalized >= normalizedStart || normalized <= normalizedEnd;
}

function pointAngle(x, y) {
  return normalizedAngle(Math.atan2(y, x) * 180 / Math.PI + 90);
}

function boxTouchesDomainBorder(box) {
  const domain = domains.find((item) => item.name === box.domain);
  if (!domain) return false;

  const corners = [
    [box.x, box.y],
    [box.x + box.width, box.y],
    [box.x, box.y + box.height],
    [box.x + box.width, box.y + box.height],
  ];

  return corners.some(([x, y]) => {
    const radius = Math.hypot(x, y);
    return radius > outerRadius - labelBorderPadding ||
      radius < innerRadius + labelBorderPadding ||
      !angleBetween(pointAngle(x, y), domain.start + 2, domain.end - 2);
  });
}

function auditLabelLayout(domainName = null) {
  if (!layoutAudit) return;

  const boxes = labelBoxes(domainName);
  const overlaps = [];
  const borderHits = [];

  boxes.forEach((box, index) => {
    if (boxTouchesDomainBorder(box)) {
      borderHits.push(`${box.domain}: ${box.name}`);
    }
    boxes.slice(index + 1).forEach((other) => {
      if (box.domain === other.domain && boxesOverlap(box, other)) {
        overlaps.push(`${box.domain}: ${box.name} + ${other.name}`);
      }
    });
  });

  const report = [
    overlaps.length ? `Overlaps (${overlaps.length})\n${overlaps.join("\n")}` : "",
    borderHits.length ? `Border proximity (${borderHits.length})\n${borderHits.join("\n")}` : "",
  ].filter(Boolean);

  layoutAudit.textContent = report.length
    ? report.join("\n\n")
    : "No label overlaps or border hits detected.";
}

function refreshLayoutPanel() {
  if (!layoutOutput) return;

  layoutOutput.textContent = `const labelOffsets = ${JSON.stringify(layoutOffsets(), null, 2)};`;
  auditLabelLayout(radarFrame?.dataset.activeDomain || null);
}

function createLayoutPanel() {
  layoutPanel = document.createElement("aside");
  layoutPanel.className = "layout-panel";
  layoutPanel.innerHTML = `
    <div class="layout-panel-header">
      <strong>Label layout</strong>
      <button type="button" data-copy-layout>Copy offsets</button>
    </div>
    <pre class="layout-audit" data-layout-audit></pre>
    <pre class="layout-output" data-layout-output></pre>
  `;
  document.body.append(layoutPanel);
  layoutOutput = layoutPanel.querySelector("[data-layout-output]");
  layoutAudit = layoutPanel.querySelector("[data-layout-audit]");
  layoutPanel.querySelector("[data-copy-layout]").addEventListener("click", async () => {
    await navigator.clipboard?.writeText(layoutOutput.textContent);
  });
}

function setLayoutMode(enabled) {
  layoutMode = enabled;
  document.body.classList.toggle("is-layout-mode", enabled);
  window.localStorage.setItem("citizenNeedsLayoutMode", enabled ? "1" : "0");

  if (enabled && !layoutPanel) {
    createLayoutPanel();
  }

  if (enabled) {
    radarFrame?.classList.add("has-domain");
    needLabelLayer.querySelectorAll(".label-set").forEach((labelSet) => labelSet.classList.add("is-active"));
    domainHeaderLayer.querySelectorAll(".domain-arc-label").forEach((header) => header.classList.add("is-active"));
    refreshLayoutPanel();
    console.table(layoutRows());
  } else {
    layoutPanel?.remove();
    layoutPanel = null;
    layoutOutput = null;
    layoutAudit = null;
    clearDomain();
  }
}

addSectors();
addGrid();
addNetwork();
addTrace();
setLayoutMode(layoutMode);
const initialInference = initCheckinStatus();
applyInferenceHighlights(initialInference);

if (isHomepageRadarFrame) {
  window.setTimeout(() => {
    homepageRadarInteractionsReady = true;
    publishHomepageHighlightState(
      Array.from(domainHeaderLayer.querySelectorAll(".domain-arc-label.has-highlight"))
        .some((header) => header.dataset.domainHeader === "Physiological"),
    );
  }, 2800);

  window.addEventListener("message", (event) => {
    if (event.origin !== window.location.origin) return;
    if (event.data?.type === "iam:homepage-radar-disable") {
      homepageRadarInteractionsReady = false;
      hideNeedCard(true);
      hideSpecialist(true);
      closeTensorKernel(false);
      return;
    }

    if (event.data?.type === "iam:homepage-radar-enable") {
      homepageRadarInteractionsReady = true;
      publishHomepageHighlightState(
        Array.from(domainHeaderLayer.querySelectorAll(".domain-arc-label.has-highlight"))
          .some((header) => header.dataset.domainHeader === "Physiological"),
      );
    }
  });
}

needLabelLayer.addEventListener("pointerdown", (event) => {
  if (!canUseHomepageRadarInteractions()) return;
  beginLabelDrag(event);
});
needLabelLayer.addEventListener("pointerover", (event) => {
  if (!canUseHomepageRadarInteractions()) return;
  const label = detailLabelFromEvent(event);
  if (!label || label === activeNeedLabel) return;
  showNeedCard(label);
});
needLabelLayer.addEventListener("pointerout", (event) => {
  if (!canUseHomepageRadarInteractions()) return;
  const label = detailLabelFromEvent(event);
  if (!label || label.contains(event.relatedTarget)) return;
  hideNeedCard();
});
needLabelLayer.addEventListener("click", (event) => {
  if (!canUseHomepageRadarInteractions()) {
    event.preventDefault();
    return;
  }
  const label = detailLabelFromEvent(event);
  if (!label) return;
  showNeedCard(label, true);
  event.preventDefault();
});
needLabelLayer.addEventListener("focusin", (event) => {
  if (!canUseHomepageRadarInteractions()) return;
  const label = detailLabelFromEvent(event);
  if (!label) return;
  showNeedCard(label, true);
});
needLabelLayer.addEventListener("focusout", (event) => {
  const label = detailLabelFromEvent(event);
  if (!label) return;
  hideNeedCard(true);
});
needLabelLayer.addEventListener("keydown", (event) => {
  if (!canUseHomepageRadarInteractions()) return;
  const label = detailLabelFromEvent(event);
  if (!label || !["Enter", " "].includes(event.key)) return;
  showNeedCard(label, true);
  event.preventDefault();
});
window.addEventListener("pointermove", moveLabelDrag);
window.addEventListener("pointerup", endLabelDrag);
window.addEventListener("pointercancel", endLabelDrag);
window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "l" && event.shiftKey) {
    setLayoutMode(!layoutMode);
  }
});
window.addEventListener("resize", () => {
  fitSpecialistCardToViewport();
  if (!activeNeedLabel || !needCard?.classList.contains("is-visible")) return;
  const match = getDomainLabel(activeNeedLabel);
  if (!match) return;
  fitNeedCardToViewport(match);
  drawNeedCardLeader(match);
});

sectorsLayer.querySelectorAll(".sector-hit").forEach((sector) => {
  sector.addEventListener("mouseenter", () => {
    if (!canUseHomepageRadarInteractions()) return;
    setDomain(sector.dataset.domain);
  });
  sector.addEventListener("focus", () => {
    if (!canUseHomepageRadarInteractions()) return;
    setDomain(sector.dataset.domain);
  });
  sector.addEventListener("click", () => {
    if (!canUseHomepageRadarInteractions()) return;
    hideNeedCard(true);
    setDomain(sector.dataset.domain);
    sector.blur?.();
  });
});

radar?.addEventListener("mouseleave", () => {
  if (!canUseHomepageRadarInteractions()) return;
  clearDomain();
});

if (cube) {
  cube.addEventListener("mouseenter", () => {
    if (!canUseHomepageRadarInteractions()) return;
    showSpecialist();
  });
  cube.addEventListener("mouseleave", scheduleSpecialistHide);
  cube.addEventListener("focus", () => {
    if (!canUseHomepageRadarInteractions()) return;
    showSpecialist();
  });
  cube.addEventListener("blur", scheduleSpecialistHide);
  cube.addEventListener("click", () => {
    if (!canUseHomepageRadarInteractions()) return;
    toggleSpecialist();
  });
}

if (specialistCard) {
  specialistCard.addEventListener("mouseenter", cancelSpecialistHide);
  specialistCard.addEventListener("mouseleave", scheduleSpecialistHide);
  specialistCard.addEventListener("focusin", cancelSpecialistHide);
  specialistCard.addEventListener("focusout", scheduleSpecialistHide);
}

tensorOpenButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    if (!canUseHomepageRadarInteractions()) return;
    openTensorKernel(event);
  });
});

tensorCloseButtons.forEach((button) => {
  button.addEventListener("click", () => closeTensorKernel());
});

tensorLayerTargets.forEach((target) => {
  target.addEventListener("pointerover", () => {
    if (!canUseHomepageRadarInteractions()) return;
    setTensorKernelLayer(target.dataset.kernelLayer);
  });
  target.addEventListener("pointerenter", () => {
    if (!canUseHomepageRadarInteractions()) return;
    setTensorKernelLayer(target.dataset.kernelLayer);
  });
  target.addEventListener("mouseenter", () => {
    if (!canUseHomepageRadarInteractions()) return;
    setTensorKernelLayer(target.dataset.kernelLayer);
  });
  target.addEventListener("focus", () => {
    if (!canUseHomepageRadarInteractions()) return;
    setTensorKernelLayer(target.dataset.kernelLayer);
  });
  target.addEventListener("pointerout", () => clearTensorKernelLayer());
  target.addEventListener("pointerleave", () => clearTensorKernelLayer());
  target.addEventListener("mouseleave", () => clearTensorKernelLayer());
  target.addEventListener("blur", () => clearTensorKernelLayer());
});

if (shouldAutoOpenTensorKernel) {
  window.requestAnimationFrame(() => {
    openTensorKernel();
    if (autoTensorKernelLayer) {
      window.setTimeout(() => setTensorKernelLayer(autoTensorKernelLayer, true), 120);
    }
  });
}

specialistHorizons.forEach((horizon) => {
  horizon.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleActiveSpecialistHorizon(horizon);
  });

  horizon.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    toggleActiveSpecialistHorizon(horizon);
  });
});

document.addEventListener("click", (event) => {
  if (!pinnedSpecialist) return;
  if (event.target.closest?.("[data-cube], [data-specialist-card]")) return;
  hideSpecialist(true);
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (radarFrame?.classList.contains("is-kernel-open")) {
    closeTensorKernel();
    event.preventDefault();
    return;
  }
  hideSpecialist(true);
  closeGlobalNav();
});

if (!isHomepageRadarFrame) {
  navOpenButtons.forEach((button) => {
    button.addEventListener("click", () => openGlobalNav(currentNavItem));
  });

  navCloseButtons.forEach((button) => {
    button.addEventListener("click", closeGlobalNav);
  });

  navItems.forEach((item) => {
    item.addEventListener("mouseenter", () => setActiveNavItem(item.dataset.navItem));
    item.addEventListener("focus", () => setActiveNavItem(item.dataset.navItem));

    if (item.tagName === "A" && navSubmenus.has(item.dataset.navItem)) {
      item.addEventListener("click", (event) => {
        const submenu = navSubmenus.get(item.dataset.navItem);
        if (submenu && !submenu.hasAttribute("data-mobile-editorial-hidden")) {
          event.preventDefault();
          setActiveNavItem(item.dataset.navItem);
        }
      });
    }
  });
}
