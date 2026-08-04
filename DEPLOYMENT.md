# Universal Mind website deployment and rollback

## Environments

- Staging proofing site: `https://staging.universalmind.tv`
- Production site: `https://universalmind.tv`
- Staging publisher: `./deploy-panthur-staging.sh`
- Production publisher: `./deploy-panthurlive.sh`

Staging publishing uses the dedicated `stagingdeploy@universalmind.tv` FTP account. Its credential is stored outside the repository in the encrypted macOS Keychain under the `universalmind-staging-ftp` service. The staging publisher also accepts `/private/tmp/um-staging-ftp-pass.txt` as a temporary override.

Production publishing uses the dedicated `codexdeploy@universalmind.tv` FTP account, restricted to `/public_html`. Its credential is stored outside the repository in the encrypted macOS Keychain under the `universalmind-production-ftp` service. The production publisher also accepts `/private/tmp/um-public-html-ftp-pass.txt` as a temporary override.

The Panthur deployment scripts remain the only website publishing method. GitHub stores version history and provides the rollback safety net; it does not automatically deploy either environment.

Creating and pushing the GitHub record is nevertheless a mandatory part of every completed deployment. The agent performing the website update is responsible for this automatically; Ben does not need to request a commit or push separately.

## GitHub branch model

Use one private GitHub repository for both environments:

- `main` records the exact source approved and deployed to production.
- `staging` records the current candidate deployed to the staging proofing site.

Keeping both branches in one repository makes the difference between staging and production visible while preserving the rule that production changes only after explicit approval.

## Staging releases

Every completed staging update must follow this sequence:

1. Inspect the working tree and identify only the files belonging to the current task.
2. Test the change locally where appropriate.
3. Commit the exact intended source locally on `staging` with a descriptive message.
4. Deploy that exact committed source with `./deploy-panthur-staging.sh`.
5. Verify the precise changed page and user journey on `https://staging.universalmind.tv`.
6. Commit any resulting staging deployment-manifest update as deployment metadata.
7. Push the completed commits to `origin/staging` and confirm the remote commit.
8. Include the staging commit identifier in the proofing handoff.

Never deploy uncommitted or untracked website files. Never include another thread's unfinished changes in a commit or deployment. If the shared checkout contains unrelated work, deploy the exact task commit from a clean isolated Git worktree.

The staging update is not complete if deployment, verification, commit, or push fails.

## Music proof URL hygiene

The ordinary Music Television proof route is:

`https://staging.universalmind.tv/vogue/iam/index.html`

- Do not append `track`, `musicVideo`, `selected_track_id`, `video`, or `local_video_file` for generic staging QA or handoff.
- Never use Madonna's "Frozen" as the fixed default test URL. This includes `madonna-frozen`, `Madonna - Frozen`, and equivalent encodings.
- With no check-in, verify the random no-check-in path and its `no_checkin_random` source marker. With a check-in, verify the real selector result rather than overriding it in the URL.
- Use a fixed track only for an explicit track-specific test. If deterministic media is otherwise required, select a task-relevant item, document the reason, and avoid repeatedly reusing the same song.
- The URL returned to Ben must omit track-selection parameters unless his request names the exact track to proof.

## Non-disruptive browser, fullscreen, and media QA

All staging and production browser verification must avoid disrupting Ben's computer.

- Run ordinary browser QA hidden or in the background. Do not take over Chrome, Safari, macOS, or another visible desktop application.
- Validate fullscreen layouts in an isolated Codex-controlled browser with explicit viewport sizes and targeted DOM, media-state, and screenshot evidence. Native browser or macOS fullscreen requires Ben's explicit approval immediately before testing.
- Start any automated browser that may encounter autoplaying media with process-level audio disabled, such as Chromium's `--mute-audio`, before navigation. If that suppression cannot be confirmed, do not begin playback and ask Ben first.
- Silent streaming checks may verify media requests, readiness, decoding, HLS or Stream state, advancing playback time, controls, routing, configured mix values, layout, and console errors.
- Testing audible output or audio quality—including streaming audio, live playback, audio rooms, crossfades, or subjective mix behavior—requires Ben's explicit approval immediately before the test and must use only one audible tab or session.
- Silent checks cannot establish subjective sound quality. Stop playback and close automated media tabs immediately after verification unless Ben asks to retain a proofing tab.

## Production releases

Only after Ben explicitly approves a staging version:

1. Deploy the exact approved staging version with `./deploy-panthurlive.sh`. Any additional source change must return to staging first.
2. Verify the production website and the precise changed user journey.
3. Fast-forward `main` to the deployed staging commit.
4. Create an annotated tag named `production-YYYY-MM-DD-HHMM`.
5. Push `main`, `staging`, and the production tag to GitHub.
6. Confirm the remote branch and tag references and report the production commit and tag.

The production release is not complete if deployment, verification, push, or tagging fails.

## Rollback

To restore an earlier production build:

1. Select the required `production-*` tag in GitHub.
2. Check out that tag locally.
3. Run the existing production publisher with `all-fast` so every non-video site file and the redirect layer are restored.
4. Verify the public user journey on `https://universalmind.tv`.
5. Return to the active branch after verification.

## Media scope

The repository excludes local `.mp4` masters because they total about 21 GB and exceed ordinary GitHub repository limits. Website source, deployment configuration, images, audio, catalogues, and other non-video assets are versioned. Hosted video delivery remains managed by the production media catalogue and Cloudflare Stream.
