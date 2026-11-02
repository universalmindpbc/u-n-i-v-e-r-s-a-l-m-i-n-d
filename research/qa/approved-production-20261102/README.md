# Approved production release — work in progress

The approved website source `7ebdb92ac8886af9c81e8616b336a2fecc86989c` was uploaded through the existing Panthur scripts on 2 November 2026. The release remains incomplete. Production main and the final production tag have not advanced because live verification identified the issues below.

## Remaining release work

- Cloudflare cached incomplete responses for archive URLs while upload progress was being checked. All 55 newly published parts pass full SHA256 checks through fresh query URLs (2,470,959,389 bytes). The ordinary canonical URLs still need the approved scoped purge and recheck.
- The new versioned `shared-experience.js?v=1c6694f64b0d` URL cached the earlier script while source upload was incomplete. It resolves the Research iframe against the wrong path and loses query selection. The uploaded source and a fresh query response are correct. Adding this one URL to the 55 approved purge URLs awaits approval.
- Browser Back/Forward invoked both the television handler and the generic I AM handler. The generic handler replaced the active media after the earlier test's immediate assertion. Commit `7c62c3665` lets the television handler retain ownership. The stronger browser test waits for each embedded document and checks nested navigation, Back, Forward, and Return TV.

The I AM correction is verified on [staging](https://staging.universalmind.tv/iam/tv/) but is not published to production. GitHub staging commit `8bbaa8d36ef96489c14fb7bc9db66aaa58404607` preserves Dot's concurrent work. The isolated candidate branch excludes that unapproved work.

## Evidence

- Original production upload modes: ai-wiki, informatics, iam-changed, directory, ai-wiki, redirects. Informatics uploaded 2,361 changed files; I AM uploaded 35 scoped files. Owner state remained unchanged.
- Production HTTP checks: 70 passed. Initial source comparisons: 118 passed, plus five export size checks. Some original comparisons used unversioned URLs; the later versioned-asset scan identified the stale script response. These checks are not a complete production sign-off.
- Original manifest validation: 13,820 entries matched the approved source. The pre-existing live wallet rollover CSS was investigated separately and preserved in candidate source `c878f9316` from its earlier approved production commit `bff911cb19af313c0158ac3f7ef9abc8282a37ab`.
- Staging correction: 54 browser checks, zero page errors, 118 final source comparisons using actual versioned URLs, and five export size checks. Chromium ran with process-level audio disabled. Fullscreen ownership was instrumented; native fullscreen was not invoked.
- Staging assistant: a real request returned HTTP 200 from OpenAI. The assistant message text was compared with the returned answer, including its source citations, and matched. The screenshot records the response in the panel.
- Production Worker `informatics-universal-one` version `58404974-72da-4721-aa9d-9f1371cae6c7` was deployed through its existing Wrangler configuration. Read-only MCP/A2A checks passed with nine tools. The actual production assistant UI check stopped before sending a request because the stale script prevented the Research frame from loading.
- Dot's youth review is absent from the source and upload queue. Twelve corresponding public paths returned 403. Public denial does not establish physical absence; source and upload exclusion provide the release scope evidence.

`release-status.json` records the remaining approvals and checks. The failed diagnostics remain here to explain the incomplete status. No final production tag is claimed.

## Access boundary

The deployment OAuth credential can read the zone but cannot purge cache. The five explicitly scoped Keychain service names contained no credential. Cloudflare's hidden dashboard tab is signed out. Automatic approval review rejected broader Keychain enumeration and saved-profile access as outside the approved scope. No broader credential lookup or global cache purge was performed. User sign-in and the two pending approvals are required to finish the outstanding steps.
