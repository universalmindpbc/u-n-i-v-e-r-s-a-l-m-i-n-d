import assert from "node:assert/strict";
import { createRequire } from "node:module";
import {
  happinessArtifact,
  happinessOracleArtifact,
} from "./check-happiness-solidity.mjs";

const require = createRequire(import.meta.url);
const ethersPath = process.env.ETHERS_PATH;
const ganachePath = process.env.GANACHE_PATH;
if (!ethersPath || !ganachePath) {
  throw new Error("ETHERS_PATH and GANACHE_PATH must point to pinned temporary test dependencies");
}
const ethers = require(ethersPath);
const ganache = require(ganachePath);

async function expectRevert(action, label) {
  let reverted = false;
  try {
    const transaction = await action();
    if (typeof transaction?.wait === "function") await transaction.wait();
  } catch {
    reverted = true;
  }
  assert.equal(reverted, true, `${label} should revert`);
}

const chain = ganache.provider({
  chain: { chainId: 1337 },
  logging: { quiet: true },
  wallet: { totalAccounts: 6 },
});
const provider = new ethers.BrowserProvider(chain);
const admin = await provider.getSigner(0);
const member = await provider.getSigner(1);
const forwarder = await provider.getSigner(2);
const workflowAuthor = await provider.getSigner(3);
const outsider = await provider.getSigner(4);
const adminAddress = await admin.getAddress();
const memberAddress = await member.getAddress();
const forwarderAddress = await forwarder.getAddress();
const workflowAuthorAddress = await workflowAuthor.getAddress();
const outsiderAddress = await outsider.getAddress();

const decimals = 1_000_000n;
const supplyCap = 1_000n * decimals;
const rewardFactory = new ethers.ContractFactory(
  happinessArtifact.abi,
  `0x${happinessArtifact.evm.bytecode.object}`,
  admin,
);
const rewards = await rewardFactory.deploy(adminAddress, adminAddress, supplyCap);
const rewardsDeploymentReceipt = await rewards.deploymentTransaction().wait();

assert.equal(await rewards.name(), "HAPPINESS");
assert.equal(await rewards.symbol(), "IOH");
assert.equal(await rewards.decimals(), 6n);
assert.equal(await rewards.supplyCap(), supplyCap);
assert.equal(await rewards.communityTreasury(), adminAddress);

const memberIssuerRole = await rewards.MEMBER_ISSUER_ROLE();
const communityIssuerRole = await rewards.COMMUNITY_ISSUER_ROLE();
assert.equal(await rewards.hasRole(memberIssuerRole, adminAddress), true);
assert.equal(await rewards.hasRole(communityIssuerRole, adminAddress), true);

const issuanceId = ethers.id("member-award:001");
const laneId = ethers.id("show-up");
await (await rewards.issueReward(memberAddress, 25n * decimals, issuanceId, laneId)).wait();
assert.equal(await rewards.balanceOf(memberAddress), 25n * decimals);
await expectRevert(
  () => rewards.issueReward(memberAddress, 1n, issuanceId, laneId),
  "duplicate member issuance",
);
await expectRevert(
  () => rewards.connect(member).transfer(outsiderAddress, 1n),
  "member transfer",
);

const redemptionId = ethers.id("redemption:001");
await (await rewards.redeemReward(memberAddress, 5n * decimals, redemptionId)).wait();
assert.equal(await rewards.balanceOf(memberAddress), 20n * decimals);
await expectRevert(
  () => rewards.redeemReward(memberAddress, 1n, redemptionId),
  "duplicate redemption",
);

await (await rewards.pause()).wait();
await expectRevert(
  () => rewards.issueReward(memberAddress, 1n, ethers.id("paused-award"), laneId),
  "paused issuance",
);
await (await rewards.unpause()).wait();
await expectRevert(
  () => rewards.issueReward(memberAddress, supplyCap, ethers.id("over-cap"), laneId),
  "supply cap",
);

const oracleFactory = new ethers.ContractFactory(
  happinessOracleArtifact.abi,
  `0x${happinessOracleArtifact.evm.bytecode.object}`,
  admin,
);
const oracle = await oracleFactory.deploy(
  adminAddress,
  await rewards.getAddress(),
  forwarderAddress,
  50n * decimals,
);
await oracle.waitForDeployment();
await (await rewards.grantRole(communityIssuerRole, await oracle.getAddress())).wait();

const workflowId = ethers.id("happiness-collective-emission-v1");
await (await oracle.configureWorkflowIdentity(workflowId, workflowAuthorAddress)).wait();
await expectRevert(
  () => oracle.configureWorkflowIdentity(ethers.id("replacement"), workflowAuthorAddress),
  "workflow identity reconfiguration",
);

const epochId = ethers.id("2026-W31");
const evidenceCommitment = ethers.id("aggregate-evidence:2026-W31");
const latestBlock = await provider.getBlock("latest");
const validUntil = BigInt(latestBlock.timestamp + 3600);
const metadata = ethers.solidityPacked(
  ["bytes32", "bytes10", "address", "bytes2"],
  [workflowId, "0x11223344556677889900", workflowAuthorAddress, "0x0000"],
);
const report = ethers.AbiCoder.defaultAbiCoder().encode(
  ["bytes32", "uint256", "uint64", "bytes32"],
  [epochId, 10n * decimals, validUntil, evidenceCommitment],
);

await expectRevert(
  () => oracle.connect(outsider).onReport(metadata, report),
  "untrusted forwarder",
);
const treasuryBefore = await rewards.balanceOf(adminAddress);
await (await oracle.connect(forwarder).onReport(metadata, report)).wait();
assert.equal(await rewards.balanceOf(adminAddress), treasuryBefore + 10n * decimals);
assert.equal(await oracle.processedEpochs(epochId), true);
await expectRevert(
  () => oracle.connect(forwarder).onReport(metadata, report),
  "duplicate collective epoch",
);

const oversizedReport = ethers.AbiCoder.defaultAbiCoder().encode(
  ["bytes32", "uint256", "uint64", "bytes32"],
  [ethers.id("2026-W32"), 51n * decimals, validUntil, evidenceCommitment],
);
await expectRevert(
  () => oracle.connect(forwarder).onReport(metadata, oversizedReport),
  "collective epoch cap",
);

process.stdout.write(`${JSON.stringify({
  ok: true,
  network: "local-ganache",
  rewards_deployment_gas: rewardsDeploymentReceipt.gasUsed.toString(),
  rewards_contract: await rewards.getAddress(),
  oracle_contract: await oracle.getAddress(),
  checks: [
    "member issuance",
    "member issuance replay protection",
    "non-transferability",
    "redemption",
    "redemption replay protection",
    "emergency pause",
    "total supply cap",
    "one-time CRE workflow identity",
    "trusted KeystoneForwarder caller",
    "community-only issuance",
    "collective epoch replay protection",
    "immutable collective epoch cap",
  ],
}, null, 2)}\n`);

await chain.disconnect();
