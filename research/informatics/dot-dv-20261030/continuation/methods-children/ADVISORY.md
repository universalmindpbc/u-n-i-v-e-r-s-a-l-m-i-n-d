# Proposed methods correction: preschool Kids Club family

The frozen batch `batch-8bd70e21e48d9a70` remains unchanged. This advisory is a proposed review correction, not human approval or a new staging revision.

Galano et al., PMID35285428, [publisher full text](https://www.cambridge.org/core/services/aop-cambridge-core/content/view/B1A750E6EE2865948819845018AF7C9B/S0954579422000104a.pdf/div-class-title-eight-year-trajectories-of-behavior-problems-and-resilience-in-children-exposed-to-early-life-intimate-partner-violence-the-overlapping-and-distinct-effects-of-individual-factors-maternal-characteristics-and-early-intervention-div.pdf), printed p853 (PDF page4), **Methods → Procedures**, describes allocation as:

> “the first six families were in the intervention condition, the following six were in the control condition, and so forth.”

This describes sequential alternating blocks. The authors call it block randomization, but the inspected methods do not describe a stochastic sequence, randomized starting order, or concealment. Accordingly, its existing one-cross classification should be treated as **randomization unverified pending reconciliation**. This is not proof that no unreported random mechanism existed.

The same paper reports nine waitlist crossovers modeled through changed treatment assignment (p854), and no significant treatment-by-time effects (pp855–856). Its abstract's intention-to-treat label therefore needs qualification; positive dose findings are post-hoc associations. Only 68/120 families attended the long-term visit.

The concern potentially affects PMID25596929: both describe the 120-family preschool intervention, US/Canada locations and linked assessment schedule, and the follow-up cites the 2015 evaluation. The2015 original methods have not been accessed; that paper's classification concern remains **provisional**, not independently confirmed.

`proposed-deltas.json` binds suggested field changes to the exact original IDs and content hashes. It must not be applied automatically. Other queued papers remain under investigation.
