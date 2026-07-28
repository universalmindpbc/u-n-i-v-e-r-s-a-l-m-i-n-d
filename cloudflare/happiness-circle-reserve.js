export const CIRCLE_RESERVE_PROFILE = Object.freeze({
  provider: "circle-wallets",
  custodyModel: "developer-controlled",
  mode: "read-only-reserve-reconciliation",
  apiOrigin: "https://api.circle.com",
  balancesPath: "/v1/w3s/developer/wallets/balances",
  blockchain: "MATIC-AMOY",
  usdcTokenAddress: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",
  mutationsImplemented: false,
});

const EVM_ADDRESS = /^0x[a-f0-9]{40}$/i;

function enabled(env, key) {
  return String(env[key] || "false") === "true";
}

export function circleReserveReadiness(env = {}) {
  return {
    provider: CIRCLE_RESERVE_PROFILE.provider,
    custody_model: CIRCLE_RESERVE_PROFILE.custodyModel,
    mode: CIRCLE_RESERVE_PROFILE.mode,
    blockchain: CIRCLE_RESERVE_PROFILE.blockchain,
    usdc_token_address: CIRCLE_RESERVE_PROFILE.usdcTokenAddress,
    api_reads_enabled: enabled(env, "HAPPINESS_CIRCLE_API_READS_ENABLED"),
    api_key_configured: Boolean(env.CIRCLE_API_KEY),
    wallet_id_configured: Boolean(env.HAPPINESS_CIRCLE_WALLET_ID),
    treasury_address_configured: EVM_ADDRESS.test(String(env.HAPPINESS_USDC_TREASURY_ADDRESS || "")),
    backing_confirmation_requested: enabled(env, "HAPPINESS_USDC_BACKING_CONFIRMED"),
    backing_confirmed: false,
    settlement_enabled: false,
    mutations_implemented: false,
  };
}

export function assertCircleReserveReadReady(env = {}) {
  if (!enabled(env, "HAPPINESS_CIRCLE_API_READS_ENABLED")) throw new Error("happiness_circle_api_reads_disabled");
  if (!env.CIRCLE_API_KEY) throw new Error("circle_api_key_not_configured");
  if (!env.HAPPINESS_CIRCLE_WALLET_ID) throw new Error("happiness_circle_wallet_not_configured");
  if (!EVM_ADDRESS.test(String(env.HAPPINESS_USDC_TREASURY_ADDRESS || ""))) {
    throw new Error("happiness_usdc_treasury_not_configured");
  }
  if (env.HAPPINESS_CIRCLE_BLOCKCHAIN && env.HAPPINESS_CIRCLE_BLOCKCHAIN !== CIRCLE_RESERVE_PROFILE.blockchain) {
    throw new Error("happiness_circle_blockchain_not_approved");
  }
  if (env.HAPPINESS_CIRCLE_USDC_TOKEN_ADDRESS
    && env.HAPPINESS_CIRCLE_USDC_TOKEN_ADDRESS.toLowerCase() !== CIRCLE_RESERVE_PROFILE.usdcTokenAddress.toLowerCase()) {
    throw new Error("happiness_circle_usdc_token_not_approved");
  }
}

export function assertCircleSettlementDisabled(env = {}) {
  if (enabled(env, "HAPPINESS_USDC_SETTLEMENT_ENABLED")) {
    throw new Error("happiness_usdc_settlement_not_implemented");
  }
  return true;
}

export async function fetchCircleReserveSnapshot(env = {}, fetchImpl = fetch) {
  assertCircleReserveReadReady(env);
  assertCircleSettlementDisabled(env);

  const response = await fetchImpl(`${CIRCLE_RESERVE_PROFILE.apiOrigin}${CIRCLE_RESERVE_PROFILE.balancesPath}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${env.CIRCLE_API_KEY}`,
    },
  });
  if (!response.ok) throw new Error(`circle_wallet_balances_failed_${response.status}`);

  const payload = await response.json();
  const wallets = Array.isArray(payload?.data?.wallets) ? payload.data.wallets : [];
  const wallet = wallets.find((candidate) => candidate?.id === env.HAPPINESS_CIRCLE_WALLET_ID);
  if (!wallet) throw new Error("happiness_circle_wallet_not_found");
  if (wallet.blockchain !== CIRCLE_RESERVE_PROFILE.blockchain) throw new Error("happiness_circle_wallet_chain_mismatch");
  if (String(wallet.address || "").toLowerCase() !== String(env.HAPPINESS_USDC_TREASURY_ADDRESS).toLowerCase()) {
    throw new Error("happiness_circle_treasury_address_mismatch");
  }

  const tokenBalance = (wallet.tokenBalances || []).find(({ token } = {}) => (
    String(token?.tokenAddress || "").toLowerCase() === CIRCLE_RESERVE_PROFILE.usdcTokenAddress.toLowerCase()
  ));

  return {
    schema_version: "happiness_circle_reserve_snapshot_v1",
    provider: CIRCLE_RESERVE_PROFILE.provider,
    mode: CIRCLE_RESERVE_PROFILE.mode,
    blockchain: wallet.blockchain,
    wallet_id: wallet.id,
    treasury_address: wallet.address,
    usdc_token_address: CIRCLE_RESERVE_PROFILE.usdcTokenAddress,
    usdc_amount: tokenBalance ? String(tokenBalance.amount) : "0",
    backing_confirmed: false,
    peg_claim_enabled: false,
    settlement_enabled: false,
  };
}
