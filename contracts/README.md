# HAPPINESS ERC-20 rewards ledger

`HappinessRewards.sol` is the non-transferable HAPPINESS rewards contract candidate for Polygon.

## Current constraints

- six decimal places;
- immutable total supply cap;
- separate member-issuance and community-pool roles, so an oracle workflow can never mint directly to a member;
- no member-to-member transfers;
- no cash redemption or reserve claim;
- replay-protected member and community-pool issuance;
- role-controlled redemption burns;
- emergency pause;
- opaque operation identifiers only—no health, check-in or identity data on-chain.

The ERC-20 ledger symbol is `IOH`; customer-facing artwork and copy render the ticker as `[ I o H ]`.

`HappinessCommunityOracle.sol` is the separate Chainlink CRE consumer. It accepts only 64-byte production metadata from the configured `KeystoneForwarder`, requires a one-time-pinned workflow ID and author, enforces report expiry, replay protection and an immutable per-epoch cap, and can call only the community-pool issuance path. Grant it `COMMUNITY_ISSUER_ROLE` only after its workflow identity is configured and tested. A workflow identity change requires a new consumer deployment and an explicit role rotation.

The first deployment target is Polygon Amoy. A testnet deployment is not production activation. Polygon mainnet deployment requires a professional smart-contract audit, Australian digital-asset legal review, controlled issuer key management and an approved rewards economy.

The first wallet-signed Amoy deployment is recorded in `deployments/polygon-amoy-happiness.json` at `0x616EF64C03D79630ECA03b5Cea4ea58a252dB68a`. The deployment starts with zero IOH issued; the `10,000,000 IOH` figure is an immutable ceiling, not a pre-mint.

Any future backed or transferable version must use a separately approved migration. Holding this version does not create a promise or right to migration, USDC, cash, investment return or future financial value.

## Wallet-signed testnet deployment

The public deployment configuration is in `happiness-testnet-deployment.config.json`. It records the Universal Mind deployer address and both test networks, but deliberately contains no private key or recovery phrase.

The approved testnet-only supply cap is `10,000,000 IOH` (`10,000,000,000,000` base units at six decimals). Create the wallet-signing plan with:

```sh
node tools/prepare-happiness-deployment.mjs --network polygon-amoy --supply-cap 10000000
```

The plan outputs constructor arguments for a MetaMask-signed deployment. It cannot deploy, mint, spend gas or access the wallet by itself. The initial testnet community treasury is the deployer address; production requires a separate multisignature treasury.

## Reproducible compile check

The contract is compiled with Solidity `0.8.28` and the audited OpenZeppelin Contracts `5.6.1` release, targeting the Shanghai EVM with the optimizer enabled for 200 runs. `tools/check-happiness-solidity.mjs` rejects any compiler build whose SHA-256 is not `72ef580a6ec5943130028e5294313f24e9435520acc89f8c9dbfd0139d9ae146` and rejects any other OpenZeppelin package version.

`tools/check-happiness-evm.mjs` deploys both contracts to a disposable local EVM and exercises issuance, redemption, replay protection, non-transferability, pausing, total and per-epoch caps, one-time workflow identity and the trusted-forwarder community path. Its `ETHERS_PATH` and `GANACHE_PATH` inputs point to temporary pinned test dependencies; those packages are not bundled into the website.

`tools/build-happiness-wallet-deployer.mjs` creates a disposable local signing interface containing the pinned compiled artifact and approved constructor arguments. It never contains or requests a private key: MetaMask supplies the public account and displays the Polygon Amoy transaction for the account holder's confirmation.
