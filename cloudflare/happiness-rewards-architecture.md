# HAPPINESS rewards architecture v1

## Identity

- Currency name: **HAPPINESS**
- Ticker: **[ I o H ]**
- ERC-20 ledger symbol: **IOH**
- Meaning: **Internet of Happiness**
- Customer-facing icon: the Universal Mind flower without the Ethereum diamond
- Primary experience: desktop and tablet at `/wallet/`
- Portable mirror: Apple Wallet, introduced through an artistic QR handoff

## Current product boundary

HAPPINESS launches as a rewards programme. It is not currently backed, pegged, cash redeemable, publicly transferable or described as a stablecoin. Customer-facing surfaces do not use crypto, blockchain, token, gas or investment language.

Members may receive a genuine ERC-20 balance once the contract is activated, but this version is non-transferable, free to earn and usable only for approved programme rewards. It carries no promise of appreciation, USDC conversion, cash value, investment return or migration into a later backed version.

The HAPPINESS ERC-20 is deployed on Polygon Amoy at `0x616EF64C03D79630ECA03b5Cea4ea58a252dB68a` with an immutable 10,000,000 IOH cap and zero current supply. Issuance remains disabled. The Apple Pass Type ID `pass.tv.universalmind.happiness` is registered, while its signing certificate and private key are not yet created.

The code remains fail-closed: reward mutations, Chainlink attestation, Apple-pass issuance and USDC settlement are disabled until their required configuration is deliberately supplied.

## Pilot earning pipeline

The first pilot uses a rolling 91-day window. Baseline eligibility requires at least 51% attendance across designated special events when such events occur, plus an average of two credited healthy-participation hours per active week. Four hours is an optional enhanced-participation pathway, never an employment-status test. Up to two pause or grace weeks may be excluded without creating a punitive broken streak.

Baseline HAPPINESS amounts, individual bonus amounts, weekly award caps and collective catalogue thresholds remain `citizen_governance_configuration_required`. They must not be invented in code. Until those decisions are approved, the evaluator may determine eligibility but returns no issuable amount.

The pipeline has four independent lanes:

1. **Show up:** determine baseline eligibility from privacy-safe aggregate attendance and credited minutes.
2. **Unlock together:** evaluate collective unique-citizen and continuity targets to open catalogue tiers for every eligible citizen; this never changes individual ranking.
3. **Contribute:** recognise capped meaningful actions such as considered check-ins, mentor audio rooms, educational programmes, appropriately safety-gated EMDR practice and human-approved community contribution.
4. **Innovate:** issue only against an approved A2A innovation contribution receipt.

Repetition is capped by action and week. There are no points for raw screen time, emotional state, clinical outcome, diagnosis, maintaining a streak or proving employment status. The same idempotency key cannot issue twice, and there is no member-to-member transfer path.

## A2A mental-health innovation gateway

The Agent2Agent gateway is for agents and future agent swarms that contribute useful mental-health innovation to the Internet of Happiness, beginning with Universal Mind's I AM portal. It is not a channel for agents to use, simulate or bot the product. Automated check-ins, clicks, engagement, referrals, sessions and screen time are never eligible contributions and cannot create an agent reward receipt.

Eligible work is objective and reviewable: assistive experiences, clinical-safety tooling, interoperability adapters, privacy and security improvements, research infrastructure, responsible-AI evaluations and wellbeing accessibility. Each proposed contribution enters a sandbox, produces an immutable artifact commitment and evaluation commitment, and is assessed against a versioned acceptance rule. A human or authorised multisig quorum must approve the receipt before any HAPPINESS issuance can be requested.

The gateway follows the A2A 1.0 discovery model: a public Agent Card at `/.well-known/agent-card.json` declares an HTTP+JSON interface at `/a2a/v1`. Discovery, task intake and HAPPINESS issuance are separately gated. The draft adapter is deliberately disabled, publishes no credentials or internal details, and returns no reward until agent identity, provenance, evaluation policy, approval quorum, idempotency, caps and Polygon signing are configured.

An agent or swarm may receive a pseudonymous, non-transferable HAPPINESS balance for an accepted contribution. The receipt is not proof of clinical efficacy and contains no patient data, mood, diagnosis, individual outcome, mental-health score or speculative financial claim. Self-approval, recursive rewards, duplicate artifacts, collusive review and rewards based on generated platform traffic must be rejected.

## Chainlink trigger lanes

Chainlink has two deliberately separate lanes. Neither lane scores an individual's mental health.

### Collective participation emission pilot

The first lane seeds the IFTTT-style oracle pattern on Polygon Amoy. Once per weekly epoch, Chainlink can attest aggregate unique eligible check-ins and aggregate continuity. If both governance-configured thresholds are reached, the contract mints a fixed, capped HAPPINESS pool into the community rewards treasury.

The pilot never mints per click, never rewards screen time, never publishes an individual's frequency and never uses mood or diagnosis. Sybil resistance is applied before aggregation. The epoch amount, weekly cap and total testnet cap must all be configured before the lane can be enabled. Mainnet activation requires separate economic, abuse, privacy and security review.

### Cohort-impact funding

The second lane is a future impact-financing mechanism. It does not decide individual HAPPINESS rewards. Instead, it can attest that a pre-agreed platform-level milestone has been independently verified and authorise the release of sponsor funds already escrowed or contractually committed for that funding stage.

Initial milestones may include aggregate check-in continuity and aggregate referral-pathway uptake. A later milestone may represent an independently registered, reviewed and published study. Any mRNA-seq or other biological research remains entirely off-chain: Chainlink receives only a signed study-level attestation, methodology commitment and publication or evidence commitment—never raw sequence data, an individual result, clinical notes, patient identifiers, mood or diagnosis.

For the RCT pathway, Triall is the planned integrity and provenance origin. Triall's published description of its Verifiable Proof API says study data or performance metrics can be timestamped to provide evidence that the data existed at a given time and was not later altered. That proof establishes integrity, not scientific meaning. A separately authorised scientific review commitment records that the predefined result threshold was met; an investor milestone commitment records the funding terms agreed before the result was known.

The exact Triall integration remains `interface_pending_vendor_diligence`. We must confirm whether the production handoff is a public event, proof-verification API, signed export or another supported interface before implementing the adapter. Chainlink will consume only the verified proof reference and the authorised aggregate conclusion.

Chainlink CRE is the planned orchestration layer. A versioned CRE workflow can retrieve approved aggregate evidence, validate the pinned attestation schema and submit only the authorised on-chain action. The workflow artifact and capability configuration must both be content-hash pinned, secrets must stay outside source, and the receiving contract must reject duplicate, expired or unauthorised attestations. CRE does not decide scientific efficacy and it cannot create or compel sponsor money. CRE workflow deployment is currently Early Access, so the adapter remains fail-closed until Universal Mind has deployment access and has completed simulation and review. `HappinessCommunityOracle` remains prepared but not deployed: its Amoy forwarder and HAPPINESS address are pinned, but the per-epoch cap, CRE workflow identity, deployment and issuer-role grant remain deliberately unset.

The CRE workflow submits a signed report through Chainlink's network-specific `KeystoneForwarder` to `HappinessCommunityOracle`. The consumer pins the forwarder at construction and permits a one-time pin of the workflow ID and workflow author, enforces expiry, replay protection and an immutable per-epoch cap, then calls only the community-pool issuance path. A workflow identity change requires a new consumer deployment and an explicit role rotation. The consumer contract receives only the community-pool issuer role. It can never mint directly to a citizen or agent address. Member and agent rewards remain behind the separately governed member-issuer role.

## Ledger path

1. A private eligibility service validates an approved visit or attendance event against a published programme rule.
2. It creates a privacy-preserving, idempotent earning intent without placing health, mood or identity data on-chain.
3. The Polygon rewards adapter submits the corresponding ERC-20 mint or redemption transaction under the programme's audited issuance rules.
4. An indexer waits for confirmation and updates the read model used by desktop and Apple Wallet.
5. Apple Wallet receives a pass update only after the confirmed balance changes.

The Polygon address-to-member mapping stays private. Public events contain pseudonymous addresses, amounts and non-sensitive programme references only.

## Circle / USDC reserve adapter

The reserve boundary is deliberately separate from HAPPINESS issuance. The Circle Wallets read-only reserve reconciliation adapter is implemented for developer-controlled wallets on `MATIC-AMOY`, pinned to Amoy USDC at `0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582`. It can read and reconcile one explicitly configured treasury wallet after a Circle API key, wallet ID and treasury address are stored as secrets or environment configuration. It cannot create a wallet, move USDC, mint HAPPINESS, confirm backing or enable settlement.

A later Chainlink plus Circle/USDC activation may:

- verify privacy-safe cohort milestones against an agreed methodology;
- release only sponsor USDC that is already escrowed, approved or contractually committed;
- reconcile USDC held in a designated treasury;
- calculate verified reserve coverage;
- gate any future redemption or stability claim on actual available reserves; and
- produce an auditable reserve report.

Adding USDC infrastructure does not itself make HAPPINESS a stablecoin. Backing, legal rights, treasury controls, independent review and regulatory approval must exist before any peg or redemption claim is enabled. Circle entity-secret registration is required only when Universal Mind deliberately adds developer-controlled wallet creation or transaction operations; no such write operation exists in this version.

## Activation gates

### Polygon ERC-20

- reviewed contract and verified test suite;
- Polygon Amoy deployment completed at `0x616EF64C03D79630ECA03b5Cea4ea58a252dB68a`, with read-only state verified;
- a separate scoped issuer address backed by a managed secret or KMS reference, never the deployer key and never in source;
- non-transferable member balances, immutable supply cap and emergency pause;
- idempotent earn and redeem intents;
- reorg and failed-transaction handling;
- independent security review before Polygon mainnet.

### Chainlink CRE oracle

- CRE account and deployment access;
- Chainlink's current Polygon Amoy `KeystoneForwarder` pinned in the consumer deployment configuration;
- workflow identifier, workflow artifact hash and capability-configuration hash pinned in configuration;
- private API authentication stored as encrypted secret material;
- versioned cohort-impact attestation schema and pre-agreed funding stages;
- independent evaluator identity and methodology commitments;
- Triall proof verification and study-registry commitment;
- scientific-review and investor-milestone commitments agreed before results are unblinded;
- no individual health, genomic, mood or clinical data;
- sponsor escrow or allowance and a legally binding stage-gated funding agreement;
- replay protection, expiry, maximum release and emergency pause controls;
- independent technical, scientific, privacy and legal review before enabling fund release.

### Collective emission pilot

- Polygon Amoy only and clearly identified as an unbacked testnet simulation;
- weekly unique-check-in and continuity thresholds approved through governance;
- fixed epoch amount, weekly cap and total cap;
- privacy-safe aggregation and Sybil-resistance evidence;
- mint destination fixed to the community rewards treasury;
- pause, replay and duplicate-epoch protection;
- separate approval required before any mainnet emission policy.

### Apple Wallet

- Apple Developer Pass Type ID registered as `pass.tv.universalmind.happiness`;
- production signing certificate;
- personalised pass generator;
- HTTPS registration and update endpoints;
- artistic QR handoff with a normal scannable quiet zone;
- balance update after confirmed ledger events.
- unsigned source-bundle generation for design QA before credentials exist;
- SHA-1 manifest generation and PKCS #7 detached signing when the Pass Type certificate, private key and Apple WWDR certificate are supplied;
- Apple-standard registration, update, unregister and pass-delivery routes, all disabled until authenticated storage and signing are active.

### A2A innovation gateway

- A2A 1.0 Agent Card and versioned HTTP+JSON interface;
- authenticated, rate-limited task intake with malware and prompt-injection isolation;
- contribution types limited to reviewable mental-health innovation;
- immutable agent, swarm, artifact, evaluation and approver commitments;
- sandboxed tests and a content-hash-pinned evaluation policy;
- human or authorised multisig approval quorum;
- per-contribution, per-agent, per-swarm and epoch issuance caps;
- replay protection and duplicate-artifact detection;
- no rewards for check-ins, clicks, engagement, referrals, sessions or screen time;
- no patient, clinical, mood, diagnosis or individual outcome data; and
- separate security, clinical-safety, abuse and economic review before activation.

### Circle / USDC

- read-only Circle Wallets balance adapter implemented and disabled by default;
- Circle standard API key, developer-controlled wallet ID and exact treasury address configured outside source before reserve reads;
- actual reserve treasury;
- sponsor/investment funds received;
- legal and accounting treatment agreed;
- Circle credentials kept in secret storage;
- reconciliation, reserve coverage and exception handling tested;
- explicit approval before any customer-facing backing language.

## Versioned interfaces

The desktop wallet, Apple pass service, Polygon ledger adapter and future reserve adapter communicate through versioned application interfaces. Each surface can evolve without changing the currency identity or forcing members to understand the underlying infrastructure.

## Primary technical references

- [Agent2Agent Protocol 1.0 specification](https://a2a-protocol.org/latest/specification/)
- [A2A Agent Discovery and Agent Cards](https://a2a-protocol.org/latest/topics/agent-discovery/)
- [Chainlink CRE overview](https://docs.chain.link/cre)
- [Chainlink CRE getting started](https://docs.chain.link/cre/getting-started/overview)
- [Circle Wallets supported blockchains](https://developers.circle.com/wallets/supported-blockchains)
- [Circle USDC contract addresses](https://developers.circle.com/stablecoins/usdc-contract-addresses)
- [Triall description of its Verifiable Proof API](https://medium.com/triall/triall-product-spotlight-reporting-analytics-9fb133837cfb)
