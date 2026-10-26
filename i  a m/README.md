# I AM portal source

This directory contains the main Universal Mind I AM portal implementation. Start at the [repository README](../README.md) for the complete project and its supporting services.

The established deployment maps this directory to `/vogue/iam/`. The repository root also contains routing, database, Worker, wallet, deployment and research infrastructure. Moving this directory alone does not reproduce the whole system.

| Area | Entry points |
| --- | --- |
| Portal and check-in | `index.html`, `induction.html`, `homepage-checkin.js` |
| Adaptive selection and policy | `selector_core.py`, `adaptive_inference_matrix.py`, versioned policy and catalogue files |
| Sound and audiovisual experiments | `adaptive-sound/`, `adaptive-sound-research-hypotheses-v1.json`, media controllers and visual modules |
| Research and study interfaces | `research/`, `study.php`, `research.html`, `science.html` |
| Server endpoints | `api/` and the supporting service code elsewhere in the repository |

See [Academic Context and Doctoral Foundations](../docs/PHD_REVIEW.md), [licensing](../LICENSING.md) and the [deployment workflow](../DEPLOYMENT.md). Academic execution or modification requires individual written permission. Normal use of the hosted portal is separate.
