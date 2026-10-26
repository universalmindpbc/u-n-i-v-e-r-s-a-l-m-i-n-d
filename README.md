# Universal Mind I AM

An adaptive audiovisual portal exploring the relationship between music, visual experience, self-report and wellbeing research.

**Founder and maintainer:** Ben Korbel<br>
**Copyright holder:** Universal Mind TV, Public Benefit Corporation<br>
**Website:** [universalmind.tv](https://universalmind.tv)<br>
**Proofing environment:** [staging.universalmind.tv](https://staging.universalmind.tv)

I AM brings check-in interfaces, adaptive media selection, sound and visual experiments, research pages and supporting services into one portal. The repository contains implemented software alongside prototypes, research material and proposed capabilities. A working interface or software test does not establish clinical efficacy or a validated biological claim.

## Start here

- [Portal source and component guide](i%20%20a%20m/README.md)
- [Academic Context and Doctoral Foundations](#academic-context-and-doctoral-foundations)
- [Cross-project doctoral review guide](docs/PHD_REVIEW.md)
- [Licence and permission requests](LICENSING.md)
- [Deployment workflow](DEPLOYMENT.md)

## Repository map

| Location | Responsibility |
| --- | --- |
| [`i  a m/`](i%20%20a%20m/) | Main portal source, audiovisual experience, check-in, APIs and research interfaces. |
| [`cloudflare/`](cloudflare/) | Supporting service and Worker implementations. |
| [`database/`](database/) | Data infrastructure and schema documentation. |
| [`apple-wallet/`](apple-wallet/) and [`contracts/`](contracts/) | Wallet and rewards-related integrations and prototypes. |
| [`research/`](research/) | Research foundations, experiments and verification records. |
| [`tools/`](tools/) | Build, export, checking and operational utilities. |
| `index.html`, `.htaccess`, [`vogue/`](vogue/) and [`iam/`](iam/) | Entry points, routing and compatibility paths. |
| [`Informatics/`](Informatics/) | Existing integrated Informatics source; its dedicated presentation repository is linked below. |

The repository root is the starting point for the complete I AM project. The main portal implementation is in `i  a m/`; the established Panthur workflow publishes it under `/vogue/iam/`. Supporting directories are part of the complete system.

## Related projects

- [Universal Informatics](https://github.com/universalmindpbc/u-n-i-v-e-r-s-a-l-i-n-f-o-r-m-a-t-i-c-s) — dedicated application, research, service and verification source, with pinned provenance to the integrated version.
- [Re-Model Intelligence](https://github.com/universalmindpbc/r-e-m-o-d-e-l-i-n-t-e-l-i-g-e-n-c-e) — complete portal frontend, API backend and research workflows.

The existing integrated I AM files, website addresses and deployment methods remain in place. The Informatics repository provides an individually reviewable project without relocating its hosted portal.

## Academic Context and Doctoral Foundations

The software supplies a platform for investigating adaptive audiovisual interaction and research methods. Review [`selector_core.py`](i%20%20a%20m/selector_core.py), [`adaptive_inference_matrix.py`](i%20%20a%20m/adaptive_inference_matrix.py), [`adaptive-sound/`](i%20%20a%20m/adaptive-sound/), [`i  a m/research/`](i%20%20a%20m/research/) and [`research/privacy-lab/`](research/privacy-lab/) alongside their evidence, policies and tests.

The [doctoral review guide](docs/PHD_REVIEW.md) distinguishes existing background software/IP, implemented methods, exploratory hypotheses and future validation. It also maps I AM to Informatics and Re-Model. No institutional endorsement or clinical validation is implied.

## Working with the source

This repository combines browser JavaScript/HTML/CSS, PHP endpoints, Python research code and supporting services. There is no single root install command. Start with the relevant component documentation, [`database/README.md`](database/README.md), [`adaptive-sound/README.md`](i%20%20a%20m/adaptive-sound/README.md) and [DEPLOYMENT.md](DEPLOYMENT.md). Credentials and private runtime data are configured separately.

Development follows the existing local → Panthur staging → review → explicitly approved production workflow. GitHub is the version and audit record; a documentation push is not a website deployment. Academic and other source-software use requires written permission before execution or modification.

## Ownership, citation and licence

This is source-available software under a [permission-required notice](LICENSE). Approved organisations below USD 1 million annual revenue receive a fee-free licence within the agreed scope; organisations at or above that threshold negotiate a nominal fee in good faith. Academic researchers also apply individually. Normal website access is separate from source-software permission.

See [LICENSING.md](LICENSING.md), [MAINTAINERS.md](MAINTAINERS.md), [CITATION.cff](CITATION.cff) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
