export const HAPPINESS_PILOT_POLICY = Object.freeze({
  schemaVersion: "happiness_pilot_policy_v1",
  rollingWindowDays: 91,
  baseline: Object.freeze({
    designatedEventAttendanceBps: 5100,
    weeklyMinutes: 120,
    enhancedWeeklyMinutes: 240,
    maximumCreditedWeeklyMinutes: 240,
    graceWeeks: 2,
  }),
  collective: Object.freeze({
    catalogueTiers: Object.freeze(["foundation", "shared", "expanded", "signature"]),
    thresholds: "citizen_governance_configuration_required",
    affectsMemberRanking: false,
  }),
  bonuses: Object.freeze({
    awardUnits: "citizen_governance_configuration_required",
    weeklyAwardCap: "citizen_governance_configuration_required",
    actions: Object.freeze({
      considered_checkin: Object.freeze({ weeklyCountCap: 3 }),
      mentor_audio_room: Object.freeze({ minimumMinutes: 20, weeklyCountCap: 2 }),
      educational_programme: Object.freeze({ minimumCompletionBps: 7000, weeklyCountCap: 2 }),
      emdr_practice: Object.freeze({ minimumMinutes: 10, weeklyCountCap: 1, requiresSafetyGate: true }),
      community_contribution: Object.freeze({ weeklyCountCap: 2, requiresHumanApproval: true }),
    }),
  }),
  guardrails: Object.freeze({
    moodOrOutcomeScoring: false,
    streakLoss: false,
    unlimitedRepetition: false,
    screenTimeReward: false,
    employmentVerification: false,
  }),
});

const UNSIGNED_INTEGER = /^\d+$/;
const LEDGER_LANES = new Set(["baseline", "citizen_bonus", "collective_pool", "agent_innovation"]);

function unsigned(value, field) {
  const normalized = String(value ?? "");
  if (!UNSIGNED_INTEGER.test(normalized)) throw new Error(`invalid_${field}`);
  return BigInt(normalized);
}

export function evaluateBaselineEligibility(metrics = {}, policy = HAPPINESS_PILOT_POLICY) {
  const attended = unsigned(metrics.designated_events_attended, "designated_events_attended");
  const available = unsigned(metrics.designated_events_available, "designated_events_available");
  const creditedMinutes = unsigned(metrics.credited_minutes, "credited_minutes");
  const activeWeeks = unsigned(metrics.active_weeks, "active_weeks");
  const pausedWeeks = unsigned(metrics.paused_weeks ?? "0", "paused_weeks");
  if (attended > available) throw new Error("attendance_exceeds_available_events");
  if (activeWeeks === 0n) throw new Error("baseline_window_has_no_active_weeks");
  if (pausedWeeks > BigInt(policy.baseline.graceWeeks)) throw new Error("baseline_grace_weeks_exceeded");

  const attendanceBps = available === 0n ? null : Number((attended * 10000n) / available);
  const averageWeeklyMinutes = Number(creditedMinutes / activeWeeks);
  const eventRequirementMet = attendanceBps === null || attendanceBps >= policy.baseline.designatedEventAttendanceBps;
  const timeRequirementMet = averageWeeklyMinutes >= policy.baseline.weeklyMinutes;

  return {
    schema_version: "happiness_baseline_eligibility_v1",
    rolling_window_days: policy.rollingWindowDays,
    eligible: eventRequirementMet && timeRequirementMet,
    event_requirement_applied: available > 0n,
    designated_event_attendance_bps: attendanceBps,
    minimum_designated_event_attendance_bps: policy.baseline.designatedEventAttendanceBps,
    average_weekly_minutes: averageWeeklyMinutes,
    minimum_weekly_minutes: policy.baseline.weeklyMinutes,
    enhanced_pathway_reached: averageWeeklyMinutes >= policy.baseline.enhancedWeeklyMinutes,
    paused_weeks: Number(pausedWeeks),
    award_units: null,
    award_status: "citizen_governance_amount_required",
    reasons: [
      eventRequirementMet ? "designated_event_requirement_met" : "designated_event_requirement_not_met",
      timeRequirementMet ? "healthy_participation_requirement_met" : "healthy_participation_requirement_not_met",
    ],
  };
}

export function evaluateCitizenBonus(intent = {}, history = {}, policy = HAPPINESS_PILOT_POLICY) {
  const action = policy.bonuses.actions[intent.action_type];
  if (!action) throw new Error("citizen_bonus_action_not_supported");
  const weeklyCount = Number(unsigned(history.weekly_count ?? "0", "weekly_count"));
  if (weeklyCount >= action.weeklyCountCap) {
    return { eligible: false, reason: "healthy_weekly_cap_reached", award_units: "0" };
  }
  if (action.minimumMinutes && Number(unsigned(intent.verified_minutes ?? "0", "verified_minutes")) < action.minimumMinutes) {
    return { eligible: false, reason: "minimum_meaningful_participation_not_reached", award_units: "0" };
  }
  if (action.minimumCompletionBps && Number(unsigned(intent.completion_bps ?? "0", "completion_bps")) < action.minimumCompletionBps) {
    return { eligible: false, reason: "minimum_educational_completion_not_reached", award_units: "0" };
  }
  if (action.requiresSafetyGate && intent.safety_gate_confirmed !== true) {
    return { eligible: false, reason: "clinical_safety_gate_required", award_units: "0" };
  }
  if (action.requiresHumanApproval && intent.human_approved !== true) {
    return { eligible: false, reason: "human_approval_required", award_units: "0" };
  }
  if (Object.hasOwn(intent, "mood") || Object.hasOwn(intent, "outcome_score") || Object.hasOwn(intent, "diagnosis")) {
    throw new Error("subjective_or_clinical_bonus_field_forbidden");
  }
  return {
    eligible: true,
    reason: "meaningful_action_verified",
    award_units: null,
    award_status: "citizen_governance_amount_required",
    next_weekly_count: weeklyCount + 1,
    weekly_count_cap: action.weeklyCountCap,
  };
}

export function evaluateCollectiveUnlock(metrics = {}, tiers = []) {
  if (!Array.isArray(tiers) || tiers.length === 0) {
    return {
      current_tier: "foundation",
      unlocked_index: 0,
      status: "citizen_governance_thresholds_required",
      member_ranking_changed: false,
    };
  }
  const uniqueCitizens = unsigned(metrics.unique_eligible_citizens, "unique_eligible_citizens");
  const continuityBps = unsigned(metrics.continuity_rate_bps, "continuity_rate_bps");
  if (continuityBps > 10000n) throw new Error("collective_continuity_out_of_range");
  let unlockedIndex = 0;
  for (let index = 0; index < tiers.length; index += 1) {
    const tier = tiers[index];
    const minimumCitizens = unsigned(tier.minimum_unique_citizens, "minimum_unique_citizens");
    const minimumContinuity = unsigned(tier.minimum_continuity_bps, "minimum_continuity_bps");
    if (uniqueCitizens >= minimumCitizens && continuityBps >= minimumContinuity) unlockedIndex = index;
  }
  return {
    current_tier: tiers[unlockedIndex].id,
    unlocked_index: unlockedIndex,
    status: "evaluated",
    member_ranking_changed: false,
  };
}

export function createSimulatedLedger() {
  const balances = new Map();
  const processed = new Map();
  const events = [];

  function issue(intent = {}) {
    if (!LEDGER_LANES.has(intent.lane)) throw new Error("ledger_lane_not_supported");
    if (!/^[a-z0-9][a-z0-9._:-]{7,127}$/i.test(String(intent.idempotency_key || ""))) {
      throw new Error("invalid_ledger_idempotency_key");
    }
    if (!/^[a-z0-9][a-z0-9._:-]{2,127}$/i.test(String(intent.recipient || ""))) {
      throw new Error("invalid_ledger_recipient");
    }
    const units = unsigned(intent.units, "ledger_units");
    if (units === 0n) throw new Error("ledger_units_must_be_positive");
    if (processed.has(intent.idempotency_key)) return processed.get(intent.idempotency_key);
    const balance = (balances.get(intent.recipient) || 0n) + units;
    balances.set(intent.recipient, balance);
    const event = Object.freeze({
      sequence: events.length + 1,
      idempotency_key: intent.idempotency_key,
      recipient: intent.recipient,
      lane: intent.lane,
      units: units.toString(),
      balance_units: balance.toString(),
    });
    processed.set(intent.idempotency_key, event);
    events.push(event);
    return event;
  }

  return Object.freeze({
    issue,
    balanceOf(recipient) { return (balances.get(recipient) || 0n).toString(); },
    events() { return events.slice(); },
  });
}

export function pilotReadiness(env = {}) {
  return {
    enabled: String(env.HAPPINESS_PILOT_ENABLED || "false") === "true",
    simulation_enabled: String(env.HAPPINESS_SIMULATION_ENABLED || "false") === "true",
    member_reads_enabled: String(env.HAPPINESS_MEMBER_READS_ENABLED || "false") === "true",
    baseline_amount_configured: Boolean(env.HAPPINESS_BASELINE_AWARD_UNITS),
    citizen_bonus_amounts_configured: Boolean(env.HAPPINESS_CITIZEN_BONUS_RULES_HASH),
    collective_thresholds_configured: Boolean(env.HAPPINESS_COLLECTIVE_UNLOCK_RULES_HASH),
    identity_provider_configured: Boolean(env.HAPPINESS_IDENTITY_ISSUER),
  };
}

export function assertPilotReady(env = {}) {
  const readiness = pilotReadiness(env);
  if (!readiness.enabled) throw new Error("happiness_pilot_disabled");
  if (!env.HAPPINESS_INTERNAL_TOKEN) throw new Error("happiness_internal_auth_not_configured");
  return readiness;
}

export function publicPilotConfig(policy = HAPPINESS_PILOT_POLICY) {
  return {
    schema_version: policy.schemaVersion,
    rolling_window_days: policy.rollingWindowDays,
    baseline: {
      minimum_designated_event_attendance_bps: policy.baseline.designatedEventAttendanceBps,
      universal_weekly_minutes: policy.baseline.weeklyMinutes,
      optional_enhanced_weekly_minutes: policy.baseline.enhancedWeeklyMinutes,
      grace_weeks: policy.baseline.graceWeeks,
      award_units: null,
    },
    collective: {
      catalogue_tiers: policy.collective.catalogueTiers,
      thresholds: null,
      member_ranking: false,
    },
    bonuses: {
      actions: Object.keys(policy.bonuses.actions),
      award_units: null,
      weekly_award_cap: null,
    },
    guardrails: {
      no_mood_or_outcome_scoring: true,
      no_streak_loss: true,
      no_unlimited_repetition: true,
      no_screen_time_reward: true,
      no_employment_verification: true,
    },
  };
}
