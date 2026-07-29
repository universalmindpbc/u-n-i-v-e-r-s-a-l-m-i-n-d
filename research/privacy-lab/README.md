# Universal Mind privacy lab v0.1

This directory makes three future-facing integrations concrete without presenting any of them as active production capability.

## Fixed separation

```text
Sensitive inference insights -> Zama TFHE-rs benchmark lane
HAPPINESS reward amounts    -> Fhenix CoFHE benchmark lane
Validated omics research    -> AWS HealthOmics readiness lane
```

- **Zama** measures whether encrypted computation is correct, usable and fast enough for the 144-dimensional synthetic form of the Universal Mind inference output. It does not receive raw check-ins, conversations, voice, identity or live citizen traffic.
- **Fhenix** is limited to confidential HAPPINESS reward amounts and balances. It does not receive or derive mental-health information. The pilot contract is separate from the current Polygon Amoy IOH contract and is not deployed.
- **AWS HealthOmics** is wired through a read-only SDK adapter. All reads, writes and research horizons remain disabled. Sequence stores are reserved for validated omics-compatible material; generic Horizon 2 biometric telemetry must not be forced into a genomics store.

No file in this lab activates live processing, issuance, genomic storage, biometric storage or citizen-data transfer.

## Stakeholder proof model

The prototype must report evidence under three headings.

### Efficiency

- key-generation time;
- client encryption time;
- encrypted-compute or coprocessor time;
- authorised decryption time;
- total latency at p50, p95 and p99;
- ciphertext and request size;
- peak memory, compute profile and estimated cost;
- transaction confirmation time and gas for the Fhenix lane.

### Efficacy

- decrypted result exactly matches the cleartext reference;
- the same fixture produces the same authorised result across repeated runs;
- overflow, missing input, replay and unauthorised access tests fail safely;
- the product can tolerate the measured overhead without weakening the ordinary experience.

The repository does not declare a latency budget before baseline measurements exist. Stakeholder results must name the library version, network, hardware, region, fixture count and date.

### Ethics

- synthetic fixtures first;
- no live citizen shadow traffic without a separate, explicit approval;
- no plaintext sensitive values in benchmark logs or result artifacts;
- key custody and decryption authority documented;
- access revocation and deletion behavior tested;
- Fhenix receives rewards data only;
- no performance result is presented as proof of privacy, clinical efficacy or regulatory compliance;
- an independent cryptographic/security review precedes any production decision.

## Prototype sequence

1. Run the Zama Rust benchmark locally with 144 synthetic integer scores.
2. Repeat on a pinned AWS CPU instance and, if justified, a supported accelerator.
3. Record results without emitting input values.
4. Compile and test the Fhenix contract in the official CoFHE mock environment.
5. Deploy the unchanged pilot to one supported Sepolia testnet only after wallet, RPC and test-fund approval.
6. Compare mock and testnet encryption, confirmation, coprocessor and decryption times.
7. Configure the HealthOmics adapter only after an AWS account, KMS key, access-log bucket and empty sequence store have been approved.
8. Prove metadata-only access before any Horizon 2 or Horizon 3 ingestion design is considered.

Official starter points:

- Zama TFHE-rs: `research/privacy-lab/zama-tfhe-benchmark/`
- Fhenix contract: `contracts/fhenix/HappinessConfidentialFhenixPilot.sol`
- HealthOmics adapter: `research/privacy-lab/healthomics-adapter.mjs`
- Required benchmark fields: `research/privacy-lab/benchmark-plan.json`

## Data ownership and shared benefit

Universal Mind uses **you own your data** in two connected senses:

1. **Agency now:** the citizen can understand, access, correct, export, pause and delete the personal data Universal Mind holds, subject to clearly stated legal retention limits.
2. **Shared benefit as the model develops:** Universal Mind's intention is that the people whose voluntary participation makes collective learning possible should share in the value that learning creates.

HAPPINESS is the current rewards-program identity. SX-1411 is recorded here only as a future value-participation hypothesis. This foundation creates no SX-1411 contract, allocation, price, redemption right, investment return or entitlement. Its relationship to HAPPINESS requires separate citizen-governance, economic, securities, tax and legal design.

## Consent language under discussion

This copy is a founder-voice draft, not a published interface:

> **May Universal Mind remember you?**
>
> With your permission, we can securely remember your check-ins and conversations across visits, helping Universal One understand you with greater care over time. Your data remains yours: you can see, change, download or delete what we remember.
>
> We believe that when our collective learning creates value, the people who make it possible should share in its benefit.

Primary actions: **Yes, remember me** / **Not now**

HAPPINESS participation should be offered separately:

> **HAPPINESS** is our mental-health rewards program. Joining is optional and separate from your privacy choices and access to Universal Mind.

This avoids making sensitive-data consent appear to be purchased with rewards. A remembered consent receipt can persist across sessions; the citizen should not be asked again unless the purpose or policy changes, the consent expires, or they revisit their choice.
