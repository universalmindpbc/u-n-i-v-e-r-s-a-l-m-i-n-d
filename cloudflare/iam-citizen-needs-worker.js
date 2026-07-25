import {
  ADAPTIVE_INFERENCE_SYSTEM_PROMPT,
  SYSTEM_PROMPT_SHA256,
  SYSTEM_PROMPT_SOURCE,
  SYSTEM_PROMPT_VERSION,
} from "./adaptive-inference-system-prompt-v4-44.js";
import {
  ADAPTIVE_SOUNDTRACK_SELECTION_GUIDE,
  SOUNDTRACK_SELECTION_GUIDE_VERSION,
} from "./adaptive-soundtrack-selection-guide-v2-22.js";
import UNIVERSAL_ONE_PORTAL_GUIDE from "../i  a m/universal-one-portal-guide-v1.txt";
import UNIVERSAL_ONE_WELLBEING_SUPPORT_GUIDE from "../i  a m/universal-one-wellbeing-support-guide-v1.txt";
import UNIVERSAL_ONE_PROGRAMME_GUIDE from "../i  a m/universal-one-programme-guide-v1.txt";

const DEFAULT_MODEL = "gpt-5.5";

const allowedOrigins = new Set([
  "https://universalmind.tv",
  "https://www.universalmind.tv",
  "https://staging.universalmind.tv",
  "http://127.0.0.1:8126",
  "http://localhost:8126",
  "http://127.0.0.1:8125",
  "http://localhost:8125",
  "http://127.0.0.1:5191",
  "http://localhost:5191",
]);

const allowedHighlights = [
  "Calm",
  "Hope",
  "Curiosity",
  "Gratitude",
  "Joy",
  "Love",
  "Awe",
  "Purpose",
  "Self-actualisation",
  "Fear",
  "Anxiety",
  "Anger",
  "Shame",
  "Loneliness",
  "Trust",
  "Belonging",
  "Connection",
  "Empathy",
  "Psychological Safety",
  "Self Transcendence",
  "Attention",
  "Clarity",
  "Mental Load",
  "Rumination",
  "Motivation",
  "Executive Function",
  "Arousal",
  "Recovery",
  "Stress",
  "Sleep Pressure",
  "Fatigue",
  "Hypervigilance",
  "Avoidance",
  "Intrusions",
  "Emotional Numbing",
  "Sleep Disturbance",
  "Startle Sensitivity",
];

const allowedSoundtrackStageGates = ["calm", "chill", "house"];
const allowedLocationPrecisions = ["none", "approximate", "precise"];
const allowedDomains = ["Emotion", "Social", "Cognitive", "Physiological", "Threat", "Clinical Risk"];

const scorecardDomains = {
  human_needs_radar: allowedHighlights,
  maslow_human_needs: [
    "Physiological Regulation", "Rest", "Shelter", "Safety", "Stability", "Protection",
    "Belonging", "Love", "Esteem", "Recognition", "Agency", "Self-Actualisation",
    "Self-Transcendence", "Meaning", "Contribution", "Creative Expression",
  ],
  mindfulness_dadirri: [
    "DM 01 Deep Listening", "DM 02 Presence", "DM 03 Connection to Country", "DM 04 Awareness",
    "DM 05 Trust", "DM 06 Self Compassion", "DM 07 Integration", "DM 08 Intention",
    "DM 09 Clarity", "DM 10 Curiosity", "DM 11 Courage", "DM 12 Service",
    "DM 13 Celebration", "DM 14 Grounded Readiness", "DM 15 Embodied Peace",
  ],
  meditative_values_applied: [
    "MVA 1 Anxiety to Peace Of Mind", "MVA 2 This Too Shall Pass", "MVA 3 Compassion Without Fixing",
    "MVA 4 Common Humanity via Body", "MVA 5 Awakening the Dreamtime", "MVA 6 Dadirri",
    "MVA 7 Grounded on Country", "MVA 8 Healing Wisdom of Nature",
  ],
  monomyth_hero_journey: [
    "MM 01 Call To Adventure", "MM 02 Refusal Of The Call", "MM 03 Supernatural Aid Mentor",
    "MM 04 Crossing First Threshold", "MM 05 Belly Of The Whale", "MM 06 Road Of Trials",
    "MM 07 Meeting With The Goddess", "MM 08 Temptation Distraction", "MM 09 Atonement With Authority",
    "MM 10 Apotheosis", "MM 11 Ultimate Boon", "MM 12 Refusal Of The Return", "MM 13 Magic Flight",
    "MM 14 Rescue From Without", "MM 15 Crossing Return Threshold", "MM 16 Master Of Two Worlds",
    "MM 17 Freedom To Live",
  ],
  memory_state: [
    "Memory Activation Strength", "Memory Specificity", "Nostalgia Intensity", "Somatic Memory Signal",
    "Agency After Listening", "Hope After Listening", "Place Memory Relevance", "Relationship Memory Relevance",
    "Sensory Memory Relevance", "Autobiographical Trigger Relevance", "Cultural Memory Relevance",
    "Future Memory Seeding",
  ],
  mental_health_safety: [
    "Fear", "Anxiety", "Anger", "Shame", "Loneliness", "Stress", "Rumination", "Hypervigilance",
    "Avoidance", "Intrusions", "Emotional Numbing", "Sleep Disturbance", "Startle Sensitivity",
    "Dysregulation", "Grounding Need", "Support Need", "Acute Distress", "Human Review Need",
    "Window of Tolerance", "Emotional Regulation Need", "Dissociation Risk", "Overwhelm", "Burnout Signal",
    "Isolation Risk", "Anger Activation", "Grief Activation", "Trauma Sensitivity",
  ],
  contextual_modifiers: [
    "Morning Activation", "Afternoon Sustain", "Evening Downshift", "Night Recovery",
    "Cold Weather Containment", "Warm Weather Expansion", "Clear Weather Brightness", "Rain Weather Holding",
    "Urban Density", "Coastal Openness", "Private Space", "Public Space",
  ],
};

function scorecardDomainSchema(labels) {
  return {
    type: "object",
    additionalProperties: false,
    properties: Object.fromEntries(labels.map((label) => [label, {
      type: "number",
      minimum: 0,
      maximum: 1,
    }])),
    required: labels,
  };
}

const scorecardSchema = {
  type: "object",
  additionalProperties: false,
  properties: Object.fromEntries(
    Object.entries(scorecardDomains).map(([domain, labels]) => [domain, scorecardDomainSchema(labels)]),
  ),
  required: Object.keys(scorecardDomains),
};

const inferenceInstructions = [
  ADAPTIVE_INFERENCE_SYSTEM_PROMPT,
  [
    "Current live MVP endpoint constraint:",
    "- Use the short Horizon 1 self-report check-in supplied in this request plus the supplied environment_context JSON.",
    "- Select exactly four labels from the existing UI radar label list.",
    "- Also score the complete 144-field needs_scorecard. Every field must be a number from 0.00 to 1.00.",
    "- Treat needs_scorecard values as present-state relevance signals for adaptive music matching, not as clinical facts.",
    "- The four highlights remain the hero vectors. They should be the four strongest or most decision-relevant human_needs_radar signals.",
    "- Select one adaptive soundtrack stage gate: calm, chill, or house.",
    "- Use calm to downshift threat, stress, overload, fatigue, sleep pressure, rumination, or clinical-risk language.",
    "- Use chill to hold balanced, reflective, connected, grateful, hopeful, clear, trusting, or awe-based states.",
    "- Use house to lift joy, motivation, curiosity, agency, self-actualisation, and healthy activation.",
    "- Treat local time, weather, temperature, and location as adaptive-environment-only modifiers.",
    "- Environmental context never creates clinical evidence and never overrides citizen self-report.",
    "- Return top_needs_used, dominant_domains, and context_modifiers_used as the audit trail for soundtrack selection.",
    `Soundtrack selection JSON guide: ${JSON.stringify(ADAPTIVE_SOUNDTRACK_SELECTION_GUIDE)}`,
    "- Obey the API-provided strict JSON schema exactly. Do not add, omit, or rename scorecard fields.",
    "- Treat the output as language-theme mapping for adaptive interface exploration.",
    "- Do not diagnose, prescribe, claim certainty, or provide clinical advice.",
  ].join("\n"),
].join("\n\n");

function corsHeaders(request) {
  const origin = request.headers.get("Origin");
  const allowedOrigin = origin && allowedOrigins.has(origin) ? origin : "https://universalmind.tv";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
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
      "Cache-Control": "no-store",
    },
  });
}

function voiceCorsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  const allowedOrigin = allowedOrigins.has(origin) ? origin : "";
  return {
    ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "no-store",
    "Vary": "Origin",
  };
}

function voiceJsonResponse(request, status, payload) {
  return Response.json(payload, {
    status,
    headers: voiceCorsHeaders(request),
  });
}

function parseStructuredResponse(payload) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return JSON.parse(payload.output_text);
  }

  const textItem = payload.output
    ?.flatMap((item) => item.content || [])
    ?.find((content) => content.type === "output_text" && typeof content.text === "string");

  if (textItem?.text) {
    return JSON.parse(textItem.text);
  }

  throw new Error("The model response did not include structured text.");
}

function cleanContextString(value, maxLength = 96) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim().replace(/\s+/g, " ");
  return cleaned ? cleaned.slice(0, maxLength) : null;
}

function cleanContextNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number * 10) / 10 : null;
}

function normalizeEnvironmentContext(value) {
  const input = value && typeof value === "object" ? value : {};
  const locationPrecision = cleanContextString(input.location_precision || input.locationPrecision, 24) || "none";
  const normalized = {
    local_time: cleanContextString(input.local_time || input.localTime, 32),
    location_label: cleanContextString(input.location_label || input.locationLabel, 96),
    location_precision: allowedLocationPrecisions.includes(locationPrecision) ? locationPrecision : "none",
    location_source: cleanContextString(input.location_source || input.locationSource, 64),
    weather_condition: cleanContextString(input.weather_condition || input.weatherCondition, 64),
    temperature_celsius: cleanContextNumber(input.temperature_celsius ?? input.temperatureCelsius),
    context_available: Boolean(input.context_available ?? input.contextAvailable),
    context_role: "adaptive_environment_only",
  };

  normalized.context_available = normalized.context_available ||
    Boolean(normalized.local_time || normalized.location_label || normalized.weather_condition || normalized.temperature_celsius !== null);

  if (!normalized.location_label) normalized.location_precision = "none";

  return normalized;
}

function normalizeScore(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(1, Math.round(number * 100) / 100));
}

function normalizeNeedsScorecard(value) {
  const input = value && typeof value === "object" ? value : {};
  return Object.fromEntries(
    Object.entries(scorecardDomains).map(([domain, labels]) => {
      const domainInput = input[domain] && typeof input[domain] === "object" ? input[domain] : {};
      return [domain, Object.fromEntries(labels.map((label) => [label, normalizeScore(domainInput[label])]))];
    }),
  );
}

function validateInference(result, model) {
  if (!result || !Array.isArray(result.highlights) || result.highlights.length !== 4) {
    throw new Error("The model response must include exactly four highlights.");
  }

  const uniqueHighlights = new Set(result.highlights);
  if (uniqueHighlights.size !== 4) {
    throw new Error("The model response must include four unique highlights.");
  }

  result.highlights.forEach((highlight) => {
    if (!allowedHighlights.includes(highlight)) {
      throw new Error(`Unknown radar highlight: ${highlight}`);
    }
  });

  const topNeedsUsed = Array.isArray(result.top_needs_used)
    ? result.top_needs_used.filter((need) => allowedHighlights.includes(need)).slice(0, 4)
    : result.highlights;
  const dominantDomains = Array.isArray(result.dominant_domains)
    ? result.dominant_domains.filter((domain) => allowedDomains.includes(domain)).slice(0, 4)
    : [];
  const contextModifiersUsed = Array.isArray(result.context_modifiers_used)
    ? result.context_modifiers_used
      .filter((modifier) => typeof modifier === "string" && modifier.trim())
      .map((modifier) => modifier.trim().replace(/\s+/g, " ").slice(0, 80))
      .slice(0, 4)
    : [];

  return {
    highlights: result.highlights,
    confidence: typeof result.confidence === "number" ? result.confidence : 0,
    soundtrack_stage_gate: allowedSoundtrackStageGates.includes(result.soundtrack_stage_gate)
      ? result.soundtrack_stage_gate
      : "chill",
    soundtrack_confidence: typeof result.soundtrack_confidence === "number" ? result.soundtrack_confidence : 0,
    soundtrack_reason: typeof result.soundtrack_reason === "string" ? result.soundtrack_reason : "",
    needs_scorecard: normalizeNeedsScorecard(result.needs_scorecard),
    dominant_domains: dominantDomains,
    top_needs_used: topNeedsUsed.length ? topNeedsUsed : result.highlights,
    context_modifiers_used: contextModifiersUsed,
    uncertainty_notes: Array.isArray(result.uncertainty_notes) ? result.uncertainty_notes.slice(0, 3) : [],
    human_review_relevance: result.human_review_relevance || "not_indicated",
    interpretation_type: result.interpretation_type || "language_theme_mapping",
    clinical_status: "not_a_diagnosis",
    model,
    prompt_version: SYSTEM_PROMPT_VERSION,
    prompt_sha256: SYSTEM_PROMPT_SHA256,
    prompt_source: SYSTEM_PROMPT_SOURCE,
    soundtrack_selection_guide_version: SOUNDTRACK_SELECTION_GUIDE_VERSION,
  };
}

async function handleInference(request, env) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(request),
    });
  }

  if (request.method !== "POST") {
    return jsonResponse(request, 405, { error: "Method not allowed." });
  }

  if (!env.OPENAI_API_KEY) {
    return jsonResponse(request, 503, { error: "The inference engine is unavailable for this prototype." });
  }

  let checkin = "";
  let environmentContext = normalizeEnvironmentContext(null);
  try {
    const body = await request.json();
    checkin = typeof body.checkin === "string" ? body.checkin.trim() : "";
    environmentContext = normalizeEnvironmentContext(body.environment_context || body.environmentContext || body.context);
  } catch {
    return jsonResponse(request, 400, { error: "Invalid JSON request." });
  }

  if (!checkin || checkin.length > 180) {
    return jsonResponse(request, 400, { error: "Provide a short I am check-in." });
  }

  const model = env.OPENAI_INFERENCE_MODEL || DEFAULT_MODEL;
  const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      store: false,
      reasoning: {
        effort: "low",
      },
      input: [
        {
          role: "system",
          content: inferenceInstructions,
        },
        {
          role: "user",
          content: [
            `Allowed UI radar labels: ${allowedHighlights.join(", ")}`,
            "Pick exactly four unique labels from that list.",
            `Needs scorecard domains and fields: ${JSON.stringify(scorecardDomains)}`,
            "Score every needs_scorecard field from 0.00 to 1.00. Use 0.00 when there is no evidence; use higher scores only when the check-in or adaptive context supports present-state relevance.",
            "Keep the four highlights aligned with the most salient human_needs_radar scores, but do not hide important lower-level signals from the full scorecard.",
            `Pick exactly one soundtrack stage gate: ${allowedSoundtrackStageGates.join(", ")}.`,
            "Use high scores only as stronger present-state relevance, never as diagnosis.",
            `Environment context JSON: ${JSON.stringify(environmentContext)}`,
            `Citizen check-in: ${checkin}`,
          ].join("\n"),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "citizen_needs_language_theme_mapping",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              highlights: {
                type: "array",
                minItems: 4,
                maxItems: 4,
                items: {
                  type: "string",
                  enum: allowedHighlights,
                },
              },
              confidence: {
                type: "number",
                minimum: 0,
                maximum: 1,
              },
              soundtrack_stage_gate: {
                type: "string",
                enum: allowedSoundtrackStageGates,
              },
              soundtrack_confidence: {
                type: "number",
                minimum: 0,
                maximum: 1,
              },
              soundtrack_reason: {
                type: "string",
              },
              needs_scorecard: scorecardSchema,
              dominant_domains: {
                type: "array",
                minItems: 1,
                maxItems: 4,
                items: {
                  type: "string",
                  enum: allowedDomains,
                },
              },
              top_needs_used: {
                type: "array",
                minItems: 1,
                maxItems: 4,
                items: {
                  type: "string",
                  enum: allowedHighlights,
                },
              },
              context_modifiers_used: {
                type: "array",
                minItems: 0,
                maxItems: 4,
                items: {
                  type: "string",
                },
              },
              uncertainty_notes: {
                type: "array",
                minItems: 1,
                maxItems: 3,
                items: {
                  type: "string",
                },
              },
              human_review_relevance: {
                type: "string",
                enum: [
                  "not_indicated",
                  "consider_if_persistent_or_escalating",
                  "human_review_recommended",
                  "urgent_human_review",
                ],
              },
              interpretation_type: {
                type: "string",
                enum: ["language_theme_mapping"],
              },
              clinical_status: {
                type: "string",
                enum: ["not_a_diagnosis"],
              },
            },
            required: [
              "highlights",
              "confidence",
              "soundtrack_stage_gate",
              "soundtrack_confidence",
              "soundtrack_reason",
              "needs_scorecard",
              "dominant_domains",
              "top_needs_used",
              "context_modifiers_used",
              "uncertainty_notes",
              "human_review_relevance",
              "interpretation_type",
              "clinical_status",
            ],
          },
        },
        verbosity: "low",
      },
    }),
  });

  const payload = await openaiResponse.json();
  if (!openaiResponse.ok) {
    console.error("OpenAI inference error:", openaiResponse.status, payload.error?.message || "No error message.");
    return jsonResponse(request, 502, { error: "The inference engine is unavailable for this prototype." });
  }

  try {
    const result = {
      ...validateInference(parseStructuredResponse(payload), model),
      environment_context: environmentContext,
    };
    console.info("Citizen needs inference QA", {
      model: result.model,
      prompt_version: result.prompt_version,
      prompt_sha256: result.prompt_sha256,
      highlights: result.highlights,
      soundtrack_stage_gate: result.soundtrack_stage_gate,
      human_review_relevance: result.human_review_relevance,
    });
    return jsonResponse(request, 200, result);
  } catch (error) {
    console.error("Inference validation error:", error.message);
    return jsonResponse(request, 502, { error: "The inference engine is unavailable for this prototype." });
  }
}

function cleanVoiceContext(value, maxLength = 180) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").slice(0, maxLength);
}

async function voiceSafetyIdentifier(request, scope = "realtime") {
  const source = [
    request.headers.get("CF-Connecting-IP") || "unknown",
    request.headers.get("User-Agent") || "unknown",
    `universal-mind-${scope}-v1`,
  ].join("|");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(source));
  return `um_${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("").slice(0, 48)}`;
}

async function handleRealtimeClientSecret(request, env) {
  if (request.method === "OPTIONS") {
    const origin = request.headers.get("Origin") || "";
    if (!allowedOrigins.has(origin)) return new Response(null, { status: 403 });
    return new Response(null, { status: 204, headers: voiceCorsHeaders(request) });
  }

  if (request.method !== "POST") {
    return voiceJsonResponse(request, 405, { error: "Method not allowed." });
  }

  const origin = request.headers.get("Origin") || "";
  if (!allowedOrigins.has(origin)) {
    return voiceJsonResponse(request, 403, { error: "This voice service is available only inside Universal Mind." });
  }

  if (!env.OPENAI_API_KEY) {
    return voiceJsonResponse(request, 503, { error: "Voice is not configured on this environment yet." });
  }

  const visitorKey = request.headers.get("CF-Connecting-IP") || "unknown";
  if (env.REALTIME_RATE_LIMITER) {
    const { success } = await env.REALTIME_RATE_LIMITER.limit({ key: `voice:${visitorKey}` });
    if (!success) {
      return voiceJsonResponse(request, 429, { error: "Please wait a little before starting another voice session." });
    }
  }

  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > 4096) {
    return voiceJsonResponse(request, 413, { error: "The voice context is too large." });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return voiceJsonResponse(request, 400, { error: "Invalid JSON request." });
  }

  const context = body?.context && typeof body.context === "object" ? body.context : {};
  const nowPlaying = cleanVoiceContext(context.title);
  const visual = cleanVoiceContext(context.visual);
  const source = cleanVoiceContext(context.source, 24);
  const page = cleanVoiceContext(context.page, 120);
  const path = cleanVoiceContext(context.path, 160);
  const mediaContext = nowPlaying
    ? `The visitor currently has ${nowPlaying} playing${source ? ` in ${source} mode` : ""}${visual ? `, with ${visual} as the visual layer` : ""}.`
    : "The visitor is in the Vogue I Am adaptive music television room.";
  const portalContext = `${page ? `The current page title is ${page}. ` : ""}${path ? `The current route is ${path}. ` : ""}${mediaContext}`;

  const instructions = `# Role and objective
You are Universal One, the transparent AI voice companion inside Universal Mind's Vogue I Am portal. Speak in a warm, savvy, friendly and relaxed feminine manner using the Marin voice. Be present and emotionally intelligent without pretending to be human or conscious.

# Conversation style
Make the exchange feel natural and unhurried. Let the visitor finish; a reflective pause is welcome. Answer directly, usually in a few conversational sentences, but stay with longer emotional or philosophical conversations when invited. Use plain language, gentle curiosity and light humour where it fits. Do not overuse the visitor's name, spiritual language, lists, disclaimers or verbal filler. Never reveal private chain-of-thought.

# Portal context
${portalContext}

# Portal guide
${UNIVERSAL_ONE_PORTAL_GUIDE}

You can talk about the current music, relaxation, light-touch meditation, creativity, culture, wellbeing and the experience of the portal. Give the shortest accurate navigation route when asked. If live or changing portal information is not in this context or guide, say you cannot see it rather than inventing it.

# Wellbeing support guide
${UNIVERSAL_ONE_WELLBEING_SUPPORT_GUIDE}

# Programme and episode guide
${UNIVERSAL_ONE_PROGRAMME_GUIDE}

# Trust and boundaries
You are AI-generated speech. Say so plainly if asked. Follow the wellbeing support guide exactly for EFT, professional-support referrals and urgent safety concerns. Do not diagnose, prescribe treatment or claim professional authority. Respect autonomy and avoid presenting spirituality or speculation as fact. Do not claim to have performed actions or accessed information you have not actually received.

# Turn taking
The visitor may interrupt at any time. Stop cleanly and listen. Keep opening acknowledgements brief so the conversation stays fluid. After your welcome, wait quietly for clear human speech. Treat music, room noise and indistinct audio as background: do not answer it, do not repeatedly ask whether anyone is there, and prefer silence over guessing.`;

  const openaiResponse = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
      "OpenAI-Safety-Identifier": await voiceSafetyIdentifier(request),
    },
    body: JSON.stringify({
      expires_after: { anchor: "created_at", seconds: 120 },
      session: {
        type: "realtime",
        model: "gpt-realtime-2.1",
        output_modalities: ["audio"],
        instructions,
        reasoning: { effort: "low" },
        max_output_tokens: 900,
        audio: {
          input: {
            noise_reduction: { type: "near_field" },
            transcription: { model: "gpt-4o-mini-transcribe" },
            turn_detection: {
              type: "server_vad",
              threshold: 0.72,
              prefix_padding_ms: 300,
              silence_duration_ms: 800,
              create_response: true,
              interrupt_response: true,
            },
          },
          output: { voice: "marin", speed: 1.0 },
        },
        tracing: null,
      },
    }),
  });

  const payload = await openaiResponse.json().catch(() => ({}));
  if (!openaiResponse.ok || !payload.value) {
    console.error("OpenAI Realtime client secret error:", openaiResponse.status, payload.error?.message || "No error message.");
    return voiceJsonResponse(request, 502, { error: "The voice connection could not be prepared. Please try again shortly." });
  }

  return voiceJsonResponse(request, 200, {
    value: payload.value,
    expires_at: payload.expires_at || 0,
    model: "gpt-realtime-2.1",
    voice: "marin",
    turn_detection: "server_vad",
    portal_guide_version: "v1",
    wellbeing_support_guide_version: "v1",
    programme_guide_version: "v1",
  });
}

const mantraVoicePresets = {
  "human-clear": { voice: "coral", direction: "Natural, contemporary and neutral. Crisp diction with calm confidence." },
  "human-warm": { voice: "marin", direction: "Warm, grounded and emotionally present. Gentle energy without breathiness." },
  "human-deep": { voice: "onyx", direction: "Deep, resonant and assured. Maintain precise consonants and an unhurried pace." },
  "human-bright": { voice: "shimmer", direction: "Bright, buoyant and clean. Energetic but never rushed or shrill." },
  "human-calm": { voice: "sage", direction: "Calm, spacious and meditative. Keep every word fully articulated." },
  "human-intimate": { voice: "nova", direction: "Close, intimate and conversational. Soft, but still clearly audible." },
  "robot-machine": { voice: "echo", direction: "Fred reference: classic dry system-synth speech, neutral and slightly mechanical, with crisp consonants and every word completely legible." },
  "robot-chrome": { voice: "alloy", direction: "Trinoids reference: a bright multi-voice electronic choir with airy upper harmonics, while preserving a clear central voice and exact pronunciation." },
  "robot-command": { voice: "cedar", direction: "Zarvox reference: an overt resonant science-fiction robot voice, deep and metallic, with slow deliberate articulation and completely intelligible words." },
  "robot-android": { voice: "fable", direction: "A friendly intelligent android: distinctly electronic in character, never caricatured." },
  "robot-circuit": { voice: "verse", direction: "A precise circuit voice with clipped rhythm and subtle computational character." },
  "robot-digital": { voice: "ash", direction: "A modern digital assistant voice with clean transients and clear speech rhythm." },
  "vocoder-neon": { voice: "shimmer", direction: "A luminous club-vocoder character with melodic colour and immaculate pronunciation." },
  "vocoder-oracle": { voice: "sage", direction: "A futuristic oracle with spacious electronic colour and calm, legible delivery." },
  "vocoder-temple": { voice: "ballad", direction: "A ceremonial vocoder character: resonant and devotional, with every syllable distinct." },
  "vocoder-astral": { voice: "verse", direction: "An astral synthesizer voice with floating tonal colour and sharply intelligible words." },
  "vocoder-cosmic": { voice: "marin", direction: "A warm cosmic vocoder character, expansive but speech-first and fully audible." },
  "vocoder-electric": { voice: "coral", direction: "An electric dance-floor voice with rhythmic voltage and clear human-language articulation." },
};

async function handleMantraVoice(request, env) {
  if (request.method === "OPTIONS") {
    const origin = request.headers.get("Origin") || "";
    if (!allowedOrigins.has(origin)) return new Response(null, { status: 403 });
    return new Response(null, { status: 204, headers: voiceCorsHeaders(request) });
  }

  if (request.method !== "POST") {
    return voiceJsonResponse(request, 405, { error: "Method not allowed." });
  }

  const origin = request.headers.get("Origin") || "";
  if (!allowedOrigins.has(origin)) {
    return voiceJsonResponse(request, 403, { error: "This voice service is available only inside Universal Mind." });
  }

  if (!env.OPENAI_API_KEY) {
    return voiceJsonResponse(request, 503, { error: "Voice rendering is unavailable on this environment." });
  }

  const visitorKey = request.headers.get("CF-Connecting-IP") || "unknown";
  if (env.REALTIME_RATE_LIMITER) {
    const { success } = await env.REALTIME_RATE_LIMITER.limit({ key: `mantra:${visitorKey}` });
    if (!success) {
      return voiceJsonResponse(request, 429, { error: "Please wait a moment before generating another voice." });
    }
  }

  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > 8192) {
    return voiceJsonResponse(request, 413, { error: "The voice request is too large." });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return voiceJsonResponse(request, 400, { error: "Invalid JSON request." });
  }

  const presetId = cleanVoiceContext(body?.preset, 40);
  const preset = mantraVoicePresets[presetId];
  const text = cleanVoiceContext(body?.text, 220);
  const speed = Number(body?.speed);
  const tone = Number(body?.tone);
  const effectAmount = Number(body?.effect_amount);
  if (!preset) {
    return voiceJsonResponse(request, 422, { error: "Choose one of the available voice presets." });
  }
  if (!text) {
    return voiceJsonResponse(request, 422, { error: "Write a line for the voice first." });
  }
  if (!Number.isFinite(speed) || speed < 0.55 || speed > 1.65
      || !Number.isInteger(tone) || tone < -6 || tone > 6
      || !Number.isFinite(effectAmount) || effectAmount < 0 || effectAmount > 1) {
    return voiceJsonResponse(request, 422, { error: "One or more voice controls are outside their safe range." });
  }

  const toneDirection = tone === 0
    ? "Keep the natural tonal centre of the selected voice."
    : (tone > 0
        ? `Lift the perceived vocal tone by about ${tone} semitones while avoiding thinness or squeakiness.`
        : `Lower the perceived vocal tone by about ${Math.abs(tone)} semitones while avoiding muddiness.`);
  const effectPercent = Math.round(effectAmount * 100);
  const effectDirection = effectPercent === 0
    ? "Use no added electronic character beyond the selected preset."
    : `Apply the selected electronic character at roughly ${effectPercent}% intensity. It must colour the voice without masking consonants, vowels or word boundaries.`;
  const instructions = `Create a short, production-ready spoken mantra sample.
Say only the exact supplied text. Do not add an introduction, commentary, sound effects or extra words.
Speech intelligibility is the first priority: every word and syllable must be immediately understandable, clearly articulated and evenly audible.
${preset.direction}
${toneDirection}
${effectDirection}
Keep the recording dry, close and clean enough for later music production.`;

  const openaiResponse = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
      "Accept": "audio/wav",
      "OpenAI-Safety-Identifier": await voiceSafetyIdentifier(request, "mantra"),
    },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice: preset.voice,
      input: text,
      instructions,
      response_format: "wav",
      speed: Math.round(speed * 100) / 100,
    }),
  });

  if (!openaiResponse.ok) {
    const payload = await openaiResponse.json().catch(() => ({}));
    console.error("OpenAI Mantra voice error:", openaiResponse.status, payload.error?.message || "No error message.");
    return voiceJsonResponse(request, 502, { error: "The voice could not be generated. Please try again shortly." });
  }

  const audio = await openaiResponse.arrayBuffer();
  if (audio.byteLength < 44) {
    console.error("OpenAI Mantra voice response did not contain a valid audio file.");
    return voiceJsonResponse(request, 502, { error: "The voice service returned an invalid audio file." });
  }

  return new Response(audio, {
    status: 200,
    headers: {
      ...voiceCorsHeaders(request),
      "Content-Type": "audio/wav",
      "Content-Disposition": 'inline; filename="mantra-voice.wav"',
      "Content-Length": String(audio.byteLength),
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.endsWith("/mantra-voice")) return handleMantraVoice(request, env);
    if (url.pathname.endsWith("/realtime-client-secret")) return handleRealtimeClientSecret(request, env);
    if (url.pathname.endsWith("/citizen-needs-inference")) return handleInference(request, env);

    return jsonResponse(request, 404, { error: "Not found." });
  },
};
