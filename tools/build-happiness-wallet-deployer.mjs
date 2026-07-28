import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  happinessArtifact,
} from "./check-happiness-solidity.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(fs.readFileSync(path.join(root, "contracts/happiness-testnet-deployment.config.json"), "utf8"));
const outputDirectory = path.resolve(process.argv[2] || "/private/tmp/happiness-wallet-deployer");
const ethersBundle = process.env.ETHERS_BROWSER_BUNDLE;

if (!ethersBundle || !fs.existsSync(ethersBundle)) {
  throw new Error("ETHERS_BROWSER_BUNDLE must point to the pinned ethers browser bundle");
}
if (config.supply_cap_status !== "approved_for_testnet_2026-07-28") {
  throw new Error("HAPPINESS testnet supply cap is not approved");
}
if (config.supply_cap_units !== "10000000000000") {
  throw new Error("Unexpected HAPPINESS testnet supply cap");
}

const amoy = config.networks["polygon-amoy"];
const deployment = {
  schema_version: "happiness_browser_deployment_v1",
  mode: "polygon_amoy_testnet_only",
  contract: config.contract,
  chain_id: amoy.chain_id,
  chain_id_hex: `0x${amoy.chain_id.toString(16)}`,
  explorer: amoy.explorer,
  deployer_address: config.deployer_address,
  currency: {
    name: config.currency_name,
    symbol: config.ledger_symbol,
    display_ticker: config.display_ticker,
    decimals: config.decimals,
    supply_cap_display: config.supply_cap_display,
    supply_cap_units: config.supply_cap_units,
  },
  constructor_arguments: [
    config.initial_admin_address,
    config.testnet_community_treasury_address,
    config.supply_cap_units,
  ],
  abi: happinessArtifact.abi,
  bytecode: `0x${happinessArtifact.evm.bytecode.object}`,
};

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>HAPPINESS Amoy deployment</title>
  <style>
    :root { color-scheme: dark; font-family: Arial, sans-serif; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #090909; color: #f5f1e8; }
    main { width: min(720px, calc(100vw - 48px)); border: 1px solid #555; border-radius: 28px; padding: 32px; background: #181818; }
    h1 { margin: 0 0 8px; font-size: 42px; letter-spacing: .04em; }
    .ticker { color: #d6cebe; font-size: 22px; letter-spacing: .3em; }
    dl { display: grid; grid-template-columns: 180px 1fr; gap: 12px; margin: 30px 0; }
    dt { color: #aaa; } dd { margin: 0; overflow-wrap: anywhere; }
    button { border: 1px solid #777; border-radius: 999px; padding: 14px 20px; margin-right: 10px; background: #eee; color: #111; font-weight: 700; cursor: pointer; }
    button[disabled] { opacity: .35; cursor: not-allowed; }
    #status { margin-top: 22px; min-height: 44px; color: #d6cebe; line-height: 1.5; }
    a { color: #fff; }
  </style>
</head>
<body>
<main>
  <h1>HAPPINESS</h1>
  <div class="ticker">[ I o H ]</div>
  <dl>
    <dt>Network</dt><dd>Polygon Amoy testnet (80002)</dd>
    <dt>Maximum supply</dt><dd>10,000,000 IOH</dd>
    <dt>Transfers</dt><dd>Disabled</dd>
    <dt>Cash value</dt><dd>None</dd>
    <dt>Deployer / admin</dt><dd>${config.deployer_address}</dd>
  </dl>
  <button id="connect">Connect MetaMask</button>
  <button id="deploy" disabled>Deploy to Amoy</button>
  <div id="status">No transaction has been requested.</div>
</main>
<script src="./ethers.min.js"></script>
<script>
const plan = ${JSON.stringify(deployment)};
const connectButton = document.querySelector('#connect');
const deployButton = document.querySelector('#deploy');
const status = document.querySelector('#status');
let provider;
let signer;

function show(message) { status.textContent = message; }

function describeError(error) {
  const details = [
    error?.shortMessage,
    error?.info?.error?.message,
    error?.error?.message,
    error?.message,
    error?.code ? 'code: ' + error.code : '',
  ].filter(Boolean);
  return [...new Set(details)].join(' | ') || String(error);
}

connectButton.addEventListener('click', async () => {
  try {
    if (!window.ethereum) throw new Error('MetaMask is not available in this Chrome profile.');
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: plan.chain_id_hex }],
    });
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    const address = await signer.getAddress();
    if (address.toLowerCase() !== plan.deployer_address.toLowerCase()) {
      throw new Error('Connected account is not the approved Universal Mind Deployer.');
    }
    const network = await provider.getNetwork();
    if (Number(network.chainId) !== plan.chain_id) throw new Error('MetaMask is not on Polygon Amoy.');
    deployButton.disabled = false;
    connectButton.disabled = true;
    show('Connected to the approved Universal Mind Deployer on Polygon Amoy. Ready for your deployment confirmation.');
  } catch (error) {
    show(describeError(error));
  }
});

deployButton.addEventListener('click', async () => {
  try {
    deployButton.disabled = true;
    show('MetaMask is requesting your approval. Review the Amoy testnet transaction before confirming.');
    const factory = new ethers.ContractFactory(plan.abi, plan.bytecode, signer);
    // Amoy's public RPC estimator can reject valid creation bytecode. The
    // local EVM deployment uses ~1.29M gas, so this fixed ceiling preserves
    // headroom while MetaMask still presents the exact maximum fee to Ben.
    const contract = await factory.deploy(...plan.constructor_arguments, { gasLimit: 1_500_000n });
    show('Transaction submitted: ' + contract.deploymentTransaction().hash + '. Waiting for Amoy confirmation…');
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    const link = plan.explorer + 'address/' + address;
    status.innerHTML = 'HAPPINESS deployed at <strong>' + address + '</strong><br><a href="' + link + '" target="_blank" rel="noopener">Open on Amoy Polygonscan</a>';
  } catch (error) {
    deployButton.disabled = false;
    show(describeError(error));
  }
});
</script>
</body>
</html>`;

fs.mkdirSync(outputDirectory, { recursive: true });
fs.writeFileSync(path.join(outputDirectory, "deployment.json"), `${JSON.stringify(deployment, null, 2)}\n`);
fs.writeFileSync(path.join(outputDirectory, "index.html"), html);
fs.copyFileSync(ethersBundle, path.join(outputDirectory, "ethers.min.js"));

process.stdout.write(`${JSON.stringify({
  ok: true,
  output_directory: outputDirectory,
  chain_id: deployment.chain_id,
  supply_cap_units: deployment.currency.supply_cap_units,
  deployer_address: deployment.deployer_address,
  contains_private_key: false,
}, null, 2)}\n`);
