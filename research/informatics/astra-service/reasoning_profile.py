"""Server-owned reasoning profiles; preserve each study's approved settings."""
from copy import deepcopy

LEGACY = {
    'version': 'low-v1',
    'astra': {'model': 'gpt-6-astra', 'effort': 'low', 'plan_output_tokens': 1200,
              'report_output_tokens': 1500, 'timeout_seconds': 90},
    'gemini': {'model': 'gemini-4-argon', 'thinking_level': 'LOW',
               'max_output_tokens': 2048, 'timeout_seconds': 180},
}
STAGING_FIRST = {
    'version': 'high-max-20261109',
    'astra': {'model': 'gpt-6-astra', 'effort': 'max', 'plan_output_tokens': 8192,
              'report_output_tokens': 8192, 'timeout_seconds': 300},
    'gemini': {'model': 'gemini-4-argon', 'thinking_level': 'HIGH',
               'max_output_tokens': 8192, 'timeout_seconds': 300},
}
STAGING = deepcopy(STAGING_FIRST)
STAGING['version'] = 'high-max-64k-20261109'
STAGING['astra'].update(plan_output_tokens=16384, report_output_tokens=16384,
                        timeout_seconds=600, study_token_limit=64000,
                        service_tier='default')

def profile_for_origin(origin):
    if origin in ('https://staging.universalmind.tv', 'https://universalmind.tv'):
        return deepcopy(STAGING)
    raise ValueError('Unknown research origin')

def profile_for_checkpoint(origin, values):
    """Resume an existing study at its original effort, without mixing receipts."""
    if not values:
        return profile_for_origin(origin)
    saved = values.get('model_settings', values.get('__start__', {}).get('model_settings', LEGACY))
    if saved not in (LEGACY, STAGING_FIRST, STAGING):
        raise ValueError('Unknown saved reasoning profile')
    profile_for_origin(origin)
    return deepcopy(saved)

def profile_for_task(origin, values, policy):
    if values:
        return profile_for_checkpoint(origin, values)
    profile = profile_for_origin(origin)
    if policy.get('maxModelTokens', 24000) == 24000:
        return deepcopy(STAGING_FIRST if origin == 'https://staging.universalmind.tv' else LEGACY)
    if policy.get('maxModelTokens', 24000) != profile['astra'].get('study_token_limit', 24000):
        raise ValueError('Study allowance differs from its server profile')
    return profile

def review_budget_for_checkpoint(origin, values, policy=None):
    """Carry forward the funded High ledger; never reset usage on promotion."""
    profile = profile_for_task(origin, values, policy) if policy is not None else profile_for_checkpoint(origin, values)
    if profile in (STAGING_FIRST, STAGING):
        return ('state/shared/gemini-high-staging-20261109.sqlite', 2_000_000)
    return ('state/shared/gemini-review-usage.sqlite', 1_000_000)
