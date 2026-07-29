(function () {
  const API = "/vogue/iam/api/happiness-automation.php";
  const login = document.querySelector("[data-login]");
  const loginForm = document.querySelector("[data-login-form]");
  const loginStatus = document.querySelector("[data-login-status]");
  const control = document.querySelector("[data-control]");
  const actionForm = document.querySelector("[data-action-form]");
  const actionButtons = Array.from(document.querySelectorAll("[data-action]"));
  const result = document.querySelector("[data-action-result]");
  const progress = document.querySelector("[data-progress]");
  const progressCopy = document.querySelector("[data-progress-copy]");
  const readiness = document.querySelector("[data-readiness]");
  const readinessTitle = document.querySelector("[data-readiness-title]");
  const readinessCopy = document.querySelector("[data-readiness-copy]");
  const balance = document.querySelector("[data-balance]");
  const member = document.querySelector("[data-member]");
  const activity = document.querySelector("[data-activity]");
  let csrf = "";
  let pollTimer = 0;

  const messages = {
    automation_configuration_required: "The managed issuer still needs its one-time Circle configuration.",
    another_polygon_confirmation_is_pending: "A Polygon confirmation is already in progress.",
    insufficient_happiness_balance: "There is not enough HAPPINESS to remove that amount.",
    owner_key_not_recognised: "Owner password not recognised.",
    owner_authentication_required: "Please sign in again.",
  };

  async function request(payload, method = "POST") {
    const response = await fetch(API, {
      method,
      credentials: "same-origin",
      cache: "no-store",
      headers: method === "POST" ? { "Content-Type": "application/json" } : {},
      body: method === "POST" ? JSON.stringify(payload) : undefined,
    });
    const data = await response.json().catch(() => ({ ok: false, error: "invalid_server_response" }));
    if (!response.ok) {
      const error = new Error(messages[data.error] || String(data.error || "The automated request failed.").replaceAll("_", " "));
      error.data = data;
      throw error;
    }
    return data;
  }

  function setBusy(active, copy = "") {
    actionButtons.forEach((button) => { button.disabled = active; });
    progress.hidden = !active;
    if (copy) progressCopy.textContent = copy;
  }

  function stage(name) {
    const order = ["intent", "circle", "polygon", "apple"];
    const current = order.indexOf(name);
    order.forEach((value, index) => {
      const node = document.querySelector(`[data-stage="${value}"]`);
      node?.classList.toggle("is-active", index === current);
      node?.classList.toggle("is-complete", index < current);
    });
  }

  function renderActivity(entries) {
    if (!Array.isArray(entries) || !entries.length) {
      activity.innerHTML = "<p>No confirmed activity yet.</p>";
      return;
    }
    activity.replaceChildren(...entries.map((entry) => {
      const row = document.createElement("article");
      row.className = "audit-entry";
      const date = entry.confirmed_at ? new Date(entry.confirmed_at).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" }) : "Pending";
      const sign = entry.action === "redeem" ? "−" : "+";
      row.innerHTML = `<span>${entry.status}</span><div><strong>${entry.reason || "HAPPINESS update"}</strong><p>${date}${entry.polygon_tx ? ` · ${entry.polygon_tx.slice(0, 10)}…` : ""}</p></div><em>${sign}${entry.amount} [ I o H ]</em>`;
      return row;
    }));
  }

  function render(state) {
    csrf = state.csrf_token || csrf;
    balance.textContent = state.balance?.available_display ?? "0";
    member.textContent = state.member?.display_id ?? "UM · 000 001";
    renderActivity(state.activity);
    const configured = Boolean(state.configuration?.ready);
    const pending = state.pending;
    readiness.classList.toggle("is-ready", configured && !pending && state.automation?.state !== "failed");
    readiness.classList.toggle("is-failed", !configured || state.automation?.state === "failed");
    if (!configured) {
      readinessTitle.textContent = "One-time managed issuer setup required";
      readinessCopy.textContent = "The dashboard is fail-closed until Circle credentials and the Polygon role are verified.";
    } else if (pending) {
      const syncingApple = state.automation?.state === "syncing_apple_wallet";
      readinessTitle.textContent = syncingApple ? "Apple Wallet refresh in progress" : "Polygon confirmation in progress";
      readinessCopy.textContent = syncingApple
        ? "The on-chain balance is confirmed; the pass refresh is being delivered."
        : `Circle transaction ${pending.circle_state || "INITIATED"} · visible points remain unchanged`;
      setBusy(true, syncingApple ? "Delivering the confirmed balance to Apple Wallet…" : "Waiting for Polygon to confirm the ERC-20 transaction…");
      stage(syncingApple ? "apple" : "polygon");
      schedulePoll();
    } else if (state.automation?.state === "confirmed") {
      readinessTitle.textContent = "Complete loop confirmed";
      readinessCopy.textContent = "Polygon, the owner ledger and Apple Wallet are aligned.";
      setBusy(false);
      stage("apple");
    } else {
      readinessTitle.textContent = "Automatic issuance is ready";
      readinessCopy.textContent = "One action will sign, mint, confirm and refresh the wallet.";
      setBusy(false);
    }
  }

  function schedulePoll() {
    window.clearTimeout(pollTimer);
    pollTimer = window.setTimeout(async () => {
      try {
        const state = await request({ action: "reconcile", csrf_token: csrf });
        render(state);
        if (!state.pending) {
          result.textContent = "Confirmed on Polygon. The wallet mirror now reflects the same balance.";
          result.classList.add("is-success");
        }
      } catch (error) {
        setBusy(false);
        result.textContent = error.message;
      }
    }, 3000);
  }

  async function openControl() {
    const state = await request(null, "GET");
    if (!state.authenticated) return;
    login.hidden = true;
    control.hidden = false;
    render(state);
  }

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginStatus.textContent = "Checking…";
    try {
      const data = Object.fromEntries(new FormData(loginForm));
      const state = await request({ action: "login", owner_key: data.owner_key });
      loginForm.reset();
      login.hidden = true;
      control.hidden = false;
      loginStatus.textContent = "";
      render(state);
    } catch (error) {
      loginStatus.textContent = error.message;
    }
  });

  actionForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitter = event.submitter;
    const action = submitter?.dataset.action;
    if (!action) return;
    const form = Object.fromEntries(new FormData(actionForm));
    result.textContent = "";
    result.classList.remove("is-success");
    setBusy(true, "Submitting one automated instruction to the managed signer…");
    stage("circle");
    try {
      const state = await request({ action, amount: form.amount, reason: form.reason, csrf_token: csrf });
      render(state);
    } catch (error) {
      setBusy(false);
      readiness.classList.add("is-failed");
      result.textContent = error.message;
    }
  });

  document.querySelector("[data-logout]")?.addEventListener("click", async () => {
    await request({ action: "logout" });
    window.location.reload();
  });

  openControl().catch(() => {});
})();
