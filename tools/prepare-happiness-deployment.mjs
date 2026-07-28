import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(fs.readFileSync(path.join(root, "contracts/happiness-testnet-deployment.config.json"), "utf8"));
const ADDRESS = /^0x[a-f0-9]{40}$/i;
const DECIMAL_AMOUNT = /^\d+(?:\.\d{1,6})?$/;

export function parseDisplayUnits(value) {
  const normalized = String(value ?? "").trim();
  if (!DECIMAL_AMOUNT.test(normalized)) throw new Error("invalid_testnet_supply_cap");
  const [whole, fraction = ""] = normalized.split(".");
  const units = BigInt(`${whole}${fraction.padEnd(config.decimals, "0")}`);
  if (units <= 0n) throw new Error("testnet_supply_cap_must_be_positive");
  return units;
}

export function buildDeploymentPlan({ network, supplyCap, admin, treasury } = {}) {
  const networkConfig = config.networks[network];
  if (!networkConfig) throw new Error("unsupported_happiness_testnet");
  const adminAddress = admin || config.initial_admin_address;
  const treasuryAddress = treasury || config.testnet_community_treasury_address;
  if (!ADDRESS.test(adminAddress)) throw new Error("invalid_happiness_admin_address");
  if (!ADDRESS.test(treasuryAddress)) throw new Error("invalid_happiness_treasury_address");
  const supplyCapUnits = parseDisplayUnits(supplyCap);
  return {
    schema_version: "happiness_wallet_signed_deployment_plan_v1",
    mode: "testnet_only",
    network,
    chain_id: networkConfig.chain_id,
    contract: config.contract,
    source: "contracts/HappinessRewards.sol",
    currency: {
      name: config.currency_name,
      ledger_symbol: config.ledger_symbol,
      display_ticker: config.display_ticker,
      decimals: config.decimals,
    },
    deployer_address: config.deployer_address,
    constructor_arguments: [adminAddress, treasuryAddress, supplyCapUnits.toString()],
    supply_cap_display: String(supplyCap),
    explorer: networkConfig.explorer,
    private_key_required_by_plan: false,
    wallet_signature_required_at_deployment: true,
    initial_role_policy: {
      member_issuer: adminAddress,
      community_issuer: adminAddress,
      redeemer: adminAddress,
      pauser: adminAddress,
      future_cre_role: "COMMUNITY_ISSUER_ROLE_only",
    },
    production_enabled: false,
  };
}

function cliArguments(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith("--")) throw new Error(`unexpected_argument:${key}`);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`missing_value:${key}`);
    values[key.slice(2)] = value;
    index += 1;
  }
  return values;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const values = cliArguments(process.argv.slice(2));
    const plan = buildDeploymentPlan({
      network: values.network,
      supplyCap: values["supply-cap"],
      admin: values.admin,
      treasury: values.treasury,
    });
    process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
