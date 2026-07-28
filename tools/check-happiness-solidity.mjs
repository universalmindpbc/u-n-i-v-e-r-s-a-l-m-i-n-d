import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const soljsonPath = process.env.SOLJSON_PATH;
const openZeppelinPath = process.env.OPENZEPPELIN_CONTRACTS_PATH;

if (!soljsonPath || !fs.existsSync(soljsonPath)) throw new Error("SOLJSON_PATH must point to an official Solidity compiler build");
if (!openZeppelinPath || !fs.existsSync(openZeppelinPath)) {
  throw new Error("OPENZEPPELIN_CONTRACTS_PATH must point to the pinned OpenZeppelin contracts directory");
}
const compilerHash = createHash("sha256").update(fs.readFileSync(soljsonPath)).digest("hex");
if (compilerHash !== "72ef580a6ec5943130028e5294313f24e9435520acc89f8c9dbfd0139d9ae146") {
  throw new Error("unexpected Solidity 0.8.28 compiler hash");
}
const openZeppelinPackage = JSON.parse(fs.readFileSync(path.join(openZeppelinPath, "package.json"), "utf8"));
if (openZeppelinPackage.version !== "5.6.1") throw new Error("OpenZeppelin Contracts 5.6.1 is required");

const require = createRequire(import.meta.url);
const soljson = require(path.resolve(soljsonPath));
const compile = soljson.cwrap("solidity_compile", "string", ["string", "number"]);
const version = soljson.cwrap("solidity_version", "string", [])();
const sources = {};
const IMPORT_PATTERN = /import\s+(?:[^"']+\s+from\s+)?["']([^"']+)["']\s*;/g;

function canonicalSourceKey(file) {
  const relativeOpenZeppelin = path.relative(openZeppelinPath, file);
  if (!relativeOpenZeppelin.startsWith("..")) {
    return `@openzeppelin/contracts/${relativeOpenZeppelin.split(path.sep).join("/")}`;
  }
  return path.relative(root, file).split(path.sep).join("/");
}

function addSource(file) {
  const resolved = path.resolve(file);
  const key = canonicalSourceKey(resolved);
  if (sources[key]) return;
  if (!fs.existsSync(resolved)) throw new Error(`missing Solidity import: ${resolved}`);
  const content = fs.readFileSync(resolved, "utf8");
  sources[key] = { content };
  for (const match of content.matchAll(IMPORT_PATTERN)) {
    const imported = match[1];
    const importedFile = imported.startsWith("@openzeppelin/contracts/")
      ? path.join(openZeppelinPath, imported.slice("@openzeppelin/contracts/".length))
      : path.resolve(path.dirname(resolved), imported);
    addSource(importedFile);
  }
}

addSource(path.join(root, "contracts/HappinessRewards.sol"));
addSource(path.join(root, "contracts/HappinessCommunityOracle.sol"));

const input = {
  language: "Solidity",
  sources,
  settings: {
    optimizer: { enabled: true, runs: 200 },
    evmVersion: "shanghai",
    metadata: { bytecodeHash: "ipfs" },
    outputSelection: {
      "*": {
        "*": [
          "abi",
          "evm.bytecode.object",
          "evm.deployedBytecode.object",
          "evm.gasEstimates",
        ],
      },
    },
  },
};

const output = JSON.parse(compile(JSON.stringify(input), 0));
const diagnostics = output.errors || [];
for (const diagnostic of diagnostics.filter((item) => item.severity !== "error")) {
  process.stderr.write(diagnostic.formattedMessage || `${diagnostic.message}\n`);
}
const failures = diagnostics.filter((item) => item.severity === "error");
if (failures.length) {
  throw new Error(failures.map((item) => item.formattedMessage || item.message).join("\n"));
}

const artifact = output.contracts?.["contracts/HappinessRewards.sol"]?.HappinessRewards;
if (!artifact) throw new Error("HappinessRewards compiler artifact missing");
const creationBytes = artifact.evm.bytecode.object.length / 2;
const runtimeBytes = artifact.evm.deployedBytecode.object.length / 2;
if (runtimeBytes > 24_576) throw new Error(`HappinessRewards exceeds EIP-170 runtime limit: ${runtimeBytes}`);

const oracleArtifact = output.contracts?.["contracts/HappinessCommunityOracle.sol"]?.HappinessCommunityOracle;
if (!oracleArtifact) throw new Error("HappinessCommunityOracle compiler artifact missing");
const oracleCreationBytes = oracleArtifact.evm.bytecode.object.length / 2;
const oracleRuntimeBytes = oracleArtifact.evm.deployedBytecode.object.length / 2;
if (oracleRuntimeBytes > 24_576) {
  throw new Error(`HappinessCommunityOracle exceeds EIP-170 runtime limit: ${oracleRuntimeBytes}`);
}

const functions = new Set(artifact.abi.filter((item) => item.type === "function").map((item) => item.name));
for (const expected of [
  "MEMBER_ISSUER_ROLE",
  "COMMUNITY_ISSUER_ROLE",
  "issueReward",
  "issueCommunityPool",
  "redeemReward",
  "pause",
  "unpause",
]) {
  if (!functions.has(expected)) throw new Error(`HappinessRewards ABI missing ${expected}`);
}

const oracleFunctions = new Set(oracleArtifact.abi.filter((item) => item.type === "function").map((item) => item.name));
for (const expected of [
  "onReport",
  "configureWorkflowIdentity",
  "expectedWorkflowId",
  "expectedWorkflowAuthor",
  "maxAmountPerEpoch",
  "processedEpochs",
  "pause",
  "unpause",
  "supportsInterface",
]) {
  if (!oracleFunctions.has(expected)) throw new Error(`HappinessCommunityOracle ABI missing ${expected}`);
}

process.stdout.write(`${JSON.stringify({
  ok: true,
  compiler: version,
  compiler_sha256: compilerHash,
  openzeppelin: openZeppelinPackage.version,
  optimizer_runs: 200,
  evm_version: "shanghai",
  creation_bytecode_bytes: creationBytes,
  runtime_bytecode_bytes: runtimeBytes,
  creation_gas_estimate: artifact.evm.gasEstimates?.creation?.totalCost || null,
  abi_entries: artifact.abi.length,
  oracle_creation_bytecode_bytes: oracleCreationBytes,
  oracle_runtime_bytecode_bytes: oracleRuntimeBytes,
  oracle_creation_gas_estimate: oracleArtifact.evm.gasEstimates?.creation?.totalCost || null,
  oracle_abi_entries: oracleArtifact.abi.length,
}, null, 2)}\n`);

export { artifact as happinessArtifact, oracleArtifact as happinessOracleArtifact };
