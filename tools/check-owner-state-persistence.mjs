import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(ROOT_DIR, relativePath), "utf8");

const deploy = read("deploy-panthurlive.sh");
const stagingDeploy = read("deploy-panthur-staging.sh");
const mantra = read("i  a m/api/mantra-library.php");
const quantum = read("i  a m/api/quantum-tree-settings.php");
const history = read("i  a m/api/owner-state-history.php");
const apiHtaccess = read("i  a m/api/.htaccess");

for (const protectedPath of [
  "api/mantra-library.json",
  "api/quantum-tree-settings.json",
  "api/happiness-ledger.json",
  "apple-wallet/happiness-apple-registrations.json",
  "api/.owner-state-history/",
  "a s s e t s/m a n t r a [ u p l o a d s ]/",
]) {
  assert.ok(deploy.includes(protectedPath), `Deployment does not preserve ${protectedPath}`);
}

assert.match(deploy, /seed-owner-state\)/, "Owner state has no explicit seed-only deployment mode");
assert.match(deploy, /remote_file_exists/, "Seed-only deployment cannot protect an existing live file");
assert.match(deploy, /snapshot_owner_runtime_state/, "Deployment does not fingerprint live owner state");
assert.match(deploy, /capture_owner_state_before_deploy/, "Deployment does not capture owner state before upload");
assert.match(deploy, /verify_owner_runtime_state_preserved/, "Deployment does not verify owner state after upload");
assert.match(deploy, /cmp -s \"\$OWNER_STATE_BEFORE\" \"\$after_snapshot\"/, "Deployment does not fail on an owner-state mismatch");
assert.match(deploy, /Mantra sample referenced by owner state is unavailable/, "Deployment does not fail closed when a referenced Mantra upload is missing");
assert.match(deploy, /deployment_requires_owner_state_guard/, "Deployment modes can bypass the owner-state guard");
assert.match(deploy, /OWNER_STATE_REFERENCE_ORIGIN/, "Production release has no approved staging Mantra reference");
assert.match(deploy, /snapshot_reference_mantra_state/, "Production release does not fingerprint approved staging Mantra state");
assert.match(deploy, /verify_target_matches_reference/, "Production release does not block a stale Mantra library before deployment");
assert.match(deploy, /approved staging Mantra state changed during deployment/, "Production release does not fail when the staging reference moves");
assert.match(stagingDeploy, /exec "\$ROOT_DIR\/deploy-panthurlive\.sh"/, "Staging no longer uses the protected shared deploy engine");

for (const endpoint of [mantra, quantum]) {
  assert.match(endpoint, /owner-state-history\.php/, "Owner endpoint does not load protected history support");
  assert.match(endpoint, /iam_owner_state_prepare_write/, "Owner endpoint can write without archiving its state");
}

assert.match(history, /IAM_OWNER_STATE_HISTORY_LIMIT = 120/, "Owner history does not retain bounded version history");
assert.match(history, /'previous'/, "Owner history does not preserve the prior live state");
assert.match(history, /'candidate'/, "Owner history does not preserve the candidate state before mutation");
assert.match(history, /Require all denied/, "Runtime history does not create an Apache access denial");
assert.match(apiHtaccess, /\.owner-state-history/, "The API directory does not deny direct history access");

console.log("Owner-state persistence checks passed.");
