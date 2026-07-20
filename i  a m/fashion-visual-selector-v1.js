(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.IAMFashionVisualSelector = Object.freeze(api);
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const DISTRESS_TO_SUPPORT = Object.freeze({
    Anxiety: { Calm: 1.0, Recovery: 0.9, "Psychological Safety": 0.9, Trust: 0.45 },
    Stress: { Calm: 0.9, Recovery: 1.0, Clarity: 0.45, "Psychological Safety": 0.65 },
    Hypervigilance: { Calm: 1.0, "Psychological Safety": 1.0, Trust: 0.55, Recovery: 0.75 },
    "Startle Sensitivity": { Calm: 0.9, "Psychological Safety": 1.0, Recovery: 0.7 },
    Fear: { "Psychological Safety": 1.0, Trust: 0.8, Calm: 0.8, Hope: 0.5 },
    Anger: { "Self-Actualisation": 1.0, Motivation: 0.9, Arousal: 0.65, Clarity: 0.35 },
    Shame: { "Psychological Safety": 1.0, Hope: 0.65, Trust: 0.55, "Self-Actualisation": 0.4 },
    Loneliness: { Connection: 1.0, Belonging: 1.0, Love: 0.75, Hope: 0.55 },
    Rumination: { Clarity: 1.0, Calm: 0.8, Attention: 0.55, Recovery: 0.45 },
    "Mental Load": { Clarity: 1.0, Calm: 0.8, "Executive Function": 0.55, Recovery: 0.5 },
    Fatigue: { Motivation: 0.7, Hope: 0.55, Joy: 0.45, Arousal: 0.25 },
    "Emotional Numbing": { Joy: 0.85, Curiosity: 0.7, Connection: 0.55, Motivation: 0.45 }
  });
  const RISK_DIMENSIONS = Object.freeze([
    "Anxiety", "Stress", "Hypervigilance", "Startle Sensitivity", "Fear", "Shame", "Mental Load", "Sleep Disturbance"
  ]);

  function unit(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    return Math.max(0, Math.min(1, number));
  }

  function normaliseMap(input) {
    const result = {};
    Object.entries(input || {}).forEach(([key, value]) => { result[key] = unit(value); });
    return result;
  }

  function addWeight(target, key, amount) {
    target[key] = (target[key] || 0) + amount;
  }

  function deriveSupportGoals(citizenNeeds, requestedGoals) {
    const current = normaliseMap(citizenNeeds);
    const goals = normaliseMap(requestedGoals);

    Object.entries(current).forEach(([need, salience]) => {
      if (!salience) return;
      const mapped = DISTRESS_TO_SUPPORT[need];
      if (mapped) {
        Object.entries(mapped).forEach(([goal, weight]) => addWeight(goals, goal, salience * weight));
      } else if (!RISK_DIMENSIONS.includes(need)) {
        addWeight(goals, need, salience);
      }
    });

    const maximum = Math.max(1, ...Object.values(goals));
    Object.keys(goals).forEach((key) => { goals[key] = goals[key] / maximum; });
    return goals;
  }

  function weightedFit(scores, weights) {
    let totalWeight = 0;
    let total = 0;
    Object.entries(weights).forEach(([key, weight]) => {
      totalWeight += weight;
      total += unit(scores?.[key]) * weight;
    });
    return totalWeight ? total / totalWeight : 0.5;
  }

  function vulnerabilityPenalty(record, citizenNeeds, context) {
    const current = normaliseMap(citizenNeeds);
    const scores = record.need_scores || {};
    let numerator = 0;
    let denominator = 0;
    RISK_DIMENSIONS.forEach((key) => {
      const vulnerability = current[key] || 0;
      numerator += vulnerability * unit(scores[key]);
      denominator += vulnerability;
    });

    const sensorySensitivity = Math.max(unit(context.sensoryOverload), current.Hypervigilance || 0, current["Startle Sensitivity"] || 0);
    const visualIntensity = (unit(scores.Arousal) + unit(scores["Mental Load"]) + unit(scores["Startle Sensitivity"])) / 3;
    numerator += sensorySensitivity * visualIntensity;
    denominator += sensorySensitivity;
    return denominator ? numerator / denominator : 0;
  }

  function hardExclusion(record) {
    if (record.status !== "Candidate" && record.status !== "Approved") return "not_selectable";
    return null;
  }

  function rank(records, options) {
    const context = options || {};
    const citizenNeeds = normaliseMap(context.citizenNeeds);
    const supportGoals = deriveSupportGoals(citizenNeeds, context.supportGoals);
    const taste = context.tasteAffinities || {};
    const recent = new Set(context.recentAssetKeys || []);
    const explicit = String(context.explicitAssetRequest || "");
    const excluded = [];
    const ranked = [];

    (records || []).forEach((record) => {
      const exclusion = hardExclusion(record);
      if (exclusion && explicit !== record.asset_key) {
        excluded.push({ asset_key: record.asset_key, reason: exclusion });
        return;
      }

      const supportFit = weightedFit(record.need_scores, supportGoals);
      const editorialSafety = (
        unit(record.need_scores?.["Psychological Safety"]) +
        unit(record.need_scores?.Trust) +
        unit(record.need_scores?.Clarity)
      ) / 3;
      const riskPenalty = vulnerabilityPenalty(record, citizenNeeds, context);
      const tasteAffinity = unit(taste[record.asset_key] ?? taste[record.brand] ?? 0);
      const repetitionPenalty = recent.has(record.asset_key) ? 0.14 : 0;
      const explicitBonus = explicit === record.asset_key ? 0.75 : 0;
      const score = (
        supportFit * 0.68 +
        editorialSafety * 0.14 +
        tasteAffinity * 0.18 +
        explicitBonus -
        riskPenalty * 0.48 -
        repetitionPenalty
      );
      const topGoalMatches = Object.entries(supportGoals)
        .map(([need, weight]) => ({ need, contribution: weight * unit(record.need_scores?.[need]) }))
        .sort((a, b) => b.contribution - a.contribution)
        .slice(0, 4)
        .map((item) => item.need);

      ranked.push({
        ...record,
        recommendation_score: Number(score.toFixed(6)),
        recommendation_reason: {
          support_goal_matches: topGoalMatches,
          support_fit: Number(supportFit.toFixed(4)),
          vulnerability_penalty: Number(riskPenalty.toFixed(4)),
          taste_affinity: tasteAffinity,
          explicit_selection: explicit === record.asset_key,
          human_review_required: record.status === "Candidate" || record.safety?.trigger !== "Safe"
        }
      });
    });

    ranked.sort((a, b) => b.recommendation_score - a.recommendation_score || a.priority - b.priority || a.title.localeCompare(b.title));
    return {
      recommendations: ranked.slice(0, Math.max(1, Number(context.limit) || 3)),
      ranked,
      excluded,
      supportGoals
    };
  }

  function feedbackWeight(event) {
    const type = String(event?.type || "");
    if (type === "explicit_select") return 1;
    if (type === "repeat_select") return 0.85;
    if (type === "dwell_30_seconds") return 0.45;
    if (type === "quick_switch") return -0.2;
    return 0;
  }

  async function loadAndRank(url, options) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`Fashion Tensor fetch failed (${response.status})`);
    const catalogue = await response.json();
    return rank(catalogue.records, options);
  }

  return Object.freeze({ deriveSupportGoals, feedbackWeight, loadAndRank, rank });
});
