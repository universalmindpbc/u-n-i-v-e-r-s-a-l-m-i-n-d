# Quantum Lab funded research gateway

## Product decision

Ben selected Universal Informatics funding for approved researchers, with an individual budget per researcher. The three tiers are Explore, Experiment and Funded Researcher. Quantum Lab follows Transcription Atlas in the shared navigation.

## This staging release

- Explore: public archived results, workflow and literature.
- Experiment: parameterised two-atom simulations, independent numerical checks, run IDs, parent-run links, local history, import/export and offline Python reproduction.
- Funded Researcher: visible access model and locally exported review package. No researcher authentication, server persistence, budget allocation or website hardware dispatch is activated in this release. The review file explicitly records LOCAL_DRAFT_NOT_SUBMITTED.
- No AWS, qBraid or D-Wave credentials enter the browser or deployment. No public hardware-submission endpoint exists.
- Browser storage is local to the browser profile, not an authenticated private cloud workspace. It is bounded to the latest 30 runs; exports provide durable records.

## Required server contract before hardware activation

Use authenticated researcher identities with server-held grants. A grant contains project ID, active/revoked state, allowed provider/device/model versions, shot limits, allocation in integer monetary units, currency, expiry and administrator audit metadata. Browser controls never establish authorisation.

The server validates the canonical experiment, allowed model version, provider-specific units and device capabilities. Aquila analog programmes, D-Wave BQM/Ising objectives and Willow gate circuits are separate adapters. A successful mapping on one device does not establish compatibility with another.

In a database transaction, create a run and unique idempotency key, lock the researcher's allocation, verify available funds, and reserve an authoritative cost estimate. Include provider task fees, shots, applicable storage/compute and an administrator-set allowance. The UI displays that estimate and the researcher's allocation before submission. No budget amounts are inferred from the earlier US$2 demo cap.

Dispatch using a restricted service identity and temporary credentials. Keep request hashes, provider task IDs and immutable audit records. A retry reuses the job and idempotency key. An intentional rerun gets a new run and reservation. If submission outcome is unknown after a timeout, retain the reservation and reconcile by the provider idempotency mechanism; never blindly resubmit or release funds.

State transitions: draft → validated → reserved → dispatching → submitted → running → completed/failed/cancelled. Unknown provider state is explicit. Reconcile actual charges before releasing unused reserved funds. Never assume cancellation or failure is free. Concurrent submissions cannot overspend the same allocation.

Results remain owned by the authenticated researcher/project. Sharing requires explicit researcher action. Preserve raw measurements, vacancies/failed shots, device metadata, compiler/solver versions, bit ordering, uncertainty, cost and timing. Keep simulation and QPU measurements distinct.

## Activation dependencies

1. Researcher sign-in and administrative grant management on the existing backend.
2. Durable run/queue/budget storage with transactional reservation and revocation.
3. Restricted cloud service identity, provider access and validated adapters.
4. Server capability API, authenticated job submission/status/result routes, audit and cost reconciliation.
5. Tests for unauthenticated/expired/revoked access, cross-project isolation, per-device grants, concurrent budget reservation, duplicate requests, provider timeouts, failures, cancellations and result access.
6. One explicitly authorised end-to-end hardware test with a concrete budget. Ben's earlier one-shot demo approval covers the existing Aquila task only.

D-Wave access remains unverified after the trial application. Google Willow is a selective research-access programme, not an installed public provider. Neither is presented as an active website connection.

## Source basis

- https://docs.aws.amazon.com/braket/latest/developerguide/braket-devices.html
- https://docs.aws.amazon.com/braket/latest/developerguide/braket-quera-submitting-analog-program-aquila.html
- https://quantumai.google/willowearlyaccess
- Provider details checked 25 October 2026. Paper metadata and original summaries checked 24 October 2026.
