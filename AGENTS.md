# Universal Mind — Permanent Website Development Rules

These instructions are permanent and apply to every website update in this repository.

## The workflow

This project has one development and publishing workflow:

Develop locally → record the exact candidate in Git → deploy it to `https://staging.universalmind.tv` → verify it → record the completed staging deployment on GitHub → Ben proofs it → deploy the same approved version to production only after Ben explicitly approves → record the production release on GitHub.

This workflow must not change unless Ben explicitly instructs otherwise.

## GitHub record is mandatory

GitHub is the permanent audit trail for staging and production. Creating and pushing the GitHub record is part of completing every deployment; it is not an optional follow-up and Ben must not need to request it separately.

- `staging` records the exact source successfully deployed and verified on the staging website.
- `main` records the exact source successfully deployed and verified on the production website.
- Every production deployment also receives an annotated `production-YYYY-MM-DD-HHMM` tag.
- The final response for a staging update must include the staging commit identifier.
- The final response for a production update must include the production commit and tag.
- A deployment is not complete if its required commit, push, or tag fails.

GitHub records versions and enables rollback. It does not replace the existing Panthur deployment scripts and must not be turned into a different automatic hosting system.

## One thread, one scoped record

Each thread must record only the files that belong to its own completed task.

- Inspect the working tree before staging files.
- Never use `git add -A` or otherwise include unrelated work without explicit confirmation.
- Never overwrite, discard, commit, or deploy another thread's unfinished changes.
- Never deploy uncommitted or untracked website files.
- If the shared working tree contains unrelated changes, use a clean isolated Git worktree for the exact task commit or wait until an exact deployment can be made safely.
- Never commit secrets, passwords, tokens, temporary credential files, or private environment configuration.

## Every staging website update

For every request to modify the website:

1. Make the requested changes locally.
2. Test the code locally where appropriate.
3. Identify and stage only the files belonging to the current task.
4. Create a descriptive local commit on `staging` containing the exact intended website source.
5. Deploy that exact committed source with the existing `./deploy-panthur-staging.sh` workflow.
6. Verify the precise changed page and user journey on `https://staging.universalmind.tv`.
7. If the change involves GPT or the OpenAI API, verify the complete live request and response workflow on staging.
8. Commit any resulting staging deployment-manifest update as deployment metadata.
9. Push the completed staging commits to `origin/staging`.
10. Confirm that the remote `staging` branch contains the commits.
11. Return the exact staging page URL and staging commit identifier.
12. Wait for Ben's explicit approval before modifying production.

If deployment, verification, commit, or push fails, repair the existing workflow and continue. Do not call the update complete until all required steps succeed.

## Permanent staging website

The permanent proofing website is:

`https://staging.universalmind.tv`

This is the only website used for previews and proofing.

- Do not use localhost as Ben's proofing handoff.
- Do not use temporary preview links.
- Do not use a different hosting provider.
- Do not create temporary deployments.
- Do not return the production website as a preview.
- Always provide the exact staging URL after every completed website update.

## Production

Production must never be modified unless Ben clearly instructs the agent to publish or deploy to production.

A positive comment such as "looks good", "thanks", "nice", "great", or "awesome" does not authorize production deployment.

Only explicit instructions such as "Deploy to production", "Publish this version", "Push this live", or "Make this the live website" authorize production deployment.

After explicit approval:

1. Use the exact staging version that Ben approved. Any additional source change must return to staging for proofing.
2. Deploy that version with the existing `./deploy-panthurlive.sh` workflow.
3. Verify the production website and the precise changed user journey.
4. Fast-forward `main` to the deployed staging commit.
5. Create an annotated `production-YYYY-MM-DD-HHMM` tag.
6. Push `main`, `staging`, and the production tag to GitHub.
7. Confirm the remote branch and tag references.
8. Return the production URL, commit identifier, and production tag.

Production is not complete if deployment, verification, commit, push, or tagging fails.

## Never change the deployment method

The configured Panthur staging and production deployment scripts remain the only website publishing method.

- Do not introduce Vercel, Netlify, Cloudflare Pages, localhost previews, temporary URLs, GitHub Actions deployment, or another hosting platform.
- If deployment fails, repair the existing deployment process rather than replacing it.

## GPT verification

When a change involves GPT or the OpenAI API, verify the complete workflow on staging:

- the request is sent;
- the server processes it;
- OpenAI responds successfully; and
- the response appears correctly in the interface.

Only then state that GPT functionality has been verified.

## Required final response

Every completed website update must finish with exactly four sections.

### Updated

Brief summary of what changed, including the GitHub commit identifier.

### Verified

Exactly what was tested and confirmation that the GitHub record was pushed.

### Proof Here

`https://staging.universalmind.tv`

Include the exact page URL when relevant.

### Production

`Production has not been modified.`

After an explicitly authorized production deployment, replace that sentence with the verified production URL, commit identifier, and production tag.

## Primary objective

The goal of this repository is rapid creative iteration. Reducing friction for Ben is more important than changing deployment methods, and consistency is more important than cleverness.
