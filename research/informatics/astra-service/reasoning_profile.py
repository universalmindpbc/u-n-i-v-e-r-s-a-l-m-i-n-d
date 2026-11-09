"""Server-owned reasoning profiles; production remains on its approved settings."""
from copy import deepcopy

LEGACY = {
    'version': 'low-v1',
    'astra': {'model': 'gpt-6-astra', 'effort': 'low', 'plan_output_tokens': 1200,
              'report_output_tokens': 1500, 'timeout_seconds': 90},
    'gemini': {'model': 'gemini-4-argon', 'thinking_level': 'LOW',
               'max_output_tokens': 2048, 'timeout_seconds': 180},
}
STAGING = {
    'version': 'high-max-20261109',
    'astra': {'model': 'gpt-6-astra', 'effort': 'max', 'plan_output_tokens': 8192,
              'report_output_tokens': 8192, 'timeout_seconds': 300},
    'gemini': {'model': 'gemini-4-argon', 'thinking_level': 'HIGH',
               'max_output_tokens': 8192, 'timeout_seconds': 300},
}

def profile_for_origin(origin):
    if origin == 'https://staging.universalmind.tv':
        return deepcopy(STAGING)
    if origin == 'https://universalmind.tv':
        return deepcopy(LEGACY)
    raise ValueError('Unknown research origin')

def profile_for_checkpoint(origin, values):
    """Resume an existing study at its original effort, without mixing receipts."""
    if not values:
        return profile_for_origin(origin)
    saved = values.get('model_settings', values.get('__start__', {}).get('model_settings', LEGACY))
    if saved not in (LEGACY, STAGING):
        raise ValueError('Unknown saved reasoning profile')
    if origin == 'https://universalmind.tv' and saved != LEGACY:
        raise ValueError('The reasoning upgrade is staging-only')
    profile_for_origin(origin)
    return deepcopy(saved)

def review_budget_for_checkpoint(origin, values):
    """A new ledger must be explicitly seeded before higher-effort work can run."""
    profile = profile_for_checkpoint(origin, values)
    if profile == STAGING:
        return ('state/shared/gemini-high-staging-20261109.sqlite', 2_000_000)
    return ('state/shared/gemini-review-usage.sqlite', 1_000_000)
