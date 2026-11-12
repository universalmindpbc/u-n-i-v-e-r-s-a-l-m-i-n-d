# Quantum conversation repair and QA

The regression was two separate defects: the chat answer request explicitly selected Low reasoning, and capability queries returned fixed frontend paragraphs instead of model answers. The repair selects Max on the staging research worker, routes conversational answers through the model, and supplies operational facts from the authenticated services.

## Conversation evaluation

The reported CUDA-Q exchange is one regression case within a broader conversation exercise. `verify-live.mjs` tests:

- capabilities before login;
- a short contextual follow-up after verified login;
- repeated access questions, without fixed paragraphs;
- an explanation distinguishing CPU simulation, GPU execution and hardware;
- a corrected gene target, explicitly without execution;
- a follow-up that relies on that corrected target;
- a topic switch with requested brevity;
- a fresh anonymous session claiming to be logged in;
- the limits of arbitrary code and device choice;
- a natural acknowledgment ending the conversation.

Assertions assess facts, context, provider reasoning receipts and effects rather than a prescribed answer. Review the actual answer text as well as the assertions. A successful HTTP response alone is insufficient. Future regression cases extend this scenario mix rather than replacing it with a single verbatim replay.

The browser runs in a dedicated headless Chromium process with `--mute-audio`, blocks media, and aborts every study or hardware POST. Any attempted mutation fails the evaluation even when it is blocked. The portal password is read from a private temporary file and is excluded from model requests and records. The separate US$5 ledger reserves and reconciles each OpenAI call; it cannot authorize a study.

## Evidence boundaries

`test-chat-runtime.mjs` exercises the actual Worker runtime with provider fixtures. Its outgoing-request check is separate from the live provider receipts in `live-verification.json`. The live exercise verifies conversation and access handling; it does not execute CUDA-Q, Wolfram, GPU work or a quantum experiment.

The initial website candidate is `b719ff894`, with staging Worker version `efad8f56-b5c4-42e2-a23e-75cdb78e0c35`. A concurrent completed research-library release is integrated before the final deployment record. Existing approved layout and input wording remain intact.

## Broader QA finding

The anonymous-session case correctly rejected the claimed login but suggested an unnecessary reload. It also described the unauthenticated service response as a zero-credit balance. This failed semantic review despite passing the initial transport assertions. The runtime now supplies the actual Password control location, states that each message checks access, and keeps credit null until authentication. The separate `verify-access.mjs` exercise verifies the correction before and after a real portal login.

The optional QA reservation was increased to US$2.25 per request to accommodate the conservative UTF-8 input bound plus the full 16,384-token Max output ceiling. The aggregate approval remains US$5. Several guards stopped before a model call; those records remain in the evidence and are not counted as successful conversational responses. Normal visitor budgets are unchanged.

## Access ordering and temporal accuracy

Repeated fresh sign-ins exposed an asynchronous access race: the anonymous check opened with the dialog can finish after the authenticated check and replace its UI state. `test-portal-order.mjs` first reproduced the defect, then verified the fix across delayed anonymous results, delayed failures and sign-out. The live race test delays a real anonymous staging response until after the real authenticated response, then verifies that sign-in remains visible. No response data is fabricated.

A later conversational transition also incorrectly called an earlier accurate anonymous check a mistake. Operational instructions now distinguish changes over time from corrections to earlier claims. The final live follow-up evaluates that distinction using the previously observed anonymous conversation.
